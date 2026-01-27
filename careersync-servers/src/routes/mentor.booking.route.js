const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth.js");
const {
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
} = require("../controllers/mentorbooking.controller.js");

// All routes require authentication
router.use(authenticate);

router.get("/earnings", getMyEarnings);

// Get all bookings for logged-in mentor
router.get("/my-bookings", getMyBookings);

// Get pending bookings only
router.get("/pending", getPendingBookings);

// Get certificates issued by mentor (must be before /:bookingId route)
router.get("/certificates", getMyCertificates);

// Get invoices for mentor (must be before /:bookingId route)
router.get("/invoices", getMyInvoices);

// Get booking stats
router.get("/stats", getBookingStats);

// Get my students
router.get("/my-students", getMyStudents);

// Get single booking details (must be last to avoid matching other routes)
router.get("/:bookingId", getBookingById);

// Accept/Confirm booking
router.patch("/:bookingId/accept", acceptBooking);

// Reject/Cancel booking
router.patch("/:bookingId/reject", rejectBooking);

// Mark booking as completed
router.patch("/:bookingId/complete", completeBooking);

module.exports = router;