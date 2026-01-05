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
  
  // Don't use placeholder values
  if (envUrl && !envUrl.includes('your-api-domain.com') && !envUrl.includes('localhost')) {
    // Production URL provided
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Check if we're in production mode
  if (import.meta.env.PROD) {
    // In production but no valid URL - try to infer from current origin
    // This is a fallback - should be set in .env file
    console.warn('⚠️ VITE_API_BASE_URL not set or contains placeholder. Please set it in .env file.');
    // Return a default production API URL (you should update this)
    return 'https://api.careersync-4be.ptascloud.online/api'; // Update with your actual API domain
  }
  
  // Development fallback
  return "http://localhost:5001/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
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