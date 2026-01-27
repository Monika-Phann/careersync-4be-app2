// src/routes/session.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { createSession, getMySessions, editSession, getAvailableSessions } = require("../controllers/session.controller");
const authenticate = require("../middleware/auth");

// Mentor protected routes
router.post("/create", authenticate, upload.single("agenda_pdf"), createSession);
router.get("/my-sessions", authenticate, getMySessions);
router.put("/edit/:sessionId", authenticate, upload.single("agenda_pdf"), editSession);
router.get("/available", getAvailableSessions);
module.exports = router;