import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRestaurantDetails, getAvailableTimes, createReview } from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const RestaurantDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useState({
    date: new Date().toISOString().split('T')[0],
    party_size: '2'
  });
  
  // For the review form
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // For map display
  const [showMap, setShowMap] = useState(false);
  
  useEffect(() => {
    fetchRestaurantDetails();
    fetchAvailableTimes();
  }, [id]);
  
  const fetchRestaurantDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await getRestaurantDetails(id);
      setRestaurant(response.data);
    } catch (err) {
      console.error('Error fetching restaurant details:', err);
      setError('Failed to load restaurant details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAvailableTimes = async () => {
    try {
      const response = await getAvailableTimes(
        id,
        searchParams.date,
        searchParams.party_size
      );
      setAvailableTimes(response.data);
    } catch (err) {
      console.error('Error fetching available times:', err);
    }
  };
  
  const handleSearchParamsChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAvailableTimes();
  };
  
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    setReviewError('');
    setReviewSuccess(false);
    
    try {
      await createReview(id, reviewData);
      
      // Update the restaurant details to include the new review
      fetchRestaurantDetails();
      
      // Reset form
      setReviewData({
        rating: 5,
        comment: ''
      });
      
      setReviewSuccess(true);
      setShowReviewForm(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      
      if (err.response && err.response.data) {
        const errorMessage = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setReviewError(errorMessage);
      } else {
        setReviewError('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map(star => (
          <svg 
            key={star} 
            className={`h-5 w-5 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <div className="mt-2">
                <button
                  onClick={() => navigate(-1)}
                  className="text-sm font-medium text-red-800 hover:underline"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!restaurant) {
    return null;
  }
  
  const userHasReviewed = restaurant.reviews.some(
    review => currentUser && review.user === currentUser.id
  );
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Restaurant Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            <div className="mt-2 flex items-center">
              <span className="text-yellow-500 font-semibold mr-2">
                {restaurant.average_rating.toFixed(1)}
              </span>
              {renderStars(Math.round(restaurant.average_rating))}
              <span className="ml-2 text-gray-500">
                ({restaurant.reviews.length} reviews)
              </span>
              
              <span className="mx-2 text-gray-400">•</span>
              
              {restaurant.cuisine.map((cuisine, index) => (
                <React.Fragment key={cuisine.id}>
                  <span className="text-gray-500">{cuisine.name}</span>
                  {index < restaurant.cuisine.length - 1 && (
                    <span className="mx-1 text-gray-400">/</span>
                  )}
                </React.Fragment>
              ))}
              
              <span className="mx-2 text-gray-400">•</span>
              
              <span className="text-gray-500">{restaurant.cost_rating_display}</span>
              
              <span className="mx-2 text-gray-400">•</span>
              
              <span className="text-gray-500">{restaurant.bookings_today} booked today</span>
            </div>
            
            <div className="mt-2 flex items-center text-gray-500">
              <svg 
                className="h-5 w-5 text-gray-400 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <span>
                {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
              </span>
            </div>
          </div>
          
          <div className="space-x-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg 
                className="-ml-1 mr-2 h-5 w-5 text-gray-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                />
              </svg>
              {showMap ? 'Hide Map' : 'View Map'}
            </button>
            
            {!userHasReviewed && currentUser && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg 
                  className="-ml-1 mr-2 h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                  />
                </svg>
                Write a Review
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Map Section */}
      {showMap && restaurant.latitude && restaurant.longitude && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          <div className="h-80 bg-gray-100 rounded-lg">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&q=${restaurant.latitude},${restaurant.longitude}`}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Restaurant Info */}
        <div className="lg:col-span-2">
          {/* Restaurant Photos */}
          {restaurant.photos && restaurant.photos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Photos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {restaurant.photos.map((photo, index) => (
                  <div key={index} className="h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || restaurant.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Restaurant Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-700">{restaurant.description}</p>
          </div>
          
          {/* Restaurant Hours */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Hours</h2>
            <div className="grid grid-cols-2 gap-2">
              {restaurant.hours.map(hour => (
                <div key={hour.id} className="flex justify-between">
                  <span className="font-medium">{hour.day_name}</span>
                  <span className="text-gray-700">
                    {formatTime(hour.opening_time)} - {formatTime(hour.closing_time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Restaurant Contact Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <svg 
                  className="h-5 w-5 text-gray-400 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                  />
                </svg>
                <span className="text-gray-700">{restaurant.phone}</span>
              </div>
              
              <div className="flex items-center">
                <svg 
                  className="h-5 w-5 text-gray-400 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
                <span className="text-gray-700">{restaurant.email}</span>
              </div>
              
              {restaurant.website && (
                <div className="flex items-center">
                  <svg 
                    className="h-5 w-5 text-gray-400 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
                    />
                  </svg>
                  <a 
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    {restaurant.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Write a Review</h2>
              
              {reviewError && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{reviewError}</h3>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                        className="focus:outline-none"
                      >
                        <svg 
                          className={`h-8 w-8 ${star <= reviewData.rating ? 'text-yellow-500' : 'text-gray-300'} cursor-pointer hover:text-yellow-500`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 text-gray-600">{reviewData.rating} out of 5 stars</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Review
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    required
                    placeholder="Share your experience at this restaurant..."
                    className="form-input"
                    value={reviewData.comment}
                    onChange={handleReviewChange}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="btn-primary"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Reviews */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Reviews ({restaurant.reviews.length})
            </h2>
            
            {reviewSuccess && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Your review has been submitted successfully!
                    </h3>
                  </div>
                </div>
              </div>
            )}
            
            {restaurant.reviews.length > 0 ? (
              <div className="space-y-6">
                {restaurant.reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {review.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{review.user_name}</p>
                          <div className="flex items-center mt-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-4 text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to review this restaurant!</p>
            )}
          </div>
        </div>
        
        {/* Right Column - Reservation */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-semibold mb-4">Make a Reservation</h2>
            
            <form onSubmit={handleSearchSubmit}>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                  value={searchParams.date}
                  onChange={handleSearchParamsChange}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">
                  Party Size
                </label>
                <select
                  id="party_size"
                  name="party_size"
                  required
                  className="form-input"
                  value={searchParams.party_size}
                  onChange={handleSearchParamsChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                  <option value="11">More than 10</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="w-full btn-primary py-3"
              >
                Find a Table
              </button>
            </form>
            
            {availableTimes.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Available Times:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map((slot, index) => (
                    <Link
                      key={index}
                      to={`/customer/restaurant/${restaurant.id}/booking`}
                      state={{ 
                        time: slot.time, 
                        date: searchParams.date, 
                        party_size: searchParams.party_size 
                      }}
                      className="text-center py-2 border border-red-600 rounded text-red-600 font-medium hover:bg-red-50"
                    >
                      {formatTime(slot.time)}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500 text-center">
                Select a date and party size to see available times
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
