import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';

const RestaurantManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: ''
  });
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  
  // Fetch all restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await api.restaurants.getList();
        setRestaurants(response.data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  // Apply filters to restaurants
  useEffect(() => {
    if (!restaurants.length) return;
    
    let filtered = [...restaurants];
    
    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(restaurant => restaurant.approval_status === filters.status);
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.city.toLowerCase().includes(searchLower) ||
        restaurant.state.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort restaurants by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    setFilteredRestaurants(filtered);
  }, [restaurants, filters]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      searchTerm: ''
    });
  };
  
  // Handle restaurant removal
  const handleRemoveRestaurant = async (restaurantId, restaurantName) => {
    if (!window.confirm(`Are you sure you want to remove "${restaurantName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.restaurants.delete(restaurantId);
      
      // Update local state
      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));
      
      alert(`Restaurant "${restaurantName}" has been removed successfully.`);
    } catch (err) {
      console.error('Error removing restaurant:', err);
      alert('Failed to remove restaurant. It may have existing bookings.');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading restaurants...</p>
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
      
      <h1 className="text-3xl font-bold mb-2">Restaurant Management</h1>
      <p className="text-gray-600 mb-8">
        View and manage all restaurants on the platform.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Filters</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="searchTerm"
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                placeholder="Search by name or location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium py-2 px-4 rounded-md transition duration-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Restaurants Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Restaurants</h2>
          <span className="text-gray-500 text-sm">
            {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} found
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {filteredRestaurants.length > 0 ? (
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
                    Manager
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRestaurants.map(restaurant => (
                  <tr key={restaurant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.cost_rating_display}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{restaurant.city}, {restaurant.state}</div>
                      <div className="text-sm text-gray-500">{restaurant.zip_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{restaurant.manager_name}</div>
                      <div className="text-sm text-gray-500">{restaurant.manager_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${restaurant.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 
                          restaurant.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}
                      >
                        {restaurant.approval_status.charAt(0).toUpperCase() + restaurant.approval_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/restaurant-approvals?id=${restaurant.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        
                        {restaurant.approval_status === 'pending' && (
                          <Link
                            to={`/admin/restaurant-approvals?id=${restaurant.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </Link>
                        )}
                        
                        <button
                          onClick={() => handleRemoveRestaurant(restaurant.id, restaurant.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No restaurants found matching your filters.</p>
              {Object.values(filters).some(value => value !== '' && value !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="mt-2 text-indigo-600 hover:text-indigo-900"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantManagement;