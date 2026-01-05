import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Grid,
  Link,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  CameraAlt as CameraIcon,
  Visibility,
  VisibilityOff,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  Link as LinkIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import * as yup from 'yup'
import SettingsTabSwitcher from '../../components/Settings/SettingsTabSwitcher'
import { SettingsStyles } from './Settings.styles'
import { getMyMentorProfile, changeMentorPassword, updateMentorProfile } from '../../api/mentorApi'
import axiosInstance from '../../api/axiosInstance'

// Helper function to get base URL for image paths
const getBaseUrl = () => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  const baseURL = axiosInstance.defaults.baseURL || `${API_BASE}/api`;
  return baseURL.replace('/api', '');
}

// Yup validation schemas
const profileValidationSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: yup
    .string()
    .trim()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: yup
    .string()
    .trim()
    .required('Phone number is required')
    .test('phone-format', 'Please enter a valid phone number', function(value) {
      if (!value) return false;
      const trimmed = value.trim();
      // Allow phone numbers starting with +855 (Cambodia country code)
      if (trimmed.startsWith('+855')) {
        // After +855, should have 8-9 digits (total 12-13 characters)
        const digitsAfter = trimmed.replace(/\+855/g, '').replace(/\D/g, '');
        return digitsAfter.length >= 8 && digitsAfter.length <= 9;
      }
      // Allow phone numbers starting with 0 (local format)
      if (trimmed.startsWith('0')) {
        // Should have 9-10 digits total (including the leading 0)
        const digits = trimmed.replace(/\D/g, '');
        return digits.length >= 9 && digits.length <= 10;
      }
      // Allow other formats (international without +855, or other local formats)
      // Must have at least 8 digits
      const digits = trimmed.replace(/\D/g, '');
      return digits.length >= 8 && /^[\d+\-\s()]+$/.test(trimmed);
    }),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null], 'Please select a valid gender'),
  dob: yup
    .string()
    .nullable()
    .required('Date of birth is required')
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value || value.trim() === '') return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  jobTitle: yup
    .string()
    .trim()
    .required('Job title is required')
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title must be less than 100 characters'),
  companyName: yup
    .string()
    .trim()
    .nullable()
    .max(100, 'Company name must be less than 100 characters'),
  experienceYears: yup
    .number()
    .nullable()
    .min(0, 'Experience years cannot be negative')
    .max(50, 'Experience years must be less than 50'),
  expertiseAreas: yup
    .string()
    .trim()
    .nullable()
    .max(500, 'Expertise areas must be less than 500 characters'),
  aboutMentor: yup
    .string()
    .trim()
    .nullable()
    .max(1000, 'About section must be less than 1000 characters'),
  socialMedia: yup
    .string()
    .trim()
    .nullable()
    .test('url-or-empty', 'Please enter a valid URL', function(value) {
      // Allow empty string or null, but if provided, must be valid URL
      if (!value || value.trim() === '') return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    })
    .max(255, 'LinkedIn URL must be less than 255 characters'),
})

const passwordValidationSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required')
    .min(1, 'Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .test('different-password', 'New password must be different from current password', function(value) {
      return value !== this.parent.currentPassword
    }),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
})

