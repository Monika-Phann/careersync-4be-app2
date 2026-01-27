const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin-management.controller");
const adminAuth = require("../middleware/adminAuth");
const requireAdmin = adminAuth;

router.put(
  "/profile/update",
  requireAdmin,
  adminController.uploadProfile.single("profile_image"),
  adminController.updateAdminProfile
);
router.put(
  "/profile",
  requireAdmin,
  adminController.uploadProfile.single("profile_image"),
  adminController.updateAdminProfile
);

router.get("/dashboard", requireAdmin, adminController.getAdminDashboard);
router.get("/mentors/stats", requireAdmin, adminController.getMentorStats);

router.get("/industry", requireAdmin, adminController.getIndustries);
router.post("/industry", requireAdmin, adminController.createIndustry);
router.put("/industry/:id", requireAdmin, adminController.updateIndustry);
router.delete("/industry/:id", requireAdmin, adminController.deleteIndustry);

router.get("/position", requireAdmin, adminController.getPositions);
router.post(
  "/position",
  requireAdmin,
  adminController.uploadPosition.single("image_position"),
  adminController.createPosition
);
router.put(
  "/position/:id",
  requireAdmin,
  adminController.uploadPosition.single("image_position"),
  adminController.updatePosition
);
router.delete("/position/:id", requireAdmin, adminController.deletePosition);

router.get("/mentors", requireAdmin, adminController.getAllMentors);
router.get(
  "/mentors/pending",
  requireAdmin,
  adminController.listPendingMentors
);
router.get("/mentors/:id", requireAdmin, adminController.getMentorById);
router.put("/mentors/:id/approve", requireAdmin, adminController.approveMentor);
router.put("/mentors/:id/reject", requireAdmin, adminController.rejectMentor);
router.patch(
  "/mentors/:mentorId/review",
  requireAdmin,
  adminController.reviewMentor
);

router.get("/users", requireAdmin, adminController.getAllUsers);
router.get("/users/:id", requireAdmin, adminController.getUserDetails);
router.post(
  "/create-user",
  requireAdmin,
  adminController.uploadProfile.single("profile_image"),
  adminController.createUser
);
router.delete("/users/:id", requireAdmin, adminController.deleteUser);

router.get("/bookings", requireAdmin, adminController.getAllBookings);
router.get("/bookings/:id", requireAdmin, adminController.getBookingDetails);
router.patch(
  "/bookings/:id/status",
  requireAdmin,
  adminController.updateBookingStatus
);
router.delete("/bookings/:id", requireAdmin, adminController.deleteBooking);

router.post("/setup/initial-admin", adminController.createInitialAdmin);

module.exports = router;
