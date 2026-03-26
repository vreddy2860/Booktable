import axios from 'axios';

// Set base URL for API calls - ensure we don't have duplicate slashes in URLs
const apiBase = process.env.REACT_APP_API_URL || window.location.origin;
axios.defaults.baseURL = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.put['Content-Type'] = 'application/json';
axios.defaults.headers.patch['Content-Type'] = 'application/json';

// Helper to ensure Authorization header is properly set for authenticated requests
const setAuthHeader = () => {
  console.log('Debug: setAuthHeader function called');
  const accessToken = localStorage.getItem('accessToken');
  console.log('Debug: Token retrieved from localStorage:', accessToken ? `${accessToken.substring(0, 10)}...` : 'null/undefined');
  
  if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
    // Create a new instance to avoid modifying global defaults for public endpoints
    console.log('Debug: Creating authenticated axios instance');
    const instance = axios.create();
    instance.defaults.baseURL = axios.defaults.baseURL;
    console.log('Debug: baseURL set to:', instance.defaults.baseURL);
    
    instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    instance.defaults.headers.common['Content-Type'] = 'application/json';
    instance.defaults.headers.post['Content-Type'] = 'application/json';
    instance.defaults.headers.put['Content-Type'] = 'application/json';
    instance.defaults.headers.patch['Content-Type'] = 'application/json';
    
    // Add request interceptor for debugging
    instance.interceptors.request.use(config => {
      console.log('Debug: Authenticated request:', { 
        method: config.method,
        url: config.url, 
        baseURL: config.baseURL,
        fullURL: config.baseURL + config.url,
        headers: config.headers
      });
      return config;
    });
    
    return instance;
  }
  console.warn('Debug: No valid access token found for authenticated request');
  return axios;
};

// Log request details in development mode
axios.interceptors.request.use(config => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data || config.params);
  return config;
}, error => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
axios.interceptors.response.use(response => {
  console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
  return response;
}, error => {
  console.error('Response error:', error.response || error);
  return Promise.reject(error);
});

