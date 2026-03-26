import React, { useState, useEffect } from 'react';
import { searchRestaurants, getCuisines } from '../../api/api';
import RestaurantList from './RestaurantList';

const SearchRestaurants = () => {
  const [searchParams, setSearchParams] = useState({
    date: '',
    time: '',
    party_size: '',
    city: '',
    state: '',
    zip_code: '',
    cuisine: ''
  });
  
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  
  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSearchParams(prev => ({
      ...prev,
      date: today
    }));
    
    // Fetch cuisines for the dropdown
    fetchCuisines();
  }, []);
  
  const fetchCuisines = async () => {
    try {
      const response = await getCuisines();
      setCuisines(response.data);
    } catch (error) {
      console.error('Error fetching cuisines:', error);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleLocationTypeChange = (e) => {
    const locationType = e.target.value;
    
    if (locationType === 'city_state') {
      setSearchParams(prev => ({
        ...prev,
        zip_code: '',
        city: prev.city || '',
        state: prev.state || ''
      }));
    } else {
      setSearchParams(prev => ({
        ...prev,
        city: '',
        state: '',
        zip_code: prev.zip_code || ''
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await searchRestaurants(searchParams);
      setRestaurants(response.data);
      setIsSearched(true);
    } catch (err) {
      console.error('Error searching restaurants:', err);
      setError('Failed to search restaurants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Find Your Table</h1>
      
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
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="form-input"
                value={searchParams.date}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                id="time"
                name="time"
                required
                className="form-input"
                value={searchParams.time}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">
                Party Size
              </label>
              <select
                id="party_size"
                name="party_size"
                required
                className="form-input"
                value={searchParams.party_size}
                onChange={handleChange}
              >
                <option value="">Select party size</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? 'person' : 'people'}
                  </option>
                ))}
                <option value="11">More than 10</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine (Optional)
              </label>
              <select
                id="cuisine"
                name="cuisine"
                className="form-input"
                value={searchParams.cuisine}
                onChange={handleChange}
              >
                <option value="">Any cuisine</option>
                {cuisines.map(cuisine => (
                  <option key={cuisine.id} value={cuisine.name}>
                    {cuisine.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <input
                    id="city_state"
                    name="location_type"
                    type="radio"
                    value="city_state"
                    checked={!searchParams.zip_code}
                    onChange={handleLocationTypeChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <label htmlFor="city_state" className="ml-2 block text-sm text-gray-700">
                    City & State
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      disabled={!!searchParams.zip_code}
                      className="form-input"
                      value={searchParams.city}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      disabled={!!searchParams.zip_code}
                      className="form-input"
                      value={searchParams.state}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <input
                    id="zip"
                    name="location_type"
                    type="radio"
                    value="zip"
                    checked={!!searchParams.zip_code}
                    onChange={handleLocationTypeChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <label htmlFor="zip" className="ml-2 block text-sm text-gray-700">
                    Zip Code
                  </label>
                </div>
                
                <input
                  type="text"
                  name="zip_code"
                  placeholder="Zip Code"
                  disabled={!searchParams.zip_code && (searchParams.city || searchParams.state)}
                  className="form-input"
                  value={searchParams.zip_code}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Find a Table'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {isSearched && (
        <RestaurantList 
          restaurants={restaurants} 
          searchParams={searchParams} 
          isLoading={isLoading} 
        />
      )}
    </div>
  );
};

export default SearchRestaurants;
