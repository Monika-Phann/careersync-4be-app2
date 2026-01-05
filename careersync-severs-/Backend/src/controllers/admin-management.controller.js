const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");

// Import all models from db object
const db = require("../models");
const {
  User,
  Admin,
  Mentor,
  AccUser,
  MentorEducation,
  MentorDocument,
  Industry,
  Position,
  LoginSession,
  Booking,
  Payment,
  Session,
  ScheduleTimeslot,
  Certificate,
} = db;
const sequelize = db.sequelize;

// Import services
const { sendTelegramNotification } = require("../services/telegram.service");
const {
  sendVerificationEmail,
  sendMentorApprovalEmail,
  sendMentorRejectionEmail,
} = require("../services/email.service");

// ============================================
// MULTER CONFIGURATION
// ============================================

/**
 * Multer storage for profile images
 */
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads/profiles");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

/**
 * Use R2 upload middleware for position images
 */
const upload = require("../middleware/upload");
const uploadPosition = upload.uploadPositionImage;

// ============================================
// ADMIN SETUP & MANAGEMENT
// ============================================

/**
 * Create Initial Admin
 * Creates the first admin account in the system
 * CareerSync Admin model uses: full_name (single field), not first_name/last_name
 */
const createInitialAdmin = async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;

  try {
    // Check if admin already exists
    const existing = await User.findOne({ where: { role_name: "admin" } });
    if (existing) {
      return res
        .status(403)
        .json({ message: "Admin already exists in the system" });
    }

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        message: "Email, password, first name, and last name are required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const adminId = uuidv4();

    const t = await sequelize.transaction();
    try {
      // Create User record
      await User.create(
        {
          id: userId,
          email,
          password: hashedPassword,
          role_name: "admin",
          status: "verified", // Initial admin is auto-verified
          email_verified: true,
          email_verified_at: new Date(),
        },
        { transaction: t }
      );

      // Create Admin record
      // CareerSync Admin model uses full_name, not first_name/last_name
      await Admin.create(
        {
          id: adminId,
          user_id: userId,
          full_name: `${first_name} ${last_name}`, // ADAPTED: Combine names for CareerSync model
          phone: phone || null,
          profile_image: null,
        },
        { transaction: t }
      );

      await t.commit();
      res.status(201).json({
        message: "Initial admin created successfully",
        admin: {
          id: adminId,
          email: email,
          full_name: `${first_name} ${last_name}`,
        },
      });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Create initial admin error:", error);
    res.status(500).json({ message: "Server error creating admin" });
  }
};

/**
 * Get Admin Dashboard Statistics
 * Returns comprehensive stats for admin dashboard
 */
