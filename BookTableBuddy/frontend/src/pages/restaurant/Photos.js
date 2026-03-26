import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const Photos = () => {
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
    is_primary: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // Fetch restaurant manager's restaurants and photos
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        
        // Get user's restaurants
        const restaurantsResponse = await api.restaurants.getList({ manager: user.id });
        
        if (restaurantsResponse.data.length > 0) {
          const userRestaurants = restaurantsResponse.data;
          setRestaurants(userRestaurants);
          
          // Get primary restaurant for manager
          const primaryRestaurant = userRestaurants[0];
          setSelectedRestaurant(primaryRestaurant);
          
          // Get restaurant photos
          const photosResponse = await api.restaurants.getPhotos(primaryRestaurant.id);
          setPhotos(photosResponse.data);
        } else {
          setError('You need to create a restaurant before adding photos.');
        }
      } catch (err) {
        console.error('Error fetching photos data:', err);
        setError('Failed to load photos. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Reset form state
  const resetForm = () => {
    setFormData({
      image_url: '',
      caption: '',
      is_primary: false
    });
    setEditingPhoto(null);
    setFormErrors({});
  };
  
  // Edit a photo
  const handleEditPhoto = (photo) => {
    setFormData({
      image_url: photo.image_url,
      caption: photo.caption || '',
      is_primary: photo.is_primary
    });
    setEditingPhoto(photo.id);
    // Scroll to form
    document.getElementById('photo-form').scrollIntoView({ behavior: 'smooth' });
  };
  
  // Set a photo as primary
  const handleSetPrimary = async (photoId) => {
    try {
      await api.restaurants.updatePhoto(
        selectedRestaurant.id,
        photoId,
        { is_primary: true }
      );
      
      // Update local state
      setPhotos(prev => 
        prev.map(photo => ({
          ...photo,
          is_primary: photo.id === photoId
        }))
      );
      
      setSuccess('Primary photo updated successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating primary photo:', err);
      setError('Failed to update primary photo. Please try again.');
    }
  };
  
  // Delete a photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }
    
    try {
      await api.restaurants.deletePhoto(selectedRestaurant.id, photoId);
      // Update local state
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      setSuccess('Photo deleted successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo. Please try again.');
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.image_url.trim()) {
      errors.image_url = 'Image URL is required';
    } else if (!isValidUrl(formData.image_url)) {
      errors.image_url = 'Please enter a valid URL';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate URL format
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      if (editingPhoto) {
        // Update existing photo
        response = await api.restaurants.updatePhoto(
          selectedRestaurant.id,
          editingPhoto,
          formData
        );
        
        // Update local state
        setPhotos(prev => {
          const updatedPhotos = prev.map(photo => 
            photo.id === editingPhoto ? response.data : photo
          );
          
          // If this photo was set as primary, update other photos
          if (formData.is_primary) {
            return updatedPhotos.map(photo => ({
              ...photo,
              is_primary: photo.id === editingPhoto
            }));
          }
          
          return updatedPhotos;
        });
        
        setSuccess('Photo updated successfully.');
      } else {
        // Create new photo
        response = await api.restaurants.addPhoto(
          selectedRestaurant.id,
          formData
        );
        
        // Update local state
        setPhotos(prev => {
          const newPhotos = [...prev, response.data];
          
          // If this photo was set as primary, update other photos
          if (formData.is_primary) {
            return newPhotos.map(photo => ({
              ...photo,
              is_primary: photo.id === response.data.id
            }));
          }
          
          return newPhotos;
        });
        
        setSuccess('Photo added successfully.');
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving photo:', err);
      let errorMessage = 'Failed to save photo. Please try again.';
      
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          // Format field errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('; ');
          
          errorMessage = `Validation error: ${fieldErrors}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading photos...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedRestaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6" role="alert">
          <p>You need to create a restaurant before managing photos.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Manage Photos</h1>
      <p className="text-gray-600 mb-8">
        Add and manage photos for {selectedRestaurant.name}.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Photo Gallery */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Restaurant Photos</h2>
            </div>
            
            <div className="p-6">
              {photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {photos.map(photo => (
                    <div key={photo.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
                      <div className="relative h-48">
                        <img
                          src={photo.image_url}
                          alt={photo.caption || 'Restaurant photo'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                          }}
                        />
                        {photo.is_primary && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            Primary
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        {photo.caption && (
                          <p className="text-gray-700 mb-3 text-sm">{photo.caption}</p>
                        )}
                        
                        <div className="flex justify-between">
                          <div className="space-x-2">
                            <button
                              onClick={() => handleEditPhoto(photo)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          
                          {!photo.is_primary && (
                            <button
                              onClick={() => handleSetPrimary(photo.id)}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              Set as Primary
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No photos added yet. Add your first photo using the form.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Add/Edit Photo Form */}
        <div>
          <div id="photo-form" className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingPhoto ? 'Edit Photo' : 'Add New Photo'}
              </h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${formErrors.image_url ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="https://example.com/image.jpg"
                    />
                    {formErrors.image_url && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.image_url}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter a direct URL to your image. The image should be in JPG, PNG, or WebP format.
                    </p>
                  </div>
                  
                  {formData.image_url && isValidUrl(formData.image_url) && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                      <div className="h-40 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      id="caption"
                      name="caption"
                      value={formData.caption}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe this photo"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_primary"
                      name="is_primary"
                      checked={formData.is_primary}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700">
                      Set as primary photo (featured image)
                    </label>
                  </div>
                  
                  <div className="pt-4 flex items-center justify-between">
                    {editingPhoto && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="ml-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 inline-flex items-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {editingPhoto ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>{editingPhoto ? 'Update Photo' : 'Add Photo'}</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium mb-2">Photo Tips</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Use high-quality, well-lit photos of your restaurant.</li>
              <li>• Include photos of your interior, exterior, and food.</li>
              <li>• The primary photo will be displayed as the main image in search results.</li>
              <li>• Recommended image dimensions: 1200 x 800 pixels or larger.</li>
              <li>• Keep file sizes under 5MB for optimal loading times.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Photos;