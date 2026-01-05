const { Mentor, User, Admin, sequelize } = require("../models");
const { sendMentorApprovalEmail, sendMentorRejectionEmail } = require("./email.service");

const APP_URL = process.env.APP_URL;
if (!APP_URL) throw new Error('APP_URL environment variable is required');

exports.getPendingApplications = async () => {
  return await Mentor.findAll({
    where: { approval_status: "pending" },
    include: [
      { 
        model: User, 
        attributes: ["id", "email", "role_name", "status", "email_verified"] 
      }
    ],
    order: [["created_at", "DESC"]]
  });
};

exports.approveApplication = async (mentorId, adminUserId) => {
  const t = await sequelize.transaction();

  try {
    // 1. Validate admin exists
    const admin = await Admin.findOne({ 
      where: { user_id: adminUserId },
      transaction: t 
    });
    
    if (!admin) {
      await t.rollback();
      throw new Error("Admin profile not found");
    }

    // 2. Find mentor application with user data
    const mentor = await Mentor.findByPk(mentorId, {
      include: [{ model: User }],
      transaction: t
    });

    if (!mentor) {
      await t.rollback();
      throw new Error("Application not found");
    }

    // 3. Validate current status
    if (mentor.approval_status === "approved") {
      await t.rollback();
      throw new Error("Application already approved");
    }

    if (mentor.approval_status === "rejected") {
      await t.rollback();
      throw new Error("Cannot approve a rejected application");
    }

    // 4. Update mentor status
    await mentor.update({
      approval_status: "approved",
      approved_by: admin.id,
      approved_at: new Date()
    }, { transaction: t });

    // 5. Update user role to mentor
    await User.update(
      { role_name: "mentor", status: "verified" },
      { where: { id: mentor.user_id }, transaction: t }
    );

    // 6. Update user email_verified status (auto-verify on approval)
    await User.update(
      { 
        email_verified: true,
        email_verified_at: new Date(),
        status: "verified"
      },
      { where: { id: mentor.user_id }, transaction: t }
    );

    // 7. Commit transaction before sending email
    await t.commit();

    // 8. ✅ Send approval email (NO verification links, NO tokens - only decision notification)
    try {
      const user = mentor.User;
      if (user && user.email) {
        await sendMentorApprovalEmail(user.email, mentor.first_name);
        console.log(`✅ Approval email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't throw - approval succeeded even if email failed
    }

    return mentor;

  } catch (error) {
    // Rollback if transaction not yet committed
    if (!t.finished) {
      await t.rollback();
    }
    throw error;
  }
};

exports.rejectApplication = async (mentorId, adminUserId, rejection_reason) => {
  const t = await sequelize.transaction();

  try {
    // 1. Validate inputs
    if (!rejection_reason || rejection_reason.trim() === "") {
      await t.rollback();
      throw new Error("Rejection reason is required");
    }

    // 2. Validate admin exists
    const admin = await Admin.findOne({ 
      where: { user_id: adminUserId },
      transaction: t 
    });
    
    if (!admin) {
      await t.rollback();
      throw new Error("Admin profile not found");
    }

    // 3. Find mentor application
    const mentor = await Mentor.findByPk(mentorId, {
      include: [{ model: User }],
      transaction: t
    });

    if (!mentor) {
      await t.rollback();
      throw new Error("Application not found");
    }

    // 4. Validate current status
    if (mentor.approval_status === "approved") {
      await t.rollback();
      throw new Error("Cannot reject an approved application");
    }

    if (mentor.approval_status === "rejected") {
      await t.rollback();
      throw new Error("Application already rejected");
    }

    // 5. Update mentor status with rejection
    await mentor.update({
      approval_status: "rejected",
      rejected_by: admin.id,
      rejected_at: new Date(),
      rejection_reason: rejection_reason || null
    }, { transaction: t });

    // 6. Update user status to inactive
    await User.update(
      { status: "inactive" },
      { where: { id: mentor.user_id }, transaction: t }
    );

    // 7. Commit transaction before sending email
    await t.commit();

    // 8. ✅ Send rejection email (NO verification links, NO tokens - only decision notification)
    try {
      if (mentor.User && mentor.User.email) {
        await sendMentorRejectionEmail(mentor.User.email, mentor.first_name, rejection_reason);
        console.log(`✅ Rejection email sent to ${mentor.User.email}`);
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
      // Don't throw - rejection succeeded even if email failed
    }

    return mentor;

  } catch (error) {
    // Rollback if transaction not yet committed
    if (!t.finished) {
      await t.rollback();
    }
    throw error;
  }
};