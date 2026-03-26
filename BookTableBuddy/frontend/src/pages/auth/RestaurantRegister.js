import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api, { handleApiError } from '../../api/api';
import axios from 'axios';

const RestaurantRegister = () => {
  const { registerRestaurantManager, error, setError } = useAuth();
  const navigate = useNavigate();
  
  // Registration now only has one step
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    role: 'restaurant_manager',
  });
  
  const [restaurantFormData, setRestaurantFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    cuisine: [],
    cost_rating: 2,
  });
  
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cuisines, setCuisines] = useState([]);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  // Fetch cuisines when component mounts
  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        const response = await api.utils.getCuisines();
        setCuisines(response.data);
      } catch (err) {
        console.error('Error fetching cuisines:', err);
        setFormError('Could not load cuisine types. Please try again later.');
      }
    };
    
    fetchCuisines();
  }, []);
  
  // This effect will redirect to the dashboard after successful registration
  useEffect(() => {
    if (registrationComplete) {
      // Redirect to login page after successful registration
      navigate('/login');
    }
  }, [registrationComplete, navigate]);
  
  const handleUserFormChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear form errors when user starts typing
    if (formError) setFormError('');
    if (error) setError(null);
  };
  
  const handleRestaurantFormChange = (e) => {
    // eslint-disable-next-line no-unused-vars
    const { name, value, checked } = e.target;
    
    if (name === 'cuisine') {
      // Handle multi-select for cuisine
      const cuisineId = parseInt(value);
      if (checked) {
        setRestaurantFormData(prev => ({
          ...prev,
          cuisine: [...prev.cuisine, cuisineId]
        }));
      } else {
        setRestaurantFormData(prev => ({
          ...prev,
          cuisine: prev.cuisine.filter(id => id !== cuisineId)
        }));
      }
    } else if (name === 'cost_rating') {
      // Handle numeric values
      setRestaurantFormData(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    } else {
      setRestaurantFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear form errors when user starts typing
    if (formError) setFormError('');
  };
  
  const validateUserForm = () => {
    setFormError('');
    const { username, email, password, password2 } = userFormData;
    
    if (!username || !email || !password || !password2) {
      setFormError('Please fill in all required fields');
      return false;
    }
    
    if (password !== password2) {
      setFormError('Passwords do not match');
      return false;
    }
    
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return false;
    }
    
    return true;
  };
  
  const validateRestaurantForm = () => {
    setFormError('');
    const { name, description, address, city, state, zip_code, phone, email } = restaurantFormData;
    
    if (!name || !description || !address || !city || !state || !zip_code || !phone || !email) {
      setFormError('Please fill in all required fields');
      return false;
    }
    
    if (restaurantFormData.cuisine.length === 0) {
      setFormError('Please select at least one cuisine type');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUserForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const registerResult = await registerRestaurantManager({
        ...userFormData,
        password2: userFormData.password2 // Include password2 for Django backend validation
      });
      
      if (!registerResult) {
        throw new Error('User registration failed');
      }
      
      setFormError('');
      setIsLoading(false);
      navigate('/login');
    } catch (err) {
      console.error('Restaurant registration error:', err);
      
      handleApiError(err, (errorMsg) => {
        setFormError(errorMsg);
      });
      
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register your restaurant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {formError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm">
              {formError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username<span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={userFormData.username}
                  onChange={handleUserFormChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address<span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={userFormData.email}
                  onChange={handleUserFormChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <div className="mt-1">
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={userFormData.first_name}
                    onChange={handleUserFormChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>
  
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={userFormData.last_name}
                    onChange={handleUserFormChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={userFormData.password}
                  onChange={handleUserFormChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>
            
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">
                Confirm Password<span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={userFormData.password2}
                  onChange={handleUserFormChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Register
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegister;