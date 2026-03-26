import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getRestaurantDetails, createBooking } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const BookingForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [restaurant, setRestaurant] = useState(null);
  const [bookingData, setBookingData] = useState({
    restaurant_id: id,
    date: location.state?.date || new Date().toISOString().split('T')[0],
    time: location.state?.time || '',
    party_size: location.state?.party_size || '2',
    special_requests: '',
    contact_name: currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : '',
    contact_email: currentUser ? currentUser.email : '',
    contact_phone: currentUser ? currentUser.phone_number || '' : ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState(null);
  
  useEffect(() => {
    // Redirect if we don't have the necessary data
    if (!location.state || !location.state.time || !location.state.date || !location.state.party_size) {
      navigate(`/customer/restaurant/${id}`);
      return;
    }
    
    fetchRestaurantDetails();
  }, [id, location]);
  
  const fetchRestaurantDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await getRestaurantDetails(id);
      setRestaurant(response.data);
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await createBooking(bookingData);
      setBooking(response.data);
      setSuccess(true);
      
      // Scroll to the top to show confirmation
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error creating booking:', err);
      
      if (err.response && err.response.data) {
        const errorMessage = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setError(errorMessage);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    
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
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-md bg-red-50 p-4">
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
              <div className="mt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="text-sm font-medium text-red-800 hover:underline"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!restaurant) {
    return null;
  }
  
  if (success && booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-lg mx-auto">
          <div className="text-center mb-6">
            <svg 
              className="mx-auto h-16 w-16 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          </div>
          
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-500">Restaurant:</div>
              <div className="font-medium">{restaurant.name}</div>
              
              <div className="text-gray-500">Date:</div>
              <div className="font-medium">{formatDate(booking.date)}</div>
              
              <div className="text-gray-500">Time:</div>
              <div className="font-medium">{formatTime(booking.time)}</div>
              
              <div className="text-gray-500">Party Size:</div>
              <div className="font-medium">{booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}</div>
              
              <div className="text-gray-500">Booking Reference:</div>
              <div className="font-medium">{booking.booking_reference}</div>
              
              <div className="text-gray-500">Contact:</div>
              <div className="font-medium">{booking.contact_name}</div>
              
              <div className="text-gray-500">Email:</div>
              <div className="font-medium">{booking.contact_email}</div>
              
              <div className="text-gray-500">Phone:</div>
              <div className="font-medium">{booking.contact_phone}</div>
              
              {booking.special_requests && (
                <>
                  <div className="text-gray-500">Special Requests:</div>
                  <div className="font-medium">{booking.special_requests}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-500 mb-6">
            <p>A confirmation has been sent to your email and phone number.</p>
            <p className="mt-2">If you need to make changes or cancel your reservation, please visit your bookings page or contact the restaurant directly.</p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/customer/bookings')}
              className="btn-primary"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/customer/search')}
              className="btn-secondary"
            >
              Find More Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl mx-auto">
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
            Back to restaurant
          </button>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Reservation</h1>
            <p className="mt-2 text-gray-600">You're reserving a table at {restaurant.name}</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6 bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reservation Details</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(bookingData.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(bookingData.time)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Party Size</p>
                  <p className="font-medium">{bookingData.party_size} {bookingData.party_size === 1 ? 'person' : 'people'}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    required
                    className="form-input"
                    value={bookingData.contact_name}
                    onChange={handleChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    required
                    className="form-input"
                    value={bookingData.contact_email}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    We'll send your booking confirmation to this email
                  </p>
                </div>
                
                <div>
                  <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    required
                    className="form-input"
                    value={bookingData.contact_phone}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The restaurant may contact you about your booking
                  </p>
                </div>
                
                <div>
                  <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="special_requests"
                    name="special_requests"
                    rows={3}
                    className="form-input"
                    placeholder="Allergies, special occasions, seating preferences..."
                    value={bookingData.special_requests}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The restaurant will try to accommodate your requests, but they cannot be guaranteed
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3 flex justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                      Processing...
                    </>
                  ) : (
                    'Complete Reservation'
                  )}
                </button>
                
                <p className="mt-4 text-sm text-gray-500 text-center">
                  By clicking the button above, you agree to the restaurant's reservation policy and cancel/no-show policy.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
