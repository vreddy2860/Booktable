import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const Analytics = () => {
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch restaurant manager's restaurants and analytics
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        
        // Get user's restaurants
        const restaurantsResponse = await api.restaurants.getList({ manager: user.id });
        
        if (restaurantsResponse.data.length > 0) {
          const userRestaurants = restaurantsResponse.data;
          setRestaurants(userRestaurants);
          
          // Get primary restaurant for manager
          const primaryRestaurant = userRestaurants[0];
          setSelectedRestaurant(primaryRestaurant);
          
          // Get restaurant analytics
          const analyticsResponse = await api.analytics.getRestaurantAnalytics(primaryRestaurant.id);
          setAnalyticsData(analyticsResponse.data);
        } else {
          setError('You need to create a restaurant before viewing analytics.');
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [user]);
  
  // Handle changing the time range
  const handleTimeRangeChange = async (newRange) => {
    if (!selectedRestaurant) return;
    
    setTimeRange(newRange);
    setLoading(true);
    
    try {
      // Get restaurant analytics with new time range
      const analyticsResponse = await api.analytics.getRestaurantAnalytics(
        selectedRestaurant.id,
        { time_range: newRange }
      );
      setAnalyticsData(analyticsResponse.data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedRestaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6" role="alert">
          <p>You need to create a restaurant before viewing analytics.</p>
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
  
  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6" role="alert">
          <p>No analytics data available yet. Start receiving bookings to see analytics.</p>
        </div>
      </div>
    );
  }
  
  const {
    total_bookings,
    bookings_by_status,
    bookings_by_day,
    average_party_size,
    total_customers,
    revenue_estimate,
    popular_times,
    average_rating
  } = analyticsData;
  
  // Calculate percentage change compared to previous period
  const getPercentageChange = (current, previous) => {
    if (!previous) return 100;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Restaurant Analytics</h1>
      <p className="text-gray-600 mb-8">
        View performance metrics for {selectedRestaurant.name}.
      </p>
      
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 flex flex-wrap items-center justify-between">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleTimeRangeChange('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleTimeRangeChange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleTimeRangeChange('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Bookings</p>
              <h3 className="text-3xl font-bold mt-1">{total_bookings}</h3>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {analyticsData.previous_total_bookings !== undefined && (
            <div className="flex items-center">
              <span className={`text-sm font-medium ${
                getPercentageChange(total_bookings, analyticsData.previous_total_bookings) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {getPercentageChange(total_bookings, analyticsData.previous_total_bookings) >= 0 ? '↑' : '↓'}
                {Math.abs(getPercentageChange(total_bookings, analyticsData.previous_total_bookings))}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous {timeRange}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Customers</p>
              <h3 className="text-3xl font-bold mt-1">{total_customers}</h3>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
          {analyticsData.previous_total_customers !== undefined && (
            <div className="flex items-center">
              <span className={`text-sm font-medium ${
                getPercentageChange(total_customers, analyticsData.previous_total_customers) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {getPercentageChange(total_customers, analyticsData.previous_total_customers) >= 0 ? '↑' : '↓'}
                {Math.abs(getPercentageChange(total_customers, analyticsData.previous_total_customers))}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous {timeRange}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Avg. Party Size</p>
              <h3 className="text-3xl font-bold mt-1">{average_party_size.toFixed(1)}</h3>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
          {analyticsData.previous_average_party_size !== undefined && (
            <div className="flex items-center">
              <span className={`text-sm font-medium ${
                getPercentageChange(average_party_size, analyticsData.previous_average_party_size) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {getPercentageChange(average_party_size, analyticsData.previous_average_party_size) >= 0 ? '↑' : '↓'}
                {Math.abs(getPercentageChange(average_party_size, analyticsData.previous_average_party_size))}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous {timeRange}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Avg. Rating</p>
              <h3 className="text-3xl font-bold mt-1">{average_rating.toFixed(1)}</h3>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-yellow-500 mr-2">
              {'★'.repeat(Math.round(average_rating))}
              {'☆'.repeat(5 - Math.round(average_rating))}
            </div>
            <span className="text-sm text-gray-500">({analyticsData.total_reviews || 0} reviews)</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bookings by Status */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Bookings by Status</h2>
          </div>
          
          <div className="p-6">
            {bookings_by_status && Object.keys(bookings_by_status).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(bookings_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center">
                    <span className="w-32 capitalize">{status}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                      <div 
                        className={`h-4 rounded-full ${
                          status === 'confirmed' ? 'bg-green-500' :
                          status === 'completed' ? 'bg-blue-500' :
                          status === 'cancelled' ? 'bg-gray-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(count / total_bookings) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-right w-16">{count}</span>
                    <span className="text-right w-16 text-gray-500">
                      {Math.round((count / total_bookings) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No booking status data available.</p>
            )}
          </div>
        </div>
        
        {/* Popular Times */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Popular Booking Times</h2>
          </div>
          
          <div className="p-6">
            {popular_times && popular_times.length > 0 ? (
              <div className="space-y-4">
                {popular_times.map((timeSlot, index) => (
                  <div key={index} className="flex items-center">
                    <span className="w-32">
                      {new Date(`1970-01-01T${timeSlot.time}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                      <div 
                        className="bg-indigo-500 h-4 rounded-full"
                        style={{ width: `${(timeSlot.count / popular_times[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-right w-16">{timeSlot.count}</span>
                    <span className="text-right w-16 text-gray-500">
                      {Math.round((timeSlot.count / total_bookings) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No popular times data available.</p>
            )}
          </div>
        </div>
        
        {/* Revenue Estimate */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Estimated Revenue</h2>
              <span className="text-sm text-gray-500">Based on average check size</span>
            </div>
          </div>
          
          <div className="p-6">
            {revenue_estimate ? (
              <div className="text-center">
                <h3 className="text-3xl font-bold text-green-600">${revenue_estimate.toFixed(2)}</h3>
                <p className="text-gray-500 mt-2">
                  Based on {total_bookings} bookings with average party size of {average_party_size.toFixed(1)}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No revenue estimate available.</p>
            )}
          </div>
        </div>
        
        {/* Bookings by Day */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Bookings by Day</h2>
          </div>
          
          <div className="p-6">
            {bookings_by_day && Object.keys(bookings_by_day).length > 0 ? (
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                  const count = bookings_by_day[index] || 0;
                  const maxCount = Math.max(...Object.values(bookings_by_day));
                  
                  return (
                    <div key={day} className="flex items-center">
                      <span className="w-32">{day}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                        ></div>
                      </div>
                      <span className="text-right w-16">{count}</span>
                      <span className="text-right w-16 text-gray-500">
                        {total_bookings > 0 ? Math.round((count / total_bookings) * 100) : 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No booking day data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;