import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileMenuOpen && !event.target.closest('#user-menu-container')) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);
  
  // Ensure menu state is synchronized with authentication state
  useEffect(() => {
    if (!isAuthenticated) {
      setIsProfileMenuOpen(false);
      setIsMenuOpen(false);
    }
  }, [isAuthenticated]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    console.log('Logout triggered');
    
    // Close all menus
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
    
    try {
      // Use the AuthContext logout function
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback logout mechanism
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('Fallback logout failed:', fallbackError);
      }
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch(user.role) {
      case 'customer':
        return '/customer/bookings';
      case 'restaurant_manager':
        return '/restaurant/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-red-600 font-bold text-xl">BookTable</Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              {isAuthenticated && user?.role === 'customer' && (
                <>
                  <Link
                    to="/customer/search"
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Find a Restaurant
                  </Link>
                  <Link
                    to="/customer/bookings"
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    My Bookings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Sign out
                  </button>
                </>
              )}
              {isAuthenticated && user?.role === 'restaurant_manager' && (
                <>
                  <Link
                    to="/restaurant/dashboard"
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/restaurant/profile"
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Restaurant Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Sign out
                  </button>
                </>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/restaurant-approvals"
                    className="border-transparent text-gray-500 hover:border-red-500 hover:text-red-600 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Approvals
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </>
              )}
            </nav>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {!isAuthenticated ? (
              <div className="flex space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Sign up
                </Link>
                <Link 
                  to="/restaurant/signup" 
                  className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  For Restaurants
                </Link>
              </div>
            ) : (
              <div className="ml-3 relative">
                <div id="user-menu-container">
                  <button
                    onClick={toggleProfileMenu}
                    className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-red-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center text-red-600 font-bold">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  </button>
                </div>
                
                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-bold">{user?.username}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Dropdown Sign Out clicked');
                        // Close the profile menu first
                        setIsProfileMenuOpen(false);
                        // Perform direct logout without using AuthContext
                        try {
                          // Clear auth data
                          localStorage.removeItem('accessToken');
                          localStorage.removeItem('refreshToken');
                          localStorage.removeItem('user');
                          
                          // Clear authorization headers
                          delete axios.defaults.headers.common['Authorization'];
                          
                          console.log('Cleared all local storage and headers');
                          
                          // Force navigation after clearing everything
                          setTimeout(() => {
                            console.log('Redirecting to login page');
                            window.location.replace('/login');
                          }, 100);
                        } catch (error) {
                          console.error('Direct logout failed:', error);
                          // Last resort redirect
                          window.location.replace('/login');
                        }
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          {isAuthenticated && user?.role === 'customer' && (
            <>
              <Link
                to="/customer/search"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Find a Restaurant
              </Link>
              <Link
                to="/customer/bookings"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                My Bookings
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'restaurant_manager' && (
            <>
              <Link
                to="/restaurant/dashboard"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/restaurant/bookings"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Bookings
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/restaurant-approvals"
                className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-red-500 hover:text-red-600 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Approvals
              </Link>
            </>
          )}
        </div>
        
        <div className="pt-4 pb-3 border-t border-gray-200">
          {!isAuthenticated ? (
            <div className="space-y-2 px-4">
              <Link 
                to="/login" 
                className="block text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="block bg-red-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-red-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
              <Link 
                to="/restaurant/signup" 
                className="block text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                For Restaurants
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center text-red-600 font-bold">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.username}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to={getDashboardLink()}
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/logout"
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign out
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;