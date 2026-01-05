import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material'
import { Close as CloseIcon, Description as DescriptionIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material'
import { SessionAgendaModalStyles } from './SessionAgendaModal.styles'
import axiosInstance from '../../api/axiosInstance'

function SessionAgendaModal({ open, onClose, agendaPdfUrl = null }) {
  const getBaseUrl = () => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
    const baseURL = axiosInstance.defaults.baseURL || `${API_BASE}/api`;
    return baseURL.replace('/api', '');
  };

  // Construct full URL if needed
  const fullPdfUrl = agendaPdfUrl 
    ? (agendaPdfUrl.startsWith('http') 
        ? agendaPdfUrl 
        : `${getBaseUrl()}/uploads/${agendaPdfUrl}`)
    : null;

  const handleViewPdf = () => {
    if (fullPdfUrl) {
      window.open(fullPdfUrl, '_blank');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          ...SessionAgendaModalStyles.dialogPaper,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={SessionAgendaModalStyles.dialogTitle}>
        <Box sx={SessionAgendaModalStyles.titleContainer}>
          <Typography variant="h4" sx={SessionAgendaModalStyles.title}>
            Session Agenda
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={SessionAgendaModalStyles.closeButton}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent 
        sx={{
          ...SessionAgendaModalStyles.dialogContent,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {fullPdfUrl ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Session Agenda PDF
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={handleViewPdf}
              >
                Open in New Tab
              </Button>
            </Box>
            <Box
              component="iframe"
              src={`${fullPdfUrl}#toolbar=1`}
              sx={{
                width: '100%',
                height: '100%',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                flex: 1,
                minHeight: 0,
                backgroundColor: '#f5f5f5',
              }}
              title="Session Agenda PDF"
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 4 }}>
            <DescriptionIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
            <Typography variant="h6" sx={{ textAlign: 'center' }}>
              No Session Agenda Available
            </Typography>
            <Alert severity="info" sx={{ width: '100%', maxWidth: 500 }}>
              No agenda PDF has been uploaded for this session yet. Please upload an agenda PDF when creating or editing a session.
            </Alert>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SessionAgendaModal

