import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login, error, setError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Get the return URL from location state or default to home
  const from = location.state?.from?.pathname || '/';
  
  // Check if user is already authenticated and redirect
  useEffect(() => {
    // Clear any lingering error messages when component loads
    setError(null);
    setFormError('');
    
    if (isAuthenticated && user) {
      console.log('User authenticated, redirecting...');
      redirectBasedOnRole(user);
    } else if (loginSuccess) {
      // If we've just logged in successfully, use cached data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Login successful, redirecting with cached user data');
      redirectBasedOnRole(userData);
    }
  }, [isAuthenticated, user, loginSuccess]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const redirectBasedOnRole = (userData) => {
    console.log('Redirecting based on role:', userData);
    // Check if we have a specific path to redirect to (from the location state)
    const isFromSpecified = from !== '/';
    
    // Default redirect path based on role
    let redirectPath;
    
    // Determine role-specific landing page
    if (userData && userData.role) {
      if (userData.role === 'customer') {
        redirectPath = '/customer/search';
      } else if (userData.role === 'restaurant_manager') {
        redirectPath = '/restaurant/dashboard';
      } else if (userData.role === 'admin') {
        redirectPath = '/admin/dashboard';
      } else {
        redirectPath = '/';
      }
    } else {
      redirectPath = '/';
    }
    
    // If user was trying to access a specific page before login, redirect there
    // unless it's the home page or login page (which would be redundant)
    const finalRedirect = isFromSpecified && from !== '/login' ? from : redirectPath;
    
    console.log('Redirecting to:', finalRedirect);
    navigate(finalRedirect, { replace: true });
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (formError) setFormError('');
    if (error) setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setError(null); // Clear auth context errors
    setIsLoading(true);
    
    const { username, password } = formData;
    
    // Basic validation
    if (!username || !password) {
      setFormError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    // Clear any existing tokens before attempting login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    try {
      console.log('Submitting login with:', { username });
      
      // Use the login function from AuthContext
      const userData = await login(username, password);
      console.log('Login successful:', userData);
      setLoginSuccess(true);

    } catch (err) {
      console.error('Login submission error:', err);
      
      // Clear any lingering success state
      setLoginSuccess(false);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Simple error handling 
      let errorMessage = 'Login failed. Please check your credentials.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          errorMessage = Array.isArray(err.response.data.non_field_errors) 
            ? err.response.data.non_field_errors.join(' ') 
            : err.response.data.non_field_errors;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-red-600 hover:text-red-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {(formError || error) && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm">
              {formError || error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter the username you chose during registration</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button type="button" className="font-medium text-red-600 hover:text-red-500">
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                }`}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Need help?</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Don't have an account? <Link to="/signup" className="font-medium text-red-600 hover:text-red-500 underline">Sign up now</Link>
              </p>
              <p className="mt-2 text-gray-600">
                Restaurant owner? <Link to="/restaurant/signup" className="font-medium text-red-600 hover:text-red-500 underline">Register your restaurant</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;