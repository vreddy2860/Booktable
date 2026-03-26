import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';

const BookingConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // If id is 'new', we're creating a new booking
  const isNewBooking = id === 'new';
  
  // Get pre-filled data for new booking from location state
  const initialData = isNewBooking && location.state?.bookingData ? {
    ...location.state.bookingData,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    special_requests: ''
  } : null;
  
  const restaurantName = isNewBooking ? location.state?.restaurantName : '';
  
  const [formData, setFormData] = useState(initialData || {});
  const [loading, setLoading] = useState(!isNewBooking);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch existing booking if not creating a new one
  useEffect(() => {
    const fetchBooking = async () => {
      if (isNewBooking) return;
      
      try {
        const response = await api.bookings.getById(id);
        setBooking(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [id, isNewBooking]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isNewBooking) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await api.bookings.create(formData);
      setBooking(response.data);
      setSuccess(true);
    } catch (err) {
      console.error('Error creating booking:', err);
      let errorMessage = 'Failed to create booking. Please try again.';
      
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
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading booking details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
        <div className="text-center">
          <button 
            onClick={() => navigate(-1)}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (success || booking) {
    // Show confirmation of successful booking
    const bookingData = booking;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 bg-green-50 border-b border-green-100">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h1 className="text-2xl font-bold text-green-800">Reservation Confirmed!</h1>
            </div>
            <p className="text-green-700">
              Your reservation has been successfully {isNewBooking ? 'created' : 'updated'}. 
              A confirmation has been sent to your email.
            </p>
          </div>
          
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reservation Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">{bookingData.restaurant_name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-gray-600">{formatDate(bookingData.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-gray-600">{formatTime(bookingData.time)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <div>
                      <p className="font-medium">Party Size</p>
                      <p className="text-gray-600">{bookingData.party_size} {bookingData.party_size === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>
                  
                  {bookingData.table_number && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium">Table</p>
                        <p className="text-gray-600">Table #{bookingData.table_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Contact Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Name</p>
                      <p className="text-gray-600">{bookingData.contact_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">{bookingData.contact_email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{bookingData.contact_phone}</p>
                    </div>
                  </div>
                  
                  {bookingData.booking_reference && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium">Reference</p>
                        <p className="text-gray-600">{bookingData.booking_reference}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {bookingData.special_requests && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Special Requests</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{bookingData.special_requests}</p>
              </div>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/customer/bookings" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-300 text-center"
              >
                View All My Bookings
              </Link>
              
              <Link 
                to="/customer/search" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-300 text-center"
              >
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show booking form for new bookings
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold mb-1">Complete Your Reservation</h1>
          <p className="text-gray-600 mb-4">{restaurantName}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-500">Date</div>
              <div className="font-medium">{formatDate(formData.date)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-500">Time</div>
              <div className="font-medium">{formatTime(formData.time)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm text-gray-500">Party Size</div>
              <div className="font-medium">{formData.party_size} {formData.party_size === 1 ? 'person' : 'people'}</div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="contact_name"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="contact_phone"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="special_requests" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests (optional)
                </label>
                <textarea
                  id="special_requests"
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Let the restaurant know if you have any special dietary requirements or other requests."
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-300"
                  disabled={submitting}
                >
                  {submitting ? 'Confirming...' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;