function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [industries, setIndustries] = useState([])
  const [positions, setPositions] = useState([])
  const [filteredPositions, setFilteredPositions] = useState([])
  const [loadingIndustries, setLoadingIndustries] = useState(false)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [accountData, setAccountData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dob: '',
    profileImageUrl: null,
    jobTitle: '',
    position: null,
    industry: null,
    companyName: '',
    experienceYears: null,
    expertiseAreas: '',
    aboutMentor: '',
    socialMedia: '',
    education: [],
    documents: [],
    approvalStatus: '',
  })

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Form validation errors
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})

  // Fetch industries and positions
  useEffect(() => {
    const fetchIndustriesAndPositions = async () => {
      try {
        setLoadingIndustries(true)
        setLoadingPositions(true)
        
        // Fetch industries - these are public endpoints (note: plural /industries)
        const industriesResponse = await axiosInstance.get('/industries')
        console.log('Industries response:', industriesResponse.data)
        if (industriesResponse.data && Array.isArray(industriesResponse.data)) {
          setIndustries(industriesResponse.data)
        } else {
          console.warn('Industries data is not an array:', industriesResponse.data)
          setIndustries([])
        }
        
        // Fetch all positions - these are public endpoints (note: plural /positions)
        const positionsResponse = await axiosInstance.get('/positions')
        console.log('Positions response:', positionsResponse.data)
        if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
          setPositions(positionsResponse.data)
        } else {
          console.warn('Positions data is not an array:', positionsResponse.data)
          setPositions([])
        }
      } catch (error) {
        console.error('Error fetching industries/positions:', error)
        console.error('Error details:', error.response?.data || error.message)
        // Set empty arrays on error
        setIndustries([])
        setPositions([])
      } finally {
        setLoadingIndustries(false)
        setLoadingPositions(false)
      }
    }
    
    fetchIndustriesAndPositions()
  }, [])

  // Match industry and position objects when lists are loaded
  // This ensures dropdowns show the correct selected values
  useEffect(() => {
    if (industries.length > 0 && accountData.industry) {
      const industryId = typeof accountData.industry === 'object' && accountData.industry.id
        ? accountData.industry.id
        : typeof accountData.industry === 'string'
          ? accountData.industry
          : null
      
      if (industryId) {
        const matchedIndustry = industries.find(ind => ind.id === industryId)
        // Only update if we found a match and it's different from current
        if (matchedIndustry) {
          const currentId = typeof accountData.industry === 'object' && accountData.industry.id
            ? accountData.industry.id
            : accountData.industry
          
          if (currentId !== matchedIndustry.id || typeof accountData.industry === 'string') {
            setAccountData(prev => ({
              ...prev,
              industry: matchedIndustry
            }))
          }
        }
      }
    }
  }, [industries]) // Only depend on industries, not accountData.industry to avoid loops

  useEffect(() => {
    if (positions.length > 0 && accountData.position) {
      const positionId = typeof accountData.position === 'object' && accountData.position.id
        ? accountData.position.id
        : typeof accountData.position === 'string'
          ? accountData.position
          : null
      
      if (positionId) {
        const matchedPosition = positions.find(pos => pos.id === positionId)
        // Only update if we found a match and it's different from current
        if (matchedPosition) {
          const currentId = typeof accountData.position === 'object' && accountData.position.id
            ? accountData.position.id
            : accountData.position
          
          if (currentId !== matchedPosition.id || typeof accountData.position === 'string') {
            setAccountData(prev => ({
              ...prev,
              position: matchedPosition
            }))
          }
        }
      }
    }
  }, [positions]) // Only depend on positions, not accountData.position to avoid loops

  // Filter positions based on selected industry
  useEffect(() => {
    if (!accountData.industry) {
      setFilteredPositions([])
      return
    }
    
    // Get industry ID (handle both object and string formats)
    const industryId = typeof accountData.industry === 'object' && accountData.industry.id
      ? accountData.industry.id
      : typeof accountData.industry === 'string'
        ? accountData.industry
        : null
    
    if (!industryId || positions.length === 0) {
      setFilteredPositions([])
      return
    }
    
    // Filter positions by industry_id
    const filtered = positions.filter(pos => pos.industry_id === industryId)
    
    // If we have a current position that's not in the filtered list (shouldn't happen, but just in case),
    // add it to the list so it shows up in the dropdown
    if (accountData.position) {
      const currentPositionId = typeof accountData.position === 'object' && accountData.position.id
        ? accountData.position.id
        : typeof accountData.position === 'string'
          ? accountData.position
          : null
      
      if (currentPositionId && !filtered.find(p => p.id === currentPositionId)) {
        // Find the position in the full positions list
        const currentPosition = positions.find(p => p.id === currentPositionId)
        if (currentPosition) {
          filtered.push(currentPosition)
        }
      }
    }
    
    setFilteredPositions(filtered)
  }, [accountData.industry, accountData.position, positions])

  // Fetch mentor profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getMyMentorProfile()
        
        // Handle response structure - backend returns { mentor: {...} } or direct object
        const mentor = response.mentor || response
        
        
        // Build profile image URL if available
        const profileImageUrl = mentor.profile_image 
          ? (mentor.profile_image.startsWith('http') 
              ? mentor.profile_image 
              : `${getBaseUrl()}/uploads/${mentor.profile_image}`)
          : null
        
        // Map all mentor data (handle both snake_case and camelCase)
        // Handle industry and position - ensure they're stored as objects with id for dropdown matching
        const industryData = mentor.Industry || mentor.industry || null
        const positionData = mentor.Position || mentor.position || null
        
        // If industry/position are just IDs, try to find the full objects from fetched lists
        // But if they're already objects, keep them as is
        let finalIndustry = industryData
        let finalPosition = positionData
        
        // If industry is just an ID string, we'll need to wait for industries to load
        // For now, store it as is - the useEffect will handle matching when industries load
        if (industryData && typeof industryData === 'string') {
          // It's just an ID, we'll match it when industries are loaded
          finalIndustry = industryData
        } else if (industryData && industryData.id) {
          // It's already an object with id, keep it
          finalIndustry = industryData
        }
        
        if (positionData && typeof positionData === 'string') {
          // It's just an ID, we'll match it when positions load
          finalPosition = positionData
        } else if (positionData && positionData.id) {
          // It's already an object with id, keep it
          finalPosition = positionData
        }
        
        setAccountData({
          firstName: mentor.first_name || mentor.firstName || '',
          lastName: mentor.last_name || mentor.lastName || '',
          email: mentor.User?.email || mentor.email || '',
          phoneNumber: mentor.phone || mentor.phoneNumber || '',
          gender: mentor.gender || '',
          dob: mentor.dob || '',
          profileImageUrl: profileImageUrl,
          jobTitle: mentor.job_title || mentor.jobTitle || '',
          position: finalPosition,
          industry: finalIndustry,
          companyName: mentor.company_name || mentor.companyName || null,
          experienceYears: mentor.experience_years || mentor.experienceYears || null,
          expertiseAreas: mentor.expertise_areas || mentor.expertiseAreas || '',
          aboutMentor: mentor.about_mentor || mentor.aboutMentor || '',
          socialMedia: mentor.social_media || mentor.socialMedia || '',
          sessionAgendaPdf: mentor.session_agenda_pdf || mentor.sessionAgendaPdf || null,
          portfolioPdf: mentor.portfolio_pdf || mentor.portfolioPdf || null,
          education: mentor.MentorEducations || mentor.education || [],
          documents: mentor.MentorDocuments || mentor.documents || [],
          approvalStatus: mentor.approval_status || mentor.approvalStatus || '',
        })
        setImagePreview(profileImageUrl)
      } catch (err) {
        setError('Failed to load profile data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setIsEditMode(false)
  }

  const handleAccountChange = async (field, value) => {
    // If industry changes, clear position selection
    if (field === 'industry') {
      setAccountData((prev) => ({
        ...prev,
        [field]: value,
        position: null, // Clear position when industry changes
      }))
    } else {
      setAccountData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
    
    // Validate field on change if it's been touched
    if (touchedFields[field] || isEditMode) {
      try {
        await profileValidationSchema.validateAt(field, {
          ...accountData,
          [field]: value,
        })
        // Clear error if validation passes
        setProfileErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      } catch (err) {
        setProfileErrors((prev) => ({
          ...prev,
          [field]: err.message,
        }))
      }
    }
  }
  
  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }))
  }

  const handleSecurityChange = async (field, value) => {
    setSecurityData((prev) => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear password error when user types
    if (passwordError) {
      setPasswordError(null)
    }
    
    // Validate field on change
    try {
      await passwordValidationSchema.validateAt(field, {
        ...securityData,
        [field]: value,
      })
      // Clear error if validation passes
      setPasswordErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    } catch (err) {
      setPasswordErrors((prev) => ({
        ...prev,
        [field]: err.message,
      }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(null)
      setProfileErrors({})
      
      // Prepare data for validation - normalize empty strings to null for optional fields
      const dataToValidate = {
        ...accountData,
        // Normalize empty strings to null for optional fields
        socialMedia: (accountData.socialMedia && accountData.socialMedia.trim()) || null,
        companyName: (accountData.companyName && accountData.companyName.trim()) || null,
        expertiseAreas: (accountData.expertiseAreas && accountData.expertiseAreas.trim()) || null,
        aboutMentor: (accountData.aboutMentor && accountData.aboutMentor.trim()) || null,
        // Normalize gender: empty string to null
        gender: (accountData.gender && accountData.gender.trim()) || null,
        // Normalize dob: empty string to null, but keep valid dates
        dob: (accountData.dob && accountData.dob.trim()) || null,
      }
      
      // Validate all fields
      try {
        await profileValidationSchema.validate(dataToValidate, { abortEarly: false })
      } catch (validationError) {
        const errors = {}
        validationError.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message
          }
        })
        setProfileErrors(errors)
        
        // Map field names to user-friendly labels
        const fieldNameMap = {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email Address',
          phoneNumber: 'Phone Number',
          gender: 'Gender',
          dob: 'Date of Birth',
          jobTitle: 'Job Title',
          companyName: 'Company Name',
          experienceYears: 'Years of Experience',
          expertiseAreas: 'Expertise Areas',
          aboutMentor: 'About Mentor',
          socialMedia: 'LinkedIn',
        }
        
        // Store errors in a structured format for better UI display
        const errorList = Object.entries(errors).map(([field, message]) => ({
          field,
          fieldLabel: fieldNameMap[field] || field,
          message
        }));
        
        // Set error as structured data (we'll handle display in the UI)
        setError(JSON.stringify({ type: 'validation', errors: errorList }))
        setSaving(false)
        return
      }

      // Prepare data for API - include all fields (use validated data)
      const updateData = {
        firstName: dataToValidate.firstName || '',
        lastName: dataToValidate.lastName || '',
        email: dataToValidate.email || '',
        phoneNumber: dataToValidate.phoneNumber || '',
        gender: dataToValidate.gender || '',
        dob: dataToValidate.dob || '',
        jobTitle: dataToValidate.jobTitle || '',
        companyName: dataToValidate.companyName || null,
        experienceYears: dataToValidate.experienceYears || null,
        expertiseAreas: dataToValidate.expertiseAreas || null,
        aboutMentor: dataToValidate.aboutMentor || null,
        socialMedia: dataToValidate.socialMedia || null,
      }

      // Handle position and industry IDs
      if (accountData.position) {
        const positionId = typeof accountData.position === 'object' && accountData.position.id
          ? accountData.position.id 
          : typeof accountData.position === 'string'
            ? accountData.position
            : accountData.position
        // Ensure it's a valid UUID string
        if (positionId) {
          const positionIdStr = String(positionId).trim()
          // Basic UUID validation
          if (positionIdStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            updateData.position_id = positionIdStr
          } else {
            console.warn('Invalid position_id format:', positionIdStr)
          }
        }
      }
      if (accountData.industry) {
        const industryId = typeof accountData.industry === 'object' && accountData.industry.id
          ? accountData.industry.id 
          : typeof accountData.industry === 'string'
            ? accountData.industry
            : accountData.industry
        // Ensure it's a valid UUID string
        if (industryId) {
          const industryIdStr = String(industryId).trim()
          // Basic UUID validation
          if (industryIdStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            updateData.industry_id = industryIdStr
          } else {
            console.warn('Invalid industry_id format:', industryIdStr)
          }
        }
      }

      // Call API to update profile
      const response = await updateMentorProfile(updateData, selectedImage)

      // Handle response - backend returns { mentor: {...} } or direct object
      const mentor = response.mentor || response

      // Build profile image URL if available
      const profileImageUrl = mentor.profile_image 
        ? (mentor.profile_image.startsWith('http') 
            ? mentor.profile_image 
            : `${getBaseUrl()}/uploads/${mentor.profile_image}`)
        : accountData.profileImageUrl

      // Update local state with response (handle both snake_case and camelCase)
      setAccountData((prev) => ({
        ...prev,
        firstName: mentor.first_name || mentor.firstName || prev.firstName,
        lastName: mentor.last_name || mentor.lastName || prev.lastName,
        email: mentor.User?.email || mentor.email || prev.email,
        phoneNumber: mentor.phone || mentor.phoneNumber || prev.phoneNumber,
        gender: mentor.gender || prev.gender,
        dob: mentor.dob || prev.dob,
        profileImageUrl: profileImageUrl,
        jobTitle: mentor.job_title || mentor.jobTitle || prev.jobTitle,
        position: mentor.Position || mentor.position || prev.position,
        industry: mentor.Industry || mentor.industry || prev.industry,
        companyName: mentor.company_name || mentor.companyName || prev.companyName,
        experienceYears: mentor.experience_years || mentor.experienceYears || prev.experienceYears,
        expertiseAreas: mentor.expertise_areas || mentor.expertiseAreas || prev.expertiseAreas,
        aboutMentor: mentor.about_mentor || mentor.aboutMentor || prev.aboutMentor,
        socialMedia: mentor.social_media || mentor.socialMedia || prev.socialMedia,
        education: mentor.MentorEducations || mentor.education || prev.education,
        documents: mentor.MentorDocuments || mentor.documents || prev.documents,
      }))

      // Reset image state and update preview
      setSelectedImage(null)
      setImagePreview(profileImageUrl)
      setIsEditMode(false)
      setSaveSuccess('Profile updated successfully!')

      // Update localStorage with new profile image so Navbar can refresh
      try {
        const { getUserData, setUserData } = await import('../../utils/auth')
        const userData = getUserData()
        if (userData) {
          if (userData.Mentor) {
            userData.Mentor.profile_image = mentor.profile_image || userData.Mentor.profile_image
            userData.Mentor.first_name = mentor.first_name || mentor.firstName || userData.Mentor.first_name
            userData.Mentor.last_name = mentor.last_name || mentor.lastName || userData.Mentor.last_name
          }
          setUserData(userData)
          // Dispatch custom event to notify Navbar
          window.dispatchEvent(new CustomEvent('profileUpdated'))
        }
      } catch (err) {
        console.warn('Failed to update localStorage:', err)
      }

      // Refresh profile data from server to ensure consistency
      const refreshResponse = await getMyMentorProfile()
      const refreshedMentor = refreshResponse.mentor || refreshResponse
      const refreshedImageUrl = refreshedMentor.profile_image 
        ? (refreshedMentor.profile_image.startsWith('http') 
            ? refreshedMentor.profile_image 
            : `${getBaseUrl()}/uploads/${refreshedMentor.profile_image}`)
        : null

      setAccountData((prev) => ({
        ...prev,
        firstName: refreshedMentor.first_name || refreshedMentor.firstName || prev.firstName,
        lastName: refreshedMentor.last_name || refreshedMentor.lastName || prev.lastName,
        email: refreshedMentor.User?.email || refreshedMentor.email || prev.email,
        phoneNumber: refreshedMentor.phone || refreshedMentor.phoneNumber || prev.phoneNumber,
        gender: refreshedMentor.gender || prev.gender,
        dob: refreshedMentor.dob || prev.dob,
        profileImageUrl: refreshedImageUrl,
        jobTitle: refreshedMentor.job_title || refreshedMentor.jobTitle || prev.jobTitle,
        position: refreshedMentor.Position || refreshedMentor.position || prev.position,
        industry: refreshedMentor.Industry || refreshedMentor.industry || prev.industry,
        companyName: refreshedMentor.company_name || refreshedMentor.companyName || prev.companyName,
        experienceYears: refreshedMentor.experience_years || refreshedMentor.experienceYears || prev.experienceYears,
        expertiseAreas: refreshedMentor.expertise_areas || refreshedMentor.expertiseAreas || prev.expertiseAreas,
        aboutMentor: refreshedMentor.about_mentor || refreshedMentor.aboutMentor || prev.aboutMentor,
        socialMedia: refreshedMentor.social_media || refreshedMentor.socialMedia || prev.socialMedia,
        education: refreshedMentor.MentorEducations || refreshedMentor.education || prev.education,
        documents: refreshedMentor.MentorDocuments || refreshedMentor.documents || prev.documents,
      }))
      setImagePreview(refreshedImageUrl)

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(null)
      }, 5000)
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reload original data
    const fetchProfile = async () => {
      try {
        const response = await getMyMentorProfile()
        const mentor = response.mentor || response
        
        const profileImageUrl = mentor.profile_image 
          ? (mentor.profile_image.startsWith('http') 
              ? mentor.profile_image 
              : `${getBaseUrl()}/uploads/${mentor.profile_image}`)
          : null
        
        setAccountData({
          firstName: mentor.first_name || mentor.firstName || '',
          lastName: mentor.last_name || mentor.lastName || '',
          email: mentor.User?.email || mentor.email || '',
          phoneNumber: mentor.phone || mentor.phoneNumber || '',
          gender: mentor.gender || '',
          dob: mentor.dob || '',
          profileImageUrl: profileImageUrl,
          jobTitle: mentor.job_title || mentor.jobTitle || '',
          position: mentor.Position || mentor.position || null,
          industry: mentor.Industry || mentor.industry || null,
          companyName: mentor.company_name || mentor.companyName || null,
          experienceYears: mentor.experience_years || mentor.experienceYears || null,
          expertiseAreas: mentor.expertise_areas || mentor.expertiseAreas || '',
          aboutMentor: mentor.about_mentor || mentor.aboutMentor || '',
          socialMedia: mentor.social_media || mentor.socialMedia || '',
          sessionAgendaPdf: mentor.session_agenda_pdf || mentor.sessionAgendaPdf || null,
          portfolioPdf: mentor.portfolio_pdf || mentor.portfolioPdf || null,
          education: mentor.MentorEducations || mentor.education || [],
          documents: mentor.MentorDocuments || mentor.documents || [],
          approvalStatus: mentor.approval_status || mentor.approvalStatus || '',
        })
        setSelectedImage(null)
        setImagePreview(profileImageUrl)
      } catch (err) {
        // Silently handle error
      }
    }
    fetchProfile()
    setIsEditMode(false)
  }

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or GIF)')
      return
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Image size must be less than 2MB')
      return
    }

    setSelectedImage(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdatePassword = async () => {
    // Clear previous errors
    setPasswordError(null)
    setPasswordSuccess(null)
    setPasswordErrors({})
    
    // Validate using Yup
    try {
      await passwordValidationSchema.validate(securityData, { abortEarly: false })
    } catch (validationError) {
      const errors = {}
      validationError.inner.forEach((err) => {
        if (err.path) {
          errors[err.path] = err.message
        }
      })
      setPasswordErrors(errors)
      
      // Show first error message
      const firstError = validationError.inner[0]
      if (firstError) {
        setPasswordError(firstError.message)
      }
      return
    }
    
    try {
      setPasswordLoading(true)
      setPasswordError(null)
      setPasswordSuccess(null)
      
      await changeMentorPassword(securityData.currentPassword.trim(), securityData.newPassword.trim())
      setPasswordSuccess('Password changed successfully!')
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordErrors({})
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess(null)
      }, 5000)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password. Please try again.'
      setPasswordError(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
  }

  const passwordRequirements = [
    'At least 8 characters long',
    'Contains uppercase and lowercase letters',
    'Contains at least one number',
    'Contains at least one special character',
  ]

  return (
    <Box sx={SettingsStyles.container}>
      <Card sx={SettingsStyles.card}>
        <CardContent sx={SettingsStyles.cardContent}>
          <Box sx={SettingsStyles.tabsContainer}>
            <SettingsTabSwitcher
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </Box>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : !isEditMode ? (
                <>
                  <Box sx={SettingsStyles.sectionHeader}>
                    <Box>
                      <Typography variant="h6" sx={SettingsStyles.sectionTitle}>
                        Profile Information
                      </Typography>
                      <Typography variant="body2" sx={SettingsStyles.sectionSubtitle}>
                        View your complete profile details
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      sx={SettingsStyles.editButton}
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit Profile
                    </Button>
                  </Box>

                  {/* Profile Picture */}
                  <Box sx={SettingsStyles.profileSection}>
                    <Avatar 
                      src={accountData.profileImageUrl} 
                      sx={SettingsStyles.profileAvatar}
                    >
                      {accountData.firstName?.[0] || accountData.lastName?.[0] || 'M'}
                    </Avatar>
                    <Box sx={SettingsStyles.profileInfo}>
                      <Typography variant="body1" sx={SettingsStyles.profileLabel}>
                        Profile Picture
                      </Typography>
                      <Typography variant="body2" sx={SettingsStyles.profileSubtext}>
                        {accountData.profileImageUrl ? 'Your current profile picture' : 'No profile picture uploaded'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Basic Information */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon /> Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          value={accountData.firstName || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          value={accountData.lastName || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          value={accountData.email || ''}
                          disabled
                          sx={SettingsStyles.textField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon sx={SettingsStyles.inputIcon} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={accountData.phoneNumber || ''}
                          disabled
                          sx={SettingsStyles.textField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon sx={SettingsStyles.inputIcon} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Gender"
                          value={accountData.gender || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          value={accountData.dob ? new Date(accountData.dob).toLocaleDateString() : ''}
                          disabled
                          sx={SettingsStyles.textField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon sx={SettingsStyles.inputIcon} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Professional Information */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon /> Professional Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Job Title"
                          value={accountData.jobTitle || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Position"
                          value={accountData.position?.position_name || accountData.position?.name || accountData.position || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Industry"
                          value={accountData.industry?.industry_name || accountData.industry?.name || accountData.industry || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Company Name"
                          value={accountData.companyName || ''}
                          disabled
                          sx={SettingsStyles.textField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon sx={SettingsStyles.inputIcon} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Years of Experience"
                          value={accountData.experienceYears ? `${accountData.experienceYears} years` : ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="LinkedIn"
                          value={accountData.socialMedia || ''}
                          disabled
                          sx={SettingsStyles.textField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LinkIcon sx={SettingsStyles.inputIcon} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Expertise Areas"
                          value={accountData.expertiseAreas || ''}
                          disabled
                          multiline
                          rows={3}
                          sx={SettingsStyles.textField}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <StarIcon sx={SettingsStyles.inputIcon} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="About Me"
                          value={accountData.aboutMentor || ''}
                          disabled
                          multiline
                          rows={4}
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Education */}
                  {accountData.education && accountData.education.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon /> Education
                      </Typography>
                      <Box sx={{ position: 'relative', pl: 3 }}>
                        {/* Timeline line */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '7px',
                            top: '20px',
                            bottom: '20px',
                            width: '2px',
                            bgcolor: '#030C2B',
                          }}
                        />
                        {/* Sort education: Bachelor's first, then Master's, then higher degrees */}
                        {(() => {
                          const sortedEducation = [...accountData.education].sort((a, b) => {
                            const getDegreeLevel = (degreeName) => {
                              if (!degreeName) return 999;
                              const degree = (degreeName || '').toLowerCase();
                              if (degree.includes('bachelor') || degree.includes('b.s') || degree.includes('b.a') || degree.includes('b.eng') || degree.includes('bsc') || degree.includes('ba')) return 1;
                              if (degree.includes('master') || degree.includes('m.s') || degree.includes('m.a') || degree.includes('m.eng') || degree.includes('msc') || degree.includes('ma') || degree.includes('mba')) return 2;
                              if (degree.includes('phd') || degree.includes('doctorate') || degree.includes('d.phil')) return 3;
                              if (degree.includes('associate') || degree.includes('a.s') || degree.includes('aa')) return 0;
                              return 999;
                            };
                            const degreeA = a.degree_name || a.degree || '';
                            const degreeB = b.degree_name || b.degree || '';
                            return getDegreeLevel(degreeA) - getDegreeLevel(degreeB);
                          });
                          
                          return sortedEducation.map((edu, index) => (
                            <Box key={edu.id || index} sx={{ position: 'relative', pb: index < sortedEducation.length - 1 ? 3 : 0, display: 'flex', alignItems: 'flex-start' }}>
                              {/* Timeline dot */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: '-19px',
                                  top: '0.35em', // Center with first line of text (approximately half of line height)
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  bgcolor: '#030C2B',
                                  border: '3px solid #fff',
                                  zIndex: 1,
                                  transform: 'translateY(-50%)', // Center vertically
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" fontWeight={600} sx={{ color: '#666666', mb: 0.5, lineHeight: 1.5 }}>
                                  {edu.degree_name || edu.degree || 'Degree'}
                                  {(edu.year_graduated || edu.yearGraduated) && (
                                    <>
                                      {' • '}
                                      <Box component="span" sx={{ fontWeight: 400 }}>{edu.year_graduated || edu.yearGraduated}</Box>
                                    </>
                                  )}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#666666', pl: 1, lineHeight: 1.5 }}>
                                  {edu.university_name || edu.institution || 'Institution'}
                                </Typography>
                              </Box>
                            </Box>
                          ));
                        })()}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 3 }} />

                  {/* Documents */}
                  {accountData.documents && accountData.documents.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon /> Documents
                      </Typography>
                      {accountData.documents.map((doc, index) => (
                        <Box key={doc.id || index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {doc.document_type || doc.documentType || 'Document'}
                          </Typography>
                          {(doc.document_url || doc.documentUrl) && (
                            <Link href={doc.document_url || doc.documentUrl} target="_blank" rel="noopener noreferrer">
                              View Document
                            </Link>
                          )}
                          {(doc.created_at || doc.uploadedAt) && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                              Uploaded: {new Date(doc.created_at || doc.uploadedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Approval Status */}
                  {accountData.approvalStatus && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Approval Status:
                      </Typography>
                      <Chip 
                        label={accountData.approvalStatus.toUpperCase()} 
                        color={
                          accountData.approvalStatus === 'accepted' ? 'success' :
                          accountData.approvalStatus === 'rejected' ? 'error' : 'warning'
                        }
                      />
                    </Box>
                  )}
                </>
              ) : (
                  <>
                    <Box sx={SettingsStyles.sectionHeader}>
                      <Box>
                        <Typography variant="h6" sx={SettingsStyles.sectionTitle}>
                          Edit Profile
                        </Typography>
                        <Typography variant="body2" sx={SettingsStyles.sectionSubtitle}>
                          Update your account information and profile details
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={SettingsStyles.profileEditSection}>
                      <Box sx={SettingsStyles.profilePictureSection}>
                        <Typography variant="body1" sx={SettingsStyles.profileLabel}>
                          Profile Picture
                        </Typography>
                        <Box sx={SettingsStyles.profilePictureContainer}>
                          <Box sx={SettingsStyles.avatarWrapper}>
                            <Avatar 
                              src={imagePreview || accountData.profileImageUrl} 
                              sx={SettingsStyles.profileAvatar}
                            >
                              {accountData.firstName?.[0] || accountData.lastName?.[0] || 'M'}
                            </Avatar>
                            <IconButton
                              sx={SettingsStyles.cameraButton}
                              component="label"
                              aria-label="upload picture"
                            >
                              <CameraIcon />
                              <input 
                                type="file" 
                                hidden 
                                accept="image/*" 
                                onChange={handleImageSelect}
                              />
                            </IconButton>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            component="label"
                            sx={SettingsStyles.uploadButton}
                          >
                            Upload New Picture
                            <input 
                              type="file" 
                              hidden 
                              accept="image/*" 
                              onChange={handleImageSelect}
                            />
                          </Button>
                          <Typography variant="caption" sx={SettingsStyles.uploadHint}>
                            JPG, PNG or GIF. Max size 2MB.
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Success/Error Alerts */}
                    {saveSuccess && (
                      <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(null)}>
                        {saveSuccess}
                      </Alert>
                    )}
                    {error && (() => {
                      // Try to parse error as structured data, otherwise treat as string
                      let errorData;
                      try {
                        errorData = JSON.parse(error);
                      } catch {
                        errorData = { type: 'simple', message: error };
                      }

                      // If it's validation errors, show friendly UI
                      if (errorData.type === 'validation' && errorData.errors) {
                        return (
                          <Box
                            sx={{
                              mb: 3,
                              p: 2.5,
                              borderRadius: 2,
                              backgroundColor: '#fff3cd',
                              border: '1px solid #ffc107',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              position: 'relative',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <ErrorOutlineIcon 
                                sx={{ 
                                  color: '#ff9800', 
                                  mr: 1.5, 
                                  fontSize: 28 
                                }} 
                              />
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  color: '#856404',
                                  fontWeight: 600,
                                  fontSize: '1.1rem'
                                }}
                              >
                                Please fix the following fields:
                              </Typography>
                            </Box>
                            <Box 
                              component="ul" 
                              sx={{ 
                                m: 0, 
                                pl: 3,
                                '& li': {
                                  mb: 1.5,
                                  color: '#856404',
                                  fontSize: '0.95rem',
                                  lineHeight: 1.6,
                                }
                              }}
                            >
                              {errorData.errors.map((err, index) => (
                                <li key={index}>
                                  <Box component="span" sx={{ fontWeight: 600 }}>
                                    {err.fieldLabel}
                                  </Box>
                                  <Box component="span" sx={{ ml: 1 }}>
                                    - {err.message}
                                  </Box>
                                </li>
                              ))}
                            </Box>
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,193,7,0.3)' }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#856404',
                                  fontStyle: 'italic',
                                  fontSize: '0.875rem'
                                }}
                              >
                                💡 Tip: Check the fields highlighted in red below and fix the errors to continue.
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => setError(null)}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: '#856404',
                                '&:hover': {
                                  backgroundColor: 'rgba(255,193,7,0.2)',
                                }
                              }}
                              size="small"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        );
                      }

                      // Simple error message
                      return (
                        <Alert 
                          severity="error" 
                          sx={{ 
                            mb: 2,
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                              fontSize: '0.95rem'
                            }
                          }} 
                          onClose={() => setError(null)}
                          icon={<ErrorOutlineIcon />}
                        >
                          {errorData.message || error}
                        </Alert>
                      );
                    })()}

                    {/* Basic Information */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon /> Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name *"
                            value={accountData.firstName}
                            onChange={(e) => handleAccountChange('firstName', e.target.value)}
                            onBlur={() => handleFieldBlur('firstName')}
                            error={!!profileErrors.firstName}
                            helperText={profileErrors.firstName}
                            sx={SettingsStyles.textField}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name *"
                            value={accountData.lastName}
                            onChange={(e) => handleAccountChange('lastName', e.target.value)}
                            onBlur={() => handleFieldBlur('lastName')}
                            error={!!profileErrors.lastName}
                            helperText={profileErrors.lastName}
                            sx={SettingsStyles.textField}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email Address *"
                            type="email"
                            value={accountData.email}
                            onChange={(e) => handleAccountChange('email', e.target.value)}
                            onBlur={() => handleFieldBlur('email')}
                            error={!!profileErrors.email}
                            helperText={profileErrors.email}
                            sx={SettingsStyles.textField}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon sx={SettingsStyles.inputIcon} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone Number *"
                            value={accountData.phoneNumber}
                            onChange={(e) => handleAccountChange('phoneNumber', e.target.value)}
                            onBlur={() => handleFieldBlur('phoneNumber')}
                            error={!!profileErrors.phoneNumber}
                            helperText={profileErrors.phoneNumber}
                            sx={SettingsStyles.textField}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon sx={SettingsStyles.inputIcon} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Gender"
                            value={accountData.gender || ''}
                            onChange={(e) => handleAccountChange('gender', e.target.value)}
                            onBlur={() => handleFieldBlur('gender')}
                            error={!!profileErrors.gender}
                            helperText={profileErrors.gender}
                            sx={SettingsStyles.textField}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Date of Birth *"
                            type="date"
                            value={accountData.dob ? accountData.dob.split('T')[0] : ''}
                            onChange={(e) => handleAccountChange('dob', e.target.value)}
                            onBlur={() => handleFieldBlur('dob')}
                            error={!!profileErrors.dob}
                            helperText={profileErrors.dob}
                            sx={SettingsStyles.textField}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarIcon sx={SettingsStyles.inputIcon} />
                                </InputAdornment>
                              ),
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Professional Information */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon /> Professional Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Job Title"
                            value={accountData.jobTitle}
                            onChange={(e) => handleAccountChange('jobTitle', e.target.value)}
                            onBlur={() => handleFieldBlur('jobTitle')}
                            error={!!profileErrors.jobTitle}
                            helperText={profileErrors.jobTitle}
                            sx={SettingsStyles.textField}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth sx={SettingsStyles.textField}>
                            <InputLabel id="industry-select-label">Industry *</InputLabel>
                            <Select
                              labelId="industry-select-label"
                              id="industry-select"
                              value={
                                accountData.industry?.id || 
                                (typeof accountData.industry === 'string' ? accountData.industry : '') || 
                                ''
                              }
                              label="Industry *"
                              onChange={(e) => {
                                const selectedIndustry = industries.find(ind => ind.id === e.target.value)
                                handleAccountChange('industry', selectedIndustry || e.target.value)
                              }}
                              onBlur={() => handleFieldBlur('industry')}
                              error={!!profileErrors.industry}
                              disabled={loadingIndustries}
                            >
                              <MenuItem value="">
                                <em>Select Industry</em>
                              </MenuItem>
                              {industries.map((industry) => (
                                <MenuItem key={industry.id} value={industry.id}>
                                  {industry.industry_name}
                                </MenuItem>
                              ))}
                            </Select>
                            {profileErrors.industry && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                {profileErrors.industry}
                              </Typography>
                            )}
                            {!profileErrors.industry && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                                Select your industry
                              </Typography>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth sx={SettingsStyles.textField}>
                            <InputLabel id="position-select-label">Position *</InputLabel>
                            <Select
                              labelId="position-select-label"
                              id="position-select"
                              value={
                                accountData.position?.id || 
                                (typeof accountData.position === 'string' ? accountData.position : '') || 
                                ''
                              }
                              label="Position *"
                              onChange={(e) => {
                                const selectedPosition = filteredPositions.find(pos => pos.id === e.target.value)
                                handleAccountChange('position', selectedPosition || e.target.value)
                              }}
                              onBlur={() => handleFieldBlur('position')}
                              error={!!profileErrors.position}
                              disabled={!accountData.industry || loadingPositions}
                            >
                              <MenuItem value="">
                                <em>
                                  {!accountData.industry 
                                    ? 'Select Industry first' 
                                    : filteredPositions.length === 0 
                                      ? 'No positions available' 
                                      : 'Select Position'}
                                </em>
                              </MenuItem>
                              {filteredPositions.map((position) => (
                                <MenuItem key={position.id} value={position.id}>
                                  {position.position_name}
                                </MenuItem>
                              ))}
                            </Select>
                            {profileErrors.position && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                {profileErrors.position}
                              </Typography>
                            )}
                            {!profileErrors.position && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                                {!accountData.industry 
                                  ? 'Please select an industry first' 
                                  : 'Select your position'}
                              </Typography>
                            )}
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Company Name"
                            value={accountData.companyName || ''}
                            onChange={(e) => handleAccountChange('companyName', e.target.value)}
                            onBlur={() => handleFieldBlur('companyName')}
                            error={!!profileErrors.companyName}
                            helperText={profileErrors.companyName}
                            sx={SettingsStyles.textField}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BusinessIcon sx={SettingsStyles.inputIcon} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Years of Experience"
                            type="number"
                            value={accountData.experienceYears || ''}
                            onChange={(e) => handleAccountChange('experienceYears', parseInt(e.target.value) || null)}
                            sx={SettingsStyles.textField}
                            inputProps={{ min: 0 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="LinkedIn"
                            value={accountData.socialMedia}
                            onChange={(e) => handleAccountChange('socialMedia', e.target.value)}
                            onBlur={() => handleFieldBlur('socialMedia')}
                            error={!!profileErrors.socialMedia}
                            helperText={profileErrors.socialMedia || 'Enter your LinkedIn profile URL (e.g., https://linkedin.com/in/yourprofile)'}
                            sx={SettingsStyles.textField}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkIcon sx={SettingsStyles.inputIcon} />
                                </InputAdornment>
                              ),
                            }}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Expertise Areas"
                            value={accountData.expertiseAreas}
                            onChange={(e) => handleAccountChange('expertiseAreas', e.target.value)}
                            multiline
                            rows={3}
                            sx={SettingsStyles.textField}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <StarIcon sx={SettingsStyles.inputIcon} />
                                </InputAdornment>
                              ),
                            }}
                            placeholder="Enter your areas of expertise"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="About Me"
                            value={accountData.aboutMentor}
                            onChange={(e) => handleAccountChange('aboutMentor', e.target.value)}
                            multiline
                            rows={4}
                            sx={SettingsStyles.textField}
                            placeholder="Tell us about yourself"
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={SettingsStyles.actions}>
                      <Button
                        variant="outlined"
                        sx={SettingsStyles.cancelButton}
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        sx={SettingsStyles.saveButton}
                        onClick={handleSaveChanges}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : null}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </>
                )}
            </Box>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Box>
              <Box sx={SettingsStyles.securityHeader}>
                <img 
                  src="/security-setting.svg" 
                  alt="Security Settings" 
                  style={{ width: '48px', height: '48px', marginTop: '4px' }}
                />
                <Box>
                  <Typography variant="h6" sx={SettingsStyles.sectionTitle}>
                    Security Settings
                  </Typography>
                  <Typography variant="body2" sx={SettingsStyles.sectionSubtitle}>
                    Manage your password and security preferences
                  </Typography>
                </Box>
              </Box>

              {/* Error Alert */}
              {passwordError && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2, mt: 2 }} 
                  onClose={() => setPasswordError(null)}
                >
                  {passwordError}
                </Alert>
              )}

              {/* Success Alert */}
              {passwordSuccess && (
                <Alert 
                  severity="success" 
                  sx={{ mb: 2, mt: 2 }} 
                  onClose={() => setPasswordSuccess(null)}
                >
                  {passwordSuccess}
                </Alert>
              )}

              <Box sx={SettingsStyles.passwordSection}>
                <Box sx={SettingsStyles.passwordSectionHeader}>
                  <img 
                    src="/change-password.svg" 
                    alt="Change Password" 
                    style={{ width: '24px', height: '24px' }}
                  />
                  <Typography variant="h6" sx={SettingsStyles.passwordTitle}>
                    Change Password
                  </Typography>
                </Box>

                <Box sx={SettingsStyles.formSection}>
                  <TextField
                    fullWidth
                    label="Current Password *"
                    placeholder="Enter your current password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={securityData.currentPassword}
                    onChange={(e) => {
                      handleSecurityChange('currentPassword', e.target.value)
                      setPasswordError(null)
                    }}
                    sx={SettingsStyles.textField}
                    disabled={passwordLoading}
                    error={!!passwordErrors.currentPassword || (!!passwordError && passwordError.includes('Current password'))}
                    helperText={passwordErrors.currentPassword}
                    required
                    autoComplete="current-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={SettingsStyles.inputIcon} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                            disabled={passwordLoading}
                            aria-label="toggle password visibility"
                          >
                            {showPasswords.current ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="New Password *"
                    placeholder="Enter your new password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={securityData.newPassword}
                    onChange={(e) => {
                      handleSecurityChange('newPassword', e.target.value)
                      setPasswordError(null)
                    }}
                    sx={SettingsStyles.textField}
                    disabled={passwordLoading}
                    error={!!passwordErrors.newPassword || (!!passwordError && (passwordError.includes('New password') || passwordError.includes('at least 8')))}
                    helperText={passwordErrors.newPassword || 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'}
                    required
                    autoComplete="new-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={SettingsStyles.inputIcon} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                            disabled={passwordLoading}
                            aria-label="toggle password visibility"
                          >
                            {showPasswords.new ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm New Password *"
                    placeholder="Confirm your new password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={securityData.confirmPassword}
                    onChange={(e) => {
                      handleSecurityChange('confirmPassword', e.target.value)
                      setPasswordError(null)
                    }}
                    sx={SettingsStyles.textField}
                    disabled={passwordLoading}
                    error={!!passwordErrors.confirmPassword || (!!passwordError && passwordError.includes('do not match'))}
                    helperText={passwordErrors.confirmPassword || (passwordError && passwordError.includes('do not match') ? passwordError : '')}
                    required
                    autoComplete="new-password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={SettingsStyles.inputIcon} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            edge="end"
                            disabled={passwordLoading}
                            aria-label="toggle password visibility"
                          >
                            {showPasswords.confirm ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={SettingsStyles.passwordRequirements}>
                  <Typography variant="body2" sx={SettingsStyles.requirementsTitle}>
                    Password Requirements:
                  </Typography>
                  <List dense sx={SettingsStyles.requirementsList}>
                    {passwordRequirements.map((requirement, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon sx={SettingsStyles.bulletIcon}>
                          <Box sx={SettingsStyles.bullet} />
                        </ListItemIcon>
                        <ListItemText
                          primary={requirement}
                          sx={SettingsStyles.requirementText}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box sx={SettingsStyles.actions}>
                  <Button
                    variant="outlined"
                    sx={SettingsStyles.cancelButton}
                    onClick={() => {
                      setSecurityData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setPasswordError(null)
                      setPasswordSuccess(null)
                    }}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    sx={SettingsStyles.updateButton}
                    onClick={handleUpdatePassword}
                    disabled={passwordLoading}
                    startIcon={passwordLoading ? <CircularProgress size={20} /> : null}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Settings

