const timeslotService = require("../services/timeslot.service");

exports.addTimeslots = async (req, res) => {
  try {
    // sessionId can come from params (if route is /:sessionId/timeslots) or be undefined (if route is /timeslots)
    let sessionId = req.params.sessionId; // Will be undefined if route is /timeslots
    const timeslots = req.body;

    // If sessionId is not provided, pass null to auto-create
    if (!sessionId) {
      sessionId = null;
    }

    const result = await timeslotService.addTimeslots(req.user.id, sessionId, timeslots);

    res.status(201).json({
      message: "Timeslots added successfully",
      addedCount: result.addedCount,
      sessionId: result.sessionId // Return the created/found session ID
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTimeslotsForSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const timeslots = await timeslotService.getTimeslotsForSession(sessionId, req.user.id);
    res.json({ timeslots });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;
    const updated = await timeslotService.updateTimeslot(req.user.id, timeslotId, req.body);
    res.json({ message: "Timeslot updated", timeslot: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTimeslot = async (req, res) => {
  try {
    const { timeslotId } = req.params;
    await timeslotService.deleteTimeslot(req.user.id, timeslotId);
    res.json({ message: "Timeslot deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllTimeslots = async (req, res) => {
  try {
    const timeslots = await timeslotService.getAllMentorTimeslots(req.user.id);
    res.json({ timeslots });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
