const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  Mentor,
  User,
  Position,
  Industry,
  MentorDocument,
  MentorEducation,
  Booking,
  Session,
  ScheduleTimeslot,
  sequelize,
} = require("../models");

const APP_URL = process.env.APP_URL;
if (!APP_URL) throw new Error('APP_URL environment variable is required');

// UPDATED: Register mentor (for guests) - NO EMAIL SENT YET
exports.registerMentor = async (
  mentorData,
  profileImage,
  documents = [],
  education = []
) => {
  let {
    email,
    password,
    first_name,
    last_name,
    phone,
    gender,
    dob,
    position_id,
    industry_id,
    position_name,
    industry_name,
    job_title,
    expertise_areas,
    experience_years,
    company_name,
    social_media,
    about_mentor,
  } = mentorData;

  // Trim and normalize fields
  email = email?.toLowerCase().trim();
  password = password?.trim();
  first_name = first_name?.trim();
  last_name = last_name?.trim();
  phone = phone?.trim();
  job_title = job_title?.trim();
  company_name = company_name?.trim();
  position_name = position_name?.trim();
  industry_name = industry_name?.trim();

  // Validation
  if (!email || !password) throw new Error("Email and password are required");
  if (!first_name || !last_name || !gender || !dob || !phone || !job_title) {
    throw new Error("All required mentor fields must be provided");
  }

  // Validate that either IDs or names are provided for position and industry
  if (!position_id && !position_name) {
    throw new Error("Position ID or Position Name is required");
  }
  if (!industry_id && !industry_name) {
    throw new Error("Industry ID or Industry Name is required");
  }

  // ✅ FIX: Use case-insensitive email check for PostgreSQL
  const exist = await User.findOne({ 
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      email.toLowerCase()
    )
  });
  if (exist) {
    throw new Error(
      "This email is already registered. One email can only be used on one platform. Please use your existing account or use a different email address."
    );
  }

  // Resolve Industry: Use ID if provided, otherwise find or create by name
  let industry;
  if (industry_id) {
    industry = await Industry.findByPk(industry_id);
    if (!industry) throw new Error("Invalid industry_id");
    console.log("✅ Using existing industry:", industry.industry_name);
  } else if (industry_name) {
    try {
      const [foundIndustry, created] = await Industry.findOrCreate({
        where: { industry_name: industry_name },
        defaults: { industry_name: industry_name },
      });
      industry = foundIndustry;
      industry_id = industry.id;
      console.log(
        `${created ? "✅ Created" : "✅ Found"} industry:`,
        industry.industry_name,
        "ID:",
        industry_id
      );
    } catch (error) {
      // Handle unique constraint violation - industry was created between find and create
      if (
        error.name === "SequelizeUniqueConstraintError" ||
        error.original?.code === "23505"
      ) {
        industry = await Industry.findOne({
          where: { industry_name: industry_name },
        });
        if (industry) {
          industry_id = industry.id;
          console.log(
            "✅ Found industry (handled race condition):",
            industry.industry_name,
            "ID:",
            industry_id
          );
        } else {
          throw new Error(
            `Failed to resolve industry "${industry_name}". Please try again.`
          );
        }
      } else {
        throw error;
      }
    }
  } else {
    throw new Error("Industry ID or Industry Name is required");
  }

  // Validate industry_id is set
  if (!industry_id) {
    throw new Error(
      "Failed to resolve industry. Please provide a valid industry ID or name."
    );
  }

  // Resolve Position: Use ID if provided, otherwise find or create by name
  let position;
  if (position_id) {
    position = await Position.findByPk(position_id);
    if (!position) throw new Error("Invalid position_id");
    console.log("✅ Using existing position:", position.position_name);
  } else if (position_name) {
    // Position requires industry_id, so we need to have resolved industry first
    if (!industry_id) {
      throw new Error("Industry must be resolved before creating position");
    }

    // Since position_name has a unique constraint, search by name only
    // If found, use it (even if industry_id differs - use existing position)
    // If not found, create new one with the provided industry_id
    try {
      const existingPosition = await Position.findOne({
        where: { position_name: position_name },
      });

      if (existingPosition) {
        position = existingPosition;
        position_id = position.id;
        console.log(
          "✅ Found existing position:",
          position.position_name,
          "ID:",
          position_id
        );
        // Note: Using existing position even if industry_id differs (position_name is unique)
      } else {
        // Create new position with the provided industry_id
        position = await Position.create({
          position_name: position_name,
          industry_id: industry_id,
        });
        position_id = position.id;
        console.log(
          "✅ Created new position:",
          position.position_name,
          "ID:",
          position_id
        );
      }
    } catch (error) {
      // Handle unique constraint violation - position was created between find and create
      if (
        error.name === "SequelizeUniqueConstraintError" ||
        error.original?.code === "23505"
      ) {
        position = await Position.findOne({
          where: { position_name: position_name },
        });
        if (position) {
          position_id = position.id;
          console.log(
            "✅ Found position (handled race condition):",
            position.position_name,
            "ID:",
            position_id
          );
        } else {
          throw new Error(
            `Failed to resolve position "${position_name}". Please try again.`
          );
        }
      } else {
        throw error;
      }
    }
  } else {
    throw new Error("Position ID or Position Name is required");
  }

  // Validate position_id is set
  if (!position_id) {
    throw new Error(
      "Failed to resolve position. Please provide a valid position ID or name."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User with mentor role (no email verification needed - admin will approve/reject)
  const user = await User.create({
    email,
    password: hashedPassword,
    role_name: "mentor",
    email_verified: false, // Will remain false until admin approves
    status: "unverified", // ✅ Set status to unverified - will be updated when admin approves
  });

  // Validate all required fields before creating Mentor
  if (!first_name || !last_name || !gender || !dob || !phone || !job_title) {
    throw new Error(
      "All required mentor fields must be provided: first_name, last_name, gender, dob, phone, job_title"
    );
  }
  if (!position_id || !industry_id) {
    throw new Error(
      "Position and Industry must be resolved before creating mentor profile"
    );
  }

  // Create Mentor record with PENDING status
  const mentor = await Mentor.create({
    user_id: user.id,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    gender: gender.toLowerCase(),
    dob,
    phone: phone.trim(),
    position_id,
    industry_id,
    job_title: job_title.trim(),
    expertise_areas: expertise_areas?.trim() || null,
    experience_years: experience_years ? parseInt(experience_years) : null,
    company_name: company_name?.trim() || null,
    social_media: social_media?.trim() || null,
    about_mentor: about_mentor?.trim() || null,
    profile_image: profileImage || null,
    approval_status: "pending", // ✅ Waiting for admin approval
  });

  // Insert documents if provided
  if (documents && documents.length > 0) {
    const documentRecords = documents.map((doc) => ({
      mentor_id: mentor.id,
      document_type: doc.document_type || "cv",
      document_url: doc.document_url,
      is_primary_cv: doc.is_primary_cv || false,
    }));

    await MentorDocument.bulkCreate(documentRecords);
  }

  // Insert education if provided (only complete records)
  if (education && education.length > 0) {
    // Filter and validate education records - only include complete ones
    const educationRecords = education
      .filter((edu) => {
        // Must have university_name, degree_name, and year_graduated
        return (
          edu.university_name &&
          edu.degree_name &&
          edu.year_graduated !== null &&
          edu.year_graduated !== undefined &&
          edu.year_graduated !== ""
        );
      })
      .map((edu) => ({
        mentor_id: mentor.id,
        university_name: edu.university_name.trim(),
        degree_name: edu.degree_name.trim(),
        field_of_study: edu.field_of_study?.trim() || null,
        year_graduated: parseInt(edu.year_graduated) || null,
        grade_gpa: edu.grade_gpa?.trim() || null,
        activities: edu.activities?.trim() || null,
      }))
      .filter((edu) => {
        // Double-check year_graduated is valid after parsing
        return edu.year_graduated !== null && !isNaN(edu.year_graduated);
      });

    // Only insert if we have valid records
    if (educationRecords.length > 0) {
      await MentorEducation.bulkCreate(educationRecords);
      console.log(
        `✅ Created ${educationRecords.length} education record(s) for mentor`
      );
    } else {
      console.log(
        "⚠️ No valid education records to insert (missing required fields)"
      );
    }
  }

  // ✅ NO verification email sent - mentor will only receive email when admin approves/rejects
  console.log(
    `✅ Mentor registration completed for ${email}. Waiting for admin approval.`
  );

  return { user, mentor };
};

// UPDATED: Apply as mentor (for logged-in users) - NO EMAIL SENT YET
exports.applyAsMentor = async (
  userId,
  mentorData,
  profileImage,
  documents = [],
  education = []
) => {
  // Check if already applied
  const existing = await Mentor.findOne({ where: { user_id: userId } });
  if (existing) {
    throw new Error(
      `You have already applied (status: ${existing.approval_status})`
    );
  }

  const {
    first_name,
    last_name,
    gender,
    dob,
    phone,
    position_id,
    industry_id,
    job_title,
    expertise_areas,
    experience_years,
    company_name,
    social_media,
    about_mentor,
  } = mentorData;

  // Required fields check
  if (
    !first_name ||
    !last_name ||
    !gender ||
    !dob ||
    !phone ||
    !position_id ||
    !industry_id ||
    !job_title
  ) {
    throw new Error("All required fields must be provided");
  }

  // Verify position and industry exist
  const position = await Position.findByPk(position_id);
  if (!position) throw new Error("Invalid position_id");

  const industry = await Industry.findByPk(industry_id);
  if (!industry) throw new Error("Invalid industry_id");

  const mentor = await Mentor.create({
    user_id: userId,
    first_name,
    last_name,
    gender,
    dob,
    phone,
    position_id,
    industry_id,
    job_title,
    expertise_areas,
    experience_years: experience_years || 0,
    company_name,
    social_media,
    about_mentor,
    profile_image: profileImage || null,
    approval_status: "pending", // ✅ Waiting for admin approval
  });

  // Insert documents if provided
  if (documents && documents.length > 0) {
    const documentRecords = documents.map((doc) => ({
      mentor_id: mentor.id,
      document_type: doc.document_type || "cv",
      document_url: doc.document_url,
      is_primary_cv: doc.is_primary_cv || false,
    }));

    await MentorDocument.bulkCreate(documentRecords);
  }

  // Insert education if provided (only complete records)
  if (education && education.length > 0) {
    // Filter and validate education records - only include complete ones
    const educationRecords = education
      .filter((edu) => {
        // Must have university_name, degree_name, and year_graduated
        return (
          edu.university_name &&
          edu.degree_name &&
          edu.year_graduated !== null &&
          edu.year_graduated !== undefined &&
          edu.year_graduated !== ""
        );
      })
      .map((edu) => ({
        mentor_id: mentor.id,
        university_name: edu.university_name.trim(),
        degree_name: edu.degree_name.trim(),
        field_of_study: edu.field_of_study?.trim() || null,
        year_graduated: parseInt(edu.year_graduated) || null,
        grade_gpa: edu.grade_gpa?.trim() || null,
        activities: edu.activities?.trim() || null,
      }))
      .filter((edu) => {
        // Double-check year_graduated is valid after parsing
        return edu.year_graduated !== null && !isNaN(edu.year_graduated);
      });

    // Only insert if we have valid records
    if (educationRecords.length > 0) {
      await MentorEducation.bulkCreate(educationRecords);
      console.log(
        `✅ Created ${educationRecords.length} education record(s) for mentor`
      );
    } else {
      console.log(
        "⚠️ No valid education records to insert (missing required fields)"
      );
    }
  }

  // UPDATE USER ROLE TO MENTOR (but status remains same until approved)
  await User.update({ role_name: "mentor" }, { where: { id: userId } });

  // ✅ NO EMAIL SENT HERE - Will be sent after admin approval

  return mentor;
};

exports.getMyApplication = async (userId) => {
  const mentor = await Mentor.findOne({
    where: { user_id: userId },
    include: [
      { model: User, attributes: ["id", "email", "role_name", "status"] },
      { model: Position, attributes: ["id", "position_name"] },
      { model: Industry, attributes: ["id", "industry_name"] },
    ],
  });
  if (!mentor) throw new Error("No application found");
  return mentor;
};

exports.getMyProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log("🔍 Querying Mentor table for user_id:", userId);

    // Query Mentor table directly - this is the source of truth for mentor data
    const mentor = await Mentor.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ["id", "email", "role_name", "status"],
        },
        {
          model: Position,
          attributes: ["id", "position_name", "image_position"],
        },
        {
          model: Industry,
          attributes: ["id", "industry_name"],
        },
        {
          model: MentorDocument,
        },
        {
          model: MentorEducation,
        },
      ],
    });

    if (!mentor) {
      throw new Error("Mentor profile not found in Mentor table");
    }

    console.log("✅ Found mentor in Mentor table:", {
      mentor_id: mentor.id,
      first_name: mentor.first_name,
      last_name: mentor.last_name,
      phone: mentor.phone,
      profile_image: mentor.profile_image,
    });

    return { mentor };
  } catch (err) {
    console.error("❌ getMyProfile service error:", err);
    throw err;
  }
};

