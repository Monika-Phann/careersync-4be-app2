import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { CreateTimeSlotModalStyles } from './CreateTimeSlotModal.styles'
import { addTimeslots } from '../../api/timeslotApi'
import { getMySessions } from '../../api/sessionApi'

function CreateTimeSlotModal({ open, onClose }) {
  const [startDateTime, setStartDateTime] = useState(null)
  const [endDateTime, setEndDateTime] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Fetch sessions when modal opens
  useEffect(() => {
    if (open) {
      fetchSessions()
    }
  }, [open])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getMySessions()
      if (result.success && result.data && result.data.length > 0) {
        setSessions(result.data)
        // Auto-select first session if available
        if (result.data[0]?.id) {
          setSelectedSessionId(result.data[0].id)
        }
      } else {
        // No sessions found - allow auto-creation using 'auto-create' flag
        setSessions([])
        setSelectedSessionId('auto-create') // Special flag to auto-create session
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setError('Failed to load sessions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStartDateTime(null)
      setEndDateTime(null)
      setError(null)
    }
  }, [open])

  const handleSave = async () => {
    // Allow saving even if no session selected (will auto-create using profile data)
    if (!startDateTime || !endDateTime) {
      setError('Please enter both start and end date/time')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Convert dayjs objects to ISO format
      const startTime = startDateTime.toISOString()
      const endTime = endDateTime.toISOString()

      if (!startTime || !endTime) {
        setError('Please enter valid date and time')
        setSaving(false)
        return
      }

      if (startDateTime.isAfter(endDateTime) || startDateTime.isSame(endDateTime)) {
        setError('End time must be after start time')
        setSaving(false)
        return
      }

      // Call API to create timeslot
      // If selectedSessionId is 'auto-create' or not set, pass null to trigger auto-creation
      const sessionIdForApi = (selectedSessionId && selectedSessionId !== 'auto-create') ? selectedSessionId : null
      const result = await addTimeslots(sessionIdForApi, [
        {
          start_time: startTime,
          end_time: endTime
        }
      ])

      if (result.success) {
        // Close modal and let parent refresh
        onClose()
      } else {
        setError(result.message || 'Failed to create timeslot')
      }
    } catch (err) {
      console.error('Error creating timeslot:', err)
      setError(err.message || 'Failed to create timeslot. Please check the date/time format.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: CreateTimeSlotModalStyles.dialogPaper,
        }}
      >
      <DialogTitle sx={CreateTimeSlotModalStyles.dialogTitle}>
        <Typography variant="h6" sx={CreateTimeSlotModalStyles.title}>
          Create New Time Slots
        </Typography>
        <IconButton
          onClick={onClose}
          sx={CreateTimeSlotModalStyles.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={CreateTimeSlotModalStyles.dialogContent}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error && selectedSessionId !== 'auto-create' ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Box sx={CreateTimeSlotModalStyles.formSection}>
            {sessions.length > 0 ? (
              <TextField
                fullWidth
                select
                label="Session"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                sx={CreateTimeSlotModalStyles.textField}
                required
              >
                {sessions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.location_name || session.Position?.position_name || session.id} - ${session.price}
                  </MenuItem>
                ))}
              </TextField>
            ) : selectedSessionId === 'auto-create' ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No existing sessions found. A new session will be created automatically using your profile's session rate and location.
              </Alert>
            ) : null}
            <DateTimePicker
              label="Start Date & Time"
              value={startDateTime}
              onChange={(newValue) => setStartDateTime(newValue)}
              minDateTime={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  sx: CreateTimeSlotModalStyles.textField,
                  helperText: "Select the start date and time for your time slot"
                }
              }}
            />
            <DateTimePicker
              label="End Date & Time"
              value={endDateTime}
              onChange={(newValue) => setEndDateTime(newValue)}
              minDateTime={startDateTime || dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  sx: CreateTimeSlotModalStyles.textField,
                  helperText: "Select the end date and time for your time slot"
                }
              }}
            />
            {error && selectedSessionId && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={CreateTimeSlotModalStyles.dialogActions}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={CreateTimeSlotModalStyles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={CreateTimeSlotModalStyles.saveButton}
          disabled={saving || loading}
        >
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  )
}

export default CreateTimeSlotModal

