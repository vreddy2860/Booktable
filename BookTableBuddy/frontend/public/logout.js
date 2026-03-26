// Direct, standalone logout script - works independently from React
function forceLogout() {
  console.log('Executing forced logout');
  
  try {
    // Clear all localStorage
    localStorage.clear();
    console.log('localStorage cleared');
    
    // Clear all sessionStorage
    sessionStorage.clear();
    console.log('sessionStorage cleared');
    
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    console.log('Cookies cleared');
    
    // Remove authorization headers
    if (window.axios && window.axios.defaults && window.axios.defaults.headers) {
      delete window.axios.defaults.headers.common['Authorization'];
      console.log('axios headers cleared');
    }
  } catch (e) {
    console.error('Error during force logout:', e);
  }
  
  // Redirect to home page
  window.location.href = '/';
  
  return false;
}
