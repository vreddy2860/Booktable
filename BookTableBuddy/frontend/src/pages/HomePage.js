import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const [searchParams, setSearchParams] = useState({
    location: '',
    date: '',
    time: '19:00',
    partySize: 2
  });
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Format query parameters
    const queryParams = new URLSearchParams();
    if (searchParams.location) queryParams.append('location', searchParams.location);
    if (searchParams.date) queryParams.append('date', searchParams.date);
    if (searchParams.time) queryParams.append('time', searchParams.time);
    if (searchParams.partySize) queryParams.append('party_size', searchParams.partySize);
    
    // Navigate to the search page with query parameters
    navigate(`/customer/search?${queryParams.toString()}`);
  };

  // Set today's date as the min date for the date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-red-600 to-red-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Find your table for any occasion in town
            </h1>
            <p className="mt-6 text-xl text-red-50 max-w-3xl mx-auto">
              Book your table in minutes at thousands of restaurants nationwide. 
              Whether it's a special celebration or casual dining, we've got you covered.
            </p>
            <div className="mt-10">
              <button
                onClick={() => navigate('/customer/search')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Browse Restaurants
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400">
            &copy; 2025 BookTable, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;