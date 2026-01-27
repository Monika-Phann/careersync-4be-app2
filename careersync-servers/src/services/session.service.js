// src/services/session.service.js
const { Session, Mentor, Position, ScheduleTimeslot, MentorEducation, Industry } = require("../models");

exports.createSession = async (mentorUserId, sessionData) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorUserId } });
  if (!mentor || mentor.approval_status !== "approved") {
    throw new Error("Only approved mentors can create sessions");
  }

  const { position_id, price, location_name, location_map_url, agenda_pdf } = sessionData;

  if (!position_id || !price || !location_name || !location_map_url) {
    throw new Error("Missing required session fields");
  }

  // Store only the filename (not full path) for agenda_pdf
  const agendaPdfFilename = agenda_pdf ? agenda_pdf : null;

  const session = await Session.create({
    mentor_id: mentor.id,
    position_id,
    price: parseFloat(price),
    agenda_pdf: agendaPdfFilename,
    location_name,
    location_map_url,
    is_available: true
  });

  return { session };
};

// ✅ FIXED: Changed to accept userId instead of (req, res)
exports.getMySessions = async (userId) => {
  let mentorId;

  if (userId) {
    const mentor = await Mentor.findOne({ where: { user_id: userId } });
    mentorId = mentor?.id;
  } else {
    // TEMPORARY: Use first approved mentor
    const mentor = await Mentor.findOne({ where: { approval_status: "approved" } });
    mentorId = mentor?.id;
  }

  if (!mentorId) {
    return []; // Return empty array instead of sending response
  }

  const sessions = await Session.findAll({
    where: { mentor_id: mentorId },
    include: [
      { model: Position, attributes: ["id", "position_name", "image_position"] },
      {
        model: ScheduleTimeslot,
        as: "ScheduleTimeslots",
        attributes: ["id", "start_time", "end_time", "is_booked"]
      },
      {
        model: Mentor,
        attributes: ["id", "first_name", "last_name", "job_title", "profile_image", "about_mentor"],
        include: [
          { model: Position, attributes: ["id", "position_name", "image_position"] },
          { model: Industry, attributes: ["id", "industry_name"] }
        ]
      }
    ],
    order: [["created_at", "DESC"]]
  });

  return sessions; // Return the data instead of sending response
};

exports.editSession = async (sessionId, mentorUserId, updates) => {
  const { sequelize } = require("../models");
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Get and verify mentor
    const mentor = await Mentor.findOne({ 
      where: { user_id: mentorUserId },
      transaction 
    });
    
    if (!mentor || mentor.approval_status !== "approved") {
      throw new Error("Only approved mentors can edit sessions");
    }

    // 2. Get and verify session ownership
    const session = await Session.findOne({
      where: { id: sessionId, mentor_id: mentor.id },
      transaction
    });
    
    if (!session) {
      throw new Error("Session not found or unauthorized");
    }

    // 3. Destructure all possible update fields from request body
    const { 
      // Session fields
      price,
      location_name,
      location_map_url,
      agenda_pdf,
      is_available,
      
      // Mentor profile fields
      job_title,
      company_name,
      about_mentor,
      expertise_areas,
      social_media,
      experience_years,
      
      // Education array
      education
    } = updates;

    // 4. Update Session fields if provided
    if (price !== undefined) {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("Invalid price value");
      }
      session.price = priceValue;
    }
    
    if (location_name !== undefined) session.location_name = location_name;
    if (location_map_url !== undefined) session.location_map_url = location_map_url;
    if (agenda_pdf !== undefined) session.agenda_pdf = agenda_pdf;
    if (is_available !== undefined) session.is_available = is_available;
    
    await session.save({ transaction });

    // 5. Update Mentor profile fields if provided
    if (job_title !== undefined) mentor.job_title = job_title;
    if (company_name !== undefined) mentor.company_name = company_name;
    if (about_mentor !== undefined) mentor.about_mentor = about_mentor;
    if (expertise_areas !== undefined) {
      mentor.expertise_areas = Array.isArray(expertise_areas) 
        ? JSON.stringify(expertise_areas) 
        : expertise_areas;
    }
    if (social_media !== undefined) mentor.social_media = social_media;
    if (experience_years !== undefined) mentor.experience_years = experience_years;
    
    await mentor.save({ transaction });

    // 6. Update Education records if provided
    if (Array.isArray(education)) {
      // Delete all existing education records for this mentor
      await MentorEducation.destroy({ 
        where: { mentor_id: mentor.id },
        transaction 
      });

      // Create new education records (only complete ones)
      if (education.length > 0) {
        const educationRecords = education
          .filter(edu => {
            // Must have university_name, degree_name, and year_graduated
            return edu.university_name && 
                   edu.degree_name && 
                   edu.year_graduated !== null && 
                   edu.year_graduated !== undefined &&
                   edu.year_graduated !== '';
          })
          .map(edu => ({
            mentor_id: mentor.id,
            university_name: edu.university_name.trim(),
            degree_name: edu.degree_name.trim(),
            field_of_study: edu.field_of_study?.trim() || null,
            year_graduated: parseInt(edu.year_graduated) || null,
            grade_gpa: edu.grade_gpa?.trim() || null,
            activities: edu.activities?.trim() || null
          }))
          .filter(edu => {
            // Double-check year_graduated is valid after parsing
            return edu.year_graduated !== null && !isNaN(edu.year_graduated);
          });
        
        if (educationRecords.length > 0) {
          await MentorEducation.bulkCreate(educationRecords, { transaction });
          console.log(`✅ Created ${educationRecords.length} education record(s) for mentor`);
        } else {
          console.log('⚠️ No valid education records to insert (missing required fields)');
        }
      }
    }

    // Commit all changes
    await transaction.commit();

    // 7. Return fresh data with all associations
    const refreshedSession = await Session.findByPk(sessionId, {
      include: [{ model: Position }]
    });

    const refreshedMentor = await Mentor.findByPk(mentor.id, {
      include: [
        { model: MentorEducation, order: [['year_graduated', 'DESC']] },
        { model: Position },
        { model: Industry }
      ]
    });

    return { 
      session: refreshedSession, 
      mentor: refreshedMentor 
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.getAvailableSessions = async () => {
  return await Session.findAll({
    where: { is_available: true },
    attributes: ["id", "mentor_id", "position_id", "price", "location_name", "location_map_url", "agenda_pdf", "is_available", "created_at", "updated_at"],
    include: [
      {
        model: ScheduleTimeslot,
        as: 'ScheduleTimeslots',
        required: false,
        attributes: ["id", "start_time", "end_time", "is_booked"]
      },
      {
        model: Mentor,
        attributes: ["id", "first_name", "last_name", "job_title", "profile_image", "about_mentor"],
        include: [
          { model: Position, attributes: ["id", "position_name", "image_position"] },
          { model: Industry, attributes: ["id", "industry_name"] }
        ]
      },
      {
        model: Position,
        attributes: ["id", "position_name", "image_position", "description"]
      }
    ],
    order: [["created_at", "DESC"]]
  });
};