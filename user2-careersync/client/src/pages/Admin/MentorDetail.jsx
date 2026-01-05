import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAtom, useAtomValue } from 'jotai'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  adminMentorDetailAtom,
  adminMentorDetailLoadingAtom,
  adminMentorActionLoadingAtom,
  adminMentorActionErrorAtom,
  adminMentorsRefreshAtom,
} from '../../atoms/mentorAtoms'
import { getMentorById, approveMentor, rejectMentor } from '../../services/adminMentorService'
import { useAuth } from '../../context/AuthContext'

const MentorDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mentor, setMentor] = useAtom(adminMentorDetailAtom)
  const [loading, setLoading] = useAtom(adminMentorDetailLoadingAtom)
  const [actionLoading, setActionLoading] = useAtom(adminMentorActionLoadingAtom)
  const [actionError, setActionError] = useAtom(adminMentorActionErrorAtom)
  const [refreshTrigger, setRefreshTrigger] = useAtom(adminMentorsRefreshAtom)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Check if user is admin
  useEffect(() => {
    if (user?.role_name !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Fetch mentor details
  useEffect(() => {
    const fetchMentor = async () => {
      if (!id) return
      setLoading(true)
      try {
        const result = await getMentorById(id)
        if (result.success) {
          setMentor(result.data)
        } else {
          setActionError(result.message)
        }
      } catch (error) {
        setActionError(error.message || 'Failed to load mentor details')
      } finally {
        setLoading(false)
      }
    }

    fetchMentor()
  }, [id, setMentor, setLoading])

  const handleApprove = async () => {
    if (!mentor || !id) {
      setActionError('Mentor ID is missing')
      return
    }

    setActionLoading(true)
    setActionError(null)

    try {
      console.log('Attempting to approve mentor:', id)
      const result = await approveMentor(id)
      console.log('Approve result:', result)
      
      if (result.success) {
        // Refresh mentors list
        setRefreshTrigger(prev => prev + 1)
        // Update local mentor state
        setMentor({ ...mentor, approval_status: 'approved' })
        setApproveDialogOpen(false)
        // Show success message
        alert('Mentor approved successfully!')
      } else {
        const errorMsg = result.message || 'Failed to approve mentor'
        setActionError(errorMsg)
        console.error('Approve failed:', errorMsg, result)
        // Keep dialog open so user can see the error
      }
    } catch (error) {
      console.error('Approve mentor error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to approve mentor'
      setActionError(errorMsg)
      // Keep dialog open so user can see the error
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!mentor || !id) {
      setActionError('Mentor ID is missing')
      return
    }

    setActionLoading(true)
    setActionError(null)

    try {
      console.log('Attempting to reject mentor:', id, 'Reason:', rejectionReason)
      const result = await rejectMentor(id, rejectionReason)
      console.log('Reject result:', result)
      
      if (result.success) {
        // Refresh mentors list
        setRefreshTrigger(prev => prev + 1)
        // Update local mentor state
        setMentor({ ...mentor, approval_status: 'rejected', rejection_reason: rejectionReason })
        setRejectDialogOpen(false)
        setRejectionReason('')
        alert('Mentor rejected successfully!')
      } else {
        const errorMsg = result.message || 'Failed to reject mentor'
        setActionError(errorMsg)
        console.error('Reject failed:', errorMsg, result)
        // Keep dialog open so user can see the error
      }
    } catch (error) {
      console.error('Reject mentor error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to reject mentor'
      setActionError(errorMsg)
      // Keep dialog open so user can see the error
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'pending':
        return 'Pending'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!mentor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Mentor not found</Alert>
        <Button onClick={() => navigate('/admin/mentors')} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/admin/mentors')}
        sx={{ mb: 2 }}
      >
        Back to List
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mentor Details
        </Typography>
        <Chip
          label={getStatusLabel(mentor.approval_status)}
          color={getStatusColor(mentor.approval_status)}
          size="large"
        />
      </Box>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography><strong>Name:</strong> {mentor.first_name} {mentor.last_name}</Typography>
              <Typography><strong>Email:</strong> {mentor.User?.email || 'N/A'}</Typography>
              <Typography><strong>Phone:</strong> {mentor.phone || 'N/A'}</Typography>
              <Typography><strong>Date of Birth:</strong> {mentor.dob || 'N/A'}</Typography>
              <Typography><strong>Gender:</strong> {mentor.gender || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Professional Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography><strong>Position:</strong> {mentor.position?.position_name || 'N/A'}</Typography>
              <Typography><strong>Industry:</strong> {mentor.industry?.industry_name || 'N/A'}</Typography>
              <Typography><strong>Job Title:</strong> {mentor.job_title || 'N/A'}</Typography>
              <Typography><strong>Company:</strong> {mentor.company_name || 'N/A'}</Typography>
              <Typography><strong>Experience:</strong> {mentor.experience_years || 'N/A'} years</Typography>
              <Typography><strong>LinkedIn:</strong> {mentor.social_media || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* About */}
        {mentor.about_mentor && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography>{mentor.about_mentor}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Education */}
        {mentor.MentorEducations && mentor.MentorEducations.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Education
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {mentor.MentorEducations.map((edu, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography><strong>{edu.university_name}</strong></Typography>
                    <Typography>{edu.degree_name} - {edu.year_graduated}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Documents */}
        {mentor.MentorDocuments && mentor.MentorDocuments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Documents
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {mentor.MentorDocuments.map((doc, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography>
                      <strong>{doc.document_type}:</strong>{' '}
                      <a
                        href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').replace(/\/api\/?$/, '')}/uploads/${doc.document_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Document
                      </a>
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Rejection Reason (if rejected) */}
        {mentor.approval_status === 'rejected' && mentor.rejection_reason && (
          <Grid item xs={12}>
            <Alert severity="error">
              <Typography variant="subtitle2">Rejection Reason:</Typography>
              <Typography>{mentor.rejection_reason}</Typography>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      {mentor.approval_status === 'pending' && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setApproveDialogOpen(true)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => setRejectDialogOpen(true)}
            disabled={actionLoading}
          >
            Reject
          </Button>
        </Box>
      )}

      {/* Approve Dialog */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => !actionLoading && setApproveDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Approve Mentor Application</DialogTitle>
        <DialogContent>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}
          <Typography>
            Are you sure you want to approve <strong>{mentor.first_name} {mentor.last_name}</strong>'s mentor application?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Once approved, the mentor will receive an email notification and can start using the platform.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setApproveDialogOpen(false)
              setActionError(null)
            }} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            color="success"
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {actionLoading ? 'Approving...' : 'Confirm Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => !actionLoading && setRejectDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Reject Mentor Application</DialogTitle>
        <DialogContent>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
              {actionError}
            </Alert>
          )}
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to reject <strong>{mentor.first_name} {mentor.last_name}</strong>'s mentor application?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason (Optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            sx={{ mt: 1 }}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRejectDialogOpen(false)
              setRejectionReason('')
              setActionError(null)
            }} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MentorDetail