// Categories of API calls
export const api = {
  // Authentication endpoints
  auth: {
    login: (credentials) => {
      console.log('API Service: Login request', { username: credentials.username });
      return axios.post('/api/users/login/', credentials);
    },
    register: (userData) => {
      console.log('API Service: Register request');
      return axios.post('/api/users/register/', userData);
    },
    refreshToken: (refreshToken) => {
      console.log('API Service: Token refresh request');
      return axios.post('/api/users/refresh/', { refresh: refreshToken });
    },
    getCurrentUser: () => {
      console.log('API Service: Get current user profile');
      return setAuthHeader().get('/api/users/profile/');
    },
    updateProfile: (userData) => {
      console.log('API Service: Update user profile');
      return setAuthHeader().put('/api/users/profile/', userData);
    },
    logout: () => {
      console.log('API Service: Logout request');
      // Use a new instance to avoid clearing global auth headers before the request is sent
      const instance = setAuthHeader();
      return instance.post('/api/users/logout/');
    },
  },

  // Restaurant endpoints
  restaurants: {
    getList(params) {
      return axios.get('/api/restaurants/search/', { params });
    },
    
    flexibleSearch(params) {
      return axios.get('/api/restaurants/flexible-search/', { params });
    },
    getById: (id) => {
      console.log('Debug: API getById called, ID:', id);
      return axios.get(`/api/restaurants/${id}/`);
    },
    create: (data) => {
      console.log('Debug: API create called with data:', data);
      console.log('Debug: Token in localStorage:', localStorage.getItem('accessToken'));
      
      // Check authentication status
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('Debug: No auth token available for restaurant creation');
      }
      
      // Show what URL we're actually hitting
      const baseUrl = axios.defaults.baseURL;
      console.log('Debug: Full URL for create:', `${baseUrl}/api/restaurants/`);
      
      // Create a deep copy of the data to modify
      const processedData = JSON.parse(JSON.stringify(data));
      
      // Format cuisine data as expected by the backend
      if (processedData.cuisine && Array.isArray(processedData.cuisine)) {
        // The backend expects objects with both id and name fields
        processedData.cuisine = processedData.cuisine.map(id => {
          // Need to get the cuisine name from somewhere - we'll look it up in the backend
          // For now, let's use a hardcoded mapping or fetch it if we have the data
          const cuisineMap = {
            1: 'Italian',
            2: 'Indian',
            3: 'Mexican',
            4: 'Chinese',
            5: 'American',
            6: 'Japanese',
            7: 'Mediterranean',
            8: 'Thai',
            9: 'French',
            10: 'Greek'
          };
          
          return { 
            id: parseInt(id), 
            name: cuisineMap[id] || 'Unknown' // Fallback in case we don't have the mapping
          };
        });
      }
      
      console.log('Debug: Sending processed data:', processedData);
      
      return setAuthHeader().post('/api/restaurants/', processedData);
    },
    update: (id, data) => {
      console.log('Debug: API update called, ID:', id);
      
      // Check if we're dealing with FormData (for file uploads)
      const isFormData = data instanceof FormData;
      console.log('Data is FormData:', isFormData);
      
      // Set the appropriate headers for FormData or JSON
      const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
      console.log('Using headers:', headers);
      
      // Make the API call with appropriate headers
      return setAuthHeader().put(`/api/restaurants/${id}/`, data, { headers });
    },
    delete: (id) => {
      console.log('Debug: API delete called, ID:', id);
      return setAuthHeader().delete(`/api/restaurants/${id}/`);
    },
    getAvailability: (id, date, partySize) =>
      axios.get(`/api/restaurants/available-times/${id}/`, { params: { date, party_size: partySize } }),

    // Restaurant tables
    getTables: (restaurantId) => axios.get(`/api/restaurants/${restaurantId}/tables/`),
    addTable: (restaurantId, tableData) => setAuthHeader().post(`/api/restaurants/${restaurantId}/tables/`, tableData),
    updateTable: (restaurantId, tableId, tableData) =>
      setAuthHeader().put(`/api/restaurants/${restaurantId}/tables/${tableId}/`, tableData),
    deleteTable: (restaurantId, tableId) =>
      setAuthHeader().delete(`/api/restaurants/${restaurantId}/tables/${tableId}/`),

    // Restaurant photos
    getPhotos(restaurantId) {
      return axios.get(`/api/restaurants/${restaurantId}/photos/`);
    },
    addPhoto(restaurantId, photoData) {
      return setAuthHeader().post(`/api/restaurants/${restaurantId}/photos/`, photoData);
    },
    addPhotoBulk(restaurantId, photoFormData) {
      // Send multiple photos at once using a special bulk endpoint
      // If API doesn't have a bulk endpoint, this will fall back to individual uploads
      if (restaurantId) {
        return setAuthHeader().post(`/api/restaurants/${restaurantId}/photos/bulk/`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).catch(error => {
          console.error('Bulk upload failed, falling back to individual uploads', error);
          
          // Extract photos from FormData and upload them individually
          const promises = [];
          let i = 0;
          let photoEntry = photoFormData.get(`photos[${i}][image]`);
          
          while (photoEntry) {
            const singlePhotoData = new FormData();
            singlePhotoData.append('image', photoFormData.get(`photos[${i}][image]`));
            singlePhotoData.append('caption', photoFormData.get(`photos[${i}][caption]`) || 'Restaurant Photo');
            singlePhotoData.append('is_primary', photoFormData.get(`photos[${i}][is_primary]`));
            
            promises.push(setAuthHeader().post(`/api/restaurants/${restaurantId}/photos/`, singlePhotoData));
            i++;
            photoEntry = photoFormData.get(`photos[${i}][image]`);
          }
          
          return Promise.all(promises);
        });
      }
      return Promise.reject(new Error('Restaurant ID is required for photo uploads'));
    },
    updatePhoto(restaurantId, photoId, photoData) {
      return setAuthHeader().put(`/api/restaurants/${restaurantId}/photos/${photoId}/`, photoData);
    },
    deletePhoto(restaurantId, photoId) {
      return setAuthHeader().delete(`/api/restaurants/${restaurantId}/photos/${photoId}/`);
    },

    // Restaurant operating hours
    getHours: (restaurantId) => axios.get(`/api/restaurants/${restaurantId}/hours/`),
    updateHours: (restaurantId, hoursData) =>
      setAuthHeader().put(`/api/restaurants/${restaurantId}/hours/`, hoursData),

    // Restaurant reviews
    getReviews: (restaurantId) => axios.get(`/api/restaurants/${restaurantId}/reviews/`),
    addReview: (restaurantId, reviewData) =>
      setAuthHeader().post(`/api/restaurants/${restaurantId}/reviews/`, reviewData),

    // Manager endpoints
    getManagerRestaurants: () => setAuthHeader().get('/api/restaurants/my-restaurants/'),
    getPendingApproval: () => setAuthHeader().get('/api/restaurants/pending-approval/'),
  },

  // Booking endpoints
  bookings: {
    create: (bookingData) => setAuthHeader().post('/api/bookings/create/', bookingData),
    getUserBookings: () => setAuthHeader().get('/api/bookings/my-bookings/'),
    getById: (id) => setAuthHeader().get(`/api/bookings/${id}/`),
    update: (id, data) => setAuthHeader().put(`/api/bookings/${id}/`, data),
    cancelBooking: (id) => setAuthHeader().patch(`/api/bookings/cancel/${id}/`),
    completeBooking: (id) => setAuthHeader().patch(`/api/bookings/complete/${id}/`),
    noShowBooking: (id) => setAuthHeader().patch(`/api/bookings/no-show/${id}/`),
    getRestaurantBookings: (restaurantId) =>
      setAuthHeader().get(`/api/bookings/restaurant/${restaurantId}/`),
    getTodayBookings: (restaurantId) => 
      setAuthHeader().get(`/api/bookings/today/${restaurantId ? `?restaurant_id=${restaurantId}` : ''}`),
    getDateRangeBookings: (startDate, endDate, restaurantId) => {
      let url = '/api/bookings/date-range/?';
      if (startDate) url += `start_date=${startDate}&`;
      if (endDate) url += `end_date=${endDate}&`;
      if (restaurantId) url += `restaurant_id=${restaurantId}`;
      return setAuthHeader().get(url);
    },
  },

  // Admin endpoints
  admin: {
    getRestaurantApprovals: () => setAuthHeader().get('/api/restaurants/pending-approval/'),
    approveRestaurant: (id, status) => {
      if (!status || !['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid approval status');
      }
      
      console.log('API: Approving restaurant with status:', status);
      const instance = setAuthHeader();
      const formData = new URLSearchParams();
      formData.append('approval_status', status);
      
      return instance({
        method: 'PATCH',
        url: `/api/restaurants/approve/${id}/`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: formData
      });
    },
    rejectRestaurant: (id) => setAuthHeader().delete(`/api/restaurants/${id}/`),
    getUsers: () => setAuthHeader().get('/api/users/list/'),
    updateUserRole: (id, role) => setAuthHeader().patch(`/api/users/change-role/${id}/`, { role }),
  },

  // Analytics endpoints
  analytics: {
    getSystemStats: () => setAuthHeader().get('/api/analytics/system/'),
    getBookingAnalytics: () => setAuthHeader().get('/api/analytics/bookings/'),
    getRestaurantAnalytics: (restaurantId) =>
      setAuthHeader().get(`/api/analytics/restaurant/${restaurantId}/`),
  },

  // Utility endpoints
  utils: {
    getCuisines: () => axios.get('/api/restaurants/cuisines/'),
  }
};

