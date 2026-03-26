import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';
import RestaurantMap from '../../components/common/RestaurantMap';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [restaurant, setRestaurant] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new URLSearchParams(location.search).get('date') || 
    new Date().toISOString().split('T')[0]
  );
  const [partySize, setPartySize] = useState(
    parseInt(new URLSearchParams(location.search).get('party_size')) || 2
  );
  
  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setLoading(true);
        const response = await api.restaurants.getById(id);
        setRestaurant(response.data);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setError('Failed to load restaurant details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantDetails();
  }, [id]);
  
  // Fetch available time slots when date or party size changes
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await api.restaurants.getAvailability(id, selectedDate, partySize);
        setAvailableTimes(response.data);
      } catch (err) {
        console.error('Error fetching availability:', err);
        setAvailableTimes([]);
      }
    };
    
    if (restaurant) {
      fetchAvailability();
    }
  }, [id, selectedDate, partySize, restaurant]);
  
  // Handle booking time selection
  const handleSelectTime = (time) => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/customer/restaurant/${id}&date=${selectedDate}&party_size=${partySize}&time=${time}`);
      return;
    }
    
    // Create booking data
    const bookingData = {
      restaurant_id: parseInt(id),
      date: selectedDate,
      time: time,
      party_size: partySize,
    };
    
    // Navigate to booking form with pre-filled data
    navigate('/customer/booking-confirmation/new', { 
      state: { 
        bookingData,
        restaurantName: restaurant.name
      } 
    });
  };
  
  // Format restaurant operating hours
  const formatHours = (hours) => {
    if (!hours || !Array.isArray(hours)) return 'Hours not available';
    
    const dayMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedHours = [...hours].sort((a, b) => a.day - b.day);
    
    return sortedHours.map(hour => {
      const day = dayMap[hour.day];
      const openTime = new Date(`1970-01-01T${hour.opening_time}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
      const closeTime = new Date(`1970-01-01T${hour.closing_time}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
      
      return (
        <div key={hour.day} className="flex justify-between">
          <span className="font-medium">{day}</span>
          <span>{openTime} - {closeTime}</span>
        </div>
      );
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading restaurant details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error || 'Restaurant not found'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Restaurant Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span>{restaurant.phone}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span>{restaurant.email}</span>
          </div>
          {restaurant.website && (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {restaurant.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.cuisine && restaurant.cuisine.map(cuisine => (
            <span 
              key={cuisine.id} 
              className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
            >
              {cuisine.name}
            </span>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Restaurant Details */}
        <div className="lg:col-span-2">
          {/* Photos */}
          {restaurant.photos && restaurant.photos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {restaurant.photos.map(photo => (
                  <div key={photo.id} className="h-48 overflow-hidden rounded-lg">
                    <img 
                      src={photo.image_path ? `${process.env.REACT_APP_API_URL}${photo.image_path}` : (photo.image || photo.image_url)} 
                      alt={photo.caption || restaurant.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image+Available';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{restaurant.description}</p>
          </div>
          
          {/* Location Map */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <RestaurantMap 
              address={restaurant.address}
              city={restaurant.city}
              state={restaurant.state}
              zipCode={restaurant.zip_code}
              name={restaurant.name}
              latitude={restaurant.latitude}
              longitude={restaurant.longitude}
            />
          </div>
          
          {/* Reviews */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <div className="flex items-center">
                <div className="text-yellow-500 mr-2">
                  {'★'.repeat(Math.round(restaurant.average_rating || 0))}
                  {'☆'.repeat(5 - Math.round(restaurant.average_rating || 0))}
                </div>
                <span className="text-gray-600">
                  {restaurant.average_rating ? restaurant.average_rating.toFixed(1) : 'No ratings yet'}
                  {restaurant.reviews && restaurant.reviews.length > 0 && 
                    ` (${restaurant.reviews.length} ${restaurant.reviews.length === 1 ? 'review' : 'reviews'})`
                  }
                </span>
              </div>
            </div>
            
            {restaurant.reviews && restaurant.reviews.length > 0 ? (
              <div className="space-y-4">
                {restaurant.reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{review.user_name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-yellow-500 mb-2">
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet.</p>
            )}
          </div>
        </div>
        
        {/* Right Column: Booking Section */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Make a Reservation</h2>
            
            {/* Booking Form */}
            <div className="mb-6">
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                <select
                  id="party_size"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Available Times */}
            <div>
              <h3 className="text-lg font-medium mb-3">Available Times</h3>
              
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => handleSelectTime(slot.time)}
                      className="bg-white border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-medium py-2 rounded-md transition duration-300"
                    >
                      {new Date(`1970-01-01T${slot.time}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No available times for the selected date and party size.</p>
              )}
            </div>
            
            {/* Restaurant Hours */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3">Hours of Operation</h3>
              <div className="space-y-2 text-sm">
                {formatHours(restaurant.hours)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;