const getAdminDashboard = async (req, res) => {
  try {
    // 📊 User statistics
    const [totalUsers, totalAdmins, totalMentors, totalAccUsers] =
      await Promise.all([
        User.count(),
        User.count({ where: { role_name: "admin" } }),
        User.count({ where: { role_name: "mentor" } }),
        User.count({ where: { role_name: "acc_user" } }),
      ]);

    // 📊 Mentor statistics by approval status
    const [approvedMentors, pendingMentors, rejectedMentors] =
      await Promise.all([
        Mentor.count({ where: { approval_status: "approved" } }),
        Mentor.count({ where: { approval_status: "pending" } }),
        Mentor.count({ where: { approval_status: "rejected" } }),
      ]);

    // 💰 Revenue & Booking statistics
    // ✅ Fetch total bookings - returns 0 if no bookings exist
    const totalBookings = (await Booking.count()) || 0;
    const completedBookings =
      (await Booking.count({
        where: { status: "completed" },
      })) || 0;

    // ✅ Calculate total revenue from bookings (when student books a mentor)
    // Revenue is calculated from completed bookings' total_amount
    const bookingRevenueResult = await Booking.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("total_amount")),
            0
          ),
          "totalRevenue",
        ],
      ],
      where: { status: "completed" }, // Only count completed bookings
      raw: true,
    });

    // Also get revenue from paid payments as backup/verification
    const paymentRevenueResult = await Payment.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("amount")),
            0
          ),
          "totalRevenue",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("commission")),
            0
          ),
          "totalCommission",
        ],
      ],
      where: { status: "paid" },
      raw: true,
    });

    // Use booking revenue as primary source (from completed bookings)
    // Fallback to payment revenue if booking revenue is not available
    const totalRevenue = parseFloat(
      bookingRevenueResult?.totalRevenue ||
        paymentRevenueResult?.totalRevenue ||
        0
    );
    const totalCommission = parseFloat(
      paymentRevenueResult?.totalCommission || 0
    );

    // 🏆 Total Certifications - returns 0 if no certifications exist
    const totalCertifications = (await Certificate.count()) || 0;

    // 📈 Monthly Bookings & Revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyData = await Booking.findAll({
      attributes: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")),
          "month",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "bookingCount"],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("total_amount")),
            0
          ),
          "revenue",
        ],
      ],
      where: {
        created_at: { [Op.gte]: twelveMonthsAgo },
      },
      group: [sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at"))],
      order: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("created_at")),
          "ASC",
        ],
      ],
      raw: true,
    });

    // Format monthly data for frontend charts
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyBookingsRevenue = monthlyData.map((row) => ({
      month: monthNames[new Date(row.month).getMonth()],
      bookings: parseInt(row.bookingCount) || 0,
      revenue: parseFloat(row.revenue) || 0,
    }));

    // 🏆 Top Mentors (by bookings and revenue)
    const topMentorsRaw = await Booking.findAll({
      attributes: [
        "mentor_id",
        "mentor_name_snapshot",
        [sequelize.fn("COUNT", sequelize.col("Booking.id")), "bookingCount"],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("total_amount")),
            0
          ),
          "totalRevenue",
        ],
      ],
      group: ["mentor_id", "mentor_name_snapshot"],
      order: [[sequelize.fn("COUNT", sequelize.col("Booking.id")), "DESC"]],
      limit: 5,
      raw: true,
    });

    const topMentors = topMentorsRaw.map((m) => ({
      name: m.mentor_name_snapshot,
      bookings: parseInt(m.bookingCount) || 0,
      revenue: parseFloat(m.totalRevenue) || 0,
      status: "Active",
    }));

    // 📋 Recent Activity (last 10 events)
    const [recentBookings, recentMentorApprovals, recentUsers] =
      await Promise.all([
        Booking.findAll({
          limit: 3,
          order: [["created_at", "DESC"]],
          attributes: [
            "mentor_name_snapshot",
            "acc_user_name_snapshot",
            "status",
            "created_at",
          ],
        }),
        Mentor.findAll({
          limit: 3,
          where: { approval_status: "approved" },
          order: [["approved_at", "DESC"]],
          attributes: ["first_name", "last_name", "approved_at"],
        }),
        User.findAll({
          limit: 3,
          order: [["created_at", "DESC"]],
          attributes: ["role_name", "created_at"],
        }),
      ]);

    // Format recent activity
    const recentActivity = [
      ...recentBookings.map((b) => ({
        type: "booking",
        message: `New booking created`,
        time: getTimeAgo(b.created_at),
      })),
      ...recentMentorApprovals.map((m) => ({
        type: "mentor",
        message: `Mentor approved – ${m.first_name} ${m.last_name}`,
        time: getTimeAgo(m.approved_at),
      })),
      ...recentUsers.map((u) => ({
        type: "user",
        message: `New ${u.role_name === "acc_user" ? "student" : u.role_name} joined the platform`,
        time: getTimeAgo(u.created_at),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // 📊 Calculate percentage changes (vs last month)
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const [
      lastMonthRevenue,
      currentMonthRevenue,
      lastMonthBookings,
      currentMonthBookings,
    ] = await Promise.all([
      // ✅ Calculate revenue from completed bookings (when student books a mentor)
      Booking.sum("total_amount", {
        where: {
          status: "completed",
          created_at: {
            [Op.gte]: lastMonthStart,
            [Op.lt]: currentMonthStart,
          },
        },
      }) || 0,
      Booking.sum("total_amount", {
        where: {
          status: "completed",
          created_at: { [Op.gte]: currentMonthStart },
        },
      }) || 0,
      // ✅ Count all bookings (not just completed)
      Booking.count({
        where: {
          created_at: {
            [Op.gte]: lastMonthStart,
            [Op.lt]: currentMonthStart,
          },
        },
      }) || 0,
      Booking.count({
        where: {
          created_at: { [Op.gte]: currentMonthStart },
        },
      }) || 0,
    ]);

    const revenueChange =
      lastMonthRevenue > 0
        ? (
            ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    const bookingsChange =
      lastMonthBookings > 0
        ? (
            ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) *
            100
          ).toFixed(1)
        : 0;

    // 📦 Return comprehensive dashboard data
    res.json({
      stats: {
        totalUsers,
        pendingMentors,
        totalBookings: totalBookings || 0, // ✅ Ensure 0 if no bookings
        totalRevenue: Math.round(totalRevenue) || 0, // ✅ Ensure 0 if no revenue
        totalCertifications: totalCertifications || 0, // ✅ Total certifications issued
        revenueChange: parseFloat(revenueChange),
        bookingsChange: parseFloat(bookingsChange),
      },
      monthlyBookingsRevenue,
      topMentors,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Helper function for time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 2592000)} months ago`;
}

/**
 * Update Admin Profile
 * Handles admin full_name field correctly
 */
const updateAdminProfile = async (req, res) => {
  const { first_name, last_name, phone } = req.body;
  const adminUserId = req.user.id; // From auth middleware

  try {
    // Find admin by user_id
    const admin = await Admin.findOne({ where: { user_id: adminUserId } });
    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found" });
    }

    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (admin.profile_image) {
        const oldPath = path.join(
          process.cwd(),
          "uploads/profiles",
          admin.profile_image
        );
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            console.error("Could not delete old image:", err);
          }
        }
      }
      admin.profile_image = req.file.filename;
    }

    // Update full_name (CareerSync Admin uses single field)
    if (first_name || last_name) {
      const currentName = admin.full_name || "";
      const [currentFirst = "", currentLast = ""] = currentName.split(" ");
      admin.full_name =
        `${first_name || currentFirst} ${last_name || currentLast}`.trim();
    }

    if (phone) admin.phone = phone;

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        phone: admin.phone,
        profile_image: admin.profile_image
          ? `/uploads/profiles/${admin.profile_image}`
          : null,
      },
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// ============================================
// MENTOR MANAGEMENT
// ============================================

/**
 * Helper function to ensure Admin record exists for a user
 * Returns Admin record or throws error
 */
const ensureAdminExists = async (userId, transaction = null) => {
  try {
    const options = transaction ? { transaction } : {};

    console.log(
      `🔍 ensureAdminExists - Looking for Admin with user_id: ${userId}`
    );

    // First try to find existing (including soft-deleted)
    let admin = await Admin.findOne({
      where: { user_id: userId },
      paranoid: false,
      ...options,
    });

    console.log(
      `🔍 Admin lookup result:`,
      admin ? `Found Admin ID: ${admin.id}` : "Not found"
    );

    // If found but soft-deleted, restore it
    if (admin && admin.deleted_at) {
      console.log(`🔄 Restoring soft-deleted Admin record: ${admin.id}`);
      admin.deleted_at = null;
      await admin.save(options);
      console.log(`✅ Restored soft-deleted Admin record: ${admin.id}`);
      return admin;
    }

    // If not found, create it
    if (!admin) {
      console.log(
        `📝 Admin not found, fetching User to create Admin record...`
      );
      const user = await User.findByPk(userId, options);
      if (!user) {
        console.error(`❌ User not found for userId: ${userId}`);
        throw new Error("User not found");
      }

      console.log(`📝 User found: ${user.email}, creating Admin record...`);

      // Double-check Admin doesn't exist (race condition protection)
      const existingAdmin = await Admin.findOne({
        where: { user_id: userId },
        paranoid: false,
        ...options,
      });

      if (existingAdmin) {
        console.log(
          `✅ Found existing Admin record (race condition): ${existingAdmin.id}`
        );
        if (existingAdmin.deleted_at) {
          existingAdmin.deleted_at = null;
          await existingAdmin.save(options);
          console.log(
            `✅ Restored soft-deleted Admin record: ${existingAdmin.id}`
          );
        }
        return existingAdmin;
      }

      // Create new Admin record
      console.log(`📝 Creating new Admin record for user: ${user.email}`);
      try {
        admin = await Admin.create(
          {
            user_id: userId,
            full_name: user.email.split("@")[0] || "Admin",
            phone: null,
            profile_image: null,
          },
          options
        );

        console.log(
          `✅ Auto-created Admin record with ID: ${admin.id} for user ${userId}`
        );

        // Verify admin was created
        if (!admin || !admin.id) {
          console.error(`❌ Admin created but ID is missing`);
          throw new Error("Admin record created but ID is missing");
        }

        // Reload to ensure we have the full record
        await admin.reload(options);

        // Final verification
        if (!admin || !admin.id) {
          console.error(`❌ Admin record invalid after reload`);
          throw new Error("Admin record invalid after reload");
        }

        console.log(`✅ Admin record verified:`, {
          id: admin.id,
          user_id: admin.user_id,
          full_name: admin.full_name,
        });
      } catch (createError) {
        console.error(`❌ Failed to create Admin record:`, createError);
        console.error(`Create error details:`, {
          name: createError.name,
          message: createError.message,
          errors: createError.errors,
        });
        throw new Error(
          `Failed to create admin profile: ${createError.message}`
        );
      }
    }

    // Final verification
    if (!admin || !admin.id) {
      console.error(`❌ Admin record is invalid after lookup/create`);
      throw new Error("Admin record is invalid after lookup/create");
    }

    console.log(`✅ ensureAdminExists - Returning Admin ID: ${admin.id}`);
    return admin;
  } catch (error) {
    console.error(`❌ ensureAdminExists error:`, error);
    throw error;
  }
};

/**
 * Get Mentor Statistics
 * Returns counts by approval status
 */
const getMentorStats = async (req, res) => {
  try {
    const [total, approved, rejected, pending] = await Promise.all([
      Mentor.count(),
      Mentor.count({ where: { approval_status: "approved" } }),
      Mentor.count({ where: { approval_status: "rejected" } }),
      Mentor.count({ where: { approval_status: "pending" } }),
    ]);

    res.json({
      total,
      approved,
      rejected,
      pending,
    });
  } catch (error) {
    console.error("Mentor stats error:", error);
    res.status(500).json({ message: "Failed to fetch mentor statistics" });
  }
};

/**
 * Get all mentors (with optional status filter)
 * GET /api/admin/mentors?status=pending|approved|rejected
 */
const getAllMentors = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { approval_status: status } : {};

    const mentors = await Mentor.findAll({
      where,
      include: [
        {
          model: User,
          attributes: [
            "id",
            "email",
            "role_name",
            "email_verified",
            "created_at",
          ],
        },
        {
          model: Position,
          as: "position",
          attributes: ["id", "position_name"],
        },
        {
          model: Industry,
          as: "industry",
          attributes: ["id", "industry_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(mentors);
  } catch (error) {
    console.error("Get all mentors error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch mentors", error: error.message });
  }
};

/**
 * Get mentor by ID
 * GET /api/admin/mentors/:id
 */
const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    const mentor = await Mentor.findByPk(id, {
      include: [
        {
          model: User,
          attributes: [
            "id",
            "email",
            "role_name",
            "email_verified",
            "created_at",
          ],
        },
        {
          model: Position,
          as: "position",
          attributes: ["id", "position_name"],
        },
        {
          model: Industry,
          as: "industry",
          attributes: ["id", "industry_name"],
        },
        {
          model: MentorDocument,
          attributes: ["id", "document_type", "document_path", "created_at"],
        },
        {
          model: MentorEducation,
          attributes: [
            "id",
            "university_name",
            "degree_name",
            "year_graduated",
            "created_at",
          ],
        },
      ],
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json(mentor);
  } catch (error) {
    console.error("Get mentor by ID error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch mentor", error: error.message });
  }
};

/**
 * Approve mentor
 * PUT /api/admin/mentors/:id/approve
 */
const approveMentor = async (req, res) => {
  const { id } = req.params;
  const adminUserId = req.user.id; // This is the User ID, not Admin ID

  console.log("🔍 Approve mentor - Admin User ID:", adminUserId);
  console.log("🔍 Approve mentor - Mentor ID:", id);

  const t = await sequelize.transaction();
  try {
    // ✅ Use helper function to ensure Admin exists
    let admin;
    try {
      admin = await ensureAdminExists(adminUserId, t);
      console.log("✅ Using Admin ID:", admin.id, "for approving mentor:", id);
    } catch (adminError) {
      await t.rollback();
      console.error("❌ Failed to ensure Admin exists:", adminError);
      return res.status(500).json({
        message: "Failed to get admin profile",
        error: adminError.message,
      });
    }

    const mentor = await Mentor.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "email", "role_name", "status", "email_verified"],
        },
      ],
      transaction: t,
    });

    if (!mentor) {
      await t.rollback();
      return res.status(404).json({ message: "Mentor not found" });
    }

    if (mentor.approval_status !== "pending") {
      await t.rollback();
      return res
        .status(400)
        .json({ message: `Mentor is already ${mentor.approval_status}` });
    }

    // Log mentor details for debugging
    console.log(`📋 Mentor details:`, {
      id: mentor.id,
      name: `${mentor.first_name} ${mentor.last_name}`,
      hasUser: !!mentor.User,
      userEmail: mentor.User?.email || "N/A",
      approvalStatus: mentor.approval_status,
    });

    mentor.approval_status = "approved";
    mentor.approved_by = admin.id; // ✅ Use Admin ID, not User ID
    mentor.approved_at = new Date();
    await mentor.save({ transaction: t });

    if (mentor.User) {
      // ✅ Mentors don't need email verification - admin approval is sufficient
      // Set email_verified to true and status to verified when admin approves
      mentor.User.email_verified = true;
      mentor.User.status = "verified";
      await mentor.User.save({ transaction: t });
    }

    await t.commit();

    // Send approval email notification (ALWAYS send, regardless of verification status)
    try {
      if (mentor.User && mentor.User.email) {
        console.log(
          `📧 Sending approval email notification to: ${mentor.User.email}`
        );
        await sendMentorApprovalEmail(mentor.User.email, mentor.first_name);
        console.log(
          `✅ Approval email sent successfully to ${mentor.User.email}`
        );
      } else {
        console.warn(
          `⚠️ Cannot send approval email: mentor.User=${!!mentor.User}, email=${mentor.User?.email || "N/A"}`
        );
      }
    } catch (emailError) {
      console.error("❌ Failed to send approval email:", emailError);
      console.error("Email error details:", {
        message: emailError.message,
        stack: emailError.stack,
        response: emailError.response?.body,
      });
      // Don't fail the request if email fails, but log the error
    }

    res.json({
      message: "Mentor approved successfully",
      mentor: mentor.toJSON(),
    });
  } catch (error) {
    await t.rollback();
    console.error("Approve mentor error:", error);
    res
      .status(500)
      .json({ message: "Failed to approve mentor", error: error.message });
  }
};

/**
 * Reject mentor
 * PUT /api/admin/mentors/:id/reject
 */
const rejectMentor = async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const adminUserId = req.user.id; // This is the User ID, not Admin ID

  console.log("🔍 Reject mentor - Admin User ID:", adminUserId);
  console.log("🔍 Reject mentor - Mentor ID:", id);
  console.log("🔍 Reject mentor - Rejection reason:", rejection_reason);

  const t = await sequelize.transaction();
  try {
    // ✅ Use helper function to ensure Admin exists
    let admin;
    try {
      admin = await ensureAdminExists(adminUserId, t);
      console.log("✅ Using Admin ID:", admin.id, "for rejecting mentor:", id);
    } catch (adminError) {
      await t.rollback();
      console.error("❌ Failed to ensure Admin exists:", adminError);
      return res.status(500).json({
        message: "Failed to get admin profile",
        error: adminError.message,
      });
    }

    const mentor = await Mentor.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "email", "role_name", "status", "email_verified"],
        },
      ],
      transaction: t,
    });

    if (!mentor) {
      await t.rollback();
      return res.status(404).json({ message: "Mentor not found" });
    }

    if (mentor.approval_status !== "pending") {
      await t.rollback();
      return res
        .status(400)
        .json({ message: `Mentor is already ${mentor.approval_status}` });
    }

    // Log mentor details for debugging
    console.log(`📋 Mentor details:`, {
      id: mentor.id,
      name: `${mentor.first_name} ${mentor.last_name}`,
      hasUser: !!mentor.User,
      userEmail: mentor.User?.email || "N/A",
      approvalStatus: mentor.approval_status,
    });

    mentor.approval_status = "rejected";
    mentor.rejected_by = admin.id; // ✅ Use Admin ID, not User ID
    mentor.rejected_at = new Date();
    mentor.rejection_reason = rejection_reason || null;
    await mentor.save({ transaction: t });

    if (mentor.User) {
      mentor.User.status = "inactive";
      await mentor.User.save({ transaction: t });
    }

    await t.commit();

    // Send rejection email
    try {
      if (mentor.User && mentor.User.email) {
        console.log(
          `📧 Attempting to send rejection email to: ${mentor.User.email}`
        );
        await sendMentorRejectionEmail(
          mentor.User.email,
          mentor.first_name,
          rejection_reason
        );
        console.log(
          `✅ Rejection email sent successfully to ${mentor.User.email}`
        );
      } else {
        console.warn(
          `⚠️ Cannot send rejection email: mentor.User=${!!mentor.User}, email=${mentor.User?.email || "N/A"}`
        );
      }
    } catch (emailError) {
      console.error("❌ Failed to send rejection email:", emailError);
      console.error("Email error details:", {
        message: emailError.message,
        stack: emailError.stack,
        response: emailError.response?.body,
      });
    }

    res.json({
      message: "Mentor rejected successfully",
      mentor: mentor.toJSON(),
    });
  } catch (error) {
    await t.rollback();
    console.error("Reject mentor error:", error);
    res
      .status(500)
      .json({ message: "Failed to reject mentor", error: error.message });
  }
};

/**
 * List Pending Mentors
 * Returns all mentors with pending approval status
 */
const listPendingMentors = async (req, res) => {
  try {
    const mentors = await Mentor.findAll({
      where: { approval_status: "pending" },
      include: [
        {
          model: User,
          attributes: ["email", "status", "email_verified", "created_at"],
        },
        {
          model: Position,
          attributes: ["position_name"],
        },
        {
          model: Industry,
          attributes: ["industry_name"],
        },
        {
          model: MentorDocument,
          attributes: ["document_type", "document_url", "created_at"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = mentors.map((m) => ({
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.User?.email,
      gender: m.gender,
      job_title: m.job_title,
      phone: m.phone,
      position: m.Position?.position_name || null,
      industry: m.Industry?.industry_name || null,
      expertise_areas: m.expertise_areas,
      experience_years: m.experience_years,
      company_name: m.company_name,
      about_mentor: m.about_mentor,
      profile_image: m.profile_image,
      documents: m.MentorDocuments || [],
      created_at: m.created_at,
      email_verified: m.User?.email_verified,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("List pending mentors error:", error);
    res.status(500).json({ message: "Failed to fetch pending mentors" });
  }
};

/**
 * Review Mentor (Approve/Reject)
 * Updates mentor approval status and sends email notification
 */
const reviewMentor = async (req, res) => {
  const { mentorId } = req.params;
  const { action } = req.body; // 'accept' or 'reject'

  if (!["accept", "reject"].includes(action)) {
    return res
      .status(400)
      .json({ message: 'Invalid action. Must be "accept" or "reject"' });
  }

  const mentorStatus = action === "accept" ? "approved" : "rejected";
  const userStatus = action === "accept" ? "verified" : "blocked";

  const t = await sequelize.transaction();
  try {
    // ✅ Use helper function to ensure Admin exists
    let admin;
    try {
      admin = await ensureAdminExists(req.user.id, t);
      console.log(
        "✅ Using Admin ID:",
        admin.id,
        "for reviewing mentor:",
        mentorId
      );
    } catch (adminError) {
      await t.rollback();
      console.error(
        "❌ Failed to ensure Admin exists in reviewMentor:",
        adminError
      );
      return res.status(500).json({
        message: "Failed to get admin profile",
        error: adminError.message,
      });
    }

    // Find mentor with User relation
    const mentor = await Mentor.findByPk(mentorId, {
      include: [{ model: User }],
    });

    if (!mentor) {
      await t.rollback();
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Update mentor approval status
    mentor.approval_status = mentorStatus;
    mentor.approved_by = admin.id; // ✅ Use Admin ID, not User ID
    mentor.approved_at = new Date();
    await mentor.save({ transaction: t });

    // Update user status
    if (mentor.User) {
      // ✅ Mentors don't need email verification - admin approval is sufficient
      if (action === "accept") {
        mentor.User.email_verified = true;
        mentor.User.status = "verified";
      } else {
        mentor.User.status = userStatus;
      }
      await mentor.User.save({ transaction: t });
    }

    await t.commit();

    // Send email notification (ALWAYS send, regardless of verification status)
    try {
      const userEmail = mentor.User ? mentor.User.email : null;

      if (userEmail) {
        if (action === "accept") {
          console.log(
            `📧 Sending approval email notification to: ${userEmail}`
          );
          await sendMentorApprovalEmail(userEmail, mentor.first_name);
          console.log(`✅ Approval email sent successfully to ${userEmail}`);
        } else {
          console.log(
            `📧 Sending rejection email notification to: ${userEmail}`
          );
          await sendMentorRejectionEmail(userEmail, mentor.first_name, null);
          console.log(`✅ Rejection email sent successfully to ${userEmail}`);
        }
      } else {
        console.warn(
          `⚠️ Cannot send notification email: mentor.User=${!!mentor.User}, email=${mentor.User?.email || "N/A"}`
        );
      }
    } catch (emailError) {
      console.error("❌ Failed to send notification email:", emailError);
      console.error("Email error details:", {
        message: emailError.message,
        stack: emailError.stack,
        response: emailError.response?.body,
      });
      // Don't fail the request if email fails, but log the error
    }

    res.json({
      message: `Mentor ${mentorStatus} successfully`,
      mentor: {
        id: mentor.id,
        first_name: mentor.first_name,
        last_name: mentor.last_name,
        approval_status: mentor.approval_status,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("Review mentor error:", error);
    res.status(500).json({ message: "Server error reviewing mentor" });
  }
};

// ============================================
// INDUSTRY MANAGEMENT (CRUD)
// ============================================

/**
 * Create Industry
 */
const createIndustry = async (req, res) => {
  const { industry_name } = req.body;

  if (!industry_name) {
    return res.status(400).json({ message: "Industry name is required" });
  }

  try {
    const industry = await Industry.create({
      id: uuidv4(),
      industry_name: industry_name.trim(),
    });

    res.status(201).json({
      message: "Industry created successfully",
      industry,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Industry already exists" });
    }
    console.error("Create industry error:", error);
    res.status(500).json({ message: "Server error creating industry" });
  }
};

/**
 * Get All Industries
 */
const getIndustries = async (req, res) => {
  try {
    const industries = await Industry.findAll({
      order: [["industry_name", "ASC"]],
    });

    res.json(industries);
  } catch (error) {
    console.error("Get industries error:", error);
    res.status(500).json({ message: "Server error fetching industries" });
  }
};

/**
 * Update Industry
 */
const updateIndustry = async (req, res) => {
  const { id } = req.params;
  const { industry_name } = req.body;

  if (!industry_name) {
    return res.status(400).json({ message: "Industry name is required" });
  }

  try {
    const industry = await Industry.findByPk(id);
    if (!industry) {
      return res.status(404).json({ message: "Industry not found" });
    }

    industry.industry_name = industry_name.trim();
    await industry.save();

    res.json({
      message: "Industry updated successfully",
      industry,
    });
  } catch (error) {
    console.error("Update industry error:", error);
    res.status(500).json({ message: "Server error updating industry" });
  }
};

/**
 * Delete Industry
 * Checks for dependent positions before deleting
 */
const deleteIndustry = async (req, res) => {
  const { id } = req.params;

  try {
    const industry = await Industry.findByPk(id);
    if (!industry) {
      return res.status(404).json({ message: "Industry not found" });
    }

    // Check if industry has positions
    const positionsCount = await Position.count({ where: { industry_id: id } });
    if (positionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete industry. It has ${positionsCount} position(s) associated with it.`,
      });
    }

    await industry.destroy();
    res.json({ message: "Industry deleted successfully" });
  } catch (error) {
    console.error("Delete industry error:", error);
    res.status(500).json({ message: "Server error deleting industry" });
  }
};

