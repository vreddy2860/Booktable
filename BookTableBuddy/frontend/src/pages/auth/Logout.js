import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * A dedicated logout page that forcefully clears all authentication
 * data and session information
 */
const Logout = () => {
  // Execute logout on component mount
  useEffect(() => {
    // Force logout
    console.log('Executing forced logout from Logout page');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
    });
    
    // Clear any authentication headers from global axios if it exists
    if (window.axios) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
    
    // We don't redirect here to show the logout confirmation
  }, []);
  
  const handleManualRedirect = () => {
    // Force reload to the home page
    window.location.href = '/';
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Logged Out Successfully
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <p className="mb-6 text-gray-600">
            You have been successfully logged out of your account.
          </p>
          
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleManualRedirect}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Return to Home Page
            </button>
            
            <Link 
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logout;
