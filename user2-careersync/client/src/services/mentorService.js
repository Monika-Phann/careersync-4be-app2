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
 * Get all industries
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function getIndustries() {
  try {
    const res = await axiosInstance.get('/api/industries')
    return ok(res.data, 'Industries fetched successfully')
  } catch (error) {
    console.error('Get industries error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Failed to fetch industries'), error?.response?.data)
  }
}

/**
 * Get all positions
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function getPositions() {
  try {
    const res = await axiosInstance.get('/api/positions')
    return ok(res.data, 'Positions fetched successfully')
  } catch (error) {
    console.error('Get positions error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Failed to fetch positions'), error?.response?.data)
  }
}

/**
 * Get all approved mentors
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function getAllMentors() {
  try {
    const res = await axiosInstance.get('/api/mentors')
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
 * Verify if position_id exists in the fetched positions list
 * This is a client-side check using the positions we already loaded
 * @param {string} positionId - Position ID to verify
 * @param {Array} positionsList - List of positions from API
 * @returns {Promise<{success: boolean, exists: boolean, message: string}>}
 */
export async function verifyPositionId(positionId, positionsList = []) {
  try {
    if (!positionId) {
      return { success: false, exists: false, message: 'Position ID is required' }
    }
    
    // Check if position exists in the list we fetched
    const positionExists = positionsList.some(p => p.id === positionId)
    
    if (positionExists) {
      return { success: true, exists: true, message: 'Position exists in fetched list' }
    } else {
      return { 
        success: true, 
        exists: false, 
        message: `Position ID ${positionId} not found in available positions. This usually means the database needs to be seeded.` 
      }
    }
  } catch (error) {
    return { success: false, exists: false, message: getErrorMessage(error, 'Failed to verify position') }
  }
}

/**
 * Get mentor by ID
 * @param {string} id - Mentor ID
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function getMentorById(id) {
  try {
    if (!id) {
      return fail('Mentor ID is required')
    }
    const res = await axiosInstance.get(`/api/mentors/${id}`)
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
 * Apply as mentor (for logged-in users)
 * @param {Object} mentorData - Mentor application data
 * @param {File} mentorData.profilePicture - Profile image file
 * @param {File[]} mentorData.mentorDocuments - Array of document files
 * @param {Object[]} mentorData.documents - Array of document metadata
 * @param {Object[]} mentorData.education - Array of education records
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function applyAsMentor(mentorData) {
  try {
    const formData = new FormData()

    // Append profile image
    if (mentorData.profilePicture instanceof File) {
      formData.append('profile_image', mentorData.profilePicture)
    }

    // Append mentor documents (multiple files)
    if (mentorData.mentorDocuments && Array.isArray(mentorData.mentorDocuments)) {
      mentorData.mentorDocuments.forEach((file) => {
        if (file instanceof File) {
          formData.append('mentor_documents', file)
        }
      })
    }

    // For logged-in users, we don't need email/password
    // Only append mentor-specific fields
    if (mentorData.firstName) formData.append('first_name', mentorData.firstName)
    if (mentorData.lastName) formData.append('last_name', mentorData.lastName)
    if (mentorData.phone) formData.append('phone', mentorData.phone)
    if (mentorData.dateOfBirth) formData.append('dob', mentorData.dateOfBirth)
    
    // Transform gender: "Male" -> "male", "Female" -> "female"
    if (mentorData.gender) {
      formData.append('gender', mentorData.gender.toLowerCase())
    }
    
    // Industry and Position - sending as IDs (from dropdown)
    console.log('📤 [applyAsMentor] Sending industry_id:', mentorData.industry);
    console.log('📤 [applyAsMentor] Sending position_id:', mentorData.position);
    if (mentorData.industry) formData.append('industry_id', mentorData.industry)
    if (mentorData.position) formData.append('position_id', mentorData.position)
    
    // Optional fields
    if (mentorData.jobTitle) formData.append('job_title', mentorData.jobTitle)
    if (mentorData.expertiseAreas) formData.append('expertise_areas', mentorData.expertiseAreas)
    if (mentorData.yearsOfExperience) formData.append('experience_years', mentorData.yearsOfExperience)
    if (mentorData.company) formData.append('company_name', mentorData.company)
    if (mentorData.linkedIn) formData.append('social_media', mentorData.linkedIn)
    if (mentorData.about) formData.append('about_mentor', mentorData.about)

    // Append documents metadata as JSON string
    if (mentorData.documents && Array.isArray(mentorData.documents) && mentorData.documents.length > 0) {
      formData.append('documents', JSON.stringify(mentorData.documents))
    }

    // Append education metadata as JSON string
    if (mentorData.education && Array.isArray(mentorData.education) && mentorData.education.length > 0) {
      formData.append('education', JSON.stringify(mentorData.education))
    }

    console.log('Applying as mentor (logged-in user) with FormData:', {
      firstName: mentorData.firstName,
      lastName: mentorData.lastName,
      hasProfileImage: mentorData.profilePicture instanceof File,
      documentCount: mentorData.mentorDocuments?.length || 0,
      documentsMetadataCount: mentorData.documents?.length || 0,
      educationCount: mentorData.education?.length || 0
    })

    const res = await axiosInstance.post('/api/mentors/apply', formData)
    
    console.log('Mentor application response:', res.data)
    return ok(res.data, res.data?.message || 'Mentor application submitted successfully')
  } catch (error) {
    console.error('Mentor application error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Mentor application failed'), error?.response?.data)
  }
}

/**
 * Register a new mentor (guest registration)
 * @param {Object} mentorData - Mentor registration data
 * @param {File} mentorData.profilePicture - Profile image file
 * @param {File[]} mentorData.mentorDocuments - Array of document files
 * @param {Object[]} mentorData.documents - Array of document metadata
 * @param {Object[]} mentorData.education - Array of education records
 * @returns {Promise<{success: boolean, data: any, message: string}>}
 */