// ============================================
// POSITION MANAGEMENT (CRUD)
// ============================================

/**
 * Create Position
 * Includes image upload support
 */
const createPosition = async (req, res) => {
  const { industry_id, position_name, description } = req.body;

  if (!industry_id || !position_name) {
    return res
      .status(400)
      .json({ message: "industry_id and position_name are required" });
  }

  try {
    // Verify industry exists
    const industry = await Industry.findByPk(industry_id);
    if (!industry) {
      return res.status(404).json({ message: "Industry not found" });
    }

    // Extract position image URL from R2 upload
    let image_position = null;
    if (req.file) {
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && req.file.key) {
        image_position = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      } else if (req.file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        image_position = req.file.location;
      } else if (req.file.filename) {
        // Legacy fallback for local uploads
        image_position = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/positions/${req.file.filename}`;
      }
    }

    const position = await Position.create({
      id: uuidv4(),
      industry_id,
      position_name: position_name.trim(),
      description: description || null,
      image_position,
    });

    // Return position with industry name
    const positionWithIndustry = await Position.findByPk(position.id, {
      include: [{ model: Industry, attributes: ["industry_name"] }],
    });

    res.status(201).json({
      message: "Position created successfully",
      position: positionWithIndustry,
    });
  } catch (error) {
    console.error("Create position error:", error);
    res.status(500).json({ message: "Server error creating position" });
  }
};

/**
 * Get All Positions
 * Can filter by industry_id
 */
const getPositions = async (req, res) => {
  const { industry_id } = req.query;

  try {
    const where = industry_id ? { industry_id } : {};

    const positions = await Position.findAll({
      where,
      include: [
        {
          model: Industry,
          attributes: ["industry_name"],
        },
      ],
      order: [["position_name", "ASC"]],
    });

    // Format response
    const formatted = positions.map((p) => ({
      id: p.id,
      position_name: p.position_name,
      description: p.description,
      industry_id: p.industry_id,
      industry_name: p.Industry?.industry_name,
      image_position: p.image_position,
      created_at: p.created_at,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get positions error:", error);
    res.status(500).json({ message: "Server error fetching positions" });
  }
};

/**
 * Update Position
 * Can update image
 */
const updatePosition = async (req, res) => {
  const { id } = req.params;
  const { industry_id, position_name, description } = req.body;

  try {
    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: "Position not found" });
    }

    // Verify industry if provided
    if (industry_id) {
      const industry = await Industry.findByPk(industry_id);
      if (!industry) {
        return res.status(404).json({ message: "Industry not found" });
      }
      position.industry_id = industry_id;
    }

    if (position_name) position.position_name = position_name.trim();
    if (description !== undefined) position.description = description;

    // Extract position image URL from R2 upload if file is provided
    if (req.file) {
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && req.file.key) {
        position.image_position = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      } else if (req.file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        position.image_position = req.file.location;
      } else if (req.file.filename) {
        // Legacy fallback for local uploads
        position.image_position = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/positions/${req.file.filename}`;
      }
    }

    await position.save();

    // Return position with industry
    const updated = await Position.findByPk(id, {
      include: [{ model: Industry, attributes: ["industry_name"] }],
    });

    res.json({
      message: "Position updated successfully",
      position: updated,
    });
  } catch (error) {
    console.error("Update position error:", error);
    res.status(500).json({ message: "Server error updating position" });
  }
};

