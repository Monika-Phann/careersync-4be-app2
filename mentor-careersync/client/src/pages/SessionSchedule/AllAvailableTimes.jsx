import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  LocationOn as LocationOnIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import CreateTimeSlotModal from '../../components/Modals/CreateTimeSlotModal'
import EditTimeSlotModal from '../../components/Modals/EditTimeSlotModal'
import DeleteTimeSlotModal from '../../components/Modals/DeleteTimeSlotModal'
import { AllAvailableTimesStyles } from './AllAvailableTimes.styles'
import { getAllTimeslots, formatTimeslotForDisplay, deleteTimeslot } from '../../api/timeslotApi'

function AllAvailableTimes() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState('Date')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [timeslots, setTimeslots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch timeslots on component mount
  useEffect(() => {
    fetchTimeslots()
  }, [])

  const fetchTimeslots = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL')
      
      const result = await getAllTimeslots()
      
      if (result.success) {
        // Format timeslots for display
        const formattedTimeslots = result.data.map(formatTimeslotForDisplay)
        // Sort by selected criteria
        const sortedTimeslots = sortTimeslots(formattedTimeslots, sortBy)
        setTimeslots(sortedTimeslots)
        console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL')
      } else {
        setError(result.message || 'Failed to load timeslots')
        setTimeslots([])
      }
    } catch (err) {
      console.error('Error fetching timeslots:', err)
      setError(err.message || 'Failed to load timeslots. Please try again.')
      setTimeslots([])
    } finally {
      setLoading(false)
    }
  }

  const sortTimeslots = (data, sortBy) => {
    const sorted = [...data]
    switch (sortBy) {
      case 'Date':
        return sorted.sort((a, b) => {
          const dateA = a.start_time ? new Date(a.start_time) : new Date(0)
          const dateB = b.start_time ? new Date(b.start_time) : new Date(0)
          return dateA - dateB
        })
      case 'Time':
        return sorted.sort((a, b) => {
          const timeA = a.start_time ? new Date(a.start_time) : new Date(0)
          const timeB = b.start_time ? new Date(b.start_time) : new Date(0)
          return timeA - timeB
        })
      case 'Location':
        return sorted.sort((a, b) => {
          const locA = a.location || ''
          const locB = b.location || ''
          return locA.localeCompare(locB)
        })
      case 'Price':
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price.replace('$', '')) || 0
          const priceB = parseFloat(b.price.replace('$', '')) || 0
          return priceA - priceB
        })
      default:
        return sorted
    }
  }

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
    const sorted = sortTimeslots(timeslots, newSortBy)
    setTimeslots(sorted)
  }

  const handleEdit = (timeSlot) => {
    setSelectedTimeSlot(timeSlot)
    setEditModalOpen(true)
  }

  const handleDelete = (timeSlot) => {
    setSelectedTimeSlot(timeSlot)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTimeSlot) return
    
    try {
      setError(null) // Clear any previous errors
      const result = await deleteTimeslot(selectedTimeSlot.id)
      if (result.success) {
        // Remove deleted timeslot from list
        setTimeslots(timeslots.filter(t => t.id !== selectedTimeSlot.id))
        setDeleteModalOpen(false)
        setSelectedTimeSlot(null)
      } else {
        const errorMsg = result.message || 'Failed to delete timeslot'
        setError(errorMsg)
        console.error('Delete timeslot error:', errorMsg)
        // Keep modal open so user can see the error
      }
    } catch (err) {
      console.error('Error deleting timeslot:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete timeslot. Please try again.'
      setError(errorMsg)
      // Keep modal open so user can see the error
    }
  }

  const handleModalClose = () => {
    // Refresh timeslots after modal closes (in case of create/edit)
    fetchTimeslots()
  }

  return (
    <Box sx={AllAvailableTimesStyles.container}>
      {/* Header Section */}
      <Box sx={AllAvailableTimesStyles.headerSection}>
        <Box sx={AllAvailableTimesStyles.headerTopRow}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/session-schedule')}
            sx={AllAvailableTimesStyles.backButton}
          >
            Back to Schedule
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={AllAvailableTimesStyles.addButton}
          >
            Add New Times
          </Button>
        </Box>
        <Box sx={AllAvailableTimesStyles.titleSection}>
          <Typography variant="h4" sx={AllAvailableTimesStyles.mainTitle}>
            All Available Times
          </Typography>
          <Typography variant="body2" sx={AllAvailableTimesStyles.subtitle}>
            Manage your available time slots
          </Typography>
        </Box>
      </Box>

      {/* Sort Section */}
      <Box sx={AllAvailableTimesStyles.sortSection}>
        <Box sx={AllAvailableTimesStyles.sortGroup}>
          <FilterListIcon sx={AllAvailableTimesStyles.filterIcon} />
          <Typography variant="body2" sx={AllAvailableTimesStyles.sortLabel}>
            Sort by:
          </Typography>
          <Button
            variant={sortBy === 'Date' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('Date')}
            sx={AllAvailableTimesStyles.sortButton}
          >
            Date
          </Button>
          <Button
            variant={sortBy === 'Time' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('Time')}
            sx={AllAvailableTimesStyles.sortButton}
          >
            Time
          </Button>
          <Button
            variant={sortBy === 'Location' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('Location')}
            sx={AllAvailableTimesStyles.sortButton}
          >
            Location
          </Button>
          <Button
            variant={sortBy === 'Price' ? 'contained' : 'outlined'}
            onClick={() => handleSortChange('Price')}
            sx={AllAvailableTimesStyles.sortButton}
          >
            Price
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      ) : error && timeslots.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchTimeslots}>
            Retry
          </Button>
        </Box>
      ) : timeslots.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sessions have been created
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't created any sessions yet. Create your first session to get started!
          </Typography>
        </Box>
      ) : (
        <>
          {/* Error Alert (non-blocking) */}
          {error && (
            <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Time Slots Grid */}
          <Grid container spacing={3}>
            {timeslots.map((timeSlot) => (
              <Grid item xs={12} sm={6} key={timeSlot.id}>
                <Card sx={AllAvailableTimesStyles.timeSlotCard}>
                  <CardContent sx={AllAvailableTimesStyles.timeSlotContent}>
                    <Box sx={AllAvailableTimesStyles.timeSlotHeader}>
                      <Box sx={AllAvailableTimesStyles.timeSlotHeaderLeft}>
                        <Typography variant="body1" sx={AllAvailableTimesStyles.timeSlotDate}>
                          {timeSlot.date}
                        </Typography>
                        <Typography variant="body2" sx={AllAvailableTimesStyles.timeSlotDuration}>
                          • {timeSlot.duration}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={AllAvailableTimesStyles.timeSlotPrice}>
                        {timeSlot.price}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={AllAvailableTimesStyles.timeSlotTime}>
                      {timeSlot.time}
                    </Typography>
                    <Box sx={AllAvailableTimesStyles.timeSlotLocation}>
                      <LocationOnIcon sx={AllAvailableTimesStyles.locationIcon} />
                      <Typography variant="body2" sx={AllAvailableTimesStyles.locationText}>
                        {timeSlot.location}
                      </Typography>
                    </Box>
                    <Box sx={AllAvailableTimesStyles.actionButtons}>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(timeSlot)}
                        sx={AllAvailableTimesStyles.editButton}
                        disabled={timeSlot.status === 'BOOKED'}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={
                          <Box
                            component="img"
                            src="/delete-trach.svg"
                            alt=""
                            sx={{ width: 16, height: 16 }}
                          />
                        }
                        onClick={() => handleDelete(timeSlot)}
                        sx={AllAvailableTimesStyles.deleteButton}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Modals */}
      <CreateTimeSlotModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          handleModalClose()
        }}
      />
      <EditTimeSlotModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedTimeSlot(null)
          handleModalClose()
        }}
        timeSlot={selectedTimeSlot}
      />
      <DeleteTimeSlotModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSelectedTimeSlot(null)
          setError(null) // Clear error when closing modal
        }}
        timeSlot={selectedTimeSlot}
        onConfirm={handleDeleteConfirm}
        error={error}
      />
    </Box>
  )
}

export default AllAvailableTimes

