// Modified mentorbooking.controller.js
// This version works WITHOUT authentication by using mentorId from query params
// For testing/development only - re-enable auth for production!

const {
  getMyBookings: getMyBookingsService,
  getBookingById: getBookingByIdService,
  acceptBooking: acceptBookingService,
  rejectBooking: rejectBookingService,
  completeBooking: completeBookingService,
  getPendingBookings: getPendingBookingsService,
  getBookingStats: getBookingStatsService,
  getMyStudents: getMyStudentsService,
  getMyEarnings: getMyEarningsService,
  getMyCertificates: getMyCertificatesService,
  getMyInvoices: getMyInvoicesService
} = require("../services/mentorbooking.service");

// Helper to get mentorId (from query param for testing, or from auth token in production)
const getMentorId = (req) => {
  // For testing: use query parameter
  if (req.query.mentorId) {
    return req.query.mentorId;
  }
  // For production: use authenticated user ID
  if (req.user && req.user.id) {
    return req.user.id;
  }
  throw new Error("No mentor ID provided. Please log in.");
};

const getMyBookings = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const bookings = await getMyBookingsService(mentorId);
    res.json({ bookings });
  } catch (error) {
    console.error("Error in getMyBookings:", error);
    res.status(500).json({ message: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const { bookingId } = req.params;
    const booking = await getBookingByIdService(mentorId, bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json({ booking });
  } catch (error) {
    console.error("Error in getBookingById:", error);
    res.status(500).json({ message: error.message });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const { bookingId } = req.params;
    const booking = await acceptBookingService(bookingId, mentorId);
    res.json({ message: "Booking accepted successfully", booking });
  } catch (error) {
    console.error("Error in acceptBooking:", error);
    res.status(500).json({ message: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const { bookingId } = req.params;
    const { rejection_reason } = req.body;
    const booking = await rejectBookingService(bookingId, mentorId, rejection_reason);
    res.json({ message: "Booking rejected successfully", booking });
  } catch (error) {
    console.error("Error in rejectBooking:", error);
    res.status(500).json({ message: error.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const { bookingId } = req.params;
    const booking = await completeBookingService(bookingId, mentorId);
    res.json({ message: "Booking completed successfully", booking });
  } catch (error) {
    console.error("Error in completeBooking:", error);
    res.status(500).json({ message: error.message });
  }
};

const getPendingBookings = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const bookings = await getPendingBookingsService(mentorId);
    res.json({ bookings });
  } catch (error) {
    console.error("Error in getPendingBookings:", error);
    res.status(500).json({ message: error.message });
  }
};

const getBookingStats = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const stats = await getBookingStatsService(mentorId);
    res.json({ stats });
  } catch (error) {
    console.error("Error in getBookingStats:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMyStudents = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const result = await getMyStudentsService(mentorId);
    res.json(result);
  } catch (error) {
    console.error("Error in getMyStudents:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMyEarnings = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const earnings = await getMyEarningsService(mentorId);
    res.json(earnings);
  } catch (error) {
    console.error("Error in getMyEarnings:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const certificates = await getMyCertificatesService(mentorId);
    res.json({ certificates });
  } catch (error) {
    console.error("Error in getMyCertificates:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMyInvoices = async (req, res) => {
  try {
    const mentorId = getMentorId(req);
    const invoices = await getMyInvoicesService(mentorId);
    res.json({ invoices });
  } catch (error) {
    console.error("Error in getMyInvoices:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  getPendingBookings,
  getBookingStats,
  getMyStudents,
  getMyEarnings,
  getMyCertificates,
  getMyInvoices
};