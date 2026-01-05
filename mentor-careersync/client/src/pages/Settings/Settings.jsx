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
    .max(255, 'Social media URL must be less than 255 characters'),
  sessionRate: yup
    .number()
    .nullable()
    .min(0, 'Session rate cannot be negative')
    .max(10000, 'Session rate must be less than 10000'),
  meetingLocation: yup
    .string()
    .trim()
    .nullable()
    .max(255, 'Meeting location must be less than 255 characters'),
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
          companyName: mentor.company_name || mentor.companyName || '',
          experienceYears: mentor.experience_years || mentor.experienceYears || null,
          expertiseAreas: mentor.expertise_areas || mentor.expertiseAreas || '',
          aboutMentor: mentor.about_mentor || mentor.aboutMentor || '',
          socialMedia: mentor.social_media || mentor.socialMedia || '',
          sessionRate: mentor.session_rate || mentor.sessionRate || null,
          meetingLocation: mentor.meeting_location || mentor.meetingLocation || '',
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
    setAccountData((prev) => ({
      ...prev,
      [field]: value,
    }))
    
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
        meetingLocation: (accountData.meetingLocation && accountData.meetingLocation.trim()) || null,
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
          socialMedia: 'Social Media',
          sessionRate: 'Session Rate',
          meetingLocation: 'Meeting Location',
        }
        
        // Show specific error messages with field names
        const errorList = Object.entries(errors).map(([field, message]) => {
          const fieldLabel = fieldNameMap[field] || field;
          return `${fieldLabel}: ${message}`;
        });
        
        if (errorList.length > 0) {
          setError(`Please fix the following errors:\n• ${errorList.join('\n• ')}`)
        } else {
          setError('Please fix the errors in the form')
        }
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
        sessionRate: dataToValidate.sessionRate || null,
        meetingLocation: dataToValidate.meetingLocation || null,
      }

      // Handle position and industry if they're objects (UUIDs, not integers)
      if (accountData.position) {
        const positionId = typeof accountData.position === 'object' 
          ? accountData.position.id 
          : accountData.position
        // Ensure it's a valid UUID string (not a number)
        if (positionId) {
          const positionIdStr = String(positionId).trim()
          // Basic UUID validation
          if (positionIdStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            updateData.position_id = positionIdStr
          }
        }
      }
      if (accountData.industry) {
        const industryId = typeof accountData.industry === 'object' 
          ? accountData.industry.id 
          : accountData.industry
        // Ensure it's a valid UUID string (not a number)
        if (industryId) {
          const industryIdStr = String(industryId).trim()
          // Basic UUID validation
          if (industryIdStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            updateData.industry_id = industryIdStr
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
        sessionRate: mentor.session_rate || mentor.sessionRate || prev.sessionRate,
        meetingLocation: mentor.meeting_location || mentor.meetingLocation || prev.meetingLocation,
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
        sessionRate: refreshedMentor.session_rate || refreshedMentor.sessionRate || prev.sessionRate,
        meetingLocation: refreshedMentor.meeting_location || refreshedMentor.meetingLocation || prev.meetingLocation,
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
          companyName: mentor.company_name || mentor.companyName || '',
          experienceYears: mentor.experience_years || mentor.experienceYears || null,
          expertiseAreas: mentor.expertise_areas || mentor.expertiseAreas || '',
          aboutMentor: mentor.about_mentor || mentor.aboutMentor || '',
          socialMedia: mentor.social_media || mentor.socialMedia || '',
          sessionRate: mentor.session_rate || mentor.sessionRate || null,
          meetingLocation: mentor.meeting_location || mentor.meetingLocation || '',
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
                          label="Session Rate"
                          value={accountData.sessionRate ? `$${accountData.sessionRate}` : ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Meeting Location"
                          value={accountData.meetingLocation || ''}
                          disabled
                          sx={SettingsStyles.textField}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Social Media"
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
                      {accountData.education.map((edu, index) => (
                        <Card key={edu.id || index} sx={{ mb: 2, p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {edu.university_name || edu.institution || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {edu.degree_name || edu.degree} {((edu.field_of_study || edu.fieldOfStudy) && `in ${edu.field_of_study || edu.fieldOfStudy}`)}
                          </Typography>
                          {(edu.year_graduated || edu.yearGraduated) && (
                            <Typography variant="body2" color="text.secondary">
                              Graduated: {edu.year_graduated || edu.yearGraduated}
                            </Typography>
                          )}
                          {(edu.grade_gpa || edu.gradeGpa) && (
                            <Typography variant="body2" color="text.secondary">
                              GPA: {edu.grade_gpa || edu.gradeGpa}
                            </Typography>
                          )}
                        </Card>
                      ))}
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
                    {error && (
                      <Alert 
                        severity="error" 
                        sx={{ mb: 2, whiteSpace: 'pre-line' }} 
                        onClose={() => setError(null)}
                      >
                        {error}
                      </Alert>
                    )}

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
                          <TextField
                            fullWidth
                            label="Position"
                            value={accountData.position?.name || accountData.position || ''}
                            onChange={(e) => handleAccountChange('position', e.target.value)}
                            sx={SettingsStyles.textField}
                            helperText="Enter position name"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Industry"
                            value={accountData.industry?.name || accountData.industry || ''}
                            onChange={(e) => handleAccountChange('industry', e.target.value)}
                            sx={SettingsStyles.textField}
                            helperText="Enter industry name"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Company Name"
                            value={accountData.companyName}
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
                            label="Social Media"
                            value={accountData.socialMedia}
                            onChange={(e) => handleAccountChange('socialMedia', e.target.value)}
                            onBlur={() => handleFieldBlur('socialMedia')}
                            error={!!profileErrors.socialMedia}
                            helperText={profileErrors.socialMedia || 'Enter a valid URL (e.g., https://linkedin.com/in/yourprofile)'}
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

