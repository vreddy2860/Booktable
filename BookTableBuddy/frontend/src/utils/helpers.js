/**
 * A collection of helper utilities for the BookTableBuddy app
 */

/**
 * Formats a date object or date string to the format MM/DD/YYYY
 * @param {Date|string} date - Date object or date string to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return '';
  
  const month = dateObj.getMonth() + 1; // getMonth is 0-indexed
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
};

/**
 * Formats a time string to 12-hour format (e.g., "7:30 PM")
 * @param {string} timeString - Time string in format HH:MM:SS
 * @returns {string} - Formatted time string
 */
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return timeString;
  }
};

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Truncates a string to the specified length and adds ellipsis if needed
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated string
 */
export const truncateString = (str, maxLength = 100) => {
  if (!str || str.length <= maxLength) return str;
  
  return str.slice(0, maxLength) + '...';
};

/**
 * Formats a price number to a currency string
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, currency = 'USD') => {
  if (price === null || price === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
};
