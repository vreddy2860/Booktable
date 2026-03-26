import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Restaurant manager pages - Simplified for core restaurant management functionality
import Dashboard from './restaurant/Dashboard';
import RestaurantProfile from './restaurant/RestaurantProfile';

// RestaurantProfile component handles all the essentials:
// - Adding/updating restaurant details (name, address, contact)
// - Managing hours and tables
// - Uploading/managing photos

const RestaurantPages = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="profile" element={<RestaurantProfile />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default RestaurantPages;