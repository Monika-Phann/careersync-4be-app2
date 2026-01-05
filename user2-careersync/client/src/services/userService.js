import axiosInstance from '../api/axiosInstance'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

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

function ok(data, message) {
  return { success: true, data, message: message || '' }
}

function fail(message, data) {
  return { success: false, data: data || null, message: message || '' }
}

export async function getProfile() {
  try {
    const res = await axiosInstance.get('/api/user/profile')
    
    const accUser = res.data.AccUser || {}
    
    // ✅ FIX: Handle R2 URL correctly
    let profileImageUrl = null;
    const rawImage = accUser.profile_image_url || accUser.profile_image;

    if (rawImage) {
      profileImageUrl = rawImage.startsWith('http')
        ? rawImage
        : `${API_ORIGIN}/uploads/${rawImage}`;
    }
    
    const capitalizeFirst = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''
    
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
    
    const profileData = {
      id: res.data.id,
      email: res.data.email,
      role: res.data.role_name,
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
    
    return ok(profileData, 'Profile loaded successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to load profile'), error?.response?.data)
  }
}

export async function updateProfile(data) {
  try {
    const hasFile = data.profileImage instanceof File
    
    let payload
    let config = {}
    
    if (hasFile) {
      const formData = new FormData()
      
      Object.keys(data).forEach(key => {
        if (key === 'profileImage' && data[key] instanceof File) {
          formData.append('profileImage', data[key])
        } else if (key === 'firstName') {
          formData.append('firstname', data[key])
        } else if (key === 'lastName') {
          formData.append('lastname', data[key])
        } else if (key === 'status') {
          const transformStatusForDB = (status) => {
            if (!status) return ''
            const lower = status.toLowerCase()
            if (lower === 'student') return 'student'
            if (lower === 'working') return 'professional'
            if (lower === 'professional') return 'professional'
            if (lower === 'institution') return 'institution'
            return lower
          }
          const dbStatus = transformStatusForDB(data[key])
          formData.append('currentstatus', dbStatus)
        } else if (key === 'gender') {
          const lowercaseGender = data[key] ? data[key].toLowerCase() : ''
          formData.append('gender', lowercaseGender)
        } else if (key === 'institution') {
          formData.append('institution', data[key])
        } else if (data[key] != null && key !== 'avatar' && key !== 'profileImage') {
          formData.append(key, data[key])
        }
      })
      
      payload = formData
      config = {}
    } else {
      const lowercaseGender = data.gender ? data.gender.toLowerCase() : ''
      
      const transformStatusForDB = (status) => {
        if (!status) return ''
        const lower = status.toLowerCase()
        if (lower === 'student') return 'student'
        if (lower === 'working') return 'professional'
        if (lower === 'professional') return 'professional'
        if (lower === 'institution') return 'institution'
        return lower
      }
      const dbStatus = transformStatusForDB(data.status)
      
      payload = {
        firstname: data.firstName,
        lastname: data.lastName,
        phone: data.phone,
        gender: lowercaseGender,
        dob: data.dob,
        currentstatus: dbStatus,
        institution: data.institution
      }
    }
    
    const res = await axiosInstance.put('/api/user/profile', payload, config)
    const responseData = res.data?.data || res.data
    return ok(responseData, res.data?.message || 'Profile updated successfully')
  } catch (error) {
    return fail(getErrorMessage(error, 'Failed to update profile'), error?.response?.data)
  }
}
