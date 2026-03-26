import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/api';

const RestaurantApprovals = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preSelectedId = queryParams.get('id');
  
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState({
    processing: false,
    success: null,
    error: null
  });
  
  // Fetch pending restaurant approvals
  useEffect(() => {
    const fetchPendingRestaurants = async () => {
      try {
        setLoading(true);
        const response = await api.admin.getRestaurantApprovals();
        setPendingRestaurants(response.data);
        
        // If there's a pre-selected restaurant ID in the URL, load its details
        if (preSelectedId) {
          const restaurant = response.data.find(r => r.id === parseInt(preSelectedId));
          if (restaurant) {
            loadRestaurantDetails(restaurant.id);
          }
        }
      } catch (err) {
        console.error('Error fetching pending restaurants:', err);
        setError('Failed to load pending restaurants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingRestaurants();
  }, [preSelectedId]);
  
  // Load restaurant details
  const loadRestaurantDetails = async (restaurantId) => {
    setDetailLoading(true);
    
    try {
      const response = await api.restaurants.getById(restaurantId);
      setSelectedRestaurant(response.data);
    } catch (err) {
      console.error('Error loading restaurant details:', err);
      setError('Failed to load restaurant details. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };
  
  // Handle restaurant approval
  const handleApproveRestaurant = async () => {
    if (!selectedRestaurant) return;
    
    setActionStatus({
      processing: true,
      success: null,
      error: null
    });
    
    try {
      console.log('Approving restaurant with id:', selectedRestaurant.id);
      // Pass the 'approved' status parameter required by the API
      await api.admin.approveRestaurant(selectedRestaurant.id, 'approved');
      
      // Update local state
      setPendingRestaurants(prev => 
        prev.filter(restaurant => restaurant.id !== selectedRestaurant.id)
      );
      
      setActionStatus({
        processing: false,
        success: `Restaurant "${selectedRestaurant.name}" has been approved.`,
        error: null
      });
      
      // Clear selected restaurant
      setSelectedRestaurant(null);
    } catch (err) {
      console.error('Error approving restaurant:', err);
      setActionStatus({
        processing: false,
        success: null,
        error: 'Failed to approve restaurant. Please try again.'
      });
    }
  };
  
  // Handle restaurant rejection
  const handleRejectRestaurant = async () => {
    if (!selectedRestaurant) return;
    
    if (!window.confirm(`Are you sure you want to reject "${selectedRestaurant.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setActionStatus({
      processing: true,
      success: null,
      error: null
    });
    
    try {
      console.log('Rejecting restaurant with id:', selectedRestaurant.id);
      // Use approveRestaurant with 'rejected' status instead of rejectRestaurant
      await api.admin.approveRestaurant(selectedRestaurant.id, 'rejected');
      
      // Update local state
      setPendingRestaurants(prev => 
        prev.filter(restaurant => restaurant.id !== selectedRestaurant.id)
      );
      
      setActionStatus({
        processing: false,
        success: `Restaurant "${selectedRestaurant.name}" has been rejected.`,
        error: null
      });
      
      // Clear selected restaurant
      setSelectedRestaurant(null);
    } catch (err) {
      console.error('Error rejecting restaurant:', err);
      setActionStatus({
        processing: false,
        success: null,
        error: 'Failed to reject restaurant. Please try again.'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading pending restaurants...</p>
        </div>
      </div>
    );
  }
  
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
      
      <h1 className="text-3xl font-bold mb-2">Restaurant Approvals</h1>
      <p className="text-gray-600 mb-8">
        Review and approve new restaurants for the platform.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {actionStatus.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{actionStatus.success}</p>
        </div>
      )}
      
      {actionStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{actionStatus.error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Restaurant List */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Pending Approvals</h2>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pendingRestaurants.length} pending
                </span>
              </div>
            </div>
            
            {pendingRestaurants.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
                {pendingRestaurants.map(restaurant => (
                  <div 
                    key={restaurant.id} 
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedRestaurant?.id === restaurant.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => loadRestaurantDetails(restaurant.id)}
                  >
                    <h3 className="text-lg font-medium text-gray-900">{restaurant.name}</h3>
                    <p className="text-sm text-gray-500">
                      {restaurant.city}, {restaurant.state}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Manager:</span> {restaurant.manager_name || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Submitted:</span> {new Date(restaurant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                <p className="mt-1 text-sm text-gray-500">All restaurant submissions have been reviewed.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Restaurant Details */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
              <div className="text-center">
                <div className="spinner-border text-blue-600" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading restaurant details...</p>
              </div>
            </div>
          ) : selectedRestaurant ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Restaurant Details</h2>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Pending Approval
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Restaurant Name</span>
                        <p className="font-medium">{selectedRestaurant.name}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Description</span>
                        <p className="text-gray-700">{selectedRestaurant.description}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Cuisine</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRestaurant.cuisine.map(cuisine => (
                            <span 
                              key={cuisine.id} 
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                            >
                              {cuisine.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Price Range</span>
                        <p className="font-medium">{selectedRestaurant.cost_rating_display}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Address</span>
                        <p className="font-medium">
                          {selectedRestaurant.address}, {selectedRestaurant.city}, {selectedRestaurant.state} {selectedRestaurant.zip_code}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Phone</span>
                        <p className="font-medium">{selectedRestaurant.phone}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-500">Email</span>
                        <p className="font-medium">{selectedRestaurant.email}</p>
                      </div>
                      
                      {selectedRestaurant.website && (
                        <div>
                          <span className="text-sm text-gray-500">Website</span>
                          <p className="font-medium">
                            <a 
                              href={selectedRestaurant.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline"
                            >
                              {selectedRestaurant.website}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Manager Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Name</span>
                      <p className="font-medium">{selectedRestaurant.manager_name}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="font-medium">{selectedRestaurant.manager_email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleRejectRestaurant}
                      disabled={actionStatus.processing}
                      className="bg-white hover:bg-gray-50 text-red-600 border border-red-600 font-medium py-2 px-4 rounded-md transition duration-300"
                    >
                      {actionStatus.processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={handleApproveRestaurant}
                      disabled={actionStatus.processing}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                    >
                      {actionStatus.processing ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No restaurant selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a restaurant from the list to review its details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantApprovals;