import axiosInstance from './axiosInstance';

/**
 * Get available sessions (Public - no auth required)
 * GET /api/sessions/available
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export const getAvailableSessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/available');
    
    return {
      success: true,
      data: response.data.sessions || [],
      message: response.data.message || 'Available sessions retrieved successfully',
      count: response.data.count || 0
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || 'Failed to fetch available sessions',
      count: 0
    };
  }
};

/**
 * Get my sessions (Authenticated - mentor's own sessions)
 * GET /api/sessions/my-sessions
 * @returns {Promise<{success: boolean, data: Array, message: string}>}
 */
export const getMySessions = async () => {
  try {
    const response = await axiosInstance.get('/sessions/my-sessions');
    
    return {
      success: true,
      data: response.data.sessions || [],
      message: response.data.message || 'Sessions retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || error.message || 'Failed to fetch sessions'
    };
  }
};

/**
 * Create new session (Authenticated)
 * POST /api/sessions/create
 * @param {Object} sessionData - Session data
 * @param {string} sessionData.position_id - Position ID
 * @param {number} sessionData.price - Session price
 * @param {string} sessionData.location_name - Location name
 * @param {string} sessionData.location_map_url - Location map URL
 * @param {File} agendaPdf - Optional PDF file for agenda
 * @returns {Promise<{success: boolean, data: Object, message: string}>}
 */
export const createSession = async (sessionData, agendaPdf = null) => {
  try {
    const formData = new FormData();
    
    // Append session data fields
    Object.keys(sessionData).forEach(key => {
      if (sessionData[key] != null && sessionData[key] !== '') {
        formData.append(key, sessionData[key]);
      }
    });
    
    // Append PDF file if provided
    if (agendaPdf instanceof File) {
      formData.append('agenda_pdf', agendaPdf);
    }
    
    const response = await axiosInstance.post('/sessions/create', formData);
    
    return {
      success: true,
      data: response.data.session || response.data,
      message: response.data.message || 'Session created successfully'
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || 'Failed to create session'
    };
  }
};

/**
 * Edit session (Authenticated)
 * PUT /api/sessions/edit/:sessionId
 * @param {string} sessionId - Session ID
 * @param {Object} sessionData - Updated session data
 * @param {File} agendaPdf - Optional PDF file for agenda
 * @returns {Promise<{success: boolean, data: Object, message: string}>}
 */
export const editSession = async (sessionId, sessionData, agendaPdf = null) => {
  try {
    const formData = new FormData();
    
    // Append session data fields
    Object.keys(sessionData).forEach(key => {
      if (sessionData[key] != null && sessionData[key] !== '') {
        formData.append(key, sessionData[key]);
      }
    });
    
    // Append PDF file if provided
    if (agendaPdf instanceof File) {
      formData.append('agenda_pdf', agendaPdf);
    }
    
    const response = await axiosInstance.put(`/sessions/edit/${sessionId}`, formData);
    
    return {
      success: true,
      data: response.data.session || response.data,
      message: response.data.message || 'Session updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || error.message || 'Failed to update session'
    };
  }
};

/**
 * Format session data for display
 * @param {Object} session - Raw session data from API
 * @returns {Object} Formatted session data
 */
export const formatSessionForDisplay = (session) => {
  // Handle timeslot data - backend uses ScheduleTimeslots array
  const timeslots = session.ScheduleTimeslots || [];
  const timeslot = timeslots[0] || {};
  
  // ✅ Backend uses start_time and end_time (not start_date/end_date)
  const startTime = timeslot.start_time;
  const endTime = timeslot.end_time;
  
  const startDate = startTime ? new Date(startTime) : null;
  const endDate = endTime ? new Date(endTime) : null;
  
  // Calculate duration in minutes
  const durationMinutes = startDate && endDate 
    ? Math.round((endDate - startDate) / 60000) 
    : 60; // Default 60 minutes
  
  // Format date
  const dateStr = startDate 
    ? startDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    : 'TBD';
  
  // Format time
  const timeStr = startDate && endDate
    ? `${startDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })} - ${endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    : 'TBD';
  
  // Determine status - check if booked (has booking_id) or available
  const isBooked = timeslot.is_booked || timeslot.booking_id;
  const status = isBooked ? 'BOOKED' : (timeslot.is_available !== false ? 'AVAILABLE' : 'UNAVAILABLE');
  
  return {
    id: session.id,
    status,
    date: dateStr,
    duration: `${durationMinutes} min`,
    time: timeStr,
    location: session.location_name || 'TBD',
    price: `$${parseFloat(session.price || 0).toFixed(0)}`,
    agendaPdf: session.agenda_pdf 
      ? (session.agenda_pdf.startsWith('http') 
          ? session.agenda_pdf 
          : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/uploads/${session.agenda_pdf}`)
      : null,
    position: session.Position?.position_name || 'N/A',
    mentor: session.Mentor ? {
      name: `${session.Mentor.first_name || ''} ${session.Mentor.last_name || ''}`.trim(),
      jobTitle: session.Mentor.job_title || '',
      profileImage: session.Mentor.profile_image || null
    } : null,
    bookedBy: session.Booking?.AccUser ? {
      name: `${session.Booking.AccUser.first_name || ''} ${session.Booking.AccUser.last_name || ''}`.trim(),
      email: session.Booking.AccUser.User?.email || ''
    } : null,
    // Raw data for reference
    raw: session
  };
};

