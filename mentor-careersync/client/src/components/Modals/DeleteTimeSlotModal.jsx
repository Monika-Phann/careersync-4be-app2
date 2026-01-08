import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Alert,
} from '@mui/material'
import {
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { DeleteTimeSlotModalStyles } from './DeleteTimeSlotModal.styles'

function DeleteTimeSlotModal({ open, onClose, timeSlot, onConfirm, error }) {
  const handleDelete = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL')
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: DeleteTimeSlotModalStyles.dialogPaper,
      }}
    >
      <DialogTitle sx={DeleteTimeSlotModalStyles.dialogTitle}>
        <Typography variant="h6" sx={DeleteTimeSlotModalStyles.title}>
          Delete Time Slot
        </Typography>
        <IconButton
          onClick={onClose}
          sx={DeleteTimeSlotModalStyles.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={DeleteTimeSlotModalStyles.dialogContent}>
        <Typography variant="body2" sx={DeleteTimeSlotModalStyles.warningText}>
          This action cannot be undone
        </Typography>
        <Typography variant="body1" sx={DeleteTimeSlotModalStyles.questionText}>
          Are you sure you want to delete this time slot?
        </Typography>

        {timeSlot && (
          <Box sx={DeleteTimeSlotModalStyles.timeSlotInfo}>
            <AccessTimeIcon sx={DeleteTimeSlotModalStyles.timeIcon} />
            <Box>
              <Typography variant="body1" sx={DeleteTimeSlotModalStyles.timeSlotDate}>
                {timeSlot.date}
              </Typography>
              <Typography variant="body2" sx={DeleteTimeSlotModalStyles.timeSlotTime}>
                {timeSlot.time}
              </Typography>
            </Box>
          </Box>
        )}

        <Alert
          icon={<WarningIcon />}
          severity="warning"
          sx={DeleteTimeSlotModalStyles.warningAlert}
        >
          Warning: Once deleted, this time slot will be permanently removed and cannot be recovered.
        </Alert>
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
          >
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={DeleteTimeSlotModalStyles.dialogActions}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={DeleteTimeSlotModalStyles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDelete}
          startIcon={<DeleteIcon />}
          sx={DeleteTimeSlotModalStyles.deleteButton}
        >
          Delete Time Slot
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteTimeSlotModal

