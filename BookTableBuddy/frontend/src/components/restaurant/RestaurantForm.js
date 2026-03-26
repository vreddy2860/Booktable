import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRestaurantDetails, createRestaurant, updateRestaurant, getCuisines } from '../../api/api';

const RestaurantForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    cost_rating: 2,
    latitude: '',
    longitude: '',
    cuisine: [],
    hours: [
      { day: 0, opening_time: '09:00', closing_time: '22:00' },
      { day: 1, opening_time: '09:00', closing_time: '22:00' },
      { day: 2, opening_time: '09:00', closing_time: '22:00' },
      { day: 3, opening_time: '09:00', closing_time: '22:00' },
      { day: 4, opening_time: '09:00', closing_time: '22:00' },
      { day: 5, opening_time: '09:00', closing_time: '22:00' },
      { day: 6, opening_time: '09:00', closing_time: '22:00' }
    ],
    tables: [
      { table_number: '1', capacity: 2 }
    ],
    photos: [
      { image_url: '', caption: '', is_primary: true }
    ]
  });
  
  const [cuisines, setCuisines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  useEffect(() => {
    fetchCuisines();
    
    if (isEditMode) {
      fetchRestaurantDetails();
    }
  }, [id]);
  
  const fetchCuisines = async () => {
    try {
      const response = await getCuisines();
      setCuisines(response.data);
    } catch (err) {
      console.error('Error fetching cuisines:', err);
      setError('Failed to load cuisine types. Please try again.');
    }
  };
  
  const fetchRestaurantDetails = async () => {
    setIsLoading(true);
    try {
      const response = await getRestaurantDetails(id);
      const restaurant = response.data;
      
      // Map cuisine objects to just their IDs/names
      const cuisineData = restaurant.cuisine.map(c => ({
        id: c.id,
        name: c.name
      }));
      
      // Ensure we have hours for all 7 days
      const hoursData = [];
      for (let i = 0; i < 7; i++) {
        const existingHour = restaurant.hours.find(h => h.day === i);
        if (existingHour) {
          hoursData.push(existingHour);
        } else {
          hoursData.push({ day: i, opening_time: '09:00', closing_time: '22:00' });
        }
      }
      hoursData.sort((a, b) => a.day - b.day);
      
      // Ensure we have at least one photo with is_primary=true
      const photosData = restaurant.photos.length > 0 
        ? restaurant.photos 
        : [{ image_url: '', caption: '', is_primary: true }];
      
      if (!photosData.some(p => p.is_primary)) {
        photosData[0].is_primary = true;
      }
      
      setFormData({
        ...restaurant,
        cuisine: cuisineData,
        hours: hoursData,
        photos: photosData
      });
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCuisineToggle = (cuisineId, cuisineName) => {
    setFormData(prev => {
      const cuisineExists = prev.cuisine.some(c => c.id === cuisineId);
      
      let newCuisine;
      if (cuisineExists) {
        // Remove cuisine
        newCuisine = prev.cuisine.filter(c => c.id !== cuisineId);
      } else {
        // Add cuisine
        newCuisine = [...prev.cuisine, { id: cuisineId, name: cuisineName }];
      }
      
      return {
        ...prev,
        cuisine: newCuisine
      };
    });
  };
  
  const handleHoursChange = (day, field, value) => {
    setFormData(prev => {
      const newHours = [...prev.hours];
      const index = newHours.findIndex(h => h.day === day);
      
      if (index !== -1) {
        newHours[index] = {
          ...newHours[index],
          [field]: value
        };
      }
      
      return {
        ...prev,
        hours: newHours
      };
    });
  };
  
  const handleTableChange = (index, field, value) => {
    setFormData(prev => {
      const newTables = [...prev.tables];
      newTables[index] = {
        ...newTables[index],
        [field]: value
      };
      
      return {
        ...prev,
        tables: newTables
      };
    });
  };
  
  const addTable = () => {
    setFormData(prev => {
      const newTableNumber = `${prev.tables.length + 1}`;
      return {
        ...prev,
        tables: [...prev.tables, { table_number: newTableNumber, capacity: 2 }]
      };
    });
  };
  
  const removeTable = (index) => {
    setFormData(prev => {
      const newTables = [...prev.tables];
      newTables.splice(index, 1);
      return {
        ...prev,
        tables: newTables
      };
    });
  };
  
  const handlePhotoChange = (index, field, value) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      
      if (field === 'is_primary' && value === true) {
        // Ensure only one photo is primary
        newPhotos.forEach((photo, i) => {
          if (i !== index) {
            photo.is_primary = false;
          }
        });
      }
      
      newPhotos[index] = {
        ...newPhotos[index],
        [field]: value
      };
      
      return {
        ...prev,
        photos: newPhotos
      };
    });
  };
  
  const addPhoto = () => {
    setFormData(prev => {
      return {
        ...prev,
        photos: [...prev.photos, { image_url: '', caption: '', is_primary: false }]
      };
    });
  };
  
  const removePhoto = (index) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      
      if (newPhotos[index].is_primary && newPhotos.length > 1) {
        // If removing the primary photo, set another one as primary
        const newPrimaryIndex = index === 0 ? 1 : 0;
        newPhotos[newPrimaryIndex].is_primary = true;
      }
      
      newPhotos.splice(index, 1);
      
      if (newPhotos.length === 0) {
        // Always have at least one photo
        newPhotos.push({ image_url: '', caption: '', is_primary: true });
      }
      
      return {
        ...prev,
        photos: newPhotos
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (isEditMode) {
        await updateRestaurant(id, formData);
        setSuccess('Restaurant updated successfully!');
      } else {
        const response = await createRestaurant(formData);
        setSuccess('Restaurant created successfully! It is now pending approval.');
        
        // For new restaurants, redirect to the dashboard after a delay
        setTimeout(() => {
          navigate('/restaurant/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting restaurant:', err);
      
      if (err.response && err.response.data) {
        const errorMessages = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError('Failed to save restaurant. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
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
          Back to dashboard
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}
      </h1>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6 whitespace-pre-line">
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
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-1 form-input"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="cost_rating" className="block text-sm font-medium text-gray-700">
                  Price Range *
                </label>
                <select
                  id="cost_rating"
                  name="cost_rating"
                  required
                  className="mt-1 form-input"
                  value={formData.cost_rating}
                  onChange={handleChange}
                >
                  <option value="1">$ (Budget)</option>
                  <option value="2">$$ (Moderate)</option>
                  <option value="3">$$$ (Expensive)</option>
                  <option value="4">$$$$ (Very Expensive)</option>
                </select>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  className="mt-1 form-input"
                  value={formData.description}
                  onChange={handleChange}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Describe your restaurant, its ambiance, specialties, and what makes it unique.
                </p>
              </div>
            </div>
          </div>
          
          {/* Cuisine Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cuisine Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cuisines.map(cuisine => (
                <div key={cuisine.id} className="flex items-center">
                  <input
                    id={`cuisine-${cuisine.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    checked={formData.cuisine.some(c => c.id === cuisine.id)}
                    onChange={() => handleCuisineToggle(cuisine.id, cuisine.name)}
                  />
                  <label htmlFor={`cuisine-${cuisine.id}`} className="ml-2 block text-sm text-gray-700">
                    {cuisine.name}
                  </label>
                </div>
              ))}
            </div>
            {formData.cuisine.length === 0 && (
              <p className="mt-2 text-sm text-red-600">
                Please select at least one cuisine type.
              </p>
            )}
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="mt-1 form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="mt-1 form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  className="mt-1 form-input"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  className="mt-1 form-input"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  className="mt-1 form-input"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  required
                  className="mt-1 form-input"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  required
                  className="mt-1 form-input"
                  value={formData.zip_code}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude (Optional)
                </label>
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  className="mt-1 form-input"
                  placeholder="37.7749"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude (Optional)
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  className="mt-1 form-input"
                  placeholder="-122.4194"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          {/* Hours */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Operating Hours</h2>
            <div className="space-y-4">
              {formData.hours.map((hour, index) => (
                <div key={hour.day} className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-center">
                  <div className="text-sm font-medium text-gray-700">{dayNames[hour.day]}</div>
                  
                  <div>
                    <label htmlFor={`opening_time_${hour.day}`} className="block text-sm font-medium text-gray-700">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      id={`opening_time_${hour.day}`}
                      className="mt-1 form-input"
                      value={hour.opening_time}
                      onChange={(e) => handleHoursChange(hour.day, 'opening_time', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor={`closing_time_${hour.day}`} className="block text-sm font-medium text-gray-700">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      id={`closing_time_${hour.day}`}
                      className="mt-1 form-input"
                      value={hour.closing_time}
                      onChange={(e) => handleHoursChange(hour.day, 'closing_time', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tables */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tables</h2>
              <button
                type="button"
                onClick={addTable}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg 
                  className="-ml-1 mr-1 h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
                Add Table
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.tables.map((table, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <label htmlFor={`table_number_${index}`} className="block text-sm font-medium text-gray-700">
                      Table Number
                    </label>
                    <input
                      type="text"
                      id={`table_number_${index}`}
                      className="mt-1 form-input"
                      value={table.table_number}
                      onChange={(e) => handleTableChange(index, 'table_number', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label htmlFor={`capacity_${index}`} className="block text-sm font-medium text-gray-700">
                      Capacity
                    </label>
                    <input
                      type="number"
                      id={`capacity_${index}`}
                      min="1"
                      className="mt-1 form-input"
                      value={table.capacity}
                      onChange={(e) => handleTableChange(index, 'capacity', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-end pb-1">
                    <button
                      type="button"
                      onClick={() => removeTable(index)}
                      disabled={formData.tables.length <= 1}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Photos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
              <button
                type="button"
                onClick={addPhoto}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg 
                  className="-ml-1 mr-1 h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
                Add Photo
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-start p-4 border border-gray-200 rounded-md">
                  <div className="sm:col-span-6">
                    <label htmlFor={`image_url_${index}`} className="block text-sm font-medium text-gray-700">
                      Image URL
                    </label>
                    <input
                      type="url"
                      id={`image_url_${index}`}
                      required
                      className="mt-1 form-input"
                      value={photo.image_url}
                      onChange={(e) => handlePhotoChange(index, 'image_url', e.target.value)}
                    />
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor={`caption_${index}`} className="block text-sm font-medium text-gray-700">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      id={`caption_${index}`}
                      className="mt-1 form-input"
                      value={photo.caption}
                      onChange={(e) => handlePhotoChange(index, 'caption', e.target.value)}
                    />
                  </div>
                  
                  <div className="sm:col-span-1 flex items-center pt-6">
                    <input
                      id={`is_primary_${index}`}
                      type="radio"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      checked={photo.is_primary}
                      onChange={() => handlePhotoChange(index, 'is_primary', true)}
                    />
                    <label htmlFor={`is_primary_${index}`} className="ml-2 block text-sm text-gray-700">
                      Primary
                    </label>
                  </div>
                  
                  <div className="sm:col-span-1 flex items-center pt-6 justify-center">
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      disabled={formData.photos.length <= 1}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/restaurant/dashboard')}
                className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formData.cuisine.length === 0}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
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
                    Saving...
                  </>
                ) : (
                  'Save Restaurant'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RestaurantForm;
