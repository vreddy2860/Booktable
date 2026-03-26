import React from 'react';

/**
 * A simple component that provides a direct way to force logout when other mechanisms fail
 */
const ForceLogout = ({ buttonText = "Force Logout", className = "" }) => {
  
  const handleForceLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Display a message
    console.log('Force logout triggered');
    
    // Clear all authentication data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
    });
    
    // Force a page reload to clear React state
    window.location.href = '/';
    
    return false;
  };
  
  return (
    <button 
      onClick={handleForceLogout}
      className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${className}`}
    >
      {buttonText}
    </button>
  );
};

export default ForceLogout;
