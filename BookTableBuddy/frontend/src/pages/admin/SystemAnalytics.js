import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';

const SystemAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Get booking analytics with time range
        const bookingAnalyticsResponse = await api.analytics.getBookingAnalytics({ time_range: timeRange });
        
        // Get system stats
        const systemStatsResponse = await api.analytics.getSystemStats();
        
        // Combine the data
        setAnalyticsData({
          ...bookingAnalyticsResponse.data,
          ...systemStatsResponse.data
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeRange]);
  
  // Handle changing the time range
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
  };
  
  // Calculate percentage change compared to previous period
  const getPercentageChange = (current, previous) => {
    if (!previous) return 100;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading analytics data...</p>
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
          <p>No analytics data available yet.</p>
        </div>
      </div>
    );
  }
  
  const {
    total_bookings,
    bookings_by_status,
    bookings_by_day,
    bookings_by_month,
    average_party_size,
    total_customers,
    revenue_estimate,
    most_popular_restaurants,
    busy_days,
    busy_times,
    total_users,
    users_by_role,
    total_restaurants,
    restaurants_by_status,
    total_reviews,
    average_rating
  } = analyticsData;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/admin/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">System Analytics</h1>
      <p className="text-gray-600 mb-8">
        Detailed analytics for the BookTable platform.
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
              <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
              <h3 className="text-3xl font-bold mt-1">{total_users}</h3>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-500">
              Customers: {users_by_role?.customer || 0}
            </span>
            <span className="text-gray-500">
              Managers: {users_by_role?.restaurant_manager || 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Restaurants</p>
              <h3 className="text-3xl font-bold mt-1">{total_restaurants}</h3>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-500">
              Approved: {restaurants_by_status?.approved || 0}
            </span>
            <span className="text-yellow-500">
              Pending: {restaurants_by_status?.pending || 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Est. Revenue</p>
              <h3 className="text-3xl font-bold mt-1">${revenue_estimate?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Based on {total_bookings} bookings with average party size of {average_party_size?.toFixed(1) || '0.0'}
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
        
        {/* Popular Restaurants */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Popular Restaurants</h2>
          </div>
          
          <div className="p-6">
            {most_popular_restaurants && most_popular_restaurants.length > 0 ? (
              <div className="space-y-4">
                {most_popular_restaurants.slice(0, 5).map((restaurant, index) => (
                  <div key={restaurant.id} className="flex items-center">
                    <span className="w-8 text-center font-bold text-gray-500">#{index + 1}</span>
                    <span className="w-48 truncate">{restaurant.name}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                      <div 
                        className="bg-green-500 h-4 rounded-full"
                        style={{ width: `${(restaurant.bookings / most_popular_restaurants[0].bookings) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-right w-16">{restaurant.bookings}</span>
                    <span className="text-right w-16 text-gray-500">
                      {restaurant.rating ? restaurant.rating.toFixed(1) : 'N/A'} ★
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No restaurant popularity data available.</p>
            )}
          </div>
        </div>
        
        {/* Popular Times */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Popular Booking Times</h2>
          </div>
          
          <div className="p-6">
            {busy_times && busy_times.length > 0 ? (
              <div className="space-y-4">
                {busy_times.slice(0, 5).map((timeSlot, index) => (
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
                        style={{ width: `${(timeSlot.count / busy_times[0].count) * 100}%` }}
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
      </div>
    </div>
  );
};

export default SystemAnalytics;