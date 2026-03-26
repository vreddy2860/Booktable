import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/helpers';
import api from '../../api/api';

const Calendar = ({ restaurantId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);

  // Format date as YYYY-MM-DD for API requests
  const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get all days for the current month view
  useEffect(() => {
    const generateCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      
      // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
      const firstDayOfWeek = firstDay.getDay();
      
      // Calculate padding days from previous month to start the calendar
      const prevMonthDays = [];
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const prevDate = new Date(year, month, -i);
        prevMonthDays.push({
          date: prevDate,
          isCurrentMonth: false,
          isToday: isSameDay(prevDate, new Date())
        });
      }
      
      // Current month days
      const currentMonthDays = [];
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const currentDate = new Date(year, month, i);
        currentMonthDays.push({
          date: currentDate,
          isCurrentMonth: true,
          isToday: isSameDay(currentDate, new Date())
        });
      }
      
      // Calculate padding days from next month to complete the calendar grid
      const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length;
      const remainingCells = 42 - totalDaysDisplayed; // 6 rows x 7 days = 42 cells total
      
      const nextMonthDays = [];
      for (let i = 1; i <= remainingCells; i++) {
        const nextDate = new Date(year, month + 1, i);
        nextMonthDays.push({
          date: nextDate,
          isCurrentMonth: false,
          isToday: isSameDay(nextDate, new Date())
        });
      }
      
      setCalendarDays([...prevMonthDays, ...currentMonthDays, ...nextMonthDays]);
    };
    
    generateCalendarDays();
  }, [currentDate]);

  // Helper function to check if two dates are the same day - with better timezone handling
  const isSameDay = (date1, date2) => {
    // Convert both dates to YYYY-MM-DD format for comparison
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const d1Str = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
    const d2Str = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
    
    console.log('Comparing dates:', d1Str, d2Str);
    return d1Str === d2Str;
  };

  // Fetch bookings for the current month
  useEffect(() => {
    const fetchBookings = async () => {
      if (!restaurantId) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Calculate first and last day of current month view
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const response = await api.bookings.getDateRangeBookings(
          formatDateForApi(firstDay),
          formatDateForApi(lastDay),
          restaurantId
        );
        
        setBookings(response.data);
      } catch (err) {
        console.error('Error fetching bookings for calendar:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [currentDate, restaurantId]);

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Count bookings for a specific day - completely reworked for reliability
  const getBookingsCountForDay = (day) => {
    // Extract year, month, day from the day object's date
    const dayYear = day.date.getFullYear();
    const dayMonth = day.date.getMonth() + 1; // Convert from 0-indexed to 1-indexed month
    const dayDate = day.date.getDate();
    
    // Format as YYYY-MM-DD string
    const formattedDayDate = `${dayYear}-${String(dayMonth).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
    
    // Count bookings by direct string comparison with the date field
    const count = bookings.filter(booking => booking.date === formattedDayDate).length;
    
    // Debug output for May 8 specifically
    if (formattedDayDate === '2025-05-08') {
      console.log('May 8th detection - Date comparison:', formattedDayDate);
      console.log('Bookings found for May 8th:', bookings.filter(booking => booking.date === formattedDayDate));
    }
    
    return count;
  };

  // Handle date selection - simplified with direct string comparison
  const handleDateClick = (day) => {
    setSelectedDate(day.date);
    
    // Format the day's date as YYYY-MM-DD for direct comparison with API data
    const dayYear = day.date.getFullYear();
    const dayMonth = day.date.getMonth() + 1; // Convert from 0-indexed to 1-indexed month
    const dayDate = day.date.getDate();
    const formattedDayDate = `${dayYear}-${String(dayMonth).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
    
    // Filter bookings by exact string match on the date field
    const filteredBookings = bookings.filter(booking => booking.date === formattedDayDate);
    
    // Debug for May 8th
    if (formattedDayDate === '2025-05-08') {
      console.log('Selected May 8th:', formattedDayDate);
      console.log('Filtered bookings for May 8th:', filteredBookings);
    }
    
    setSelectedDateBookings(filteredBookings);
  };

  // Format the time from the API response
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Booking Calendar</h2>
        <div className="flex space-x-2">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="font-medium">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </div>
          <button 
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-7">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center font-medium text-gray-500 pb-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const bookingsCount = getBookingsCountForDay(day);
            const isSelected = selectedDate && isSameDay(day.date, selectedDate);
            
            return (
              <div 
                key={index} 
                onClick={() => handleDateClick(day)}
                className={`cursor-pointer p-2 h-24 border rounded transition-all ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'} ${
                  day.isToday ? 'border-blue-500 border-2' : 'border-gray-200'
                } ${isSelected ? 'ring-2 ring-indigo-600' : ''}`}
              >
                <div className="flex justify-between">
                  <span className={`text-sm font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                    {day.date.getDate()}
                  </span>
                  
                  {bookingsCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {bookingsCount}
                    </span>
                  )}
                </div>
                
                {/* Show a preview of first 2 bookings if they exist */}
                {bookingsCount > 0 && (
                  <div className="mt-1 overflow-hidden">
                    {(() => {
                      // Format the day's date as YYYY-MM-DD for direct comparison
                      const dayYear = day.date.getFullYear();
                      const dayMonth = day.date.getMonth() + 1; // Convert from 0-indexed to 1-indexed month
                      const dayDate = day.date.getDate();
                      const formattedDayDate = `${dayYear}-${String(dayMonth).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
                      
                      // Debug for May 8
                      if (formattedDayDate === '2025-05-08') {
                        console.log('Rendering cell for May 8th', formattedDayDate);
                      }
                      
                      // Direct string comparison with the booking date field
                      return bookings
                        .filter(booking => booking.date === formattedDayDate)
                        .slice(0, 2)
                        .map((booking, idx) => (
                          <div key={idx} className="text-xs truncate text-gray-600 bg-gray-100 rounded px-1 py-0.5 mb-0.5">
                            {formatTime(booking.time)} - {booking.party_size}p
                          </div>
                        ));
                    })()}
                    {bookingsCount > 2 && (
                      <div className="text-xs text-center text-gray-500">+{bookingsCount - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Selected day details */}
      {selectedDate && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium text-lg mb-3">
            Bookings for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          
          {selectedDateBookings.length === 0 ? (
            <p className="text-gray-500">No bookings for this day.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {selectedDateBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className={`p-3 rounded-lg border ${booking.status === 'confirmed' ? 'border-green-200 bg-green-50' : 
                    booking.status === 'cancelled' ? 'border-red-200 bg-red-50' : 
                    booking.status === 'completed' ? 'border-blue-200 bg-blue-50' :
                    booking.status === 'no_show' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{formatTime(booking.time)} • Table {booking.table.table_number}</p>
                      <p className="text-sm text-gray-600">Party of {booking.party_size}</p>
                      <p className="text-sm text-gray-600">{booking.contact_name} • {booking.contact_phone}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'no_show' ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  {booking.special_requests && (
                    <p className="mt-2 text-sm text-gray-700 italic">Note: {booking.special_requests}</p>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          if (window.confirm('Mark this booking as completed?')) {
                            api.bookings.completeBooking(booking.id)
                              .then(() => {
                                // Refresh the bookings after marking as completed
                                const updatedBookings = [...bookings];
                                const bookingIndex = updatedBookings.findIndex(b => b.id === booking.id);
                                if (bookingIndex !== -1) {
                                  updatedBookings[bookingIndex].status = 'completed';
                                  setBookings(updatedBookings);
                                  
                                  // Also update the selected date bookings
                                  const updatedSelected = [...selectedDateBookings];
                                  const selectedIndex = updatedSelected.findIndex(b => b.id === booking.id);
                                  if (selectedIndex !== -1) {
                                    updatedSelected[selectedIndex].status = 'completed';
                                    setSelectedDateBookings(updatedSelected);
                                  }
                                }
                              })
                              .catch(err => console.error('Error completing booking:', err));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Mark this booking as no-show?')) {
                            api.bookings.noShowBooking(booking.id)
                              .then(() => {
                                // Refresh the bookings after marking as no-show
                                const updatedBookings = [...bookings];
                                const bookingIndex = updatedBookings.findIndex(b => b.id === booking.id);
                                if (bookingIndex !== -1) {
                                  updatedBookings[bookingIndex].status = 'no_show';
                                  setBookings(updatedBookings);
                                  
                                  // Also update the selected date bookings
                                  const updatedSelected = [...selectedDateBookings];
                                  const selectedIndex = updatedSelected.findIndex(b => b.id === booking.id);
                                  if (selectedIndex !== -1) {
                                    updatedSelected[selectedIndex].status = 'no_show';
                                    setSelectedDateBookings(updatedSelected);
                                  }
                                }
                              })
                              .catch(err => console.error('Error marking as no-show:', err));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        No-Show
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
