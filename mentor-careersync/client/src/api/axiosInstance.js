import axios from "axios";
import { getAuthToken, clearAuth, getStudentPlatformUrl } from "../utils/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
// 1. Create axios instance using env-driven base URL
// Ensure baseURL includes /api prefix for backend routes
const baseURL = API_BASE.endsWith("/api") 
  ? API_BASE 
  : API_BASE.endsWith("/") 
    ? `${API_BASE}api` 
    : `${API_BASE}/api`;

const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request interceptor - add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response interceptor - handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      // Redirect to student platform homepage if session expires
      const studentPlatformUrl = getStudentPlatformUrl();
      window.location.href = studentPlatformUrl;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
