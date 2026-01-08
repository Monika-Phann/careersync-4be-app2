const { ScheduleTimeslot, Session, Mentor } = require("../models");

exports.addTimeslots = async (mentorUserId, sessionId, timeslots) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor) throw new Error("Mentor not found");

  let session = await Session.findOne({
    where: { id: sessionId, mentor_id: mentor.id }
  });
  
  // If sessionId is "auto-create" or session not found, auto-create a session
  if (!session && (!sessionId || sessionId === 'auto-create')) {
    // Get session_rate and meeting_location from mentor profile
    const sessionRate = mentor.session_rate || 60;
    const meetingLocation = mentor.meeting_location || 'Online';
    
    // Use mentor's position_id (required field)
    if (!mentor.position_id) {
      throw new Error("Mentor position is required. Please complete your profile first.");
    }
    
    // Create a default session using mentor's profile data
    session = await Session.create({
      mentor_id: mentor.id,
      position_id: mentor.position_id,
      price: parseFloat(sessionRate),
      location_name: meetingLocation,
      location_map_url: `https://maps.google.com/?q=${encodeURIComponent(meetingLocation)}`,
      is_available: true
    });
    
    console.log(`✅ Auto-created session for mentor ${mentor.id} with rate $${sessionRate} and location ${meetingLocation}`);
  }
  
  if (!session) throw new Error("Session not found or not yours");

  if (!Array.isArray(timeslots) || timeslots.length === 0) {
    throw new Error("At least one timeslot is required");
  }

  const records = timeslots.map(slot => ({
    session_id: session.id, // Use the actual session.id (either found or auto-created)
    mentor_id: mentor.id,
    start_time: new Date(slot.start_time || slot.start_date),
    end_time: new Date(slot.end_time || slot.end_date),
    is_booked: false
  }));

  const created = await ScheduleTimeslot.bulkCreate(records);
  return { addedCount: created.length, sessionId: session.id };
};

exports.getTimeslotsForSession = async (sessionId, mentorUserId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor) throw new Error("Mentor not found");

  const session = await Session.findOne({
    where: { id: sessionId, mentor_id: mentor.id }
  });
  if (!session) throw new Error("Session not found or not yours");

  return await ScheduleTimeslot.findAll({
    where: { session_id: sessionId },
    order: [["start_time", "ASC"]]
  });
};

exports.updateTimeslot = async (mentorUserId, timeslotId, updates) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor) throw new Error("Mentor not found");

  const timeslot = await ScheduleTimeslot.findOne({
    where: { id: timeslotId, mentor_id: mentor.id }
  });
  if (!timeslot) throw new Error("Timeslot not found or not yours");

  if (updates.start_time || updates.start_date) timeslot.start_time = new Date(updates.start_time || updates.start_date);
  if (updates.end_time || updates.end_date) timeslot.end_time = new Date(updates.end_time || updates.end_date);

  await timeslot.save();
  return timeslot;
};

exports.deleteTimeslot = async (mentorUserId, timeslotId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor) throw new Error("Mentor not found");

  const { Booking } = require("../models");

  // Check if timeslot exists and belongs to mentor
  const timeslot = await ScheduleTimeslot.findOne({
    where: { id: timeslotId, mentor_id: mentor.id }
  });
  if (!timeslot) throw new Error("Timeslot not found or not yours");

  // Check if timeslot has an associated booking
  const booking = await Booking.findOne({
    where: { schedule_timeslot_id: timeslotId }
  });
  if (booking) throw new Error("Cannot delete timeslot that is already booked");

  await timeslot.destroy();
};

// ✅ FIXED: Get ALL timeslots for a mentor with booking info
// ✅ FIXED: Get ALL timeslots for a mentor with booking info
exports.getAllMentorTimeslots = async (mentorUserId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor) throw new Error("Mentor not found");

  const { Booking, AccUser, User } = require("../models");

  // Get all timeslots for mentor
  const timeslots = await ScheduleTimeslot.findAll({
    where: { 
      mentor_id: mentor.id
    },
    include: [
      {
        model: Session,
        attributes: ['id', 'location_name', 'price']
      },
      {
        model: Booking,
        attributes: ['id', 'acc_user_id', 'status'],
        required: false,
        include: [{
          model: AccUser,
          as: 'menteeUser',
          attributes: ['id', 'first_name', 'last_name', 'user_id'],
          include: [{
            model: User,
            attributes: ['email']
          }]
        }]
      }
    ],
    order: [["start_time", "ASC"]]
  });

  // Filter out timeslots that have bookings (they should be deleted automatically when booked,
  // but this handles any edge cases or existing data)
  return timeslots.filter(timeslot => {
    // If timeslot has a booking, it should have been deleted, but filter it out just in case
    const hasBooking = timeslot.Booking && timeslot.Booking.id;
    return !hasBooking;
  });
};
