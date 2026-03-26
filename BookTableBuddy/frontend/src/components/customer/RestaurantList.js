import React from 'react';
import { Link } from 'react-router-dom';
import { getAvailableTimes } from '../../api/api';

const RestaurantList = ({ restaurants, searchParams, isLoading }) => {
  const [availabilityMap, setAvailabilityMap] = React.useState({});
  const [loadingRestaurantId, setLoadingRestaurantId] = React.useState(null);
  
  const fetchAvailableTimes = async (restaurantId) => {
    setLoadingRestaurantId(restaurantId);
    try {
      const response = await getAvailableTimes(
        restaurantId, 
        searchParams.date, 
        searchParams.party_size
      );
      
      setAvailabilityMap(prev => ({
        ...prev,
        [restaurantId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching available times:', error);
    }
    setLoadingRestaurantId(null);
  };
  
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Get the selected time +/- 30 minutes range
  const getTimeRange = () => {
    if (!searchParams.time) return null;
    
    const [hours, minutes] = searchParams.time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    const lowerBound = new Date(date);
    lowerBound.setMinutes(date.getMinutes() - 30);
    
    const upperBound = new Date(date);
    upperBound.setMinutes(date.getMinutes() + 30);
    
    return {
      lower: lowerBound,
      upper: upperBound,
      target: date
    };
  };
  
  // Filter time slots to be within +/- 30 minutes of search time
  const getRelevantTimeSlots = (restaurantId) => {
    const slots = availabilityMap[restaurantId] || [];
    const timeRange = getTimeRange();
    
    if (!timeRange) return slots;
    
    return slots.filter(slot => {
      const [hours, minutes] = slot.time.split(':');
      const slotDate = new Date();
      slotDate.setHours(parseInt(hours, 10));
      slotDate.setMinutes(parseInt(minutes, 10));
      
      return slotDate >= timeRange.lower && slotDate <= timeRange.upper;
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  if (restaurants.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8 text-center">
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No restaurants found</h3>
        <p className="mt-1 text-gray-500">
          Try adjusting your search criteria or expanding your search area.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Restaurants</h2>
      
      <div className="space-y-6">
        {restaurants.map(restaurant => (
          <div key={restaurant.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 h-48 w-full md:w-48 bg-gray-200">
                {restaurant.primary_photo ? (
                  <img 
                    src={restaurant.primary_photo} 
                    alt={restaurant.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100">
                    <svg 
                      className="h-12 w-12 text-gray-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                      />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-6 md:flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Link 
                      to={`/customer/restaurant/${restaurant.id}`} 
                      className="text-xl font-semibold text-gray-900 hover:text-red-600"
                    >
                      {restaurant.name}
                    </Link>
                    
                    <div className="mt-1 flex items-center">
                      {restaurant.cuisine && restaurant.cuisine.map(c => (
                        <span key={c.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
                          {c.name}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <svg 
                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                        />
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                        />
                      </svg>
                      {restaurant.city}, {restaurant.state}
                    </div>
                    
                    <div className="mt-2 flex items-center">
                      <span className="text-yellow-500 mr-1">{restaurant.average_rating.toFixed(1)}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg 
                            key={star} 
                            className={`h-5 w-5 ${star <= Math.round(restaurant.average_rating) ? 'text-yellow-500' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">({restaurant.bookings_today} booked today)</span>
                    </div>
                    
                    <div className="mt-2">
                      <span className="font-medium text-gray-900">{restaurant.cost_rating_display}</span>
                      <span className="ml-2 text-sm text-gray-600">Price Range</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  {availabilityMap[restaurant.id] ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Times:</h4>
                      <div className="flex flex-wrap gap-2">
                        {getRelevantTimeSlots(restaurant.id).length > 0 ? (
                          getRelevantTimeSlots(restaurant.id).map((slot, index) => (
                            <Link
                              key={index}
                              to={`/customer/restaurant/${restaurant.id}/booking`}
                              state={{ 
                                time: slot.time, 
                                date: searchParams.date, 
                                party_size: searchParams.party_size 
                              }}
                              className="inline-flex items-center px-3 py-1 border border-red-600 text-sm font-medium rounded text-red-600 bg-white hover:bg-red-50"
                            >
                              {formatTime(slot.time)}
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No available times in your requested window.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fetchAvailableTimes(restaurant.id)}
                      disabled={loadingRestaurantId === restaurant.id}
                      className="btn-primary"
                    >
                      {loadingRestaurantId === restaurant.id ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Loading times...
                        </>
                      ) : (
                        'See available times'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantList;
