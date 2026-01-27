// src/routes/mentor.route.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const authenticate = require("../middleware/auth");
const {
  registerMentor,
  applyAsMentor,
  getMyApplication,
  getAllMentors,
  getMentorById,
  getMyProfile,
  updateProfile,
  changePassword,
  getPending,
  approve,
  reject,
  getMyStats,
  getMyAvailableSessions,
  updateProfileFull,
  uploadPDF,
  addEducation,
  updateEducation,
  deleteEducation
} = require("../controllers/mentor.controller");

// Public routes
router.get("/", getAllMentors);
router.get("/:id", getMentorById);

// Guest mentor registration with profile image and documents
router.post("/register", 
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'mentor_documents', maxCount: 10 }
  ]), 
  registerMentor
);

// Authenticated user routes — TEMPORARILY DISABLED for testing
router.post("/apply", 
  // authenticate,  // ← DISABLED FOR TESTING
  upload.fields([
    { name: 'profile_image', maxCount: 1 },
    { name: 'mentor_documents', maxCount: 10 }
  ]), 
  applyAsMentor
);

router.get("/my-application", 
  // authenticate,  // ← DISABLED FOR TESTING
  getMyApplication
);

// Authenticated mentor routes
router.get("/me/profile", 
  authenticate,  // ← ENABLED: Required for SessionProfile
  getMyProfile
);

router.put("/me/profile", 
  authenticate,  // ← ENABLED: Required for profile updates
  upload.single("profile_image"), 
  updateProfile
);

// Change password route
router.put("/me/change-password", 
  authenticate,  // ← ENABLED: Required for password change
  changePassword
);

// ============================================================================
// NEW ROUTES - Added for SessionProfile integration
// ============================================================================

// Get mentor statistics
router.get("/me/stats", 
  // authenticate,  // ← Enable in production
  getMyStats
);

// Get mentor's available sessions
router.get("/me/available-sessions", 
  // authenticate,  // ← Enable in production
  getMyAvailableSessions
);

// Update profile with education support (full update)
router.put("/me/profile-full", 
  // authenticate,  // ← Enable in production
  upload.single("profile_image"), 
  updateProfileFull
);

// PDF upload for session agenda or CV/portfolio
router.post("/me/upload", 
  authenticate,
  upload.single("file"),
  uploadPDF
);

// Education CRUD endpoints
router.post("/me/education",
  authenticate,
  addEducation
);

router.put("/education/:educationId",
  authenticate,
  updateEducation
);

router.delete("/education/:educationId",
  authenticate,
  deleteEducation
);

// ============================================================================

// Admin routes — TEMPORARILY DISABLED auth for testing
router.get("/admin/pending", 
  // authenticate,  // ← DISABLED FOR TESTING
  (req, res, next) => {
    // Temporarily allow all for testing — re-enable role check later
    // if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
    next();
  }, 
  getPending
);

router.patch("/admin/approve/:mentorId", 
  // authenticate,  // ← DISABLED FOR TESTING
  (req, res, next) => {
    next();
  }, 
  approve
);

router.patch("/admin/reject/:mentorId", 
  // authenticate,  // ← DISABLED FOR TESTING
  (req, res, next) => {
    next();
  }, 
  reject
);

module.exports = router;