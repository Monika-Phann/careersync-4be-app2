import axios from 'axios';

// Create API instance
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - redirecting to login');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Get all bookings for the logged-in mentor
export const getMyBookings = async () => {
  try {
    const response = await api.get('/api/mentor.bookings/my-bookings');
    return response.data.bookings || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

// Get pending bookings only
export const getPendingBookings = async () => {
  try {
    const response = await api.get('/api/mentor.bookings/pending');
    return response.data.bookings || [];
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    throw error;
  }
};

// Get booking stats
export const getBookingStats = async () => {
  try {
    const response = await api.get('/api/mentor.bookings/stats');
    return response.data.stats || {};
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    throw error;
  }
};

// Accept a booking
export const acceptBooking = async (bookingId) => {
  try {
    const response = await api.patch(`/api/mentor.bookings/${bookingId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting booking:', error);
    throw error;
  }
};

// Reject a booking
export const rejectBooking = async (bookingId, rejection_reason = '') => {
  try {
    const response = await api.patch(`/api/mentor.bookings/${bookingId}/reject`, {
      rejection_reason
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting booking:', error);
    throw error;
  }
};

// Complete a booking
export const completeBooking = async (bookingId) => {
  try {
    const response = await api.patch(`/api/mentor.bookings/${bookingId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing booking:', error);
    throw error;
  }
};

// Get single booking details
export const getBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/api/mentor.bookings/${bookingId}`);
    return response.data.booking;
  } catch (error) {
    console.error('Error fetching booking details:', error);
    throw error;
  }
};

// Get certificates issued by the mentor
export const getMyCertificates = async () => {
  try {
    const response = await api.get('/api/mentor.bookings/certificates');
    return response.data.certificates || [];
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

// Get mentor earnings
export const getMyEarnings = async () => {
  try {
    const response = await api.get('/api/mentor.bookings/earnings');
    return response.data;
  } catch (error) {
    console.error('Error fetching earnings:', error);
    throw error;
  }
};

// Get all invoices for mentor
export const getMyInvoices = async () => {
  try {
    const response = await api.get('/api/mentor.bookings/invoices');
    return response.data.invoices || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Format booking data for display
export const formatBookingForDisplay = (booking) => {
  if (!booking) return null;

  const student = booking.menteeUser || booking.AccUser;
  const timeslot = booking.ScheduleTimeslot; // ✅ Changed from booking.timeslot

  // Calculate duration between start and end time
  const startDate = new Date(booking.start_date_snapshot);
  const endDate = new Date(booking.end_date_snapshot);
  const durationMs = endDate - startDate;
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let duration = '';
  if (durationHours > 0) {
    duration = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
    if (durationMinutes > 0) {
      duration += ` ${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`;
    }
  } else {
    duration = `${durationMinutes} min${durationMinutes > 1 ? 's' : ''}`;
  }

  return {
    id: booking.id,
    bookingId: booking.id,
    user: {
      name: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : booking.acc_user_name_snapshot,
      email: student?.User?.email || 'N/A',
      userId: student?.id || 'N/A',
      firstName: student?.first_name || booking.acc_user_name_snapshot.split(' ')[0],
      lastName: student?.last_name || booking.acc_user_name_snapshot.split(' ')[1] || '',
      phone: student?.phone || 'N/A',
      profileImage: student?.profile_image || '/default-avatar.png',
      gender: student?.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A',
      dateOfBirth: student?.dob ? new Date(student.dob).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A',
      status: student?.types_user || 'Student',
      institution: student?.institution_name || 'N/A',
      joinedDate: student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A',
      lastActive: booking.updated_at ? new Date(booking.updated_at).toLocaleDateString() : 'N/A',
      totalBookings: 1, // This would need to be calculated separately
      totalSpent: parseFloat(booking.total_amount || 0),
      role: student?.types_user || 'Student',
    },
    dateTime: startDate.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    duration,
    amount: parseFloat(booking.total_amount || 0),
    status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
    programName: booking.position_name_snapshot || 'N/A',
    meetingDate: startDate.toLocaleDateString('en-US'),
    bookingDate: booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-US') : 'N/A',
    meetingLocation: 'TBD', // This should come from session data if available
    rawBooking: booking
  };
};

