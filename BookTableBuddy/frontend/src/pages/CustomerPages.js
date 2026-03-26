import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Customer pages
import RestaurantSearch from './customer/RestaurantSearch';
import RestaurantDetail from './customer/RestaurantDetail';
import MyBookings from './customer/MyBookings';
import BookingDetail from './customer/BookingDetail';
import BookingConfirmation from './customer/BookingConfirmation';

const CustomerPages = () => {
  return (
    <Routes>
      <Route path="search" element={<RestaurantSearch />} />
      <Route path="restaurant/:id" element={<RestaurantDetail />} />
      <Route path="bookings" element={<MyBookings />} />
      <Route path="booking/:id" element={<BookingDetail />} />
      <Route path="booking-confirmation/:id" element={<BookingConfirmation />} />
      <Route path="*" element={<Navigate to="search" replace />} />
    </Routes>
  );
};

export default CustomerPages;