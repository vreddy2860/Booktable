import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const Hours = () => {
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const days = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];
  
  // Fetch restaurant manager's restaurants and hours
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
          
          // Get restaurant hours
          const hoursResponse = await api.restaurants.getHours(primaryRestaurant.id);
          
          // Ensure we have entries for all days of the week
          const existingHours = hoursResponse.data;
          const hoursByDay = {};
          
          // Map existing hours by day
          existingHours.forEach(hour => {
            hoursByDay[hour.day] = hour;
          });
          
          // Create default hours for any missing days
          const completeHours = days.map(day => {
            if (hoursByDay[day.value]) {
              return hoursByDay[day.value];
            } else {
              return {
                day: day.value,
                opening_time: '09:00:00',
                closing_time: '17:00:00',
                is_closed: true
              };
            }
          });
          
          setHours(completeHours);
        } else {
          setError('You need to create a restaurant before setting hours.');
        }
      } catch (err) {
        console.error('Error fetching hours data:', err);
        setError('Failed to load operating hours. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [user]);
  
  // Handle change in hours
  const handleHourChange = (dayIndex, field, value) => {
    setHours(prevHours => {
      const updatedHours = [...prevHours];
      updatedHours[dayIndex] = {
        ...updatedHours[dayIndex],
        [field]: value
      };
      return updatedHours;
    });
  };
  
  // Toggle closed status for a day
  const handleToggleClosed = (dayIndex) => {
    setHours(prevHours => {
      const updatedHours = [...prevHours];
      updatedHours[dayIndex] = {
        ...updatedHours[dayIndex],
        is_closed: !updatedHours[dayIndex].is_closed
      };
      return updatedHours;
    });
  };
  
  // Copy hours from previous day
  const handleCopyFromPrevious = (dayIndex) => {
    if (dayIndex === 0) return; // No previous day for Monday
    
    setHours(prevHours => {
      const updatedHours = [...prevHours];
      updatedHours[dayIndex] = {
        ...updatedHours[dayIndex],
        opening_time: prevHours[dayIndex - 1].opening_time,
        closing_time: prevHours[dayIndex - 1].closing_time,
        is_closed: prevHours[dayIndex - 1].is_closed
      };
      return updatedHours;
    });
  };
  
  // Apply the same hours to all days
  const handleApplyToAll = (dayIndex) => {
    const sourceDay = hours[dayIndex];
    
    setHours(prevHours => {
      return prevHours.map(day => ({
        ...day,
        opening_time: sourceDay.opening_time,
        closing_time: sourceDay.closing_time,
        is_closed: sourceDay.is_closed
      }));
    });
  };
  
  // Save hours to the server
  const handleSaveHours = async () => {
    if (!selectedRestaurant) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Format hours data for the API
      const hoursData = {
        hours: hours.map(hour => ({
          day: hour.day,
          opening_time: hour.opening_time,
          closing_time: hour.closing_time,
          is_closed: hour.is_closed || false
        }))
      };
      
      // Update hours
      await api.restaurants.updateHours(selectedRestaurant.id, hoursData);
      setSuccess('Operating hours updated successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving hours:', err);
      let errorMessage = 'Failed to save operating hours. Please try again.';
      
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
          <p className="mt-2">Loading operating hours...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedRestaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6" role="alert">
          <p>You need to create a restaurant before setting operating hours.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Operating Hours</h1>
      <p className="text-gray-600 mb-8">
        Set the hours of operation for {selectedRestaurant.name}.
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
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Set Restaurant Hours</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {days.map((day, index) => (
              <div key={day.value} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center py-3 border-b border-gray-200 last:border-0">
                <div className="md:col-span-1">
                  <span className="font-medium">{day.label}</span>
                </div>
                
                <div className="md:col-span-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {hours[index]?.is_closed ? (
                    <div className="text-gray-500 italic">Closed</div>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <label htmlFor={`opening-time-${day.value}`} className="block text-sm font-medium text-gray-700 w-20">
                          Open:
                        </label>
                        <input
                          type="time"
                          id={`opening-time-${day.value}`}
                          value={hours[index]?.opening_time?.substring(0, 5) || '09:00'}
                          onChange={(e) => handleHourChange(index, 'opening_time', `${e.target.value}:00`)}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={hours[index]?.is_closed}
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <label htmlFor={`closing-time-${day.value}`} className="block text-sm font-medium text-gray-700 w-20">
                          Close:
                        </label>
                        <input
                          type="time"
                          id={`closing-time-${day.value}`}
                          value={hours[index]?.closing_time?.substring(0, 5) || '17:00'}
                          onChange={(e) => handleHourChange(index, 'closing_time', `${e.target.value}:00`)}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={hours[index]?.is_closed}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`closed-${day.value}`}
                      checked={hours[index]?.is_closed || false}
                      onChange={() => handleToggleClosed(index)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor={`closed-${day.value}`} className="ml-2 text-sm text-gray-700">
                      Closed
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-1 flex justify-end space-x-2">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyFromPrevious(index)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                      title={`Copy hours from ${days[index - 1].label}`}
                    >
                      Copy Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleApplyToAll(index)}
                    className="text-blue-600 hover:text-blue-900 text-sm whitespace-nowrap"
                    title="Apply these hours to all days"
                  >
                    Apply to All
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveHours}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition duration-300 inline-flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Hours'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium mb-2">Operating Hours Tips</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• Enter times in 24-hour format (e.g., 14:00 for 2:00 PM).</li>
          <li>• Mark days as "Closed" when your restaurant is not open.</li>
          <li>• Use "Copy Previous" to quickly set the same hours as the day above.</li>
          <li>• Use "Apply to All" to set the same hours for every day of the week.</li>
          <li>• Make sure opening time is earlier than closing time.</li>
          <li>• If your restaurant is open past midnight, set the closing time for the next day.</li>
        </ul>
      </div>
    </div>
  );
};

export default Hours;