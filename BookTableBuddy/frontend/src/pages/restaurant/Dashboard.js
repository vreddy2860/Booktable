import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import Calendar from '../../components/restaurant/Calendar';

const Dashboard = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    noShowBookings: 0,
    totalTables: 0,
    averageRating: 0,
    bookingsByDay: [],
    dailyBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch restaurants when component mounts
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        console.log('Fetching restaurants for user ID:', user.id);
        const restaurantsResponse = await api.restaurants.getManagerRestaurants();
        console.log('Manager restaurants response:', restaurantsResponse.data);
        
        if (restaurantsResponse.data && restaurantsResponse.data.length > 0) {
          const userRestaurants = restaurantsResponse.data;
          setRestaurants(userRestaurants);
          
          // Set the first restaurant as selected by default if none is selected yet
          if (!selectedRestaurantId && userRestaurants.length > 0) {
            setSelectedRestaurantId(userRestaurants[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants. Please try again later.');
      }
    };
    
    fetchRestaurants();
  }, [user.id, selectedRestaurantId]);
  
  // Update dashboard data when selected restaurant changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only fetch data if we have a selected restaurant
      if (!selectedRestaurantId || restaurants.length === 0) return;
      
      try {
        setLoading(true);
        console.log('Fetching dashboard data for restaurant ID:', selectedRestaurantId);
        
        // Get the currently selected restaurant
        const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
        if (!selectedRestaurant) {
          console.error('Selected restaurant not found:', selectedRestaurantId);
          setLoading(false);
          return;
        }
        
        // Check if the restaurant is approved
        const isApproved = selectedRestaurant.approval_status === 'approved';
        if (!isApproved) {
          console.log('Restaurant not approved:', selectedRestaurant);
          setTodayBookings([]);
          setStats({
            totalBookings: 0,
            pendingBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            noShowBookings: 0,
            totalTables: 0,
            averageRating: 0,
            bookingsByDay: [],
            dailyBookings: [],
            isApproved: false
          });
          setError('This restaurant is pending approval by an admin. Analytics and bookings will be available after approval.');
          setLoading(false);
          return;
        }
        
        // Fetch today's bookings - only for approved restaurants
        const bookingsResponse = await api.bookings.getTodayBookings(selectedRestaurantId);
        setTodayBookings(bookingsResponse.data || []);
        
        // Fetch analytics data
        try {
          const analyticsResponse = await api.analytics.getRestaurantAnalytics(selectedRestaurantId);
          console.log('Analytics data:', analyticsResponse.data);
          
          const { 
            restaurant_name = '',
            total_bookings = 0, 
            pending_bookings = 0, 
            completed_bookings = 0, 
            cancelled_bookings = 0, 
            no_show_bookings = 0,
            total_tables = 0, 
            avg_rating = 0, // Changed from average_rating to match API response
            bookings_by_day = [],
            daily_bookings = []
          } = analyticsResponse.data || {};
          
          setStats({
            totalBookings: total_bookings,
            pendingBookings: pending_bookings,
            completedBookings: completed_bookings,
            cancelledBookings: cancelled_bookings,
            noShowBookings: no_show_bookings,
            totalTables: total_tables,
            averageRating: avg_rating, // Updated to use avg_rating from API response
            bookingsByDay: bookings_by_day,
            dailyBookings: daily_bookings,
            isApproved: true
          });
        } catch (analyticsErr) {
          console.error('Error fetching analytics:', analyticsErr);
          // Check if the error is due to restaurant not being approved
          if (analyticsErr.response && analyticsErr.response.data && analyticsErr.response.data.error === 'Analytics are only available for approved restaurants') {
            setError('This restaurant is pending approval by an admin. Analytics will be available after approval.');
          }
          
          // Set default values if analytics fail to load
          setStats({
            totalBookings: 0,
            pendingBookings: 0,
            completedBookings: 0,
            cancelledBookings: 0,
            noShowBookings: 0,
            totalTables: 0,
            averageRating: 0,
            bookingsByDay: [],
            dailyBookings: [],
            isApproved: false
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedRestaurantId, restaurants]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // Handle booking completion
  const handleMarkAsCompleted = async (bookingId) => {
    try {
      const response = await api.bookings.completeBooking(bookingId);
      
      // Update the booking status in the local state
      const updatedBookings = todayBookings.map(booking => {
        if (booking.id === bookingId) {
          return { ...booking, status: 'completed' };
        }
        return booking;
      });
      
      setTodayBookings(updatedBookings);
      
      // Show success message
      alert('Booking marked as completed successfully!');
      
      // Fully refresh all analytics data
      const analyticsResponse = await api.analytics.getRestaurantAnalytics(selectedRestaurantId);
      console.log('Updated analytics after completion:', analyticsResponse.data);
      
    } catch (err) {
      console.error('Error marking booking as completed:', err);
      alert('Failed to mark booking as completed. Please try again.');
    }
  };
  
  // Handle booking no-show
  const handleMarkAsNoShow = async (bookingId) => {
    try {
      const response = await api.bookings.noShowBooking(bookingId);
      
      // Update the booking status in the local state
      const updatedBookings = todayBookings.map(booking => {
        if (booking.id === bookingId) {
          return { ...booking, status: 'no_show' };
        }
        return booking;
      });
      
      setTodayBookings(updatedBookings);
      
      // Show success message
      alert('Booking marked as no-show successfully!');
      
      // Fully refresh all analytics data
      const analyticsResponse = await api.analytics.getRestaurantAnalytics(selectedRestaurantId);
      console.log('Updated analytics after no-show:', analyticsResponse.data);
      
      // Extract all the data including detailed analytics
      const { 
        total_bookings = 0, 
        pending_bookings = 0, 
        completed_bookings = 0, 
        cancelled_bookings = 0, 
        no_show_bookings = 0,
        total_tables = 0, 
        avg_rating = 0, // Changed from average_rating to match API response
        bookings_by_day = [],
        daily_bookings = []
      } = analyticsResponse.data || {};
      
      // Update all stats including detailed analytics data
      setStats({
        totalBookings: total_bookings,
        pendingBookings: pending_bookings,
        completedBookings: completed_bookings,
        cancelledBookings: cancelled_bookings,
        noShowBookings: no_show_bookings,
        totalTables: total_tables,
        averageRating: avg_rating, // Updated to use avg_rating
        bookingsByDay: bookings_by_day,
        dailyBookings: daily_bookings
      });
      
      // Re-fetch today's bookings to ensure they're current
      try {
        const bookingsResponse = await api.bookings.getTodayBookings(selectedRestaurantId);
        setTodayBookings(bookingsResponse.data || []);
      } catch (bookingErr) {
        console.error('Error refreshing today\'s bookings:', bookingErr);
      }
    } catch (err) {
      console.error('Error marking booking as completed:', err);
      alert('Failed to mark booking as completed. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  // Handle restaurant selection change
  const handleRestaurantChange = async (e) => {
    const newRestaurantId = parseInt(e.target.value);
    setSelectedRestaurantId(newRestaurantId);
    
    // Show loading state while fetching new data
    setLoading(true);
    
    try {
      // Fetch analytics data for new restaurant
      const analyticsResponse = await api.analytics.getRestaurantAnalytics(newRestaurantId);
      console.log('Restaurant analytics data:', analyticsResponse.data);
      
      // Extract all analytics data
      const { 
        restaurant_name = '',
        total_bookings = 0, 
        pending_bookings = 0, 
        completed_bookings = 0, 
        cancelled_bookings = 0, 
        no_show_bookings = 0,
        total_tables = 0, 
        avg_rating = 0, // Changed from average_rating to avg_rating to match API response
        bookings_by_day = [],
        daily_bookings = []
      } = analyticsResponse.data || {};
      
      // Update all stats including detailed analytics data
      setStats({
        totalBookings: total_bookings,
        pendingBookings: pending_bookings,
        completedBookings: completed_bookings,
        cancelledBookings: cancelled_bookings,
        noShowBookings: no_show_bookings,
        totalTables: total_tables,
        averageRating: avg_rating, // Updated to use correctly extracted avg_rating
        bookingsByDay: bookings_by_day,
        dailyBookings: daily_bookings
      });
      
      // Also fetch today's bookings for the selected restaurant
      const bookingsResponse = await api.bookings.getTodayBookings(newRestaurantId);
      setTodayBookings(bookingsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data for selected restaurant:', error);
      // Set default values if data fetch fails
      setStats({
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        noShowBookings: 0,
        totalTables: 0,
        averageRating: 0,
        bookingsByDay: [],
        dailyBookings: []
      });
      setTodayBookings([]);
    } finally {
      setLoading(false);
    }
  };
  
  if (restaurants.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome, Restaurant Manager!</h1>
          <p className="text-gray-600 mb-6">You don't have any restaurants yet. Get started by adding your restaurant.</p>
          <Link 
            to="/restaurant/profile" 
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition duration-300"
          >
            Add Your Restaurant
          </Link>
        </div>
      </div>
    );
  }
  
  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId) || restaurants[0];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
        
        {/* Restaurant selector dropdown */}
        {restaurants.length > 1 && (
          <div className="flex items-center">
            <label htmlFor="restaurant-selector" className="mr-2 text-gray-600">Select Restaurant:</label>
            <select
              id="restaurant-selector"
              className="border border-gray-300 rounded-md px-3 py-1"
              value={selectedRestaurantId || ''}
              onChange={handleRestaurantChange}
            >
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <p className="text-gray-600 mb-8">
        Welcome back, {user.first_name}. Here's an overview of {selectedRestaurant.name}.
      </p>
      
      {/* Notification for unapproved restaurants */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">TOTAL BOOKINGS</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
            <div className="ml-auto bg-blue-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">TODAY'S BOOKINGS</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{todayBookings.length}</div>
            <div className="ml-auto bg-green-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">TOTAL TABLES</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{stats.totalTables}</div>
            <div className="ml-auto bg-purple-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">AVERAGE RATING</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{(stats.averageRating || 0).toFixed(1)}</div>
            <div className="text-yellow-500 ml-2">
              {'★'.repeat(Math.round(stats.averageRating || 0))}
              {'☆'.repeat(5 - Math.round(stats.averageRating || 0))}
            </div>
            <div className="ml-auto bg-yellow-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analytics Summary Section */}
      <div className="bg-white rounded-lg shadow-md p-6 col-span-1 md:col-span-2 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Booking Analytics</h2>
          <button
            onClick={() => document.getElementById('detailed-analytics').scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
          >
            View Detailed Analytics
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Completed</h3>
            <p className="text-xl font-bold text-green-600">{stats.completedBookings || 0}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Cancelled</h3>
            <p className="text-xl font-bold text-red-600">{stats.cancelledBookings || 0}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">No-Shows</h3>
            <p className="text-xl font-bold text-yellow-600">{stats.noShowBookings || 0}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-sm text-gray-500 mb-1">Completion Rate</h3>
            <p className="text-xl font-bold text-indigo-600">
              {stats.totalBookings ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Today's Bookings Section */}
      <div className="bg-white rounded-lg shadow-md p-6 col-span-1 md:col-span-2 mt-6">
        <h2 className="text-xl font-semibold mb-4">Today's Bookings</h2>
        
        {todayBookings.length === 0 ? (
          <p className="text-gray-500">No bookings for today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayBookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{booking.contact_name}</div>
                          <div className="text-sm text-gray-500">{booking.contact_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatTime(booking.time)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.party_size} people</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {booking.status === 'confirmed' ? (
                        <>
                          <button
                            onClick={() => handleMarkAsCompleted(booking.id)}
                            className="text-green-600 hover:text-green-800 mr-3"
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleMarkAsNoShow(booking.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Mark No-Show
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">
                          {booking.status === 'completed' ? 'Completed' : 
                           booking.status === 'no_show' ? 'No-Show' : 'Not Active'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Calendar View for All Bookings */}
      {selectedRestaurantId && (
        <Calendar restaurantId={selectedRestaurantId} />
      )}
      
      {/* Detailed Analytics Section */}
      <div id="detailed-analytics" className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-6">Detailed Booking Analytics</h2>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Bookings by Status (Last 30 Days)</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {stats.dailyBookings && stats.dailyBookings.length > 0 ? (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-3 bg-green-100 rounded-lg">
                    <h4 className="text-sm text-gray-500 mb-1">Completed</h4>
                    <p className="text-2xl font-bold text-green-600">{stats.completedBookings || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-red-100 rounded-lg">
                    <h4 className="text-sm text-gray-500 mb-1">Cancelled</h4>
                    <p className="text-2xl font-bold text-red-600">{stats.cancelledBookings || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-100 rounded-lg">
                    <h4 className="text-sm text-gray-500 mb-1">No-Shows</h4>
                    <p className="text-2xl font-bold text-yellow-600">{stats.noShowBookings || 0}</p>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-gray-500 mb-2">Daily Booking Trends</h4>
                <div className="h-64 overflow-x-auto">
                  <div className="min-w-max">
                    <div className="flex h-60">
                      {Array.isArray(stats.dailyBookings) && stats.dailyBookings
                        // Don't reverse the array, display from oldest to newest date (left to right)
                        .filter(day => day && typeof day.count !== 'undefined')
                        .map((day, index) => {
                          // Format date safely - fixing timezone issues by using proper parsing
                          let dateStr = '';
                          try {
                            if (day.date) {
                              // Parse the date string with explicit parts to avoid timezone issues
                              const parts = day.date.split('-');
                              if (parts.length === 3) {
                                const year = parseInt(parts[0]);
                                const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JS Date
                                const dayNum = parseInt(parts[2]);
                                
                                // Create date at UTC time to avoid timezone shifts
                                const dateObj = new Date(Date.UTC(year, month, dayNum));
                                dateStr = `${month+1}/${dayNum}`;
                              } else {
                                dateStr = day.date;
                              }
                            }
                          } catch (e) {
                            console.error('Error formatting date:', e);
                            dateStr = `Day ${index}`;
                          }
                          
                          return (
                            <div key={day.date || index} className="flex flex-col justify-end items-center mx-1 w-10">
                              <div className="text-xs text-center mb-1">{day.count || 0}</div>
                              <div 
                                className="w-8 bg-blue-500 rounded-sm" 
                                style={{ height: `${Math.max((day.count || 0) * 10, 1)}%` }}
                              ></div>
                              <div className="text-xs text-gray-500 mt-1">{dateStr}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-10">No booking data available for the last 30 days.</p>
            )}
          </div>
        </div>
        
        {/* Bookings by Day of Week chart removed as requested */}

        
        <div>
          <h3 className="text-lg font-medium mb-4">Completion Rate by Time Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="text-sm text-gray-500 mb-2">Today</h4>
              <div className="text-2xl font-bold">
                {Array.isArray(todayBookings) && todayBookings.length > 0 
                  ? Math.round((todayBookings.filter(b => b && b.status === 'completed').length / todayBookings.length) * 100) 
                  : 0}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="text-sm text-gray-500 mb-2">This Week</h4>
              <div className="text-2xl font-bold">
                {(stats && typeof stats.totalBookings === 'number' && stats.totalBookings > 0 && typeof stats.completedBookings === 'number')
                  ? Math.round((stats.completedBookings / stats.totalBookings) * 100) 
                  : 0}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <h4 className="text-sm text-gray-500 mb-2">Cancellation Rate</h4>
              <div className="text-2xl font-bold text-red-600">
                {(stats && typeof stats.totalBookings === 'number' && stats.totalBookings > 0 && typeof stats.cancelledBookings === 'number')
                  ? Math.round((stats.cancelledBookings / stats.totalBookings) * 100) 
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        {/* Restaurant Management */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Restaurant Management</h2>
          </div>
          
          <div className="p-6">
            {restaurants.length === 0 ? (
              <div className="text-center mb-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <h3 className="text-lg font-medium mb-2">No Restaurant Listed Yet</h3>
                <p className="text-gray-500 mb-4">Create your first restaurant listing to get started.</p>
                <Link 
                  to="/restaurant/profile" 
                  className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300"
                >
                  Add New Restaurant
                </Link>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="font-medium text-lg mb-3">Your Restaurant{restaurants.length > 1 ? 's' : ''}</h3>
                <div className="grid gap-4">
                  {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{restaurant.name}</h4>
                          <p className="text-sm text-gray-500">{restaurant.address}, {restaurant.city}, {restaurant.state}</p>
                        </div>
                        <Link 
                          to="/restaurant/profile" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setSelectedRestaurantId(restaurant.id)}
                        >
                          Edit Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Link 
                    to="/restaurant/profile" 
                    className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300"
                  >
                    Add Another Restaurant
                  </Link>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Link 
                to="/restaurant/profile" 
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-300"
              >
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <span className="text-gray-800 font-medium">Restaurant Profile</span>
                  <p className="text-sm text-gray-600">Update name, address, hours, tables & photos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;