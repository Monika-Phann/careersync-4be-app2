import axiosInstance from '../api/axiosInstance'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * Get error message from API error response
 */
function getErrorMessage(error, fallbackMessage) {
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `Cannot connect to server. Please make sure the backend server is running on ${API_BASE}`
  }

  const errorData = error?.response?.data
  if (errorData) {
    if (errorData.message) return errorData.message
    if (errorData.error) return errorData.error
    if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      return errorData.errors.map(e => e.message || e).join(', ')
    }
  }
  return error?.message || fallbackMessage
}

/**
 * Success response helper
 */
function ok(data, message) {
  return { success: true, data, message: message || '' }
}

/**
 * Error response helper
 */
function fail(message, data) {
  return { success: false, data: data || null, message: message || '' }
}

/**
 * Get all mentors (with optional status filter)
 * @param {string} status - Optional: 'pending' | 'approved' | 'rejected'
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function getAllMentors(status = null) {
  try {
    const params = status ? { status } : {}
    const res = await axiosInstance.get('/api/admin/mentors', { params })
    return ok(res.data, 'Mentors fetched successfully')
  } catch (error) {
    console.error('Get all mentors error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Failed to fetch mentors'), error?.response?.data)
  }
}

/**
 * Get mentor by ID
 * @param {string} id - Mentor ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function getMentorById(id) {
  try {
    const res = await axiosInstance.get(`/api/admin/mentors/${id}`)
    return ok(res.data, 'Mentor fetched successfully')
  } catch (error) {
    console.error('Get mentor by ID error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Failed to fetch mentor'), error?.response?.data)
  }
}

/**
 * Approve mentor
 * @param {string} id - Mentor ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function approveMentor(id) {
  try {
    const res = await axiosInstance.put(`/api/admin/mentors/${id}/approve`)
    return ok(res.data.mentor || res.data, res.data.message || 'Mentor approved successfully')
  } catch (error) {
    console.error('Approve mentor error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Failed to approve mentor'), error?.response?.data)
  }
}

/**
 * Reject mentor
 * @param {string} id - Mentor ID
 * @param {string} rejectionReason - Optional rejection reason
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function rejectMentor(id, rejectionReason = null) {
  try {
    const res = await axiosInstance.put(`/api/admin/mentors/${id}/reject`, {
      rejection_reason: rejectionReason
    })
    return ok(res.data.mentor || res.data, res.data.message || 'Mentor rejected successfully')
  } catch (error) {
    console.error('Reject mentor error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Failed to reject mentor'), error?.response?.data)
  }
}

