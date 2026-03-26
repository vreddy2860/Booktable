import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Pages
import HomePage from './pages/HomePage';
import CustomerPages from './pages/CustomerPages';
import RestaurantPages from './pages/RestaurantPages';
import AdminPages from './pages/AdminPages';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RestaurantRegister from './pages/auth/RestaurantRegister';
import Logout from './pages/auth/Logout';
import NotFound from './pages/NotFound';

// Protected route component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log("User not authenticated, redirecting to login");
    // Save the location they were trying to access for potential redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Handle role-based access
  if (requiredRole && user.role !== requiredRole) {
    console.log(`User role ${user.role} does not match required role ${requiredRole}`);
    
    // Redirect based on user's actual role
    if (user.role === 'customer') {
      return <Navigate to="/customer/search" replace />;
    } else if (user.role === 'restaurant_manager') {
      return <Navigate to="/restaurant/dashboard" replace />;
    } else if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Fallback to homepage if role doesn't match any known paths
    return <Navigate to="/" replace />;
  }
  
  // User is authenticated and has the required role
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Register />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/restaurant/signup" element={<RestaurantRegister />} />
              
              {/* Protected routes for customers */}
              <Route 
                path="/customer/*" 
                element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerPages />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes for restaurant managers */}
              <Route 
                path="/restaurant/*" 
                element={
                  <ProtectedRoute requiredRole="restaurant_manager">
                    <RestaurantPages />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes for admins */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPages />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;