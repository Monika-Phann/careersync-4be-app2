import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const API_URL = `${API_BASE}/api`

function IndustryManagement() {
  const [industries, setIndustries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndustry, setEditingIndustry] = useState(null)
  const [formData, setFormData] = useState({ industry_name: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchIndustries()
  }, [])

  const fetchIndustries = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      const response = await axios.get(`${API_URL}/admin/industry`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIndustries(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching industries:', err)
      setError(err.response?.data?.message || 'Failed to load industries')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (industry = null) => {
    setEditingIndustry(industry)
    setFormData({
      industry_name: industry?.industry_name || ''
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingIndustry(null)
    setFormData({ industry_name: '' })
  }

  const handleSave = async () => {
    if (!formData.industry_name.trim()) {
      setError('Industry name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      if (editingIndustry) {
        // Update existing industry
        await axios.put(
          `${API_URL}/admin/industry/${editingIndustry.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        // Create new industry
        await axios.post(
          `${API_URL}/admin/industry`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      handleCloseDialog()
      fetchIndustries()
    } catch (err) {
      console.error('Error saving industry:', err)
      setError(err.response?.data?.message || 'Failed to save industry')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this industry?')) {
      return
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      await axios.delete(`${API_URL}/admin/industry/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchIndustries()
    } catch (err) {
      console.error('Error deleting industry:', err)
      setError(err.response?.data?.message || 'Failed to delete industry')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Industry Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Industry
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Industry Name</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {industries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No industries found. Click "Add Industry" to create one.
                </TableCell>
              </TableRow>
            ) : (
              industries.map((industry) => (
                <TableRow key={industry.id}>
                  <TableCell>{industry.industry_name}</TableCell>
                  <TableCell>
                    {industry.created_at ? new Date(industry.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(industry)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(industry.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndustry ? 'Edit Industry' : 'Add New Industry'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Industry Name *"
            fullWidth
            value={formData.industry_name}
            onChange={(e) => setFormData({ ...formData, industry_name: e.target.value })}
            placeholder="e.g., Information Technology"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : editingIndustry ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default IndustryManagement


