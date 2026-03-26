import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import api from '../api/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios default base URL
  useEffect(() => {
    // Ensure axios has the base URL set
    if (!axios.defaults.baseURL) {
      axios.defaults.baseURL = process.env.REACT_APP_API_URL || window.location.origin;
    }
  }, []);
  
  // Listen for unauthenticated events from API service
  useEffect(() => {
    const handleUnauthenticated = () => {
      console.log('Unauthenticated event received, logging out user');
      logout();
    };
    
    window.addEventListener('auth:unauthenticated', handleUnauthenticated);
    
    return () => {
      window.removeEventListener('auth:unauthenticated', handleUnauthenticated);
    };
  }, []);
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have tokens in localStorage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!accessToken || !refreshToken) {
          setLoading(false);
          return;
        }

        // Set default Authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Fetch user data
        const response = await axios.get('/api/users/profile/');
        
        if (response.data) {
          setUser(response.data);
        }
      } catch (err) {
        // If token is expired, try to refresh
        if (err.response && err.response.status === 401) {
          try {
            await refreshAccessToken();
            // Try to fetch user data again with new token
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
              const response = await axios.get('/api/users/profile/');
              if (response.data) {
                setUser(response.data);
              }
            }
          } catch (refreshErr) {
            // If refresh fails, log out
            console.error('Token refresh failed:', refreshErr);
            logout();
          }
        } else {
          console.error('Auth check error:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      setError(null);
      console.log('Attempting login with:', { username });
      
      // Clear any existing tokens before login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      
      // Use the API service for login
      const response = await api.auth.login({ username, password });
      console.log('Login response:', response.data);
      
      if (!response.data || !response.data.access) {
        throw new Error('Invalid response format - missing access token');
      }
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh || '');
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      // Create user data object
      const userData = {
        id: response.data.user_id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role || 'customer',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || ''
      };
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
      
      console.log('Login successful:', userData);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data) {
        console.error('Login error - Response data:', err.response.data);
        console.error('Login error - Response status:', err.response.status);
        console.error('Login error - Response headers:', err.response.headers);
        setError(err.response.data.detail || (typeof err.response.data === 'string' ? err.response.data : 'Login failed. Please check your credentials.'));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Network error. Please try again later.');
      }
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      console.log('Registration data being sent to API:', userData);
      
      // Make sure password2 field is included for Django backend validation
      if (userData.password && !userData.password2) {
        userData.password2 = userData.password;
      }
      
      const response = await axios.post('/api/users/register/', userData);
      console.log('Registration response:', response.data);
      
      // After successful registration, you may want to auto-login the user
      // For now, just return the response and let the UI handle the next steps
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        console.error('Response error data:', err.response.data);
        
        // Handle different error formats
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else if (typeof err.response.data === 'object') {
          // Handle field-specific errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('; ');
          
          if (fieldErrors) {
            setError(fieldErrors);
          } else {
            setError('Registration failed. Please try again.');
          }
        } else {
          setError('Registration failed. Please try again.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Network error. Please try again later.');
      }
      throw err;
    }
  };

  // Register restaurant manager
  const registerRestaurantManager = async (userData) => {
    try {
      // Set the role to restaurant_manager
      const managerData = { ...userData, role: 'restaurant_manager' };
      return await register(managerData);
    } catch (err) {
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Get the access token
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        // Notify backend about logout using the API service
        try {
          await api.auth.logout();
          console.log('Backend notified of logout');
        } catch (error) {
          console.error('Failed to notify backend of logout:', error);
          // Continue with local logout even if backend notification fails
        }
      }

      // Clear all auth-related data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Clear axios default headers
      delete axios.defaults.headers.common['Authorization'];
      
      // Reset auth state
      setUser(null);
      setError(null);
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      console.log('AuthContext: Logout process completed');
      
      // Force navigation to login page - wait a moment to ensure event listeners receive the logout event
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if there's an error, try to clean up
      localStorage.clear();
      setUser(null);
      
      // Force navigation to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  // Refresh token function
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken || refreshToken === 'undefined' || refreshToken === '') {
        console.error('No valid refresh token found in localStorage');
        throw new Error('No refresh token available');
      }
      
      console.log('Attempting to refresh token with:', { refreshTokenExists: !!refreshToken });
      
      // Use the API service to refresh the token
      const response = await api.auth.refreshToken(refreshToken);
      
      const { access } = response.data;
      
      if (!access) {
        throw new Error('No access token in refresh response');
      }
      
      console.log('Token refresh successful');
      
      // Update localStorage
      localStorage.setItem('accessToken', access);
      
      // Update axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return access;
    } catch (err) {
      console.error('Token refresh error:', err);
      // Clear invalid tokens
      if (err.message === 'No refresh token available' || 
          (err.response && err.response.status === 401)) {
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessToken');
        delete axios.defaults.headers.common['Authorization'];
      }
      throw err;
    }
  };

  // Axios response interceptor to handle token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // Don't attempt to refresh if we're already logging out or if the request URL is logout
        if (originalRequest.url?.includes('/logout/')) {
          return Promise.reject(error);
        }
        
        // If error is 401 (Unauthorized) and the request hasn't been retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Check if refresh token exists
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              // No refresh token means we can't refresh, log out
              logout();
              return Promise.reject(error);
            }
            
            // Try to refresh the token
            const newToken = await refreshAccessToken();
            
            // Retry the original request with the new token
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, log the user out
            console.error('Token refresh failed in interceptor:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        // Handle 403 Forbidden errors (permissions issue)
        if (error.response?.status === 403) {
          console.error('Permission denied:', error.response.data);
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Create context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    registerRestaurantManager,
    logout,
    refreshAccessToken,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;