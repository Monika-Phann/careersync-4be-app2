import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Business as BusinessIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import SessionAgendaModal from '../../components/Modals/SessionAgendaModal'
import { SessionProfileStyles } from './SessionProfile.styles'
import { getMyMentorProfile, updateMentorProfile } from '../../api/mentorApi'
import { getMySessions, formatSessionForDisplay, createSession, editSession } from '../../api/sessionApi'
import axiosInstance from '../../api/axiosInstance'

// ✅ Initial state with empty data - will be populated from database
const initialMentorData = {
  fullName: '',
  jobTitle: '',
  employmentType: '',
  experience: '0',
  sessionsCompleted: '0',
  image: null,
  about: '',
  expertise: [],
  education: [],
  sessionRate: '60',
  meetingLocation: 'Online',
  email: '',
  phone: '',
  linkedin: '',
  portfolio: '',
  availableSessions: [], // ✅ Will be fetched from database
}

function SessionProfile() {
  const navigate = useNavigate() // Navigation hook
  const [isEditMode, setIsEditMode] = useState(false)
  const [agendaModalOpen, setAgendaModalOpen] = useState(false)
  const [profileData, setProfileData] = useState(initialMentorData)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [newExpertise, setNewExpertise] = useState('')
  const [newEducation, setNewEducation] = useState({ degree: '', year: '', institution: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [sessionsUpdated, setSessionsUpdated] = useState(false)
  const [updatedSessionInfo, setUpdatedSessionInfo] = useState(null)
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [originalProfileData, setOriginalProfileData] = useState(null)
  
  // Session management states
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [sessionFormData, setSessionFormData] = useState({
    position_id: '',
    price: '',
    location_name: '',
    location_map_url: '',
  })
  const [agendaPdfFile, setAgendaPdfFile] = useState(null)
  const [positions, setPositions] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [sessionSaving, setSessionSaving] = useState(false)
  const [mentorPositionId, setMentorPositionId] = useState(null) // Store mentor's position_id from profile

  // Fetch positions for session creation (kept for display purposes only)
  const fetchPositions = async () => {
    try {
      const response = await axiosInstance.get('/positions')
      setPositions(response.data || [])
    } catch (err) {
      // Silently handle error
    }
  }

  // Fetch all sessions
  const fetchAllSessions = async () => {
    try {
      setSessionsLoading(true)
      const result = await getMySessions()
      if (result.success && result.data) {
        setAllSessions(result.data)
      }
    } catch (err) {
    } finally {
      setSessionsLoading(false)
    }
  }

  // Open session dialog for creating new session
  const handleAddSession = () => {
    setEditingSessionId(null)
    setSessionFormData({
      position_id: mentorPositionId || '', // ✅ Use mentor's position_id from profile
      price: profileData.sessionRate || '60',
      location_name: profileData.meetingLocation || 'Online',
      location_map_url: '',
    })
    setAgendaPdfFile(null)
    setSessionDialogOpen(true)
  }

  // Open session dialog for editing existing session
  const handleEditSession = (session) => {
    setEditingSessionId(session.id)
    setSessionFormData({
      position_id: session.position_id || '',
      price: session.price || '',
      location_name: session.location_name || '',
      location_map_url: session.location_map_url || '',
    })
    setAgendaPdfFile(null)
    setSessionDialogOpen(true)
  }

  // Save session (create or update)
  const handleSaveSession = async () => {
    try {
      setSessionSaving(true)
      setError(null)

      // ✅ Use mentor's position_id from profile (automatically set)
      const positionIdToUse = mentorPositionId || sessionFormData.position_id
      
      if (!positionIdToUse) {
        setError('Unable to determine your position. Please ensure your mentor profile has a position assigned.')
        setSessionSaving(false)
        return
      }
      
      // Validation
      if (!sessionFormData.price || !sessionFormData.location_name) {
        setError('Please fill in all required fields (Price, Location)')
        setSessionSaving(false)
        return
      }

      const sessionData = {
        position_id: positionIdToUse, // ✅ Always use mentor's position_id from profile
        price: parseFloat(sessionFormData.price),
        location_name: sessionFormData.location_name,
        location_map_url: sessionFormData.location_map_url || 'https://maps.google.com',
      }


      let result
      if (editingSessionId) {
        // Update existing session
        result = await editSession(editingSessionId, sessionData, agendaPdfFile)
      } else {
        // Create new session
        result = await createSession(sessionData, agendaPdfFile)
      }

      if (result.success) {
        setSuccess(true)
        setSessionDialogOpen(false)
        
        // Clear form (keep position_id from mentor profile)
        setSessionFormData({
          position_id: mentorPositionId || '', // ✅ Keep mentor's position_id
          price: profileData.sessionRate || '60',
          location_name: profileData.meetingLocation || 'Online',
          location_map_url: '',
        })
        setAgendaPdfFile(null)
        setEditingSessionId(null)
        
        // Refresh sessions list to show the new/updated session
        await fetchAllSessions()
        
        // Show success message
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.message || 'Failed to save session')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save session')
    } finally {
      setSessionSaving(false)
    }
  }

  const handleEditProfile = () => {
    setIsEditMode(true)
  }

  const handleCancel = () => {
    setIsEditMode(false)
    // ✅ Reset to original fetched data (from database), not static initial data
    if (originalProfileData) {
      setProfileData(originalProfileData)
    }
    setNewExpertise('')
    setNewEducation({ degree: '', year: '', institution: '' })
    setProfileImageFile(null)
    setError(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Prepare data for backend
      const [firstName, ...lastNameParts] = profileData.fullName.split(' ')
      const lastName = lastNameParts.join(' ') || ''
      
      const updateData = {
        first_name: firstName || '',
        last_name: lastName || '',
        job_title: profileData.jobTitle || '',
        company_name: profileData.employmentType || '',
        experience_years: parseInt(profileData.experience) || 0,
        about_mentor: profileData.about || '',
        expertise_areas: JSON.stringify(profileData.expertise || []),
        phone: profileData.phone || '',
        social_media: profileData.linkedin || '',
        // ✅ Include session rate and meeting location
        session_rate: profileData.sessionRate || '60',
        meeting_location: profileData.meetingLocation || 'Online',
        // ✅ Include education data - will be sent as JSON string
        education: profileData.education || [],
      }
      
      // Call API to update profile
      await updateMentorProfile(updateData, profileImageFile)
      
      // ✅ CRITICAL: Re-fetch profile data from backend after successful save
      // This ensures we have the latest data from the database
      const response = await getMyMentorProfile()
      const mentor = response.mentor || response
      
      if (!mentor) {
        throw new Error('No mentor data received after update')
      }
      
      // Parse expertise_areas - backend stores as comma-separated string
      let expertiseArray = []
      if (mentor.expertise_areas) {
        try {
          if (typeof mentor.expertise_areas === 'string') {
            // Try parsing as JSON first (in case it's stored as JSON string)
            try {
              const parsed = JSON.parse(mentor.expertise_areas)
              expertiseArray = Array.isArray(parsed) ? parsed : []
            } catch (jsonError) {
              // If not JSON, treat as comma-separated string
              expertiseArray = mentor.expertise_areas.split(',').map(s => s.trim()).filter(s => s)
            }
          } else if (Array.isArray(mentor.expertise_areas)) {
            expertiseArray = mentor.expertise_areas
          }
        } catch (e) {
          expertiseArray = []
        }
      }
      
      // Map backend data to frontend format (same logic as initial fetch)
      const updatedData = {
        fullName: `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || 'N/A',
        jobTitle: mentor.job_title || '',
        employmentType: mentor.company_name || 'Freelance',
        experience: mentor.experience_years?.toString() || '0',
        sessionsCompleted: profileData.sessionsCompleted || '0',
        image: mentor.profile_image 
          ? (mentor.profile_image.startsWith('http') 
              ? mentor.profile_image 
              : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/uploads/${mentor.profile_image}`)
          : (profileData.image || initialMentorData.image),
        about: mentor.about_mentor || '',
        expertise: expertiseArray,
        education: mentor.MentorEducations && Array.isArray(mentor.MentorEducations) && mentor.MentorEducations.length > 0
          ? mentor.MentorEducations.map(edu => ({
              degree: edu.degree_name || '',
              year: edu.year_graduated?.toString() || '',
              institution: edu.university_name || '',
            }))
          : [],
        // ✅ Get session rate and meeting location from database
        sessionRate: mentor.session_rate?.toString() || '60',
        meetingLocation: mentor.meeting_location || 'Online',
        email: mentor.User?.email || '',
        phone: mentor.phone || '',
        linkedin: mentor.social_media || '',
        portfolio: profileData.portfolio || 'CV / Portfolio',
        availableSessions: [], // Will be refreshed below
      }
      
      // ✅ Re-fetch mentor's own sessions after profile update
      setSessionsLoading(true)
      try {
        const sessionsResult = await getMySessions()
        
        if (sessionsResult.success && sessionsResult.data && sessionsResult.data.length > 0) {
          // Format sessions for display
          const formattedSessions = sessionsResult.data
            .slice(0, 5) // Limit to 5 newest
            .map(formatSessionForDisplay)
            .filter(session => session.status === 'AVAILABLE') // Only show available sessions
            .map(session => ({
              day: session.date,
              duration: session.duration,
              time: session.time,
              location: session.location,
              price: session.price,
            }))
          
          updatedData.availableSessions = formattedSessions
          
          // Show success notification with location and cost from updated profile
          // Use the updated session rate and meeting location from the database
          setUpdatedSessionInfo({
            location: updatedData.meetingLocation || 'Online',
            cost: `$${updatedData.sessionRate || '60'}`
          })
          setSessionsUpdated(true)
          // Don't auto-hide - let user dismiss manually
        } else {
          updatedData.availableSessions = []
          // Still show the alert even if no sessions, as the profile was updated
          setUpdatedSessionInfo({
            location: updatedData.meetingLocation || 'Online',
            cost: `$${updatedData.sessionRate || '60'}`
          })
          setSessionsUpdated(true)
          // Don't auto-hide - let user dismiss manually
        }
      } catch (sessionError) {
        // Keep existing sessions on error
        updatedData.availableSessions = profileData.availableSessions || []
      } finally {
        setSessionsLoading(false)
      }
      
      setProfileData(updatedData)
      setOriginalProfileData(updatedData)
      setProfileImageFile(null)
      setIsEditMode(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // ✅ Refresh sessions list after profile update (sessions may have been updated with new prices)
      await fetchAllSessions()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddExpertise = () => {
    if (newExpertise.trim()) {
      setProfileData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()],
      }))
      setNewExpertise('')
    }
  }

  const handleRemoveExpertise = (index) => {
    setProfileData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index),
    }))
  }

  const handleAddEducation = () => {
    setProfileData((prev) => ({
      ...prev,
      education: [...prev.education, { degree: '', year: '', institution: '' }],
    }))
  }

  const handleRemoveEducation = (index) => {
    setProfileData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const handleEducationFieldChange = (index, field, value) => {
    const newEducation = [...profileData.education]
    newEducation[index][field] = value
    setProfileData((prev) => ({ ...prev, education: newEducation }))
  }

  // Fetch mentor profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch positions and sessions in parallel
        await Promise.all([fetchPositions(), fetchAllSessions()])
        
        const response = await getMyMentorProfile()
        
        // Handle response structure - backend returns { mentor: {...} }
        const mentor = response.mentor || response
        
        if (!mentor) {
          throw new Error('No mentor data received from server')
        }
        
        // Parse expertise_areas - backend stores as comma-separated string
        let expertiseArray = []
        if (mentor.expertise_areas) {
          try {
            if (typeof mentor.expertise_areas === 'string') {
              // Try parsing as JSON first (in case it's stored as JSON string)
              try {
                const parsed = JSON.parse(mentor.expertise_areas)
                expertiseArray = Array.isArray(parsed) ? parsed : []
              } catch (jsonError) {
                // If not JSON, treat as comma-separated string
                expertiseArray = mentor.expertise_areas.split(',').map(s => s.trim()).filter(s => s)
              }
            } else if (Array.isArray(mentor.expertise_areas)) {
              expertiseArray = mentor.expertise_areas
            }
          } catch (e) {
            expertiseArray = []
          }
        }
        
        // ✅ Store mentor's position_id from profile
        const mentorPosId = mentor.position_id || mentor.Position?.id || null
        setMentorPositionId(mentorPosId)
        
        // Map backend data to frontend format
        const mappedData = {
          fullName: `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() || 'N/A',
          jobTitle: mentor.job_title || '',
          employmentType: mentor.company_name || 'Freelance',
          experience: mentor.experience_years?.toString() || '0',
          sessionsCompleted: '0', // This would come from bookings count
          image: mentor.profile_image 
            ? (mentor.profile_image.startsWith('http') 
                ? mentor.profile_image 
                : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/uploads/${mentor.profile_image}`)
            : initialMentorData.image,
          about: mentor.about_mentor || '', // ✅ Fetched from database "About You" field
          expertise: expertiseArray, // ✅ Fetched from database expertise_areas field
          education: mentor.MentorEducations && Array.isArray(mentor.MentorEducations) && mentor.MentorEducations.length > 0
            ? mentor.MentorEducations.map(edu => ({
                degree: edu.degree_name || '', // ✅ From registration form
                year: edu.year_graduated?.toString() || '', // ✅ From registration form
                institution: edu.university_name || '', // ✅ From registration form
              }))
            : [], // ✅ Fetched from database MentorEducations
          sessionRate: mentor.session_rate?.toString() || '60', // ✅ From database or default
          meetingLocation: mentor.meeting_location || 'Online', // ✅ From database or default
          email: mentor.User?.email || '',
          phone: mentor.phone || '',
          linkedin: mentor.social_media || '',
          portfolio: 'CV / Portfolio', // Would come from documents
          availableSessions: [], // Will be fetched separately
        }
        
        // ✅ Fetch mentor's own sessions from database
        setSessionsLoading(true)
        try {
          const sessionsResult = await getMySessions()
          
          if (sessionsResult.success && sessionsResult.data && sessionsResult.data.length > 0) {
            // Format sessions for display
            const formattedSessions = sessionsResult.data
              .slice(0, 5) // Limit to 5 newest
              .map(formatSessionForDisplay)
              .filter(session => session.status === 'AVAILABLE') // Only show available sessions
              .map(session => ({
                day: session.date,
                duration: session.duration,
                time: session.time,
                location: session.location,
                price: session.price,
              }))
            
            mappedData.availableSessions = formattedSessions
          } else {
            mappedData.availableSessions = []
          }
        } catch (sessionError) {
          // Set empty array on error - don't fail the whole profile load
          mappedData.availableSessions = []
        } finally {
          setSessionsLoading(false)
        }
        
        setProfileData(mappedData)
        setOriginalProfileData(mappedData)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load profile. Please try again.')
        // Don't reset to initial data on error - keep showing error message
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [])

  const handleFileUpload = (type, event) => {
    const file = event.target.files[0]
    if (file) {
      if (type === 'profile') {
        setProfileImageFile(file)
        // Preview the image
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfileData(prev => ({
            ...prev,
            image: reader.result
          }))
        }
        reader.readAsDataURL(file)
      } else {
        // Handle other file uploads (CV, session agenda) here
      }
    }
  }

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={SessionProfileStyles.container}>
      {/* Success/Error Messages */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Profile updated successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={sessionsUpdated}
        autoHideDuration={4000}
        onClose={() => setSessionsUpdated(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSessionsUpdated(false)} severity="success" sx={{ width: '100%' }}>
          Available sessions updated successfully!
        </Alert>
      </Snackbar>

      {/* Action Buttons - Only shown in edit mode */}
      {isEditMode && (
        <Box sx={SessionProfileStyles.actionButtonsContainer}>
          <Button
            variant="outlined"
            sx={SessionProfileStyles.cancelButton}
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={SessionProfileStyles.saveButton}
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}
      <Grid container spacing={3}>
        {/* Main Content - Left Column */}
        <Grid item xs={12} md={8}>
          {/* Profile Header Card */}
          <Card sx={SessionProfileStyles.card}>
            <CardContent sx={SessionProfileStyles.cardContent}>
              {isEditMode ? (
                <Box sx={SessionProfileStyles.profileEditContainer}>
                  <Box sx={SessionProfileStyles.avatarWrapper}>
                    <Avatar
                      src={profileData.image}
                      alt={profileData.fullName}
                      sx={SessionProfileStyles.profileAvatar}
                    />
                    <IconButton
                      sx={SessionProfileStyles.cameraButton}
                      component="label"
                      aria-label="upload picture"
                    >
                      <CameraIcon />
                      <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload('profile', e)} />
                    </IconButton>
                  </Box>
                  <Box sx={SessionProfileStyles.formSection}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={profileData.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="Job Title"
                      value={profileData.jobTitle}
                      onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="Employment Type"
                      value={profileData.employmentType}
                      onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="Experience (years)"
                      value={profileData.experience}
                      onChange={(e) => handleFieldChange('experience', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="Sessions Completed"
                      value={`${profileData.sessionsCompleted} mentoring sessions completed`}
                      disabled
                      sx={SessionProfileStyles.sessionsCompletedField}
                    />
                    <Typography variant="caption" sx={SessionProfileStyles.updatedText}>
                      Updated from User Management
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={SessionProfileStyles.profileHeader}>
                  <Box
                    component="img"
                    src={profileData.image}
                    alt={profileData.fullName}
                    sx={SessionProfileStyles.avatar}
                  />
                  <Box sx={SessionProfileStyles.profileInfo}>
                    <Typography variant="h4" sx={SessionProfileStyles.name}>
                      {profileData.fullName}
                    </Typography>
                    <Typography variant="h6" sx={SessionProfileStyles.title}>
                      {profileData.jobTitle}
                    </Typography>
                    <Box sx={SessionProfileStyles.metaInfo}>
                      <Box sx={SessionProfileStyles.metaItem}>
                        <BusinessIcon sx={SessionProfileStyles.metaIcon} />
                        <Typography variant="body2">{profileData.employmentType}</Typography>
                      </Box>
                      <Box sx={SessionProfileStyles.metaItem}>
                        <SchoolIcon sx={SessionProfileStyles.metaIcon} />
                        <Typography variant="body2">{profileData.experience} years of experience</Typography>
                      </Box>
                      <Box sx={SessionProfileStyles.metaItem}>
                        <CheckCircleIcon sx={SessionProfileStyles.metaIcon} />
                        <Typography variant="body2">{profileData.sessionsCompleted} mentoring sessions completed</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* About Section Card */}
          <Card sx={SessionProfileStyles.card}>
            <CardContent sx={SessionProfileStyles.cardContent}>
              <Typography variant="h6" sx={SessionProfileStyles.sectionTitle}>
                About
              </Typography>
              {isEditMode ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={profileData.about}
                  onChange={(e) => handleFieldChange('about', e.target.value)}
                  sx={SessionProfileStyles.textField}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <Typography variant="body1" sx={SessionProfileStyles.aboutText}>
                  {profileData.about}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Expertise Section Card */}
          <Card sx={SessionProfileStyles.card}>
            <CardContent sx={SessionProfileStyles.cardContent}>
              <Typography variant="h6" sx={SessionProfileStyles.sectionTitle}>
                Expertise
              </Typography>
              <Box sx={SessionProfileStyles.expertiseContainer}>
                {profileData.expertise.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={isEditMode ? () => handleRemoveExpertise(index) : undefined}
                    deleteIcon={isEditMode ? <CloseIcon sx={SessionProfileStyles.chipDeleteIcon} /> : undefined}
                    sx={SessionProfileStyles.expertiseChip}
                  />
                ))}
              </Box>
              {isEditMode && (
                <Box sx={SessionProfileStyles.addExpertiseContainer}>
                  <TextField
                    fullWidth
                    placeholder="Add new expertise"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddExpertise()
                      }
                    }}
                    sx={SessionProfileStyles.expertiseInput}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddExpertise}
                    sx={SessionProfileStyles.addButton}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Education Section Card */}
          <Card sx={SessionProfileStyles.card}>
            <CardContent sx={SessionProfileStyles.cardContent}>
              <Box sx={SessionProfileStyles.educationHeader}>
                <Typography variant="h6" sx={SessionProfileStyles.sectionTitle}>
                  Education
                </Typography>
                {isEditMode && (
                  <Button
                    variant="contained"
                    onClick={handleAddEducation}
                    sx={SessionProfileStyles.addEducationButton}
                    startIcon={<AddIcon />}
                  >
                    Add Education
                  </Button>
                )}
              </Box>
              {isEditMode ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(profileData.education || []).map((edu, index) => (
                    <Box key={index} sx={SessionProfileStyles.educationItemEdit}>
                      <IconButton
                        sx={SessionProfileStyles.removeButton}
                        onClick={() => handleRemoveEducation(index)}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                      <Grid container spacing={2} sx={{ flex: 1 }}>
                        <Grid item xs={12} sm={5}>
                          <TextField
                            fullWidth
                            label="Degree"
                            value={edu.degree}
                            onChange={(e) => handleEducationFieldChange(index, 'degree', e.target.value)}
                            sx={SessionProfileStyles.textField}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            fullWidth
                            label="Year"
                            value={edu.year}
                            onChange={(e) => handleEducationFieldChange(index, 'year', e.target.value)}
                            sx={SessionProfileStyles.textField}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Institution"
                            value={edu.institution}
                            onChange={(e) => handleEducationFieldChange(index, 'institution', e.target.value)}
                            sx={SessionProfileStyles.textField}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={SessionProfileStyles.educationTimeline}>
                  {profileData.education && profileData.education.length > 0 ? (
                    (() => {
                      // Sort education: Bachelor's first, then Master's, then higher degrees
                      const sortedEducation = [...profileData.education]
                        .filter(edu => edu.degree || edu.institution || edu.year || edu.degree_name || edu.university_name || edu.year_graduated)
                        .sort((a, b) => {
                          const getDegreeLevel = (degreeName) => {
                            if (!degreeName) return 999;
                            const degree = (degreeName || '').toLowerCase();
                            if (degree.includes('bachelor') || degree.includes('b.s') || degree.includes('b.a') || degree.includes('b.eng') || degree.includes('bsc') || degree.includes('ba')) return 1;
                            if (degree.includes('master') || degree.includes('m.s') || degree.includes('m.a') || degree.includes('m.eng') || degree.includes('msc') || degree.includes('ma') || degree.includes('mba')) return 2;
                            if (degree.includes('phd') || degree.includes('doctorate') || degree.includes('d.phil')) return 3;
                            if (degree.includes('associate') || degree.includes('a.s') || degree.includes('aa')) return 0;
                            return 999;
                          };
                          const degreeA = a.degree || a.degree_name || '';
                          const degreeB = b.degree || b.degree_name || '';
                          return getDegreeLevel(degreeA) - getDegreeLevel(degreeB);
                        });
                      
                      return sortedEducation.map((edu, index) => (
                        <Box key={index} sx={SessionProfileStyles.educationItem}>
                          <Box sx={SessionProfileStyles.timelineDot} />
                          <Box sx={SessionProfileStyles.educationContent}>
                            <Typography variant="subtitle1" sx={SessionProfileStyles.educationDegree}>
                              {edu.degree || edu.degree_name || 'Degree'} • {edu.year || edu.year_graduated || 'Year'}
                            </Typography>
                            <Typography variant="body2" sx={SessionProfileStyles.educationUniversity}>
                              {edu.institution || edu.university_name || 'Institution'}
                            </Typography>
                          </Box>
                        </Box>
                      ));
                    })()
                  ) : (
                    <Typography variant="body2" sx={{ color: '#999999', fontStyle: 'italic', paddingLeft: '32px' }}>
                      No education entries added yet
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {!isEditMode && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditProfile}
              sx={SessionProfileStyles.editProfileButton}
            >
              Edit Profile
            </Button>
          )}

          {isEditMode ? (
            <>
              {/* Edit Session Card */}
              <Card sx={SessionProfileStyles.card}>
                <CardContent sx={SessionProfileStyles.cardContent}>
                  <Typography variant="h6" sx={SessionProfileStyles.sectionTitle}>
                    Edit Session
                  </Typography>
                  <Box sx={SessionProfileStyles.formSection}>
                    <TextField
                      fullWidth
                      label="Session Rate ($)"
                      value={profileData.sessionRate}
                      onChange={(e) => handleFieldChange('sessionRate', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="Meeting Location"
                      value={profileData.meetingLocation}
                      onChange={(e) => handleFieldChange('meetingLocation', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <Box
                      component="label"
                      sx={SessionProfileStyles.uploadBox}
                    >
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={(e) => handleFileUpload('sessionAgenda', e)}
                      />
                      <CloudUploadIcon sx={SessionProfileStyles.uploadIcon} />
                      <Typography variant="body2" sx={SessionProfileStyles.uploadText}>
                        Click to upload PDF
                      </Typography>
                      <Typography variant="caption" sx={SessionProfileStyles.uploadSubtext}>
                        Upload a new session agenda
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card sx={SessionProfileStyles.card}>
                <CardContent sx={SessionProfileStyles.cardContent}>
                  <Typography variant="h6" sx={SessionProfileStyles.sectionTitle}>
                    Contact
                  </Typography>
                  <Box sx={SessionProfileStyles.formSection}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <TextField
                      fullWidth
                      label="LinkedIn"
                      value={profileData.linkedin}
                      onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                      sx={SessionProfileStyles.textField}
                    />
                    <Box
                      component="label"
                      sx={SessionProfileStyles.uploadBox}
                    >
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={(e) => handleFileUpload('cvPortfolio', e)}
                      />
                      <CloudUploadIcon sx={SessionProfileStyles.uploadIcon} />
                      <Typography variant="body2" sx={SessionProfileStyles.uploadText}>
                        Click to upload PDF
                      </Typography>
                      <Typography variant="caption" sx={SessionProfileStyles.uploadSubtext}>
                        Upload your CV or Portfolio
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Available Sessions Card */}
              <Card sx={SessionProfileStyles.availableSessionsCard}>
                <CardContent sx={SessionProfileStyles.cardContent}>
                  <Box sx={SessionProfileStyles.cardHeader}>
                    <Box sx={SessionProfileStyles.cardHeaderLeft}>
                      <CalendarIcon sx={SessionProfileStyles.cardIcon} />
                      <Typography variant="h6" sx={SessionProfileStyles.cardTitle}>
                        Available Sessions
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={SessionProfileStyles.subtitleContainer}>
                    <ArrowForwardIcon sx={SessionProfileStyles.subtitleIcon} />
                    <Typography variant="subtitle2" sx={SessionProfileStyles.subtitle}>
                      Newest Available Slots
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddSession}
                      variant="contained"
                      sx={{ ml: 'auto' }}
                    >
                      Add Session
                    </Button>
                  </Box>

                  {sessionsUpdated && updatedSessionInfo && (
                    <Alert 
                      severity="success" 
                      sx={{ mb: 2, borderRadius: '8px' }}
                      onClose={() => {
                        setSessionsUpdated(false)
                        setUpdatedSessionInfo(null)
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Session details updated successfully!
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                            Location: <strong>{updatedSessionInfo.location}</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                            Cost: <strong>{updatedSessionInfo.cost}</strong>
                          </Typography>
                        </Box>
                      </Box>
                    </Alert>
                  )}

                  <Box sx={SessionProfileStyles.sessionsList}>
                    {sessionsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (() => {
                      // ✅ Flatten all timeslots from all sessions and sort by date
                      const allTimeslots = []
                      if (allSessions && allSessions.length > 0) {
                        allSessions.forEach((session) => {
                          if (session.ScheduleTimeslots && session.ScheduleTimeslots.length > 0) {
                            session.ScheduleTimeslots.forEach((timeslot) => {
                              // Only include available (not booked) timeslots
                              if (!timeslot.is_booked) {
                                const startTime = timeslot.start_time ? new Date(timeslot.start_time) : null
                                const endTime = timeslot.end_time ? new Date(timeslot.end_time) : null
                                const durationMinutes = startTime && endTime 
                                  ? Math.round((endTime - startTime) / 60000)
                                  : 60
                                
                                allTimeslots.push({
                                  id: timeslot.id,
                                  sessionId: session.id,
                                  session: session,
                                  startTime,
                                  endTime,
                                  durationMinutes,
                                  location: session.location_name || 'TBD',
                                  price: session.price || 0,
                                })
                              }
                            })
                          }
                        })
                      }
                      
                      // Sort by start time (oldest first, so newest appear at bottom when scrolling)
                      allTimeslots.sort((a, b) => {
                        if (!a.startTime) return 1
                        if (!b.startTime) return -1
                        return b.startTime - a.startTime // Reverse sort - newest first
                      })
                      
                      return allTimeslots.length > 0 ? (
                        allTimeslots.map((timeslot) => {
                          const dateStr = timeslot.startTime 
                            ? timeslot.startTime.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'TBD'
                          
                          const timeStr = timeslot.startTime && timeslot.endTime
                            ? `${timeslot.startTime.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })} - ${timeslot.endTime.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}`
                            : 'TBD'
                          
                          return (
                            <Box key={timeslot.id} sx={{...SessionProfileStyles.sessionSlot, mb: 2}}>
                              <Box sx={SessionProfileStyles.sessionSlotTopRow}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={SessionProfileStyles.sessionDay}>
                                    {dateStr}
                                  </Typography>
                                  <Typography variant="body2" sx={SessionProfileStyles.sessionDot}>
                                    •
                                  </Typography>
                                  <Typography variant="body2" sx={SessionProfileStyles.sessionDuration}>
                                    {timeslot.durationMinutes} min
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={SessionProfileStyles.sessionPrice}>
                                  ${parseFloat(timeslot.price || 0).toFixed(0)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={SessionProfileStyles.sessionTime}>
                                {timeStr}
                              </Typography>
                              <Box sx={SessionProfileStyles.sessionLocation}>
                                <LocationOnIcon sx={SessionProfileStyles.locationIcon} />
                                <Typography 
                                  variant="body2"
                                  sx={SessionProfileStyles.locationText}
                                >
                                  {timeslot.location}
                                </Typography>
                              </Box>
                            </Box>
                          )
                        })
                      ) : allSessions && allSessions.length > 0 ? (
                        // ✅ Show sessions even if they don't have timeslots yet
                        allSessions.map((session) => {
                          const position = positions.find(p => p.id === session.position_id || p.id === session.Position?.id)
                          return (
                            <Box key={session.id} sx={{...SessionProfileStyles.sessionSlot, mb: 2}}>
                              <Box sx={SessionProfileStyles.sessionSlotTopRow}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={SessionProfileStyles.sessionDay}>
                                    Session Created
                                  </Typography>
                                  <Typography variant="body2" sx={SessionProfileStyles.sessionDot}>
                                    •
                                  </Typography>
                                  <Typography variant="body2" sx={SessionProfileStyles.sessionDuration}>
                                    60 min
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={SessionProfileStyles.sessionPrice}>
                                  ${parseFloat(session.price || 0).toFixed(0)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={SessionProfileStyles.sessionTime}>
                                Add timeslots to schedule this session
                              </Typography>
                              <Box sx={SessionProfileStyles.sessionLocation}>
                                <LocationOnIcon sx={SessionProfileStyles.locationIcon} />
                                <Typography 
                                  variant="body2"
                                  sx={SessionProfileStyles.locationText}
                                >
                                  {session.location_name || 'TBD'}
                                </Typography>
                              </Box>
                            </Box>
                          )
                        })
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No sessions created yet. Click "Add Session" to create one.
                          </Typography>
                        </Box>
                      )
                    })()}
                  </Box>

                  <Box sx={SessionProfileStyles.sessionButtons}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      onClick={() => navigate('/session-schedule')}
                      sx={SessionProfileStyles.viewAllButton}
                    >
                      View All Available Times
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      onClick={() => setAgendaModalOpen(true)}
                      sx={SessionProfileStyles.viewAgendaButton}
                    >
                      View Session Agenda
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card sx={SessionProfileStyles.card}>
                <CardContent sx={SessionProfileStyles.cardContent}>
                  <Typography variant="h6" sx={SessionProfileStyles.sectionTitle}>
                    Contact
                  </Typography>
                  <Box sx={SessionProfileStyles.contactSection}>
                    <Box sx={SessionProfileStyles.contactItem}>
                      <EmailIcon sx={SessionProfileStyles.contactIcon} />
                      <Typography variant="body2">{profileData.email}</Typography>
                    </Box>
                    <Box sx={SessionProfileStyles.contactItem}>
                      <PhoneIcon sx={SessionProfileStyles.contactIcon} />
                      <Typography variant="body2">{profileData.phone}</Typography>
                    </Box>
                    <Box sx={SessionProfileStyles.contactItem}>
                      <LinkedInIcon sx={SessionProfileStyles.contactIcon} />
                      <Typography
                        variant="body2"
                        component="a"
                        href="#"
                        sx={SessionProfileStyles.contactLink}
                      >
                        {profileData.linkedin}
                      </Typography>
                    </Box>
                    <Box sx={SessionProfileStyles.contactItem}>
                      <DescriptionIcon sx={SessionProfileStyles.contactIcon} />
                      <Typography
                        variant="body2"
                        component="a"
                        href="#"
                        sx={SessionProfileStyles.contactLink}
                      >
                        {profileData.portfolio}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Grid>
      </Grid>

      {/* Session Create/Edit Dialog */}
      <Dialog 
        open={sessionDialogOpen} 
        onClose={() => !sessionSaving && setSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSessionId ? 'Edit Session' : 'Create New Session'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* ✅ Position field removed - automatically uses mentor's position from registration */}
            {mentorPositionId && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Using your registered position: {positions.find(p => p.id === mentorPositionId)?.position_name || 'Your Position'}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Price ($) *"
              type="number"
              value={sessionFormData.price}
              onChange={(e) => setSessionFormData({ ...sessionFormData, price: e.target.value })}
              placeholder="60"
            />

            <TextField
              fullWidth
              label="Location Name *"
              value={sessionFormData.location_name}
              onChange={(e) => setSessionFormData({ ...sessionFormData, location_name: e.target.value })}
              placeholder="e.g., Starbucks Downtown"
            />

            <TextField
              fullWidth
              label="Location Map URL"
              value={sessionFormData.location_map_url}
              onChange={(e) => setSessionFormData({ ...sessionFormData, location_map_url: e.target.value })}
              placeholder="https://maps.google.com"
            />

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                {agendaPdfFile ? agendaPdfFile.name : 'Upload Agenda PDF (Optional)'}
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={(e) => setAgendaPdfFile(e.target.files?.[0] || null)}
                />
              </Button>
              {agendaPdfFile && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Selected: {agendaPdfFile.name}
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)} disabled={sessionSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSession} 
            variant="contained"
            disabled={sessionSaving}
            startIcon={sessionSaving ? <CircularProgress size={20} /> : null}
          >
            {sessionSaving ? 'Saving...' : editingSessionId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Agenda Modal */}
      <SessionAgendaModal
        open={agendaModalOpen}
        onClose={() => setAgendaModalOpen(false)}
        agendaPdfUrl={(() => {
          // Get the most recent session with an agenda PDF
          if (allSessions && allSessions.length > 0) {
            // allSessions contains raw session data from backend
            // Sort by created_at DESC to get most recent first, then find first with agenda_pdf
            const sortedSessions = [...allSessions].sort((a, b) => {
              const dateA = new Date(a.created_at || a.createdAt || 0);
              const dateB = new Date(b.created_at || b.createdAt || 0);
              return dateB - dateA;
            });
            
            // Find first session with agenda_pdf (check raw data structure)
            const sessionWithAgenda = sortedSessions.find(s => {
              // Check if agenda_pdf exists in raw session data
              return s.agenda_pdf && s.agenda_pdf.trim() !== '';
            });
            
            if (sessionWithAgenda && sessionWithAgenda.agenda_pdf) {
              // Return the agenda_pdf URL
              // It should be a full URL (R2) or filename (legacy)
              return sessionWithAgenda.agenda_pdf;
            }
          }
          return null;
        })()}
      />
    </Box>
  )
}

export default SessionProfile
