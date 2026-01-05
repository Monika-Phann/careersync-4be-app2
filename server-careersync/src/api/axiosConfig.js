// import axios from 'axios';

// // ✅ កែត្រង់នេះ៖ ប្រើ VITE_API_URL (អត់មាន BASE)
// // ហើយដក /api/v1 ចេញ (ព្រោះ Server បងអត់មាន Route v1 ទេ)
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// const api = axios.create({
//   baseURL: API_URL,
//   withCredentials: true,
// });

// // --- Request Interceptor (ទុកដដែល) ---
// api.interceptors.request.use(
//   (config) => {
//     // ពិនិត្យមើលថាបង Save Token ឈ្មោះអី? accessToken ឬ token?
//     // បើក្នុង Login.jsx ដាក់ localStorage.setItem('token', ...) ខាងក្រោមនេះត្រូវដាក់ 'token' ដែរ
//     const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // --- Response Interceptor (ទុកដដែល) ---
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       // TODO: Handle token refresh logic here
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from 'axios';

// Get API base URL from environment variables
// Check for placeholder values and provide proper fallbacks
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  
  // List of placeholder patterns to reject
  const placeholderPatterns = [
    'your-api-domain.com',
    'your-api-domain',
    'example.com',
    'localhost:3000', // Old default that shouldn't be used
  ];
  
  // Check if URL contains any placeholder patterns
  const isPlaceholder = envUrl && placeholderPatterns.some(pattern => 
    envUrl.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // CRITICAL: If placeholder detected, immediately use fallback
  if (isPlaceholder) {
    console.error('❌ ERROR: Placeholder API URL detected in environment variable!');
    console.error('❌ Detected URL:', envUrl);
    console.error('⚠️ Using fallback API URL. Please update your .env file and rebuild.');
    
    // Determine if we're in production
    const isProduction = import.meta.env.PROD || 
                        (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
    
    if (isProduction) {
      // Production fallback - UPDATE THIS WITH YOUR ACTUAL API DOMAIN
      const fallbackUrl = 'https://api.careersync-4be.ptascloud.online/api';
      console.log('✅ Using production fallback:', fallbackUrl);
      return fallbackUrl;
    }
    
    // Development fallback
    return "http://localhost:5001/api";
  }
  
  // Use environment URL if it's valid and not a placeholder
  if (envUrl && envUrl.startsWith('http')) {
    // Ensure it ends with /api
    const finalUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    console.log('✅ Using environment API URL:', finalUrl);
    return finalUrl;
  }
  
  // No valid URL provided - use fallback based on environment
  const isProduction = import.meta.env.PROD || 
                      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
  
  if (isProduction) {
    console.warn('⚠️ No valid API URL found. Using production fallback.');
    return 'https://api.careersync-4be.ptascloud.online/api';
  }
  
  // Development fallback
  return "http://localhost:5001/api";
};

// Get the API base URL
let apiBaseUrl = getApiBaseUrl();

// FINAL SAFETY CHECK: Force replace placeholder URLs even if they somehow got through
if (apiBaseUrl.includes('your-api-domain.com') || apiBaseUrl.includes('your-api-domain')) {
  console.error('❌ CRITICAL: Placeholder URL detected in final baseURL! Forcing replacement...');
  const isProduction = typeof window !== 'undefined' && 
                      window.location.hostname !== 'localhost' && 
                      !window.location.hostname.includes('127.0.0.1');
  apiBaseUrl = isProduction 
    ? 'https://api.careersync-4be.ptascloud.online/api'
    : 'http://localhost:5001/api';
  console.log('✅ Forced replacement to:', apiBaseUrl);
}

// Log the final API URL being used
if (typeof window !== 'undefined') {
  console.log('🔗 Admin Platform API Base URL:', apiBaseUrl);
  console.log('📍 Current hostname:', window.location.hostname);
}

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// --- Request Interceptor (ទុកដដែល) ---
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 (Unauthorized) - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    // Handle 403 (Forbidden) - Admin access required
    if (error.response?.status === 403) {
      // Clear auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;