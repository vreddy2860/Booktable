import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const RestaurantProfile = () => {
  // State for photo upload status tracking
  const [uploadPhotoStatus, setUploadPhotoStatus] = useState({
    uploading: false,
    progress: 0,
    error: null
  });
  
  // Handle photo upload - this only adds the photo to the form, not uploading it to the server yet
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Verify file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadPhotoStatus({
        uploading: false,
        progress: 0,
        error: 'File type not supported. Please upload a JPG, PNG, or GIF.'
      });
      return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadPhotoStatus({
        uploading: false,
        progress: 0,
        error: 'File is too large. Maximum size is 10MB.'
      });
      return;
    }
    
    // Show that we're processing the photo
    setUploadPhotoStatus({
      uploading: true,
      progress: 30,
      error: null
    });
    
    // Create a FileReader for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      // Get the preview URL
      const previewUrl = event.target.result;
      
      // Update upload progress for UI feedback
      setUploadPhotoStatus({
        uploading: true,
        progress: 70,
        error: null
      });
      
      // Create a temporary object for display
      const photoObject = {
        // Use a temporary preview URL for display only
        preview_url: previewUrl,
        // Store the actual file for later upload
        file: file,
        caption: file.name.split('.')[0] || 'Restaurant Photo',
        is_primary: (!formData.photos || formData.photos.length === 0)
      };
      
      // Add additional debugging info
      console.log('Photo being added to form:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasPreview: !!previewUrl
      });
      
      // Add to form data
      const updatedFormData = {...formData};
      const newPhotos = [...(updatedFormData.photos || [])];
      newPhotos.unshift(photoObject);
      updatedFormData.photos = newPhotos;
      
      // Update state
      setFormData(updatedFormData);
      
      // Show success in the UI
      setUploadPhotoStatus({
        uploading: false,
        progress: 100,  // Mark as complete on frontend
        error: null
      });
      
      console.log('Photo added to form and will be uploaded when saving changes');
    };
    
    // Start reading the file for preview
    reader.readAsDataURL(file);
  };
  // Days of the week for hours selection
  const days = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];
  
  // Generate time options for the select dropdowns
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip times between 2am-6am for regular restaurant hours
        if ((hour >= 2 && hour < 6)) continue;
        
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        const timeValue = `${h}:${m}:00`;
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const timeDisplay = `${displayHour}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
        
        options.push(<option key={timeValue} value={timeValue}>{timeDisplay}</option>);
      }
    }
    return options;
  };

  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  // Initial form state
  const initialState = {
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
    cost_rating: 1,
    hours: Array(7).fill().map((_, index) => ({
      day: index,
      opening_time: '09:00:00',
      closing_time: '21:00:00'
    })),
    tables: [
      {table_number: 1, capacity: 4},
      {table_number: 2, capacity: 2},
      {table_number: 3, capacity: 6}
    ],
    photos: [{
      caption: 'Main Photo',
      is_primary: true,
      file: null, // For new file uploads
      preview_url: null // For client-side preview
    }]
  };
  
  const [formData, setFormData] = useState(initialState);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Fetch restaurant manager data and cuisines on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get all cuisines
        const cuisinesResponse = await api.utils.getCuisines();
        setCuisines(cuisinesResponse.data);
        
        // Get user's restaurants using the manager-specific endpoint
        const restaurantsResponse = await api.restaurants.getManagerRestaurants();
        console.log('Manager restaurants response:', restaurantsResponse.data);
        setRestaurants(restaurantsResponse.data);
        
        if (restaurantsResponse.data.length > 0) {
          // Get detailed info for the first restaurant
          const primaryRestaurant = restaurantsResponse.data[0];
          console.log('Loading details for restaurant ID:', primaryRestaurant.id);
          const detailResponse = await api.restaurants.getById(primaryRestaurant.id);
          
          setSelectedRestaurant(detailResponse.data);
          
          // Pre-fill form with restaurant data
          const restaurant = detailResponse.data;
          setFormData({
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            city: restaurant.city,
            state: restaurant.state,
            zip_code: restaurant.zip_code,
            phone: restaurant.phone,
            email: restaurant.email,
            website: restaurant.website || '',
            cuisine: restaurant.cuisine.map(c => c.id),
            cost_rating: restaurant.cost_rating,
            latitude: restaurant.latitude || '',
            longitude: restaurant.longitude || '',
            // Get hours or use default
            hours: restaurant.hours && restaurant.hours.length > 0 ? restaurant.hours : [
              {day: 0, opening_time: '11:00:00', closing_time: '22:00:00'},
              {day: 1, opening_time: '11:00:00', closing_time: '22:00:00'},
              {day: 2, opening_time: '11:00:00', closing_time: '22:00:00'},
              {day: 3, opening_time: '11:00:00', closing_time: '22:00:00'},
              {day: 4, opening_time: '11:00:00', closing_time: '23:00:00'},
              {day: 5, opening_time: '11:00:00', closing_time: '23:00:00'},
              {day: 6, opening_time: '12:00:00', closing_time: '21:00:00'}
            ],
            // Get tables or use default
            tables: restaurant.tables && restaurant.tables.length > 0 ? restaurant.tables : [
              {table_number: 'A1', capacity: 2},
              {table_number: 'A2', capacity: 2},
              {table_number: 'B1', capacity: 4},
              {table_number: 'B2', capacity: 4}
            ],
            // Get photos or use default
            photos: restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos : [
              {
                image_url: 'https://res.cloudinary.com/booktable/image/upload/v1651234567/restaurant-default.jpg', 
                caption: 'Restaurant View', 
                is_primary: true
              }
            ]
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load restaurant data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user]);
  
  // Handle input changes for all form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle cuisine selection (multiple checkboxes)
  const handleCuisineChange = (cuisineId) => {
    setFormData(prev => {
      const cuisineIds = [...prev.cuisine];
      
      if (cuisineIds.includes(cuisineId)) {
        // Remove cuisine if already selected
        return {
          ...prev,
          cuisine: cuisineIds.filter(id => id !== cuisineId)
        };
      } else {
        // Add cuisine if not already selected
        return {
          ...prev,
          cuisine: [...cuisineIds, cuisineId]
        };
      }
    });
  };
  
  // Handle restaurant selection change
  const handleRestaurantSelect = async (restaurantId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading details for restaurant ID:', restaurantId);
      
      // Get detailed info for the selected restaurant
      const detailResponse = await api.restaurants.getById(restaurantId);
      setSelectedRestaurant(detailResponse.data);
      
      // Pre-fill form with restaurant data
      const restaurant = detailResponse.data;
      console.log('Restaurant data loaded:', restaurant);
      
      // Process photos to ensure they have proper data format
      let processedPhotos = [];
      if (restaurant.photos && restaurant.photos.length > 0) {
        processedPhotos = restaurant.photos.map(photo => {
          // Determine the image URL to use - prefer image_path when available (relative URL)
          let imageUrl = '';
          
          // Use the relative path if available
          if (photo.image_path) {
            // Get the API base URL from the environment
            const apiBaseUrl = process.env.REACT_APP_API_URL || '';
            // Create a URL using the base of the API URL (without using localhost directly)
            imageUrl = `${apiBaseUrl}${photo.image_path}`;
          } else if (photo.image) {
            // Fallback to image field if provided
            imageUrl = photo.image;
          }
          
          console.log('Photo image URL:', imageUrl);
          
          return {
            id: photo.id,
            image_url: imageUrl,
            caption: photo.caption || 'Restaurant Photo',
            is_primary: photo.is_primary || false
          };
        });
        console.log('Processed photos:', processedPhotos);
      } else {
        processedPhotos = [
          {
            image_url: '',
            caption: 'Restaurant View',
            is_primary: true
          }
        ];
      }
      
      setFormData({
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        zip_code: restaurant.zip_code,
        phone: restaurant.phone,
        email: restaurant.email,
        website: restaurant.website || '',
        cuisine: restaurant.cuisine.map(c => c.id),
        cost_rating: restaurant.cost_rating,
        latitude: restaurant.latitude || '',
        longitude: restaurant.longitude || '',
        hours: restaurant.hours && restaurant.hours.length > 0 ? restaurant.hours : [
          {day: 0, opening_time: '11:00:00', closing_time: '22:00:00'},
          {day: 1, opening_time: '11:00:00', closing_time: '22:00:00'},
          {day: 2, opening_time: '11:00:00', closing_time: '22:00:00'},
          {day: 3, opening_time: '11:00:00', closing_time: '22:00:00'},
          {day: 4, opening_time: '11:00:00', closing_time: '23:00:00'},
          {day: 5, opening_time: '11:00:00', closing_time: '23:00:00'},
          {day: 6, opening_time: '12:00:00', closing_time: '21:00:00'}
        ],
        tables: restaurant.tables && restaurant.tables.length > 0 ? restaurant.tables : [
          {table_number: 'A1', capacity: 2},
          {table_number: 'A2', capacity: 2},
          {table_number: 'B1', capacity: 4},
          {table_number: 'B2', capacity: 4}
        ],
        photos: processedPhotos
      });
    } catch (err) {
      console.error('Error getting restaurant details:', err);
      setError('Failed to load restaurant details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle new restaurant button click
  const handleNewRestaurant = () => {
    setSelectedRestaurant(null);
    setFormData({
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
      latitude: '',
      longitude: '',
      hours: [
        {day: 0, opening_time: '11:00:00', closing_time: '22:00:00'},
        {day: 1, opening_time: '11:00:00', closing_time: '22:00:00'},
        {day: 2, opening_time: '11:00:00', closing_time: '22:00:00'},
        {day: 3, opening_time: '11:00:00', closing_time: '22:00:00'},
        {day: 4, opening_time: '11:00:00', closing_time: '23:00:00'},
        {day: 5, opening_time: '11:00:00', closing_time: '23:00:00'},
        {day: 6, opening_time: '12:00:00', closing_time: '21:00:00'}
      ],
      tables: [
        {table_number: 'A1', capacity: 2},
        {table_number: 'A2', capacity: 2},
        {table_number: 'B1', capacity: 4},
        {table_number: 'B2', capacity: 4}
      ],
      photos: [
        {
          image_url: 'https://example.com/restaurant-photo-default.jpg', 
          caption: 'Restaurant View', 
          is_primary: true
        }
      ]
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    console.log('Debug: Starting restaurant submission');
    console.log('Debug: Auth user:', user);
    console.log('Debug: Auth token present:', !!localStorage.getItem('accessToken'));
    
    // Prepare the data payload - ensure all required fields are formatted correctly
    const payload = {
      // Basic restaurant information
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      phone: formData.phone,
      email: formData.email,
      website: formData.website || null,
      cost_rating: parseInt(formData.cost_rating),
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      
      // Backend expects an array of objects with id and name fields for cuisine
      cuisine: formData.cuisine.map(id => {
        const cuisineId = parseInt(id);
        const cuisineObj = cuisines.find(c => c.id === cuisineId);
        return {
          id: cuisineId,
          name: cuisineObj ? cuisineObj.name : 'Unknown'
        };
      }),
      
      // Ensure hours has day, opening_time, and closing_time for each day
      hours: days.map((day, index) => ({
        day: day.value,
        opening_time: formData.hours[index]?.opening_time || '11:00:00',
        closing_time: formData.hours[index]?.closing_time || '22:00:00'
      })),
      
      // Ensure tables are formatted correctly
      tables: formData.tables.map(table => ({
        table_number: table.table_number,
        capacity: parseInt(table.capacity)
      })),
      
      // Handle photos - focus only on file uploads
      photos: formData.photos
        .filter(photo => photo && (photo.file || photo.id))
        .map((photo, index) => ({
          id: photo.id, // Include ID only for existing photos
          caption: photo.caption || 'Restaurant Photo',
          is_primary: index === 0 ? true : Boolean(photo.is_primary),
          _file: photo.file // Track files for upload
        }))
    };
    
    // Validate required fields - Photos are required for new restaurants
    // For existing restaurants, we don't force re-uploading photos
    if (!selectedRestaurant) {
      // This is a new restaurant - require at least one photo
      const hasPhotoFiles = formData.photos.some(photo => photo && photo.file);
      
      if (!hasPhotoFiles) {
        setError('At least one photo is required for new restaurants. Please upload a photo.');
        setSaving(false);
        window.scrollTo(0, 0);
        return;
      }
    }
    // For existing restaurants, we don't need to validate photos again
    
    console.log('Submitting restaurant data:', payload);
    
    try {
      let response;
      
      console.log('Debug: About to make API call with payload', JSON.stringify(payload, null, 2));
      
      if (selectedRestaurant) {
        // Update existing restaurant
        console.log(`Debug: Updating restaurant ID ${selectedRestaurant.id}`);
        
        // Create a FormData object for the update
        const restaurantFormData = new FormData();
        
        // Add all the basic restaurant data fields
        restaurantFormData.append('name', payload.name);
        restaurantFormData.append('description', payload.description);
        restaurantFormData.append('address', payload.address);
        restaurantFormData.append('city', payload.city);
        restaurantFormData.append('state', payload.state);
        restaurantFormData.append('zip_code', payload.zip_code);
        restaurantFormData.append('phone', payload.phone);
        restaurantFormData.append('email', payload.email);
        restaurantFormData.append('website', payload.website || '');
        restaurantFormData.append('cost_rating', payload.cost_rating);
        if (payload.latitude) restaurantFormData.append('latitude', payload.latitude);
        if (payload.longitude) restaurantFormData.append('longitude', payload.longitude);
        
        // Handle cuisine (complex field)
        payload.cuisine.forEach((cuisine, index) => {
          restaurantFormData.append(`cuisine[${index}][id]`, cuisine.id);
          restaurantFormData.append(`cuisine[${index}][name]`, cuisine.name);
        });
        
        // Handle hours (complex field)
        payload.hours.forEach((hour, index) => {
          restaurantFormData.append(`hours[${index}][day]`, hour.day);
          restaurantFormData.append(`hours[${index}][opening_time]`, hour.opening_time);
          restaurantFormData.append(`hours[${index}][closing_time]`, hour.closing_time);
        });
        
        // Handle tables (complex field)
        payload.tables.forEach((table, index) => {
          restaurantFormData.append(`tables[${index}][table_number]`, table.table_number);
          restaurantFormData.append(`tables[${index}][capacity]`, table.capacity);
        });
        
        // We'll handle photos differently - we'll use the standard DRF fields for existing photos
        // and then handle file uploads separately after the initial update
        
        // First, just add existing photos by ID (with no changes to them)
        let photoIndex = 0;
        const existingPhotos = formData.photos.filter(p => p.id && !p.file);
        existingPhotos.forEach((photo) => {
          restaurantFormData.append(`photos[${photoIndex}][id]`, photo.id);
          restaurantFormData.append(`photos[${photoIndex}][caption]`, photo.caption || 'Restaurant Photo');
          restaurantFormData.append(`photos[${photoIndex}][is_primary]`, photo.is_primary ? 'true' : 'false');
          photoIndex++;
        });
        
        // Log the FormData contents for debugging before sending
        console.log('FormData entries:');
        for (let pair of restaurantFormData.entries()) {
          console.log(pair[0], typeof pair[1] === 'object' ? 'File: ' + pair[1].name : pair[1]);
        }

        // Check if we have any new photos with files to upload
        const photosWithFiles = formData.photos.filter(p => p.file);
        console.log(`Found ${photosWithFiles.length} new photos with files to upload`);
        
        // Make the update request with the complete FormData
        response = await api.restaurants.update(selectedRestaurant.id, restaurantFormData);
        console.log('Debug: Update successful', response);
        
        // If we have new photos with files, upload them separately using the bulk endpoint
        if (photosWithFiles.length > 0) {
          try {
            console.log(`Uploading ${photosWithFiles.length} new photos via bulk upload endpoint`);
            
            // Create a FormData object for the bulk photo upload
            const photoFormData = new FormData();
            
            // Add each photo to the FormData using the photos[index][field] format
            photosWithFiles.forEach((photo, i) => {
              console.log(`Adding photo ${i + 1}/${photosWithFiles.length}:`, {
                name: photo.file.name,
                type: photo.file.type,
                size: photo.file.size
              });
              
              photoFormData.append(`photos[${i}][image]`, photo.file);
              photoFormData.append(`photos[${i}][caption]`, photo.caption || 'Restaurant Photo');
              photoFormData.append(`photos[${i}][is_primary]`, photo.is_primary ? 'true' : 'false');
            });
            
            // Upload the photos using the bulk endpoint
            const photoResponse = await api.restaurants.addPhotoBulk(selectedRestaurant.id, photoFormData);
            console.log('Photo upload successful:', photoResponse);
            
            // Refresh the restaurant data to include the new photos
            const updatedResponse = await api.restaurants.getById(selectedRestaurant.id);
            setSelectedRestaurant(updatedResponse.data);
          } catch (photoError) {
            console.error('Error uploading photos:', photoError);
            // Show error but don't fail the entire operation since the restaurant was updated
            setError('Restaurant was updated but there was an error uploading photos. Please try again later.');
          }
        }
        
        setSuccess(true);
      } else {
        // Create new restaurant
        console.log('Debug: Creating new restaurant');
        const baseUrl = process.env.REACT_APP_API_URL || window.location.origin;
        console.log('Debug: API base URL:', baseUrl);
        console.log('Debug: Full URL will be:', baseUrl + '/api/restaurants/');
        
        // Create a simplified payload without photos for the initial creation
        const initialPayload = { ...payload };
        delete initialPayload.photos; // Remove photos from initial creation request
        
        // Create restaurant without photos first
        response = await api.restaurants.create(initialPayload);
        console.log('Debug: Create successful', response);
        const newRestaurantId = response.data.id;
        setSelectedRestaurant(response.data);
        setRestaurants(prev => [response.data, ...prev]);
        
        // Now upload any actual photo files
        const photosWithFiles = formData.photos.filter(p => p.file);
        if (photosWithFiles.length > 0) {
          console.log(`Uploading ${photosWithFiles.length} photos to new restaurant`);
          
          // Create a FormData object for the bulk photo upload
          const photoFormData = new FormData();
          
          // Add each photo to the FormData using the photos[index][field] format
          photosWithFiles.forEach((photo, i) => {
            console.log(`Adding photo ${i + 1}/${photosWithFiles.length}:`, {
              name: photo.file.name,
              type: photo.file.type,
              size: photo.file.size
            });
            
            photoFormData.append(`photos[${i}][image]`, photo.file);
            photoFormData.append(`photos[${i}][caption]`, photo.caption || 'Restaurant Photo');
            photoFormData.append(`photos[${i}][is_primary]`, i === 0 ? 'true' : photo.is_primary ? 'true' : 'false');
          });
          
          // Log the FormData contents for debugging
          console.log('Photo FormData entries:');
          for (let pair of photoFormData.entries()) {
            console.log(pair[0], typeof pair[1] === 'object' ? 'File: ' + pair[1].name : pair[1]);
          }
          
          try {
            // Upload the photos using the bulk endpoint
            const photoResponse = await api.restaurants.addPhotoBulk(newRestaurantId, photoFormData);
            console.log('Photo upload successful:', photoResponse);
            
            // Refresh the restaurant data to include the new photos
            const updatedResponse = await api.restaurants.getById(newRestaurantId);
            setSelectedRestaurant(updatedResponse.data);
          } catch (uploadError) {
            console.error('Error uploading photos:', uploadError);
            // Show warning but don't fail the entire operation
            console.warn('Restaurant was created but there was an error uploading photos.');
          }
        }
        
        setSuccess(true);
        
        // Redirect to dashboard
        navigate('/restaurant/dashboard');
      }
    } catch (err) {
      console.error('Debug: Error saving restaurant:', err);
      console.error('Debug: Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        requestURL: err.config?.url,
        requestMethod: err.config?.method,
        requestHeaders: err.config?.headers
      });
      let errorMessage = 'Failed to save restaurant. Please try again.';
      
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          // Format field errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, errors]) => {
              if (typeof errors === 'object' && !Array.isArray(errors)) {
                return `${field}: ${JSON.stringify(errors)}`;
              }
              return `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`;
            })
            .join('; ');
          
          errorMessage = `Validation error: ${fieldErrors}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
      
      // Scroll to top to show success/error message
      window.scrollTo(0, 0);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading restaurant profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{selectedRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</h1>
          <p className="text-gray-600">
            {selectedRestaurant
              ? 'Update your restaurant information below.'
              : 'Complete the form below to add your restaurant to our platform.'}
          </p>
        </div>
        
        {/* Restaurant selector and Add New button */}
        <div className="flex space-x-4">
          {restaurants.length > 0 && (
            <div className="flex items-center">
              <label htmlFor="restaurant-selector" className="mr-2 text-gray-600">Select Restaurant:</label>
              <select
                id="restaurant-selector"
                className="border border-gray-300 rounded-md px-3 py-1"
                value={selectedRestaurant?.id || ''}
                onChange={(e) => handleRestaurantSelect(parseInt(e.target.value))}
              >
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleNewRestaurant}
            className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded-md">
            Add New Restaurant
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p>Restaurant information saved successfully!</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="cost_rating" className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range *
                  </label>
                  <select
                    id="cost_rating"
                    name="cost_rating"
                    value={formData.cost_rating}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="1">$ (Inexpensive)</option>
                    <option value="2">$$ (Moderate)</option>
                    <option value="3">$$$ (Expensive)</option>
                    <option value="4">$$$$ (Very Expensive)</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuisine Types *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cuisines.map(cuisine => (
                      <div key={cuisine.id} className="flex items-center">
                        <input
                          id={`cuisine-${cuisine.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          checked={formData.cuisine.includes(cuisine.id)}
                          onChange={() => handleCuisineChange(cuisine.id)}
                        />
                        <label htmlFor={`cuisine-${cuisine.id}`} className="ml-2 text-sm text-gray-700">
                          {cuisine.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province *
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP/Postal Code *
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com (Optional)"
                  />
                </div>
              </div>
            </div>
            
            {/* Hours Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Operating Hours</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {days.map((day, index) => (
                  <div key={day.value} className="flex flex-col space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {day.label}
                    </label>
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <label htmlFor={`opening-${day.value}`} className="sr-only">Opening Time</label>
                        <select
                          id={`opening-${day.value}`}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                          value={formData.hours[index]?.opening_time || '11:00:00'}
                          onChange={(e) => {
                            const updatedHours = [...formData.hours];
                            if (!updatedHours[index]) {
                              updatedHours[index] = {day: day.value, opening_time: '', closing_time: '22:00:00'};
                            }
                            updatedHours[index].opening_time = e.target.value;
                            setFormData({...formData, hours: updatedHours});
                          }}
                        >
                          {generateTimeOptions()}
                        </select>
                      </div>
                      <span className="text-gray-500 flex items-center">to</span>
                      <div className="flex-1">
                        <label htmlFor={`closing-${day.value}`} className="sr-only">Closing Time</label>
                        <select
                          id={`closing-${day.value}`}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                          value={formData.hours[index]?.closing_time || '22:00:00'}
                          onChange={(e) => {
                            const updatedHours = [...formData.hours];
                            if (!updatedHours[index]) {
                              updatedHours[index] = {day: day.value, opening_time: '11:00:00', closing_time: ''};
                            }
                            updatedHours[index].closing_time = e.target.value;
                            setFormData({...formData, hours: updatedHours});
                          }}
                        >
                          {generateTimeOptions()}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tables Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Tables</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter information about tables in your restaurant. You must have at least one table.
              </p>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    // Add a new table with default values
                    const tableNumber = `T${formData.tables.length + 1}`;
                    setFormData({
                      ...formData,
                      tables: [
                        ...formData.tables,
                        { table_number: tableNumber, capacity: 2 }
                      ]
                    });
                  }}
                  className="bg-white border border-gray-300 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Add Another Table
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.tables.map((table, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">Table {table.table_number}</div>
                      {formData.tables.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedTables = [...formData.tables];
                            updatedTables.splice(index, 1);
                            setFormData({...formData, tables: updatedTables});
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`table-number-${index}`} className="block text-xs font-medium text-gray-500 mb-1">
                          Table Number
                        </label>
                        <input
                          type="text"
                          id={`table-number-${index}`}
                          value={table.table_number}
                          onChange={(e) => {
                            const updatedTables = [...formData.tables];
                            updatedTables[index].table_number = e.target.value;
                            setFormData({...formData, tables: updatedTables});
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`table-capacity-${index}`} className="block text-xs font-medium text-gray-500 mb-1">
                          Capacity
                        </label>
                        <select
                          id={`table-capacity-${index}`}
                          value={table.capacity}
                          onChange={(e) => {
                            const updatedTables = [...formData.tables];
                            updatedTables[index].capacity = parseInt(e.target.value);
                            setFormData({...formData, tables: updatedTables});
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          required
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload a photo for your restaurant. You can add more photos after creating the restaurant.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="photo-file" className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Photo *
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="w-full flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="photo-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="photo-upload"
                              name="photo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="photo-caption" className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Caption
                  </label>
                  <input
                    type="text"
                    id="photo-caption"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="Restaurant Front View"
                    value={formData.photos[0]?.caption || ''}
                    onChange={(e) => {
                      const updatedPhotos = [...formData.photos];
                      if (!updatedPhotos[0]) {
                        updatedPhotos[0] = { image_url: '', is_primary: true };
                      }
                      updatedPhotos[0].caption = e.target.value;
                      setFormData({...formData, photos: updatedPhotos});
                    }}
                  />
                  
                  {uploadPhotoStatus.uploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${uploadPhotoStatus.progress}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading: {uploadPhotoStatus.progress}%</p>
                    </div>
                  )}
                  
                  {uploadPhotoStatus.error && (
                    <p className="text-xs text-red-500 mt-1">{uploadPhotoStatus.error}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 border border-gray-200 rounded-lg p-4">
                 {uploadPhotoStatus.uploading ? (
                  <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded">
                    <svg className="animate-spin h-10 w-10 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Uploading image...</p>
                  </div>
                ) : formData.photos && formData.photos.length > 0 && (formData.photos[0]?.image_url || formData.photos[0]?.preview_url) ? (
                  <div className="flex flex-col">
                    <img 
                      src={formData.photos[0].preview_url || formData.photos[0].image_url} 
                      alt={formData.photos[0].caption || 'Restaurant photo'} 
                      className="w-full h-48 object-cover rounded mb-2" 
                      onError={(e) => {
                        console.log('Image load error, using fallback');
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20400%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_15ba800aa1d%20text%20%7B%20fill%3A%23FF0000%3Bfont-weight%3Abold%3Bfont-family%3AArial%2C%20Helvetica%2C%20Open%20Sans%2C%20sans-serif%2C%20monospace%3Bfont-size%3A40pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_15ba800aa1d%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D%22%23EE0000%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22247.3203125%22%20y%3D%22218.3%22%3EError%20Loading%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-medium">{formData.photos[0].caption || 'Restaurant photo'}</span>
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Primary</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedPhotos = [...formData.photos];
                          updatedPhotos[0] = { caption: 'Restaurant Photo', is_primary: true, image_url: '' };
                          setFormData({...formData, photos: updatedPhotos});
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">Upload an image using the form above</p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : selectedRestaurant ? 'Save Changes' : 'Create Restaurant'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantProfile;