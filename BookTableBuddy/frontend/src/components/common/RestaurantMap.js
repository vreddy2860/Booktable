import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '300px'
};

// Getting the API key from environment variables
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const RestaurantMap = ({ address, city, state, zipCode, name, latitude, longitude }) => {
  // States for component
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  
  // Create a full address string for display
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  
  // Prepare restaurant location
  let restaurantLocation;
  if (latitude && longitude) {
    restaurantLocation = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude)
    };
  } else {
    // Fallback location
    restaurantLocation = { lat: 34.0522, lng: -118.2437 };
  }

  // Handle map load
  const handleMapLoad = useCallback((mapInstance) => {
    console.log('Map loaded successfully');
    setMap(mapInstance);
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          console.log('User location:', userPos);
        },
        (error) => {
          console.error('Error getting location:', error.message);
          alert('Unable to get your location. Please make sure location services are enabled.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };
  
  // Open Google Maps directions in a new tab
  const getDirections = () => {
    // Try to get user location first if not already available
    if (!userLocation) {
      getUserLocation();
    }
    
    // Build the Google Maps directions URL
    let directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurantLocation.lat},${restaurantLocation.lng}`;
    
    // Add origin if user location is available
    if (userLocation) {
      directionsUrl += `&origin=${userLocation.lat},${userLocation.lng}`;
    }
    
    // Open in a new tab
    window.open(directionsUrl, '_blank');
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={restaurantLocation}
          zoom={15}
          onLoad={handleMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true
          }}
        >
          {/* Restaurant marker */}
          <Marker 
            position={restaurantLocation} 
            title={name}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: { width: 50, height: 50 }, // Made larger
              anchor: { x: 25, y: 25 } // Center the marker
            }}
            animation={2} // 2 = BOUNCE
            onClick={() => setShowInfoWindow(true)}
          />
          
          {/* Info window when marker is clicked */}
          {showInfoWindow && (
            <InfoWindow
              position={restaurantLocation}
              onCloseClick={() => setShowInfoWindow(false)}
            >
              <div>
                <h3 className="font-bold">{name}</h3>
                <p className="text-sm">{fullAddress}</p>
              </div>
            </InfoWindow>
          )}
          
          {/* User location marker (if available) */}
          {userLocation && (
            <Marker
              position={userLocation}
              title="Your Location"
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: { width: 40, height: 40 }
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
      
      <div className="bg-gray-100 p-3">
        <div className="text-center text-sm text-gray-700 mb-2">
          {fullAddress}
        </div>
        <div className="flex justify-center space-x-2">
          <button
            onClick={getUserLocation}
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
          >
            Show My Location
          </button>
          <button
            onClick={getDirections}
            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
          >
            Get Directions
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantMap;
