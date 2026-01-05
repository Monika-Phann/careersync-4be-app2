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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const API_URL = `${API_BASE}/api`

function PositionManagement() {
  const [positions, setPositions] = useState([])
  const [industries, setIndustries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState(null)
  const [formData, setFormData] = useState({
    industry_id: '',
    position_name: '',
    description: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      const [positionsRes, industriesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/position`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/industry`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setPositions(positionsRes.data || [])
      setIndustries(industriesRes.data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (position = null) => {
    setEditingPosition(position)
    setFormData({
      industry_id: position?.industry_id || '',
      position_name: position?.position_name || '',
      description: position?.description || '',
    })
    setImageFile(null)
    // Handle both R2 URLs (full URLs) and legacy local paths
    const imageUrl = position?.image_position 
      ? (position.image_position.startsWith('http') 
          ? position.image_position 
          : `${API_URL}${position.image_position}`)
      : null;
    setImagePreview(imageUrl)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPosition(null)
    setFormData({ industry_id: '', position_name: '', description: '' })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!formData.industry_id || !formData.position_name.trim()) {
      setError('Industry and Position Name are required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      const formDataObj = new FormData()
      formDataObj.append('industry_id', formData.industry_id)
      formDataObj.append('position_name', formData.position_name)
      formDataObj.append('description', formData.description || '')
      if (imageFile) {
        formDataObj.append('image_position', imageFile)
      }

      if (editingPosition) {
        // Update existing position
        await axios.put(
          `${API_URL}/admin/position/${editingPosition.id}`,
          formDataObj,
          { headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }}
        )
      } else {
        // Create new position
        await axios.post(
          `${API_URL}/admin/position`,
          formDataObj,
          { headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }}
        )
      }

      handleCloseDialog()
      fetchData()
    } catch (err) {
      console.error('Error saving position:', err)
      setError(err.response?.data?.message || 'Failed to save position')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this position?')) {
      return
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      await axios.delete(`${API_URL}/admin/position/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchData()
    } catch (err) {
      console.error('Error deleting position:', err)
      setError(err.response?.data?.message || 'Failed to delete position')
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
        <Typography variant="h4">Position Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Position
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
              <TableCell>Image</TableCell>
              <TableCell>Position Name</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No positions found. Click "Add Position" to create one.
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell>
                    <Avatar
                      src={position.image_position 
                        ? (position.image_position.startsWith('http') 
                            ? position.image_position 
                            : `${API_URL}${position.image_position}`)
                        : undefined}
                      alt={position.position_name}
                      sx={{ width: 40, height: 40 }}
                    />
                  </TableCell>
                  <TableCell>{position.position_name}</TableCell>
                  <TableCell>{position.Industry?.industry_name || 'N/A'}</TableCell>
                  <TableCell>{position.description || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(position)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(position.id)}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPosition ? 'Edit Position' : 'Add New Position'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Industry *</InputLabel>
              <Select
                value={formData.industry_id}
                onChange={(e) => setFormData({ ...formData, industry_id: e.target.value })}
                label="Industry *"
              >
                {industries.map((industry) => (
                  <MenuItem key={industry.id} value={industry.id}>
                    {industry.industry_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Position Name *"
              fullWidth
              value={formData.position_name}
              onChange={(e) => setFormData({ ...formData, position_name: e.target.value })}
              placeholder="e.g., Software Developer"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the position"
            />

            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                {imageFile ? imageFile.name : 'Upload Position Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Avatar
                    src={imagePreview}
                    alt="Preview"
                    sx={{ width: 100, height: 100, margin: '0 auto' }}
                  />
                </Box>
              )}
            </Box>
          </Box>
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
            {saving ? 'Saving...' : editingPosition ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PositionManagement


