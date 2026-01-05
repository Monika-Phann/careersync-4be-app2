import axiosInstance from '../api/axiosInstance'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function ok(data, message) {
  return { success: true, data, message: message || '' }
}

function fail(message, data) {
  return { success: false, data: data || null, message: message || '' }
}

function getErrorMessage(error, fallbackMessage) {
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`
  }
  const errorData = error?.response?.data
  return errorData?.message || errorData?.error || error?.message || fallbackMessage
}

/**
 * Public: Get all available sessions (includes mentor + timeslots)
 * GET /api/sessions/available
 */
export async function getAvailableSessions() {
  try {
    const res = await axiosInstance.get('/api/sessions/available')
    // Backend returns { message, count, sessions }
    return ok(res.data?.sessions || [], res.data?.message || 'Available sessions loaded')
  } catch (error) {
    console.error('Get available sessions error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    })
    return fail(getErrorMessage(error, 'Failed to load available sessions'), error?.response?.data)
  }
}