// Adds a common error handler that can be used across the app
export const handleApiError = (error, defaultMessage = 'An unexpected error occurred. Please try again.') => {
  console.error('API Error:', error);

  let errorMessage = defaultMessage;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Debug: Response data:', error.response.data);
    console.error('Debug: Response status:', error.response.status);
    
    // Log the full error object for detailed debugging
    console.log('Debug: Full error object:', error);
    
    // Enhanced error handling for 400 errors
    if (error.response.status === 400) {
      console.log('Debug: 400 Bad Request detected - detailed error info:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }

    if (typeof error.response.data === 'string') {
      errorMessage = error.response.data;
    } else if (error.response.data.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response.data.error) {
      errorMessage = error.response.data.error;
    } else if (error.response.data.non_field_errors) {
      // Handle non-field errors returned by DRF
      if (Array.isArray(error.response.data.non_field_errors)) {
        errorMessage = error.response.data.non_field_errors.join('; ');
      } else {
        errorMessage = error.response.data.non_field_errors;
      }
    } else if (typeof error.response.data === 'object') {
      // Handle field-specific errors from DRF
      const fieldErrors = Object.entries(error.response.data)
        .map(([field, errors]) => {
          if (Array.isArray(errors)) {
            return `${field}: ${errors.join(', ')}`;
          }
          return `${field}: ${errors}`;
        })
        .join('; ');

      errorMessage = fieldErrors || errorMessage;
    }

    // Special handling for common status codes
    if (error.response.status === 401) {
      errorMessage = 'Authentication failed. Please log in again.';
      // Clear tokens on 401 errors as they're most likely expired
      const event = new CustomEvent('auth:unauthenticated');
      window.dispatchEvent(event);
    } else if (error.response.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.response.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.response.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response from server. Please check your internet connection.';
  } else if (error.message) {
    // Something happened in setting up the request that triggered an Error
    errorMessage = error.message;
  }

  return errorMessage;
};

// Export a direct reference to the getAvailability function for legacy code
export const getAvailableTimes = (restaurantId, date, partySize) =>
  api.restaurants.getAvailability(restaurantId, date, partySize);

export default api;