import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch admin dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get system statistics
        const statsResponse = await api.analytics.getSystemStats();
        console.log('System stats response:', statsResponse.data);
        
        const apiData = statsResponse.data;
        
        // Map the backend data structure to the format expected by the frontend
        const processedStats = {
          // The backend returns nested objects with 'total' properties
          total_users: apiData?.users?.total || 0,
          total_restaurants: apiData?.restaurants?.total || 0,
          total_bookings: apiData?.bookings?.total || 0,
          average_rating: 0, // This might need to be calculated or fetched separately
          
          // Map nested objects to match frontend expectations
          users_by_role: { 
            customer: apiData?.users?.customers || 0, 
            restaurant_manager: apiData?.users?.managers || 0 
          },
          
          restaurants_by_status: { 
            approved: apiData?.restaurants?.approved || 0, 
            pending: apiData?.restaurants?.pending || 0 
          },
          
          // Map booking status counts from the API response
          bookings_by_status: { 
            confirmed: apiData?.bookings?.confirmed || 0, 
            completed: apiData?.bookings?.completed || 0, 
            cancelled: apiData?.bookings?.cancelled || 0, 
            no_show: apiData?.bookings?.no_show || 0 
          }
        };
        
        console.log('Processed stats:', processedStats);
        setStats(processedStats);
        
        // Get restaurants pending approval
        const approvalsResponse = await api.admin.getRestaurantApprovals();
        setPendingApprovals(approvalsResponse.data);
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading admin dashboard...</p>
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Monitor and manage the BookTable platform.
      </p>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Users</p>
              <h3 className="text-3xl font-bold">{stats?.total_users || 0}</h3>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-500">
              Customers: {stats?.users_by_role?.customer || 0}
            </span>
            <span className="text-gray-500">
              Managers: {stats?.users_by_role?.restaurant_manager || 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Restaurants</p>
              <h3 className="text-3xl font-bold">{stats?.total_restaurants || 0}</h3>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-500">
              Approved: {stats?.restaurants_by_status?.approved || 0}
            </span>
            <span className="text-yellow-500">
              Pending: {stats?.restaurants_by_status?.pending || 0}
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase">Total Bookings</p>
              <h3 className="text-3xl font-bold">{stats?.total_bookings || 0}</h3>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-green-500">
              Confirmed: {stats?.bookings_by_status?.confirmed || 0}
            </span>
            <span className="text-blue-500">
              Completed: {stats?.bookings_by_status?.completed || 0}
            </span>
            <span className="text-gray-500">
              Cancelled: {stats?.bookings_by_status?.cancelled || 0}
            </span>
            <span className="text-red-500">
              No-shows: {stats?.bookings_by_status?.no_show || 0}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link 
              to="/admin/restaurant-approvals" 
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              <div className="bg-blue-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium text-center">Restaurant Approvals</span>
              {pendingApprovals.length > 0 && (
                <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {pendingApprovals.length} pending
                </span>
              )}
            </Link>
            
            <Link 
              to="/admin/restaurants" 
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              <div className="bg-green-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium text-center">Manage Restaurants</span>
            </Link>
            
            <Link 
              to="/admin/users" 
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              <div className="bg-purple-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium text-center">User Management</span>
            </Link>
            
            <Link 
              to="/admin/analytics" 
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-300"
            >
              <div className="bg-red-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
              <span className="text-gray-800 font-medium text-center">System Analytics</span>
            </Link>
          </div>
        </div>
        
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pending Restaurant Approvals</h2>
              <Link 
                to="/admin/restaurant-approvals" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.slice(0, 5).map(restaurant => (
                <div key={restaurant.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500">
                        {restaurant.city}, {restaurant.state}
                      </p>
                      <p className="text-sm text-gray-500">
                        Manager: {restaurant.manager_name || restaurant.manager_email}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/admin/restaurant-approvals?id=${restaurant.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No pending restaurant approvals.</p>
              </div>
            )}
          </div>
          
          {pendingApprovals.length > 5 && (
            <div className="px-6 py-3 bg-gray-50 text-right">
              <span className="text-sm text-gray-500">
                +{pendingApprovals.length - 5} more pending approvals
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;