import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyRestaurants, getTodayBookings } from '../../api/api';

const Dashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurants();
    fetchTodayBookings();
  }, []);

  const fetchRestaurants = async () => {
    setIsLoadingRestaurants(true);
    try {
      const response = await getMyRestaurants();
      setRestaurants(response.data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load your restaurants. Please try again.');
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  const fetchTodayBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const response = await getTodayBookings();
      setTodayBookings(response.data);
    } catch (err) {
      console.error('Error fetching today\'s bookings:', err);
      setError('Failed to load today\'s bookings. Please try again.');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getApprovalStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoadingRestaurants && isLoadingBookings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Manager Dashboard</h1>
        <Link
          to="/restaurant/create"
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg 
            className="-ml-1 mr-2 h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
          Add New Restaurant
        </Link>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Restaurants Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
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
              <p className="text-3xl font-bold text-gray-900">{restaurants.length}</p>
            </div>
          </div>
        </div>

        {/* Today's Bookings Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
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
              <h2 className="text-lg font-semibold text-gray-700">Today's Bookings</h2>
              <p className="text-3xl font-bold text-gray-900">{todayBookings.length}</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Pending Approvals</h2>
              <p className="text-3xl font-bold text-gray-900">
                {restaurants.filter(r => r.approval_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Restaurants */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Restaurants</h2>
          
          {restaurants.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No restaurants yet</h3>
              <p className="mt-1 text-gray-500">
                Get started by creating your first restaurant listing.
              </p>
              <div className="mt-6">
                <Link
                  to="/restaurant/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Add Restaurant
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {restaurants.map(restaurant => (
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
                          <div className="text-sm text-gray-900">{restaurant.city}</div>
                          <div className="text-sm text-gray-500">{restaurant.state}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getApprovalStatusColor(restaurant.approval_status)}`}>
                            {restaurant.approval_status.charAt(0).toUpperCase() + restaurant.approval_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link 
                            to={`/restaurant/edit/${restaurant.id}`}
                            className="text-red-600 hover:text-red-900 mr-4"
                          >
                            Edit
                          </Link>
                          <Link 
                            to={`/restaurant/bookings/${restaurant.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Bookings
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Today's Bookings */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Bookings</h2>
          
          {todayBookings.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings today</h3>
              <p className="mt-1 text-gray-500">
                Bookings for today will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {todayBookings.map(booking => (
                  <li key={booking.id} className="p-4">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.contact_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(booking.time)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {booking.restaurant_name} • Table {booking.table_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span className="font-medium">Ref:</span> {booking.booking_reference}
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="bg-gray-50 px-4 py-3 text-center">
                <Link
                  to="/restaurant/bookings"
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  View all bookings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
