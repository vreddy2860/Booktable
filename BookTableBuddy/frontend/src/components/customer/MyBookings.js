import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserBookings, cancelBooking } from '../../api/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  useEffect(() => {
    fetchBookings();
  }, []);
  
  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await getUserBookings();
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    
    try {
      await cancelBooking(bookingId);
      
      // Update the booking status in the local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' } 
            : booking
        )
      );
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };
  
  // Filter bookings based on active tab
  const filterBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return (
          booking.status === 'confirmed' && 
          bookingDate >= today
        );
      });
    } else if (activeTab === 'past') {
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return (
          booking.status === 'completed' || 
          booking.status === 'no_show' ||
          bookingDate < today
        );
      });
    } else {
      return bookings.filter(booking => booking.status === 'cancelled');
    }
  };
  
  const filteredBookings = filterBookings();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
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
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`
                w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                ${activeTab === 'upcoming'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`
                w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                ${activeTab === 'past'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Past
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`
                w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                ${activeTab === 'cancelled'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              Cancelled
            </button>
          </nav>
        </div>
      </div>
      
      {filteredBookings.length === 0 ? (
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {activeTab === 'upcoming' && 'No upcoming bookings'}
            {activeTab === 'past' && 'No past bookings'}
            {activeTab === 'cancelled' && 'No cancelled bookings'}
          </h3>
          <p className="mt-1 text-gray-500">
            {activeTab === 'upcoming' && (
              <>
                Ready to dine out? <Link to="/customer/search" className="text-red-600 hover:text-red-500">Find a restaurant</Link> and make a reservation.
              </>
            )}
            {activeTab === 'past' && 'Your completed reservations will appear here.'}
            {activeTab === 'cancelled' && 'Your cancelled reservations will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredBookings.map(booking => (
              <li key={booking.id} className="p-6">
                <div className="md:flex md:justify-between md:items-center">
                  <div className="md:flex md:items-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {booking.restaurant_name}
                    </div>
                    
                    <div className="mt-2 md:mt-0 md:ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusDisplay(booking.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 text-sm text-gray-500">
                    Booking ref: {booking.booking_reference}
                  </div>
                </div>
                
                <div className="mt-4 sm:flex sm:justify-between">
                  <div>
                    <div className="sm:flex items-center text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg 
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          />
                        </svg>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      
                      <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                        <svg 
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                          />
                        </svg>
                        <span>{formatTime(booking.time)}</span>
                      </div>
                      
                      <div className="mt-2 sm:mt-0 sm:ml-6 flex items-center">
                        <svg 
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                          />
                        </svg>
                        <span>
                          {booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                    </div>
                    
                    {booking.special_requests && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Special requests: </span>
                        {booking.special_requests}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex">
                    <Link
                      to={`/customer/restaurant/${booking.restaurant_id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mr-2"
                    >
                      View Restaurant
                    </Link>
                    
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
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
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Booking'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