/**
 * Delete Position
 * Checks for dependent mentors before deleting
 */
const deletePosition = async (req, res) => {
  const { id } = req.params;

  try {
    const position = await Position.findByPk(id);
    if (!position) {
      return res.status(404).json({ message: "Position not found" });
    }

    // Check if position has mentors
    const mentorsCount = await Mentor.count({ where: { position_id: id } });
    if (mentorsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete position. It has ${mentorsCount} mentor(s) associated with it.`,
      });
    }

    await position.destroy();
    res.json({ message: "Position deleted successfully" });
  } catch (error) {
    console.error("Delete position error:", error);
    res.status(500).json({ message: "Server error deleting position" });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get All Users
 * With filtering and creator tracking
 */
const getAllUsers = async (req, res) => {
  try {
    const { search, startDate, endDate, role_name, status } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    let whereClause = { ...dateFilter };
    if (role_name) whereClause.role_name = role_name;
    if (status) whereClause.status = status;

    const users = await User.findAll({
      where: whereClause,
      attributes: [
        "id",
        "email",
        "role_name",
        "status",
        "created_at",
        "created_by",
      ],
      include: [
        // User's own profile data
        { model: Admin, attributes: ["full_name", "phone"], required: false },
        {
          model: Mentor,
          attributes: ["first_name", "last_name"],
          required: false,
        },
        {
          model: AccUser,
          attributes: ["first_name", "last_name"],
          required: false,
        },

        // Creator information
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "role_name"],
          include: [
            { model: Admin, attributes: ["full_name"], required: false },
          ],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formatted = users.map((u) => {
      // Format user's name based on role
      let name = "N/A";
      if (u.role_name === "admin" && u.Admin) {
        name = u.Admin.full_name;
      } else if (u.role_name === "mentor" && u.Mentor) {
        name = `${u.Mentor.first_name} ${u.Mentor.last_name}`;
      } else if (u.role_name === "acc_user" && u.AccUser) {
        name = `${u.AccUser.first_name} ${u.AccUser.last_name}`;
      }

      // Format creator name
      let createdBy = "Self-Registered";
      if (u.creator) {
        if (u.creator.Admin) {
          createdBy = `${u.creator.Admin.full_name} (Admin)`;
        } else {
          createdBy = u.creator.email;
        }
      }

      return {
        id: u.id,
        email: u.email,
        role_name: u.role_name,
        status: u.status,
        created_at: u.created_at,
        name: name,
        created_by: createdBy,
      };
    });

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      const result = formatted.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch) ||
          u.role_name.toLowerCase().includes(lowerSearch) ||
          u.created_by.toLowerCase().includes(lowerSearch)
      );
      return res.json(result);
    }

    res.json(formatted);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * Create User (by Admin)
 * Creates user with specific role and sends verification email
 * Includes Telegram notification
 */
const createUser = async (req, res) => {
  const {
    email,
    password,
    role_name,
    first_name,
    last_name,
    phone,
    gender,
    dob,
    types_user,
    institution_name,
    position_id,
    industry_id,
    job_title,
    expertise_areas,
    experience_years,
    company_name,
    social_media,
    about_mentor,
    education,
  } = req.body;

  const profile_image = req.file
    ? `/uploads/profiles/${req.file.filename}`
    : null;

  // Validation
  if (!email || !password || !role_name) {
    return res
      .status(400)
      .json({ message: "Email, password, and role_name are required" });
  }

  if (!["admin", "mentor", "acc_user"].includes(role_name)) {
    return res.status(400).json({
      message: "Invalid role_name. Must be: admin, mentor, or acc_user",
    });
  }

  // Role-specific validation
  if (
    role_name === "mentor" &&
    (!first_name ||
      !last_name ||
      !gender ||
      !dob ||
      !phone ||
      !job_title ||
      !position_id ||
      !industry_id)
  ) {
    return res.status(400).json({
      message:
        "Mentor requires: first_name, last_name, gender, dob, phone, job_title, position_id, industry_id",
    });
  }

  if (
    role_name === "acc_user" &&
    (!first_name ||
      !last_name ||
      !gender ||
      !dob ||
      !phone ||
      !types_user ||
      !institution_name)
  ) {
    return res.status(400).json({
      message:
        "AccUser requires: first_name, last_name, gender, dob, phone, types_user, institution_name",
    });
  }

  try {
    // ✅ FIX: Use case-insensitive email check for PostgreSQL
    const existing = await User.findOne({ 
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        email.toLowerCase()
      )
    });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const t = await sequelize.transaction();

    try {
      // Create User record
      await User.create(
        {
          id: userId,
          email,
          password: hashedPassword,
          role_name,
          status: "unverified",
          email_verified: false,
          created_by: req.user.id, // Track who created this user
        },
        { transaction: t }
      );

      // Create role-specific record
      if (role_name === "admin") {
        await Admin.create(
          {
            id: uuidv4(),
            user_id: userId,
            full_name: `${first_name || ""} ${last_name || ""}`.trim(),
            phone: phone || null,
            profile_image,
          },
          { transaction: t }
        );
      } else if (role_name === "acc_user") {
        await AccUser.create(
          {
            id: uuidv4(),
            user_id: userId,
            first_name,
            last_name,
            phone,
            gender,
            dob,
            types_user,
            institution_name,
            profile_image: profile_image || "",
          },
          { transaction: t }
        );
      } else if (role_name === "mentor") {
        const mentorId = uuidv4();
        await Mentor.create(
          {
            id: mentorId,
            user_id: userId,
            first_name,
            last_name,
            gender,
            dob,
            phone,
            job_title,
            position_id,
            industry_id,
            expertise_areas: expertise_areas || null,
            experience_years: experience_years || null,
            company_name: company_name || null,
            social_media: social_media || null,
            about_mentor: about_mentor || null,
            profile_image,
            approval_status: "pending",
          },
          { transaction: t }
        );

        // Handle education if provided (only complete records)
        if (education) {
          const eduList =
            typeof education === "string" ? JSON.parse(education) : education;

          // Filter to only include complete education records
          const validEducation = eduList.filter((edu) => {
            return (
              edu.university_name &&
              edu.degree_name &&
              edu.year_graduated !== null &&
              edu.year_graduated !== undefined &&
              edu.year_graduated !== ""
            );
          });

          for (const edu of validEducation) {
            const yearGraduated = parseInt(edu.year_graduated);
            // Double-check year_graduated is valid
            if (!isNaN(yearGraduated)) {
              await MentorEducation.create(
                {
                  id: uuidv4(),
                  mentor_id: mentorId,
                  university_name: edu.university_name.trim(),
                  degree_name: edu.degree_name.trim(),
                  field_of_study: edu.field_of_study?.trim() || null,
                  year_graduated: yearGraduated,
                  grade_gpa: edu.grade_gpa ? parseFloat(edu.grade_gpa) : null,
                  activities: edu.activities?.trim() || null,
                },
                { transaction: t }
              );
            }
          }
        }
      }

      // Create verification token
      const verificationToken = uuidv4();
      const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await LoginSession.create(
        {
          user_id: userId,
          refresh_token: verificationToken,
          access_token: "temp_verification",
          expired_at: expiredAt,
        },
        { transaction: t }
      );

      await t.commit();

      // Send Telegram notification (non-blocking)
      try {
        const creatorName = req.user ? req.user.email : "System/Admin";
        const telegramData = {
          first_name,
          last_name,
          email,
          phone,
          gender,
          role_name,
          types_user,
          institution_name,
          company_name,
          job_title,
          expertise_areas,
          status: "Unverified",
        };
        sendTelegramNotification(telegramData, creatorName);
      } catch (tgError) {
        console.error("Telegram notification error:", tgError.message);
      }

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken, role_name);
        res.status(201).json({
          message: `${role_name} created successfully! Verification email sent to ${email}`,
        });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        res.status(201).json({
          message: `${role_name} created, but email failed to send. Contact admin.`,
          warning: "Email not sent",
        });
      }
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Create user error:", error);
    res
      .status(500)
      .json({ message: "Failed to create user", error: error.message });
  }
};

/**
 * Get User Details
 * Returns full user information including role-specific data
 */
const getUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "email",
        "role_name",
        "status",
        "email_verified",
        "created_at",
      ],
      include: [
        { model: Admin },
        {
          model: Mentor,
          include: [
            { model: MentorEducation },
            { model: Position },
            { model: Industry },
          ],
        },
        { model: AccUser },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete User
 * Prevents self-deletion and admin deletion
 * Includes proper cascade deletion
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user ? req.user.id : null;

  // Security: Prevent self-deletion
  if (requesterId && id === requesterId) {
    return res
      .status(403)
      .json({ message: "Security Alert: You cannot delete your own account!" });
  }

  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(id);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Security: Prevent admin deletion by other admins
    if (user.role_name === "admin") {
      await t.rollback();
      return res.status(403).json({
        message:
          "Access Denied: You cannot delete another Admin account. Please deactivate them instead.",
      });
    }

    // Delete role-specific data
    if (user.role_name === "mentor") {
      const mentor = await Mentor.findOne({ where: { user_id: id } });
      if (mentor) {
        await MentorEducation.destroy({
          where: { mentor_id: mentor.id },
          transaction: t,
        });
        await Mentor.destroy({ where: { user_id: id }, transaction: t });
      }
    } else if (user.role_name === "acc_user") {
      await AccUser.destroy({ where: { user_id: id }, transaction: t });
    }

    // Delete login sessions
    await LoginSession.destroy({ where: { user_id: id }, transaction: t });

    // Delete user
    await user.destroy({ transaction: t });

    await t.commit();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Delete user error:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        message: "Cannot delete: This user is linked to other critical data.",
      });
    }

    res
      .status(500)
      .json({ message: "Failed to delete user: " + error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    let whereClause = {};

    if (status && status !== "all") whereClause.status = status;
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Mentor,
          as: "mentorUser",
          attributes: ["id", "first_name", "last_name", "profile_image"],
          include: [{ model: User, attributes: ["email"] }],
        },
        {
          model: AccUser,
          as: "menteeUser",
          attributes: ["id", "first_name", "last_name", "profile_image"],
          include: [{ model: User, attributes: ["email"] }],
        },
        {
          model: Session,
          attributes: ["price", "location_name", "agenda_pdf"],
        },
        { model: Position, attributes: ["position_name"] },
        { model: Payment, attributes: ["status", "amount", "pay_date"] },
      ],
      order: [["created_at", "DESC"]],
    });

    let filteredBookings = bookings;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredBookings = bookings.filter(
        (b) =>
          b.mentor_name_snapshot.toLowerCase().includes(lowerSearch) ||
          b.acc_user_name_snapshot.toLowerCase().includes(lowerSearch) ||
          b.position_name_snapshot.toLowerCase().includes(lowerSearch)
      );
    }

    const formatted = filteredBookings.map((b) => ({
      id: b.id,
      mentor: {
        id: b.mentorUser?.id,
        name: b.mentor_name_snapshot,
        email: b.mentorUser?.User?.email,
        image: b.mentorUser?.profile_image || null,
      },
      student: {
        id: b.menteeUser?.id,
        name: b.acc_user_name_snapshot,
        email: b.menteeUser?.User?.email,
        image: b.menteeUser?.profile_image || null,
      },
      session: {
        price: b.session_price_snapshot,
        location: b.Session?.location_name,
        agenda: b.Session?.agenda_pdf,
      },
      position: b.position_name_snapshot,
      startDate: b.start_date_snapshot,
      endDate: b.end_date_snapshot,
      totalAmount: b.total_amount,
      status: b.status,
      payment: {
        status: b.Payment?.status || "pending",
        amount: b.Payment?.amount,
        paidDate: b.Payment?.pay_date,
      },
      createdAt: b.created_at,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Mentor,
          as: "mentorUser",
          include: [{ model: User }, { model: Position }, { model: Industry }],
        },
        { model: AccUser, as: "menteeUser", include: [{ model: User }] },
        { model: Session },
        { model: Position },
        { model: Payment },
        { model: ScheduleTimeslot },
      ],
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    booking.updated_by = req.user.id;
    await booking.save();

    res.json({
      message: `Booking status updated to ${status}`,
      booking: { id: booking.id, status: booking.status },
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot delete completed bookings" });
    }
    await booking.destroy();
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createInitialAdmin,
  getAdminDashboard,
  updateAdminProfile,
  getMentorStats,
  listPendingMentors,
  reviewMentor,
  getAllMentors,
  getMentorById,
  approveMentor,
  rejectMentor,
  createIndustry,
  getIndustries,
  updateIndustry,
  deleteIndustry,
  createPosition,
  getPositions,
  updatePosition,
  deletePosition,
  getAllUsers,
  createUser,
  getUserDetails,
  deleteUser,
  getAllBookings,
  getBookingDetails,
  updateBookingStatus,
  deleteBooking,
  uploadProfile,
  uploadPosition,
};
