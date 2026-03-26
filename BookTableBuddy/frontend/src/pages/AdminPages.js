import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Admin pages
import Dashboard from './admin/Dashboard';
import RestaurantApprovals from './admin/RestaurantApprovals';
import RestaurantManagement from './admin/RestaurantManagement';
import UserManagement from './admin/UserManagement';
import SystemAnalytics from './admin/SystemAnalytics';

const AdminPages = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="restaurant-approvals" element={<RestaurantApprovals />} />
      <Route path="restaurants" element={<RestaurantManagement />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="analytics" element={<SystemAnalytics />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AdminPages;