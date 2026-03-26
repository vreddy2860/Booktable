import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import axios from 'axios';

const RestaurantApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
    } else {
      fetchPendingRestaurants();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const fetchRestaurantDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.restaurants.getById(id);
      setRestaurant(response.data);
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPendingRestaurants = async () => {
    setIsLoading(true);
    try {
      const response = await api.admin.getRestaurantApprovals();
      setPendingRestaurants(response.data);
    } catch (err) {
      console.error('Error fetching pending restaurants:', err);
      setError('Failed to load pending restaurants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApproval = async (restaurantId, status) => {
    setError('');
    setIsProcessing(true);
    
    try {
      console.log('Component: Preparing to send approval request');
      console.log('Restaurant ID:', restaurantId);
      console.log('Status:', status);
      
      // Validate status
      if (!status || !['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid approval status');
      }
      
      // Directly use axios for more control over the request
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const formData = new URLSearchParams();
      formData.append('approval_status', status);
      
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/restaurants/approve/${restaurantId}/`;
      console.log('Making API request to:', apiUrl);
      console.log('With payload:', { approval_status: status });
      
      const response = await axios({
        method: 'PATCH',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        data: formData
      });
      
      console.log('Component: Received response:', response);
      console.log('Response data:', response.data);
      setSuccess(`Restaurant has been ${status} successfully.`);
      
      // Update local state if viewing list of pending restaurants
      if (!id) {
        setPendingRestaurants(prev => prev.filter(r => r.id !== restaurantId));
      } else {
        // Refresh restaurant details to show updated status
        fetchRestaurantDetails();
        
        // Redirect back to pending list after a delay
        setTimeout(() => {
          navigate('/admin/restaurant-approvals');
        }, 2000);
      }
    } catch (err) {
      console.error('Error updating restaurant status:', err);
      setError('Failed to update restaurant status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  // If viewing an individual restaurant
  if (id && restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/restaurants/pending')}
            className="inline-flex items-center text-gray-600 hover:text-red-600"
          >
            <svg 
              className="h-5 w-5 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Back to pending restaurants
          </button>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Review</h1>
        <p className="text-gray-500 mb-8">
          Review and approve or reject this restaurant listing
        </p>
        
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
        
        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
                <p className="text-gray-500 mt-1">
                  Submitted by {restaurant.manager_name} on {formatDate(restaurant.created_at)}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Approve button clicked for restaurant:', restaurant.id);
                    handleApproval(restaurant.id, 'approved');
                  }}
                  disabled={isProcessing || restaurant.approval_status !== 'pending'}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Approve Restaurant'}
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Reject button clicked for restaurant:', restaurant.id);
                    handleApproval(restaurant.id, 'rejected');
                  }}
                  disabled={isProcessing || restaurant.approval_status !== 'pending'}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Reject Restaurant'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1">{restaurant.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cuisine</p>
                      <p className="mt-1">{restaurant.cuisine.map(c => c.name).join(', ')}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Price Range</p>
                      <p className="mt-1">{restaurant.cost_rating_display}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1">{restaurant.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1">{restaurant.phone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <p className="mt-1">
                        {restaurant.website ? (
                          <a 
                            href={restaurant.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-red-600 hover:underline"
                          >
                            {restaurant.website}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-700">{restaurant.description}</p>
                </div>
                
                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="mt-1">{restaurant.address}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">City, State, ZIP</p>
                      <p className="mt-1">{restaurant.city}, {restaurant.state} {restaurant.zip_code}</p>
                    </div>
                    
                    {restaurant.latitude && restaurant.longitude && (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-gray-500">Coordinates</p>
                        <p className="mt-1">
                          Latitude: {restaurant.latitude}, Longitude: {restaurant.longitude}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Operating Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {restaurant.hours.map(hour => (
                      <div key={hour.id}>
                        <p className="text-sm font-medium text-gray-500">{hour.day_name}</p>
                        <p className="mt-1">
                          {formatTime(hour.opening_time)} - {formatTime(hour.closing_time)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tables */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tables</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {restaurant.tables.map(table => (
                      <div key={table.id} className="bg-gray-50 p-4 rounded-md">
                        <p className="text-sm font-medium text-gray-500">Table {table.table_number}</p>
                        <p className="mt-1">Capacity: {table.capacity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                {/* Restaurant Photos */}
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
                <div className="space-y-4">
                  {restaurant.photos.map(photo => (
                    <div key={photo.id} className="border border-gray-200 rounded-md overflow-hidden">
                      <img 
                        src={photo.image_url} 
                        alt={photo.caption || restaurant.name}
                        className="w-full h-48 object-cover"
                      />
                      {photo.caption && (
                        <div className="p-2 bg-gray-50">
                          <p className="text-sm text-gray-500">{photo.caption}</p>
                        </div>
                      )}
                      {photo.is_primary && (
                        <div className="p-2 bg-red-50 text-red-800 text-sm font-medium">
                          Primary Photo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If viewing list of pending restaurants
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Restaurant Approvals</h1>
      <p className="text-gray-500 mb-8">
        Review and approve or reject restaurant listings
      </p>
      
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
      
      {success && (
        <div className="rounded-md bg-green-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {pendingRestaurants.length === 0 ? (
          <div className="p-8 text-center">
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
                {pendingRestaurants.map(restaurant => (
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
                      {formatDate(restaurant.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/restaurant-approvals/${restaurant.id}`)}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        Review
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Approve button clicked for restaurant:', restaurant.id);
                          handleApproval(restaurant.id, 'approved');
                        }}
                        disabled={isProcessing}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Reject button clicked for restaurant:', restaurant.id);
                          handleApproval(restaurant.id, 'rejected');
                        }}
                        disabled={isProcessing}
                        className="text-red-600 hover:text-red-900"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantApproval;
