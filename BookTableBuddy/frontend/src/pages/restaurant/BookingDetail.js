import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({
    isUpdating: false,
    success: null,
    error: null
  });
  
  // Fetch booking details on component mount
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await api.bookings.getById(id);
        setBooking(response.data);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [id]);
  
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
  
  // Format date time for display
  const formatDateTime = (dateString, timeString) => {
    const date = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 0 && diffDays < 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < 0 && diffDays > -7) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return formatDate(dateString);
    }
  };
  
  // Determine status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Update booking status
  const handleUpdateStatus = async (newStatus) => {
    setUpdateStatus({ isUpdating: true, success: null, error: null });
    
    try {
      const response = await api.bookings.update(id, { status: newStatus });
      setBooking(response.data);
      setUpdateStatus({ 
        isUpdating: false, 
        success: `Booking status updated to ${newStatus}`, 
        error: null 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (err) {
      console.error('Error updating booking status:', err);
      setUpdateStatus({ 
        isUpdating: false, 
        success: null, 
        error: 'Failed to update booking status. Please try again.' 
      });
    }
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
  
  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error || 'Booking not found'}</p>
        </div>
        <div className="text-center">
          <button 
            onClick={() => navigate('/restaurant/bookings')}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }
  
  const isUpcoming = booking.status === 'confirmed' && new Date(`${booking.date}T${booking.time}`) > new Date();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          to="/restaurant/bookings" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Bookings
        </Link>
      </div>
      
      {updateStatus.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{updateStatus.success}</p>
        </div>
      )}
      
      {updateStatus.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{updateStatus.error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <div>
              <div className="inline-flex items-center">
                <h1 className="text-2xl font-bold">Booking Details</h1>
                <span className={`ml-4 ${getStatusBadgeClass(booking.status)} px-3 py-1 rounded-full text-sm font-medium`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-500 mt-1">
                Reference: {booking.booking_reference}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {isUpcoming && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={updateStatus.isUpdating}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                  >
                    {updateStatus.isUpdating ? 'Updating...' : 'Mark as Completed'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('no_show')}
                    disabled={updateStatus.isUpdating}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                  >
                    {updateStatus.isUpdating ? 'Updating...' : 'Mark as No-Show'}
                  </button>
                </>
              )}
              
              {booking.status === 'completed' && (
                <button
                  onClick={() => handleUpdateStatus('confirmed')}
                  disabled={updateStatus.isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                >
                  {updateStatus.isUpdating ? 'Updating...' : 'Revert to Confirmed'}
                </button>
              )}
              
              {booking.status === 'no_show' && (
                <button
                  onClick={() => handleUpdateStatus('confirmed')}
                  disabled={updateStatus.isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                >
                  {updateStatus.isUpdating ? 'Updating...' : 'Revert to Confirmed'}
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Reservation Information</h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-gray-600">{formatDate(booking.date)}</p>
                    <p className="text-gray-600">{formatTime(booking.time)}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(booking.date, booking.time)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <div>
                    <p className="font-medium">Party Size</p>
                    <p className="text-gray-600">{booking.party_size} {booking.party_size === 1 ? 'person' : 'people'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Table</p>
                    <p className="text-gray-600">Table #{booking.table_number}</p>
                  </div>
                </div>
                
                {booking.special_requests && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Special Requests</p>
                      <p className="text-gray-600">{booking.special_requests}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Name</p>
                    <p className="text-gray-600">{booking.contact_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">{booking.contact_phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">{booking.contact_email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Booking Created</p>
                    <p className="text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString()} at {new Date(booking.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {booking.created_at !== booking.updated_at && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-gray-600">
                        {new Date(booking.updated_at).toLocaleDateString()} at {new Date(booking.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">
                Booking ID: {booking.id}
              </span>
            </div>
            
            <div className="flex space-x-2 mt-4 sm:mt-0">
              <Link
                to="/restaurant/bookings"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-300"
              >
                Back to All Bookings
              </Link>
              
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                      handleUpdateStatus('cancelled');
                    }
                  }}
                  disabled={updateStatus.isUpdating}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
                >
                  {updateStatus.isUpdating ? 'Updating...' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;