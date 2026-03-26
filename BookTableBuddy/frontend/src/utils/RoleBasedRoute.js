import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRoute = ({ requiredRole, children }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // If authenticated but wrong role, redirect to appropriate dashboard
  if (currentUser.role !== requiredRole) {
    if (currentUser.role === 'customer') {
      return <Navigate to="/customer/search" />;
    } else if (currentUser.role === 'restaurant_manager') {
      return <Navigate to="/restaurant/dashboard" />;
    } else if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  // Otherwise, render the protected component
  return children;
};

export default RoleBasedRoute;
