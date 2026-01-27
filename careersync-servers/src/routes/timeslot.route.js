// src/routes/timeslot.route.js
const express = require("express");
const router = express.Router();
const timeslotController = require("../controllers/timeslot.controller");
const authMiddleware = require("../middleware/auth");  // ← Import the function directly

// Only require login — no role check (as you requested)
router.use(authMiddleware);

router.get("/", timeslotController.getAllTimeslots); // Get all timeslots for mentor
router.post("/timeslots", timeslotController.addTimeslots); // Allow creating without sessionId (auto-create) - MUST come before /:sessionId route
router.post("/:sessionId/timeslots", timeslotController.addTimeslots);
router.get("/:sessionId/timeslots", timeslotController.getTimeslotsForSession);
router.put("/timeslots/:timeslotId", timeslotController.updateTimeslot);
router.delete("/timeslots/:timeslotId", timeslotController.deleteTimeslot);

module.exports = router;