exports.updateProfile = async (userId, updates, profileImage) => {
  console.log("🔍 Finding mentor in Mentor table for user_id:", userId);

  // Find mentor record in Mentor table
  const mentor = await Mentor.findOne({
    where: { user_id: userId },
    include: [
      { model: User, attributes: ["id", "email", "role_name", "status"] },
    ],
  });

  if (!mentor) {
    throw new Error("Mentor profile not found in Mentor table");
  }

  console.log("✅ Found mentor record in Mentor table:", mentor.id);

  // Check if session_rate is being updated
  const oldSessionRate = mentor.session_rate
    ? parseFloat(mentor.session_rate)
    : null;
  const newSessionRate =
    updates.session_rate !== undefined &&
    updates.session_rate !== null &&
    updates.session_rate !== ""
      ? parseFloat(updates.session_rate)
      : null;
  const sessionRateChanged =
    newSessionRate !== null &&
    !isNaN(newSessionRate) &&
    (oldSessionRate === null ||
      Math.abs(oldSessionRate - newSessionRate) > 0.01);

  // Prepare updates for Mentor table
  // Only update fields that are provided and belong to Mentor table
  const allowedUpdates = {
    first_name: updates.first_name,
    last_name: updates.last_name,
    phone: updates.phone,
    gender: updates.gender,
    dob: updates.dob,
    job_title: updates.job_title,
    expertise_areas: updates.expertise_areas,
    experience_years: updates.experience_years,
    company_name: updates.company_name,
    social_media: updates.social_media,
    about_mentor: updates.about_mentor,
    profile_image: profileImage || updates.profile_image,
    // ✅ Session preferences (if fields exist in model, they'll be saved; otherwise ignored)
    session_rate: updates.session_rate,
    meeting_location: updates.meeting_location,
    // ✅ Position and Industry IDs
    position_id: updates.position_id,
    industry_id: updates.industry_id,
  };

  // Remove undefined/null values
  Object.keys(allowedUpdates).forEach((key) => {
    if (allowedUpdates[key] === undefined || allowedUpdates[key] === null) {
      delete allowedUpdates[key];
    }
  });

  console.log(
    "📝 Updating Mentor table with:",
    JSON.stringify(allowedUpdates, null, 2)
  );

  // Validate that we're not trying to set required fields to null
  const requiredFields = ["first_name", "last_name", "phone", "job_title"];
  requiredFields.forEach((field) => {
    if (
      allowedUpdates[field] !== undefined &&
      (allowedUpdates[field] === null || allowedUpdates[field] === "")
    ) {
      console.warn(
        `⚠️ Warning: Attempting to set required field '${field}' to null/empty. Removing from updates.`
      );
      delete allowedUpdates[field];
    }
  });

  // Update Mentor table record
  try {
    await mentor.update(allowedUpdates);
    console.log("✅ Mentor table updated successfully");
  } catch (updateError) {
    console.error("❌ Error updating mentor record:", updateError);
    console.error("❌ Update error details:", {
      name: updateError.name,
      message: updateError.message,
      sql: updateError.sql,
      allowedUpdates,
    });
    throw updateError;
  }

  // ✅ If session_rate was updated, update all existing sessions' prices to match
  if (sessionRateChanged && newSessionRate > 0) {
    const { Session } = require("../models");
    console.log(
      `💰 Updating all available sessions' prices to match new session_rate: $${newSessionRate}`
    );

    try {
      const updateResult = await Session.update(
        { price: newSessionRate },
        {
          where: {
            mentor_id: mentor.id,
            is_available: true, // Only update available sessions
          },
        }
      );

      console.log(
        `✅ Updated ${updateResult[0]} session(s) with new price: $${newSessionRate}`
      );
    } catch (sessionUpdateError) {
      console.error(
        "⚠️ Warning: Failed to update sessions prices:",
        sessionUpdateError
      );
      // Don't throw error - profile update succeeded, session price update is secondary
    }
  }

  // Reload mentor with all relations to get fresh data
  await mentor.reload({
    include: [
      { model: User, attributes: ["id", "email", "role_name", "status"] },
      {
        model: Position,
        attributes: ["id", "position_name", "image_position"],
      },
      {
        model: Industry,
        attributes: ["id", "industry_name"],
      },
    ],
  });

  console.log("✅ Reloaded mentor data from Mentor table:", {
    first_name: mentor.first_name,
    last_name: mentor.last_name,
    phone: mentor.phone,
    profile_image: mentor.profile_image,
    session_rate: mentor.session_rate,
  });

  return mentor;
};

