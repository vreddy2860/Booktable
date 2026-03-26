import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSystemStats, getPendingRestaurants } from '../../api/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchSystemStats();
    fetchPendingRestaurants();
  }, []);
  
  const fetchSystemStats = async () => {
    try {
      const response = await getSystemStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching system stats:', err);
      setError('Failed to load system statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPendingRestaurants = async () => {
    try {
      const response = await getPendingRestaurants();
      setPendingRestaurants(response.data);
    } catch (err) {
      console.error('Error fetching pending restaurants:', err);
      setError('Failed to load pending restaurant approvals. Please try again.');
    }
  };

  const formatDateString = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  const restaurantData = {
    labels: ['Total', 'Approved', 'Pending', 'Rejected', 'New (Last Month)'],
    datasets: [
      {
        label: 'Restaurants',
        data: stats ? [
          stats.restaurants.total,
          stats.restaurants.approved,
          stats.restaurants.pending,
          stats.restaurants.rejected,
          stats.restaurants.new_last_month
        ] : [],
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
      },
    ],
  };
  
  const userData = {
    labels: ['Total', 'Customers', 'Managers', 'Admins', 'New (Last Month)'],
    datasets: [
      {
        label: 'Users',
        data: stats ? [
          stats.users.total,
          stats.users.customers,
          stats.users.managers,
          stats.users.admins,
          stats.users.new_last_month
        ] : [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {stats && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Bookings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-700">Total Bookings</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.bookings.total}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.bookings.last_month} in the last month
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Restaurants */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-700">Total Restaurants</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.restaurants.total}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.restaurants.pending} pending approval
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.users.new_last_month} new in the last month
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Reviews */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-700">Total Reviews</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.reviews.total}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Restaurant Statistics</h2>
              <Bar data={restaurantData} options={chartOptions} />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">User Statistics</h2>
              <Bar data={userData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
      
      {/* Pending Approvals */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Pending Restaurant Approvals</h2>
          <Link
            to="/admin/restaurants/pending"
            className="text-sm font-medium text-red-600 hover:text-red-500"
          >
            View All
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {pendingRestaurants.length === 0 ? (
            <div className="p-6 text-center">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No pending approvals</h3>
              <p className="mt-1 text-gray-500">
                All restaurant listings have been reviewed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRestaurants.slice(0, 5).map(restaurant => (
                    <tr key={restaurant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                            {restaurant.primary_photo ? (
                              <img 
                                src={restaurant.primary_photo} 
                                alt={restaurant.name}
                                className="h-10 w-10 object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center">
                                <svg 
                                  className="h-6 w-6 text-gray-400" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {restaurant.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {restaurant.cuisine.map(c => c.name).join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{restaurant.manager_name}</div>
                        <div className="text-sm text-gray-500">{restaurant.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{restaurant.city}</div>
                        <div className="text-sm text-gray-500">{restaurant.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateString(restaurant.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/admin/restaurants/${restaurant.id}`}
                          className="text-red-600 hover:text-red-900"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/restaurants/pending"
            className="group p-4 border border-gray-200 rounded-md hover:border-red-500 flex items-center"
          >
            <div className="p-2 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <span className="ml-3 text-gray-900 group-hover:text-red-600">Restaurant Approvals</span>
          </Link>
          
          <Link
            to="/admin/analytics/bookings"
            className="group p-4 border border-gray-200 rounded-md hover:border-red-500 flex items-center"
          >
            <div className="p-2 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <span className="ml-3 text-gray-900 group-hover:text-red-600">Booking Analytics</span>
          </Link>
          
          <Link
            to="/customer/search"
            className="group p-4 border border-gray-200 rounded-md hover:border-red-500 flex items-center"
          >
            <div className="p-2 rounded-full bg-red-100 text-red-600 group-hover:bg-red-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            <span className="ml-3 text-gray-900 group-hover:text-red-600">Search Restaurants</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
