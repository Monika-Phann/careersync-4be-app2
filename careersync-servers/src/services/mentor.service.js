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

// --- HELPER: Notify Admin ---
const notifyAdminOfNewMentor = async (email, firstName, lastName) => {
  try {
    const emailService = require("./email.service");
    const adminEmail = process.env.ADMIN_EMAIL || 'careersync168@gmail.com';
    
    console.log(`🚀 SERVICE: Notifying admin (${adminEmail}) about new mentor: ${email}`);
    
    await emailService.sendEmail(
      adminEmail,
      "🚨 Action Required: New Mentor Registration",
      `<h3>New Mentor Approval Needed</h3>
       <p><strong>Name:</strong> ${firstName} ${lastName}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p>A new mentor has registered and is waiting for your approval in the admin dashboard.</p>`,
      `New Mentor Registration: ${email}`
    );
    console.log(`✅ Admin notification sent to ${adminEmail}`);
  } catch (mailErr) {
    console.error("❌ Admin notification failed:", mailErr.message);
  }
};

// UPDATED: Register mentor (for guests)
exports.registerMentor = async (
  mentorData,
  profileImage,
  documents = [],
  education = []
) => {
  let {
    email, password, first_name, last_name, phone, gender, dob,
    position_id, industry_id, position_name, industry_name,
    job_title, expertise_areas, experience_years, company_name,
    social_media, about_mentor,
  } = mentorData;

  // Trim and normalize
  email = email?.toLowerCase().trim();
  password = password?.trim();
  first_name = first_name?.trim();
  last_name = last_name?.trim();

  if (!email || !password) throw new Error("Email and password are required");

  // Case-insensitive check for PostgreSQL
  const exist = await User.findOne({ 
    where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email.toLowerCase())
  });
  if (exist) throw new Error("This email is already registered.");

  // Resolve Industry (with race condition handling)
  let industry_id_resolved = industry_id;
  if (!industry_id_resolved && industry_name) {
    const [ind] = await Industry.findOrCreate({ 
        where: { industry_name }, 
        defaults: { industry_name } 
    });
    industry_id_resolved = ind.id;
  }

  // Resolve Position
  let position_id_resolved = position_id;
  if (!position_id_resolved && position_name) {
    const [pos] = await Position.findOrCreate({ 
      where: { position_name }, 
      defaults: { position_name, industry_id: industry_id_resolved } 
    });
    position_id_resolved = pos.id;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User
  const user = await User.create({
    email,
    password: hashedPassword,
    role_name: "mentor",
    email_verified: false,
    status: "unverified",
  });

  // Create Mentor
  const mentor = await Mentor.create({
    user_id: user.id,
    first_name,
    last_name,
    gender: gender?.toLowerCase(),
    dob,
    phone,
    position_id: position_id_resolved,
    industry_id: industry_id_resolved,
    job_title,
    expertise_areas,
    experience_years: parseInt(experience_years) || 0,
    company_name,
    social_media,
    about_mentor,
    profile_image: profileImage || null,
    approval_status: "pending",
  });

  // ✅ NOTIFY ADMIN
  await notifyAdminOfNewMentor(email, first_name, last_name);

  // Bulk inserts for Docs and Edu
  if (documents?.length > 0) {
    await MentorDocument.bulkCreate(documents.map(d => ({ ...d, mentor_id: mentor.id })));
  }
  if (education?.length > 0) {
    const eduData = education.filter(e => e.university_name && e.degree_name)
      .map(e => ({ ...e, mentor_id: mentor.id, year_graduated: parseInt(e.year_graduated) }));
    if (eduData.length > 0) await MentorEducation.bulkCreate(eduData);
  }

  return { user, mentor };
};

