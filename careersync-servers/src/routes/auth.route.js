// src/routes/authRoute.js
const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

// Auth endpoints
router.post("/register", upload.single("profileImage"), authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/refresh", authController.refresh);

// Get current user (protected route)
router.get("/me", authMiddleware, authController.getMe);

// Email verify - support both path and query parameters
router.get("/verify/:token", authController.verifyEmail);
router.get("/verify", authController.verifyEmail); // For query parameter: ?token=xxx

// Password reset
router.post("/reset-request", authController.resetRequest);
router.get("/reset/:token", authController.showResetPasswordForm); // GET route to show reset form or redirect
router.post("/reset/:token", authController.resetPassword);

module.exports = router;
