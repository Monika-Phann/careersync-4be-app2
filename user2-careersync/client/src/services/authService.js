import axiosInstance from '../api/axiosInstance'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function getErrorMessage(error, fallbackMessage) {
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`;
  }
  
  // Try multiple paths for error message
  const errorData = error?.response?.data
  if (errorData) {
    // Check for message field
    if (errorData.message) return errorData.message
    // Check for error field
    if (errorData.error) return errorData.error
    // Check for errors array (validation errors)
    if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      return errorData.errors.map(e => e.message || e).join(', ')
    }
  }
  
  return error?.message || fallbackMessage
}

function ok(data, message) {
  return { success: true, data, message: message || '' }
}

function fail(message, data) {
  return { success: false, data: data || null, message: message || '' }
}

export async function register(data) {
  try {
    // Normalize email to lowercase for case-insensitive matching
    const normalizedData = {
      ...data,
      email: data.email?.toLowerCase().trim()
    }
    
    // Check if profileImage is a File object - if so, use FormData
    const hasFile = normalizedData.profileImage instanceof File
    
    let payload
    let config = {}
    
    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData()
      
      // Add all fields to FormData
      Object.keys(normalizedData).forEach(key => {
        if (key === 'profileImage' && normalizedData[key] instanceof File) {
          // Add file with the correct field name the backend expects
          formData.append('profileImage', normalizedData[key])
        } else if (normalizedData[key] != null) {
          // Add other fields as strings
          formData.append(key, normalizedData[key])
        }
      })
      
      payload = formData
      // Content-Type header will be automatically removed by axiosInstance interceptor for FormData
      config = {}
    } else {
      // Regular JSON request
      payload = { ...normalizedData }
      // Remove profileImage if it's not a file (might be undefined or null)
      if (!normalizedData.profileImage) {
        delete payload.profileImage
      }
    }
    
    console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND')
    
    const res = await axiosInstance.post('/api/auth/register', payload, config)
    console.log('CAREERSYNC PLATFORM CREATED BY 4BE AT ABOVE AND BEYOND')
    return ok(res.data, res.data?.message || 'Registration successful')
  } catch (error) {
    console.error('Registration error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Registration failed'), error?.response?.data)
  }
}

export async function login(data) {
  try {
    // Normalize email to lowercase for case-insensitive matching
    const normalizedData = {
      ...data,
      email: data.email?.toLowerCase().trim()
    }
    const res = await axiosInstance.post('/api/auth/login', normalizedData)
    return ok(res.data, res.data?.message || 'Login successful')
  } catch (error) {
    return fail(getErrorMessage(error, 'Login failed'), error?.response?.data)
  }
}

export async function requestPasswordReset(email) {
  try {
    // Normalize email to lowercase for case-insensitive matching
    const normalizedEmail = email?.toLowerCase().trim()
    const res = await axiosInstance.post('/api/auth/reset-request', { email: normalizedEmail })
    return ok(res.data, res.data?.message || 'Reset link sent')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to send reset link'), error?.response?.data)
  }
}

export async function resetPassword(token, data) {
  try {
    const res = await axiosInstance.post(`/api/auth/reset/${token}`, data)
    return ok(res.data, res.data?.message || 'Password updated successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Password reset failed'), error?.response?.data)
  }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}