exports.getAllApprovedMentors = async () => {
  const mentors = await Mentor.findAll({
    where: { approval_status: "approved" },
    include: [
      { model: User, attributes: ["id", "email", "status"] },
      {
        model: Position,
        attributes: ["id", "position_name", "image_position"],
      },
      { model: Industry, attributes: ["id", "industry_name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Add completed sessions count to each mentor
  const mentorsWithStats = await Promise.all(
    mentors.map(async (mentor) => {
      const completedCount = await Booking.count({
        where: { mentor_id: mentor.id, status: "completed" },
      });

      const mentorJson = mentor.toJSON();
      mentorJson.completed_sessions = completedCount;
      return mentorJson;
    })
  );

  return mentorsWithStats;
};

exports.getMentorById = async (mentorId) => {
  const { Booking } = require("../models");
  const mentor = await Mentor.findByPk(mentorId, {
    include: [
      { model: User, attributes: ["id", "email", "role_name", "status"] },
      {
        model: Position,
        attributes: ["id", "position_name", "image_position", "description"],
      },
      { model: Industry, attributes: ["id", "industry_name"] },
      { model: MentorDocument },
      { model: MentorEducation },
    ],
  });
  if (!mentor) throw new Error("Mentor not found");

  // Add completed sessions count
  const completedCount = await Booking.count({
    where: { mentor_id: mentor.id, status: "completed" },
  });

  const mentorJson = mentor.toJSON();
  mentorJson.completed_sessions = completedCount;
  return mentorJson;
};

/**
 * Get mentor statistics (sessions completed, earnings, etc.)
 */
exports.getMyStats = async (userId) => {
  const mentor = await Mentor.findOne({ where: { user_id: userId } });
  if (!mentor) throw new Error("Mentor not found");

  // Count completed sessions
  const completedCount = await Booking.count({
    where: { mentor_id: mentor.id, status: "completed" },
  });

  // Count total bookings
  const totalBookings = await Booking.count({
    where: { mentor_id: mentor.id },
  });

  // Calculate total earnings from completed sessions
  const earnings = await Booking.sum("total_amount", {
    where: { mentor_id: mentor.id, status: "completed" },
  });

  return {
    sessionsCompleted: completedCount,
    totalBookings: totalBookings,
    totalEarnings: earnings || 0,
  };
};

/**
 * Get mentor's available sessions with timeslots
 */
exports.getMyAvailableSessions = async (userId) => {
  const mentor = await Mentor.findOne({ where: { user_id: userId } });
  if (!mentor) throw new Error("Mentor not found");

  const sessions = await Session.findAll({
    where: {
      mentor_id: mentor.id,
      is_available: true,
    },
    include: [
      {
        model: ScheduleTimeslot,
        as: "ScheduleTimeslots", // ← CHANGED from 'timeslots'
        where: { is_available: true },
        required: false,
        attributes: ["id", "start_date", "end_date"],
      },
      {
        model: Position,
        attributes: ["id", "position_name"],
      },
    ],
    order: [
      [
        { model: ScheduleTimeslot, as: "ScheduleTimeslots" },
        "start_date",
        "ASC",
      ], // ← CHANGED
    ],
  });

  // Format for frontend
  const formatted = [];
  sessions.forEach((session) => {
    if (session.ScheduleTimeslots && session.ScheduleTimeslots.length > 0) {
      // ← CHANGED
      session.ScheduleTimeslots.forEach((slot) => {
        // ← CHANGED
        const startDate = new Date(slot.start_date);
        const endDate = new Date(slot.end_date);
        const durationMinutes = Math.round((endDate - startDate) / 60000);

        formatted.push({
          sessionId: session.id,
          timeslotId: slot.id,
          day: startDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          duration: `${durationMinutes} min`,
          time: `${startDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })} - ${endDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}`,
          location: session.location_name,
          price: `$${parseFloat(session.price).toFixed(0)}`,
          positionName: session.Position?.position_name || "Session",
        });
      });
    }
  });

  return formatted;
};

/**
 * Update profile with education support
 */
exports.updateProfileWithEducation = async (userId, updates, profileImage) => {
  const transaction = await sequelize.transaction();

  try {
    // Find the mentor by user_id
    const mentor = await Mentor.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ["id", "email"],
        },
        {
          model: MentorEducation,
          as: "MentorEducations",
        },
      ],
      transaction,
    });

    if (!mentor) {
      await transaction.rollback();
      throw new Error("Mentor profile not found");
    }

    // Prepare mentor updates
    const mentorUpdates = {};

    if (updates.first_name) mentorUpdates.first_name = updates.first_name;
    if (updates.last_name) mentorUpdates.last_name = updates.last_name;
    if (updates.job_title) mentorUpdates.job_title = updates.job_title;
    if (updates.phone) mentorUpdates.phone = updates.phone;
    if (updates.about_mentor) mentorUpdates.about_mentor = updates.about_mentor;
    if (updates.social_media) mentorUpdates.social_media = updates.social_media;
    if (
      updates.company_name &&
      typeof updates.company_name === "string" &&
      updates.company_name.trim()
    ) {
      mentorUpdates.company_name = updates.company_name.trim();
    }
    if (
      updates.experience_years !== undefined &&
      updates.experience_years !== null &&
      updates.experience_years !== ""
    ) {
      const expYears = parseInt(updates.experience_years);
      if (!isNaN(expYears)) {
        mentorUpdates.experience_years = expYears;
      }
    }
    if (updates.session_rate) mentorUpdates.session_rate = updates.session_rate;
    if (updates.meeting_location)
      mentorUpdates.meeting_location = updates.meeting_location;

    // Handle expertise areas - ensure it's stored as string in database
    if (
      updates.expertise_areas !== undefined &&
      updates.expertise_areas !== null
    ) {
      if (Array.isArray(updates.expertise_areas)) {
        // Convert array to comma-separated string for TEXT column
        mentorUpdates.expertise_areas = updates.expertise_areas.join(", ");
      } else if (typeof updates.expertise_areas === "string") {
        // Already a string, use as-is (may already be comma-separated or JSON string)
        mentorUpdates.expertise_areas = updates.expertise_areas;
      }
    }

    // Handle profile image
    if (profileImage) {
      mentorUpdates.profile_image = profileImage; // Already just filename, not full path
    }

    // Update mentor record
    await mentor.update(mentorUpdates, { transaction });

    // Handle education updates
    if (updates.education && Array.isArray(updates.education)) {
      // Delete existing education records
      await MentorEducation.destroy({
        where: { mentor_id: mentor.id },
        transaction,
      });

      // Filter and create new education records (only complete ones)
      const educationRecords = updates.education
        .filter((edu) => {
          // Must have institution, degree, and year
          return (
            edu.institution &&
            edu.degree &&
            edu.year !== null &&
            edu.year !== undefined &&
            edu.year !== ""
          );
        })
        .map((edu) => ({
          mentor_id: mentor.id,
          degree_name: (edu.degree || "").trim(),
          university_name: (edu.institution || "").trim(),
          year_graduated: parseInt(edu.year) || null,
        }))
        .filter((edu) => {
          // Double-check year_graduated is valid after parsing
          return edu.year_graduated !== null && !isNaN(edu.year_graduated);
        });

      if (educationRecords.length > 0) {
        await MentorEducation.bulkCreate(educationRecords, { transaction });
        console.log(
          `✅ Created ${educationRecords.length} education record(s) for mentor`
        );
      } else if (updates.education.length > 0) {
        console.log(
          "⚠️ No valid education records to insert (missing required fields)"
        );
      }
    }

    // Fetch updated mentor with all relations BEFORE committing
    const updatedMentor = await Mentor.findOne({
      where: { id: mentor.id },
      include: [
        {
          model: User,
          attributes: ["id", "email"],
        },
        {
          model: MentorEducation,
          as: "MentorEducations",
        },
        {
          model: MentorDocument,
          as: "MentorDocuments",
        },
      ],
      transaction,
    });

    // Commit transaction
    await transaction.commit();

    return updatedMentor;
  } catch (error) {
    // Only rollback if transaction hasn't been committed yet
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error in updateProfileWithEducation:", error);
    throw error;
  }
};
