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

  const { Booking, sequelize } = require("../models");

  // Check if timeslot exists and belongs to mentor
  const timeslot = await ScheduleTimeslot.findOne({
    where: { id: timeslotId, mentor_id: mentor.id }
  });
  if (!timeslot) throw new Error("Timeslot not found or not yours");

  // Use a transaction to ensure atomicity
  const transaction = await sequelize.transaction();

  try {
    // Allow deletion of booked timeslots - mentors can delete their booked slots
    // The booking will still exist with snapshot data, but timeslot reference will be set to null
    // Check if there's a booking and update it before deleting timeslot
    const bookings = await Booking.findAll({
      where: { schedule_timeslot_id: timeslotId },
      transaction
    });
    
    if (bookings && bookings.length > 0) {
      // Try to set bookings' schedule_timeslot_id to null using raw SQL
      // This bypasses Sequelize validation and works even if the column has NOT NULL constraint
      // We'll handle the constraint error separately
      const bookingIds = bookings.map(b => b.id);
      
      try {
        // First, try to alter the column to allow NULL (if not already)
        // This is safe to run multiple times - it will fail silently if already nullable
        await sequelize.query(
          `ALTER TABLE "Booking" ALTER COLUMN schedule_timeslot_id DROP NOT NULL`,
          { transaction }
        );
      } catch (alterError) {
        // Column might already be nullable, or we don't have permission
        // Continue anyway - we'll catch the error when trying to update
        if (!alterError.message.includes('already') && !alterError.message.includes('does not exist')) {
          console.warn('⚠️ Could not alter column:', alterError.message);
        }
      }

      // Now try to update using raw SQL
      try {
        await sequelize.query(
          `UPDATE "Booking" SET schedule_timeslot_id = NULL WHERE id = ANY(ARRAY[:bookingIds]::uuid[])`,
          {
            replacements: { bookingIds },
            type: sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
        console.log(`⚠️ ${bookings.length} booking(s) timeslot reference(s) removed before timeslot deletion`);
      } catch (updateError) {
        // If update fails due to NOT NULL constraint, provide helpful error
        if (updateError.message && updateError.message.includes('violates not-null constraint')) {
          await transaction.rollback();
          throw new Error(
            "Database migration required: The Booking table's schedule_timeslot_id column needs to allow NULL values. " +
            "Please run this SQL command on your database:\n\n" +
            "ALTER TABLE \"Booking\" ALTER COLUMN schedule_timeslot_id DROP NOT NULL;\n\n" +
            "Or run the migration script: migrations/update-booking-timeslot-constraint.sql"
          );
        }
        throw updateError;
      }
    }

    // Delete the timeslot
    await timeslot.destroy({ transaction });

    // Commit the transaction
    await transaction.commit();
    console.log(`✅ Timeslot ${timeslotId} deleted successfully`);
  } catch (error) {
    // Rollback the transaction on error
    await transaction.rollback();
    console.error(`❌ Error deleting timeslot ${timeslotId}:`, error);
    console.error('Error details:', {
      name: error.name,
      message: error.message
    });
    
    // Re-throw with helpful message if it's our custom error
    if (error.message && error.message.includes('Database migration required')) {
      throw error;
    }
    
    // Provide a more helpful error message for other cases
    if (error.message && error.message.includes('violates not-null constraint')) {
      throw new Error(
        "Database migration required: Please run this SQL on your database:\n\n" +
        "ALTER TABLE \"Booking\" ALTER COLUMN schedule_timeslot_id DROP NOT NULL;"
      );
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      throw new Error("Cannot delete timeslot: it is still referenced by a booking. The booking reference should be cleared first.");
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error("Cannot delete timeslot due to unique constraint. Please contact support.");
    }
    throw new Error(error.message || "Failed to delete timeslot. Please try again.");
  }
};

// ✅ FIXED: Get ALL timeslots for a mentor with booking info
// ✅ FIXED: Get ALL timeslots for a mentor with booking info
exports.getAllMentorTimeslots = async (mentorUserId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor) throw new Error("Mentor not found");

  const { Booking, AccUser, User } = require("../models");

  // Get all timeslots for mentor (including booked ones so mentors can view and manage them)
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
        attributes: ['id', 'acc_user_id', 'status', 'created_at'],
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

  // Return all timeslots (including booked ones) so mentors can view and manage them
  return timeslots;
};
