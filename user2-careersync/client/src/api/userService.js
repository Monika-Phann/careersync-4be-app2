import axiosInstance from './axiosInstance'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

/**
 * Helper function to extract error message from API error
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
 * Helper function to create success response
 */
function ok(data, message) {
  return { success: true, data, message: message || '' }
}

/**
 * Helper function to create error response
 */
function fail(message, data) {
  return { success: false, data: data || null, message: message || '' }
}

/**
 * Transform backend response to frontend format
 */
function transformProfileData(backendData) {
  const accUser = backendData.AccUser || {}
  
  // ✅ FIX: Handle R2 URL correctly
  let profileImageUrl = null;
  const rawImage = accUser.profile_image_url || accUser.profile_image;

  if (rawImage) {
    if (rawImage.startsWith('http')) {
      // It's already a full URL (Cloudflare R2)
      profileImageUrl = rawImage;
    } else {
      // It's a legacy local file
      profileImageUrl = `${API_ORIGIN}/uploads/${rawImage}`;
    }
  }
  
  // Transform gender: "male" -> "Male", "female" -> "Female"
  const capitalizeFirst = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''
  
  // Transform status
  const transformStatus = (status) => {
    if (!status) return ''
    const lower = status.toLowerCase()
    if (lower === 'student') return 'Student'
    if (lower === 'professional') return 'Working'
    if (lower === 'institution') return 'Institution'
    if (lower === 'working') return 'Working'
    return capitalizeFirst(status)
  }
  
  const transformedGender = capitalizeFirst(accUser.gender || '')
  const transformedStatus = transformStatus(accUser.types_user || '')
  
  return {
    id: backendData.id,
    email: backendData.email,
    role: backendData.role_name,
    firstName: accUser.first_name || '',
    lastName: accUser.last_name || '',
    phone: accUser.phone || '',
    dob: accUser.dob || '',
    gender: transformedGender,
    status: transformedStatus,
    institution: accUser.institution_name || '',
    avatar: profileImageUrl,
    profileImage: profileImageUrl
  }
}

/**
 * Transform frontend data to backend format
 */
function transformProfileForBackend(data) {
  const transformStatusForDB = (status) => {
    if (!status) return ''
    const lower = status.toLowerCase()
    if (lower === 'student') return 'student'
    if (lower === 'working') return 'professional'
    if (lower === 'professional') return 'professional'
    if (lower === 'institution') return 'institution'
    return lower
  }
  
  return {
    firstname: data.firstName,
    lastname: data.lastName,
    phone: data.phone,
    gender: data.gender ? data.gender.toLowerCase() : '',
    dob: data.dob,
    currentstatus: transformStatusForDB(data.status),
    institution: data.institution
  }
}

// ============================================
// Profile API Functions
// ============================================

export async function getUserProfile() {
  try {
    const res = await axiosInstance.get('/api/user/profile')
    const profileData = transformProfileData(res.data)
    return ok(profileData, 'Profile loaded successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to load profile'), error?.response?.data)
  }
}

export async function updateUserProfile(data) {
  try {
    const hasFile = data.profileImage instanceof File
    
    let payload
    let config = {}
    
    if (hasFile) {
      const formData = new FormData()
      const backendData = transformProfileForBackend(data)
      
      Object.keys(backendData).forEach(key => {
        if (backendData[key] != null) {
          formData.append(key, backendData[key])
        }
      })
      
      formData.append('profileImage', data.profileImage)
      
      payload = formData
      config = {}
    } else {
      payload = transformProfileForBackend(data)
    }
    
    const res = await axiosInstance.put('/api/user/profile', payload, config)
    
    const responseData = res.data?.data || res.data
    
    // Transform response if needed
    const profileData = responseData.avatar ? responseData : transformProfileData({ ...res.data, AccUser: responseData })
    
    return ok(profileData, res.data?.message || 'Profile updated successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to update profile'), error?.response?.data)
  }
}

export async function changePassword(data) {
  try {
    const res = await axiosInstance.put('/api/user/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    })
    return ok(res.data, res.data?.message || 'Password changed successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to change password'), error?.response?.data)
  }
}

export async function getUserBookings() {
  try {
    const res = await axiosInstance.get('/api/user/bookings')
    return ok(res.data || [], 'Bookings loaded successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to load bookings'), error?.response?.data)
  }
}

export async function getUserCertificates() {
  try {
    const res = await axiosInstance.get('/api/user/certificates')
    return ok(res.data || [], 'Certificates loaded successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to load certificates'), error?.response?.data)
  }
}
