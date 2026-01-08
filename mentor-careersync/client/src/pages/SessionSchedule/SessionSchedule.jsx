import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  LocationOn as LocationOnIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material'
import { SessionScheduleStyles } from './SessionSchedule.styles'
import { getAllTimeslots, formatTimeslotForDisplay } from '../../api/timeslotApi'

function SessionSchedule() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const [timeslots, setTimeslots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch timeslots on component mount
  useEffect(() => {
    const fetchTimeslots = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('CAREERSYNC PLATFORM CREATING BY 4BE AT ABOVE AND BEYONG SCHOOL')
        
        const result = await getAllTimeslots()
        
        if (result.success) {
          // Format timeslots for display
          const formattedTimeslots = result.data.map(formatTimeslotForDisplay)
          setTimeslots(formattedTimeslots)
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
    
    fetchTimeslots()
  }, [])

  // Calculate statistics
  const totalSessions = timeslots.length
  const bookedSessions = timeslots.filter((t) => t.status === 'BOOKED').length
  const availableSlots = timeslots.filter((t) => t.status === 'AVAILABLE').length

  // Filter timeslots based on selected filter
  const filteredTimeslots = timeslots.filter((timeslot) => {
    if (filter === 'All') return true
    if (filter === 'Available') return timeslot.status === 'AVAILABLE'
    if (filter === 'Booked') return timeslot.status === 'BOOKED'
    return true
  })


  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Show error state
  if (error && timeslots.length === 0) {
    return (
      <Box sx={SessionScheduleStyles.container}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={SessionScheduleStyles.container}>
      {/* Error Alert (non-blocking) */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={SessionScheduleStyles.summaryCards}>
        <Grid item xs={12} sm={4}>
          <Card sx={SessionScheduleStyles.summaryCard}>
            <CardContent sx={SessionScheduleStyles.summaryCardContent}>
              <Box sx={SessionScheduleStyles.summaryContent}>
                <Box sx={SessionScheduleStyles.summaryTopRow}>
                  <Box
                    component="img"
                    src="/ttl-session.svg"
                    alt="Total Sessions"
                    sx={SessionScheduleStyles.summaryIcon}
                  />
                  <Typography variant="body2" sx={SessionScheduleStyles.summaryLabel}>
                    Total Sessions
                  </Typography>
                </Box>
                <Typography variant="h4" sx={SessionScheduleStyles.summaryValue}>
                  {totalSessions}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={SessionScheduleStyles.summaryCard}>
            <CardContent sx={SessionScheduleStyles.summaryCardContent}>
              <Box sx={SessionScheduleStyles.summaryContent}>
                <Box sx={SessionScheduleStyles.summaryTopRow}>
                  <Box
                    component="img"
                    src="/booking-session.svg"
                    alt="Booked Sessions"
                    sx={SessionScheduleStyles.summaryIcon}
                  />
                  <Typography variant="body2" sx={SessionScheduleStyles.summaryLabel}>
                    Booked Sessions
                  </Typography>
                </Box>
                <Typography variant="h4" sx={SessionScheduleStyles.summaryValue}>
                  {bookedSessions}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={SessionScheduleStyles.summaryCard}>
            <CardContent sx={SessionScheduleStyles.summaryCardContent}>
              <Box sx={SessionScheduleStyles.summaryContent}>
                <Box sx={SessionScheduleStyles.summaryTopRow}>
                  <Box
                    component="img"
                    src="/ava-slot.svg"
                    alt="Available Slots"
                    sx={SessionScheduleStyles.summaryIcon}
                  />
                  <Typography variant="body2" sx={SessionScheduleStyles.summaryLabel}>
                    Available Slots
                  </Typography>
                </Box>
                <Typography variant="h4" sx={SessionScheduleStyles.summaryValue}>
                  {availableSlots}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Sort Section */}
      <Box sx={SessionScheduleStyles.filterSortSection}>
        <Box sx={SessionScheduleStyles.filterGroup}>
          <Box sx={SessionScheduleStyles.filterLabelContainer}>
            <FilterListIcon sx={SessionScheduleStyles.filterIcon} />
            <Typography variant="body2" sx={SessionScheduleStyles.filterLabel}>
              Filter:
            </Typography>
          </Box>
          <Button
            variant={filter === 'All' ? 'contained' : 'outlined'}
            onClick={() => setFilter('All')}
            sx={SessionScheduleStyles.filterButton}
          >
            All ({totalSessions})
          </Button>
          <Button
            variant={filter === 'Available' ? 'contained' : 'outlined'}
            onClick={() => setFilter('Available')}
            sx={SessionScheduleStyles.filterButton}
          >
            Available ({availableSlots})
          </Button>
          <Button
            variant={filter === 'Booked' ? 'contained' : 'outlined'}
            onClick={() => setFilter('Booked')}
            sx={SessionScheduleStyles.filterButton}
          >
            Booked ({bookedSessions})
          </Button>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/session-schedule/available-times')}
          sx={SessionScheduleStyles.viewAllButton}
        >
          View All Available Times
        </Button>
      </Box>

      {/* Timeslot Cards Grid */}
      {filteredTimeslots.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sessions have been created
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filter === 'All' 
              ? 'You haven\'t created any sessions yet. Create your first session to get started!'
              : `No ${filter.toLowerCase()} sessions found.`
            }
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTimeslots.map((timeslot) => (
          <Grid item xs={12} sm={6} md={4} key={timeslot.id}>
            <Card
              sx={{
                ...SessionScheduleStyles.sessionCard,
                border:
                  timeslot.status === 'BOOKED'
                    ? '2px solid #4CAF50'
                    : '2px solid #E0E0E0',
              }}
            >
              <CardContent sx={SessionScheduleStyles.sessionCardContent}>
                <Box sx={SessionScheduleStyles.sessionCardHeader}>
                  <Chip
                    label={timeslot.status}
                    sx={{
                      ...SessionScheduleStyles.statusChip,
                      backgroundColor:
                        timeslot.status === 'BOOKED' ? '#0B7A39' : '#FF9800',
                      color: '#ffffff',
                    }}
                  />
                  <Typography variant="h6" sx={SessionScheduleStyles.sessionPrice}>
                    {timeslot.price}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={SessionScheduleStyles.sessionDate}>
                  {timeslot.date}
                </Typography>
                <Typography variant="body2" sx={SessionScheduleStyles.sessionDuration}>
                  {timeslot.duration}
                </Typography>
                <Typography variant="body2" sx={SessionScheduleStyles.sessionTime}>
                  {timeslot.time}
                </Typography>
                <Box sx={SessionScheduleStyles.sessionLocation}>
                  <LocationOnIcon sx={SessionScheduleStyles.locationIcon} />
                  <Typography variant="body2" sx={SessionScheduleStyles.locationText}>
                    {timeslot.location}
                  </Typography>
                </Box>
                {timeslot.raw?.Booking?.menteeUser && (
                  <Box sx={SessionScheduleStyles.bookedBySection}>
                    <Typography variant="body2" sx={SessionScheduleStyles.bookedByLabel}>
                      Booked by:
                    </Typography>
                    <Typography variant="body2" sx={SessionScheduleStyles.bookedByName}>
                      {`${timeslot.raw.Booking.menteeUser.first_name || ''} ${timeslot.raw.Booking.menteeUser.last_name || ''}`.trim()}
                    </Typography>
                    <Typography variant="body2" sx={SessionScheduleStyles.bookedByEmail}>
                      {timeslot.raw.Booking.menteeUser.User?.email || ''}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default SessionSchedule