// UPDATED: Apply as mentor (for existing users)
exports.applyAsMentor = async (userId, mentorData, profileImage, documents = [], education = []) => {
  const existing = await Mentor.findOne({ where: { user_id: userId } });
  if (existing) throw new Error(`Already applied (status: ${existing.approval_status})`);

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const mentor = await Mentor.create({
    user_id: userId,
    ...mentorData,
    profile_image: profileImage || null,
    approval_status: "pending",
  });

  // ✅ UPDATE USER ROLE & NOTIFY ADMIN
  await User.update({ role_name: "mentor" }, { where: { id: userId } });
  await notifyAdminOfNewMentor(user.email, mentorData.first_name, mentorData.last_name);

  return mentor;
};

// --- GETTERS & PROFILE MANAGEMENT (Preserved from your cat output) ---

exports.getMyApplication = async (userId) => {
  return await Mentor.findOne({
    where: { user_id: userId },
    include: [
      { model: User, attributes: ["id", "email", "role_name", "status"] },
      { model: Position, attributes: ["id", "position_name"] },
      { model: Industry, attributes: ["id", "industry_name"] },
    ],
  });
};

exports.getMyProfile = async (userId) => {
  const mentor = await Mentor.findOne({
    where: { user_id: userId },
    include: [
      { model: User, attributes: ["id", "email", "role_name", "status"] },
      { model: Position, attributes: ["id", "position_name", "image_position"] },
      { model: Industry, attributes: ["id", "industry_name"] },
      { model: MentorDocument },
      { model: MentorEducation },
    ],
  });
  if (!mentor) throw new Error("Mentor profile not found");
  return { mentor };
};

exports.updateProfile = async (userId, updates, profileImage) => {
  const mentor = await Mentor.findOne({ where: { user_id: userId } });
  if (!mentor) throw new Error("Mentor profile not found");
  if (profileImage) updates.profile_image = profileImage;
  await mentor.update(updates);
  return mentor;
};

exports.updateProfileWithEducation = async (userId, updates, profileImage) => {
  const transaction = await sequelize.transaction();
  try {
    const mentor = await Mentor.findOne({ where: { user_id: userId }, transaction });
    if (!mentor) throw new Error("Mentor profile not found");
    if (profileImage) updates.profile_image = profileImage;
    await mentor.update(updates, { transaction });
    if (updates.education) {
      await MentorEducation.destroy({ where: { mentor_id: mentor.id }, transaction });
      const eduRecords = updates.education.map(e => ({
        mentor_id: mentor.id,
        university_name: e.institution || e.university_name,
        degree_name: e.degree || e.degree_name,
        year_graduated: parseInt(e.year || e.year_graduated)
      }));
      await MentorEducation.bulkCreate(eduRecords, { transaction });
    }
    await transaction.commit();
    return mentor;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.getAllApprovedMentors = async () => {
  return await Mentor.findAll({
    where: { approval_status: "approved" },
    include: [{ model: User, attributes: ["id", "email", "status"] }, { model: Position }, { model: Industry }],
    order: [["createdAt", "DESC"]],
  });
};

exports.getMentorById = async (mentorId) => {
  return await Mentor.findByPk(mentorId, {
    include: [{ model: User }, { model: Position }, { model: Industry }, { model: MentorDocument }, { model: MentorEducation }]
  });
};

exports.getMyStats = async (userId) => {
  const mentor = await Mentor.findOne({ where: { user_id: userId } });
  const completedCount = await Booking.count({ where: { mentor_id: mentor.id, status: "completed" } });
  const earnings = await Booking.sum("total_amount", { where: { mentor_id: mentor.id, status: "completed" } });
  return { sessionsCompleted: completedCount, totalEarnings: earnings || 0 };
};

exports.getMyAvailableSessions = async (userId) => {
  const mentor = await Mentor.findOne({ where: { user_id: userId } });
  const sessions = await Session.findAll({
    where: { mentor_id: mentor.id, is_available: true },
    include: [
      { model: ScheduleTimeslot, as: "ScheduleTimeslots", where: { is_available: true }, required: false },
      { model: Position }
    ]
  });
  return sessions;
};
