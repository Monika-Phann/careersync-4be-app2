import axiosInstance from "./axiosInstance";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * Register a new user
 * @param {Object} data - User registration data
 * @returns {Promise} API response
 */
export const registerUser = async (data) => {
  try {
    const response = await axiosInstance.post("/auth/register", data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Handle network errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        success: false,
        error: `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`,
        details: error.response?.data,
      };
    }
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "Registration failed",
      details: error.response?.data,
    };
  }
};

/**
 * Login user
 * @param {Object} data - Login credentials { email, password }
 * @returns {Promise} API response with token and user
 */
export const loginUser = async (data) => {
  try {
    const response = await axiosInstance.post("/auth/login", data);

    const { accessToken, user } = response.data || {};

    // Store JWT access token and user in localStorage
    if (accessToken) {
      localStorage.setItem("token", accessToken);
    }
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Handle network errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        success: false,
        error: `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`,
        details: error.response?.data,
      };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Login failed",
      details: error.response?.data,
    };
  }
};

/**
 * Request password reset
 * @param {string} email - User email address
 * @returns {Promise} API response
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await axiosInstance.post("/auth/reset-request", { email });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Handle network errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        success: false,
        error: `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`,
        details: error.response?.data,
      };
    }
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset link",
      details: error.response?.data,
    };
  }
};

/**
 * Reset password with token
 * @param {string} resetToken - Password reset token from URL
 * @param {string} newPassword - New password
 * @returns {Promise} API response
 */
export const resetPassword = async (resetToken, newPassword) => {
  try {
    const response = await axiosInstance.post(`/auth/reset/${resetToken}`, {
      password: newPassword,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Handle network errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        success: false,
        error: `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`,
        details: error.response?.data,
      };
    }
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Password reset failed",
      details: error.response?.data,
    };
  }
};

/**
 * Logout user - clears token from localStorage
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Get stored token
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  return localStorage.getItem("token");
};
