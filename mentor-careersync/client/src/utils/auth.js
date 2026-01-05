// Auth utility for mentor platform
// Handles token and user data from localStorage or URL params

/**
 * Get the student platform URL from environment variables
 * This ensures consistent URL usage across the mentor platform
 */
export const getStudentPlatformUrl = () => {
  // Try multiple environment variable names for flexibility
  const url = 
    import.meta.env.VITE_CLIENT_BASE_URL_STUDENT ||
    import.meta.env.VITE_STUDENT_PLATFORM_URL ||
    import.meta.env.VITE_STUDENT_URL ||
    // Fallback to localhost only in development
    (import.meta.env.DEV ? 'http://localhost:5174' : 'https://careersync-4be.ptascloud.online');
  
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};

export const getAuthToken = () => {
  // First check URL params (from redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  
  if (tokenFromUrl) {
    // Store in localStorage for future use (both keys for compatibility)
    localStorage.setItem('accessToken', tokenFromUrl);
    localStorage.setItem('token', tokenFromUrl);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return tokenFromUrl;
  }
  
  // Check both 'token' and 'accessToken' for compatibility
  return localStorage.getItem('token') || localStorage.getItem('accessToken');
};

export const getUserData = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      // Silently handle parsing error
      return null;
    }
  }
  return null;
};

export const setUserData = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