export async function registerMentor(mentorData) {
  try {
    const formData = new FormData()

    // Append profile image
    if (mentorData.profilePicture instanceof File) {
      formData.append('profile_image', mentorData.profilePicture)
    }

    // Append mentor documents (multiple files)
    if (mentorData.mentorDocuments && Array.isArray(mentorData.mentorDocuments)) {
      mentorData.mentorDocuments.forEach((file) => {
        if (file instanceof File) {
          formData.append('mentor_documents', file)
        }
      })
    }

    // Map frontend field names to backend expected names
    // Note: industry and position are now dropdowns with IDs
    const fieldMapping = {
      email: 'email',
      password: 'password',
      firstName: 'first_name',
      lastName: 'last_name',
      phone: 'phone',
      dateOfBirth: 'dob',
      gender: 'gender',
      industry: 'industry_id', // ID from dropdown
      position: 'position_id', // ID from dropdown
      jobTitle: 'job_title',
      expertiseAreas: 'expertise_areas',
      yearsOfExperience: 'experience_years',
      company: 'company_name',
      linkedIn: 'social_media',
      about: 'about_mentor',
    }

    // Append text fields with proper validation
    Object.keys(fieldMapping).forEach((frontendKey) => {
      const backendKey = fieldMapping[frontendKey]
      const value = mentorData[frontendKey]
      
      if (value != null && value !== '') {
        // Normalize email to lowercase for case-insensitive matching
        if (frontendKey === 'email') {
          formData.append(backendKey, value.toLowerCase().trim())
        }
        // Transform gender: "Male" -> "male", "Female" -> "female"
        else if (frontendKey === 'gender') {
          formData.append(backendKey, value.toLowerCase())
        } 
        // Industry and position are now IDs from dropdowns
        else if (frontendKey === 'industry' || frontendKey === 'position') {
          console.log(`📤 [registerMentor] Sending ${backendKey}:`, value);
          formData.append(backendKey, value) // Send as-is (it's already an ID)
        } else {
          formData.append(backendKey, value)
        }
      }
    })

    // Append documents metadata as JSON string
    if (mentorData.documents && Array.isArray(mentorData.documents) && mentorData.documents.length > 0) {
      formData.append('documents', JSON.stringify(mentorData.documents))
    }

    // Append education metadata as JSON string
    if (mentorData.education && Array.isArray(mentorData.education) && mentorData.education.length > 0) {
      formData.append('education', JSON.stringify(mentorData.education))
    }

    console.log('Registering mentor with FormData:', {
      email: mentorData.email,
      firstName: mentorData.firstName,
      lastName: mentorData.lastName,
      hasProfileImage: mentorData.profilePicture instanceof File,
      documentCount: mentorData.mentorDocuments?.length || 0,
      documentsMetadataCount: mentorData.documents?.length || 0,
      educationCount: mentorData.education?.length || 0
    })

    const res = await axiosInstance.post('/api/mentors/register', formData)
    
    console.log('Mentor registration response:', res.data)
    return ok(res.data, res.data?.message || 'Mentor registration successful')
  } catch (error) {
    console.error('Mentor registration error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return fail(getErrorMessage(error, 'Mentor registration failed'), error?.response?.data)
  }
}

