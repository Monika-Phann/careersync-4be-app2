const bcrypt = require("bcrypt");
const {
  User,
  AccUser,
  Booking,
  Certificate,
  Mentor,
  Position,
  Session,
  ScheduleTimeslot,
} = require("../models");

const APP_URL = process.env.APP_URL;
if (!APP_URL) throw new Error('APP_URL environment variable is required');

exports.getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "role_name"],
    include: [
      {
        model: AccUser,
        attributes: [
          "id",
          "user_id",
          "first_name",
          "last_name",
          "phone",
          "gender",
          "dob",
          "types_user",
          "institution_name",
          "profile_image",
          "deleted_at",
          "created_at",
          "updated_at",
        ],
      },
    ],
  });

  if (!user) {
    return null;
  }

  // Convert to plain object and add full image URL
  const userData = user.toJSON();
  if (userData.AccUser && userData.AccUser.profile_image) {
    // If profile_image is already a full URL (R2), use it directly
    // Otherwise, construct it from APP_URL (legacy local storage)
    if (userData.AccUser.profile_image.startsWith('http')) {
      userData.AccUser.profile_image_url = userData.AccUser.profile_image;
    } else {
      userData.AccUser.profile_image_url = `${APP_URL}/uploads/${userData.AccUser.profile_image}`;
    }
  }

  return userData;
};

exports.updateProfile = async (userId, data, profileImageUrl) => {
  // First, get the current profile to preserve existing data
  const currentProfile = await AccUser.findOne({ where: { user_id: userId } });
  
  if (!currentProfile) {
    throw new Error("User profile not found");
  }

  // Build update object - only update fields that are explicitly provided
  // This prevents clearing fields that weren't included in the update
  const updateData = {};
  
  if (data.firstname !== undefined && data.firstname !== null) {
    updateData.first_name = data.firstname;
  }
  if (data.lastname !== undefined && data.lastname !== null) {
    updateData.last_name = data.lastname;
  }
  if (data.phone !== undefined && data.phone !== null) {
    updateData.phone = data.phone;
  }
  if (data.gender !== undefined && data.gender !== null) {
    updateData.gender = data.gender;
  }
  if (data.dob !== undefined) {
    updateData.dob = data.dob || null; // Allow null for dob
  }
  if (data.currentstatus !== undefined && data.currentstatus !== null) {
    updateData.types_user = data.currentstatus;
  }
  if (data.institution !== undefined && data.institution !== null) {
    updateData.institution_name = data.institution;
  }

  // Update profile_image if a new image URL is provided (from R2 upload)
  if (profileImageUrl) {
    updateData.profile_image = profileImageUrl; // Store the full R2 URL
    console.log("✅ Updating profile_image with R2 URL:", profileImageUrl);
  }

  // Only update if there are fields to update
  if (Object.keys(updateData).length > 0) {
    await AccUser.update(updateData, { where: { user_id: userId } });
    console.log("✅ Profile updated in database");
  }

  // Fetch and return the updated profile with full image URL
  const updatedProfile = await exports.getProfile(userId);
  const accUser = updatedProfile.AccUser || {};

  console.log("Updated profile AccUser:", accUser);
  console.log("Profile image from DB:", accUser.profile_image);

  // Construct full profile image URL
  // If profile_image is already a full URL (R2), use it directly
  // Otherwise, construct it from APP_URL (legacy local storage)
  let finalProfileImageUrl = null;
  if (accUser.profile_image) {
    if (accUser.profile_image.startsWith('http')) {
      // Already a full URL (R2)
      finalProfileImageUrl = accUser.profile_image;
    } else {
      // Legacy local storage path
      finalProfileImageUrl = `${APP_URL}/uploads/${accUser.profile_image}`;
    }
  }

  console.log("Final profile image URL:", finalProfileImageUrl);

  // Return formatted profile data
  return {
    id: updatedProfile.id,
    email: updatedProfile.email,
    role: updatedProfile.role_name,
    firstName: accUser.first_name || "",
    lastName: accUser.last_name || "",
    phone: accUser.phone || "",
    dob: accUser.dob || "",
    gender: accUser.gender || "",
    status: accUser.types_user || "",
    institution: accUser.institution_name || "",
    avatar: finalProfileImageUrl,
    profileImage: finalProfileImageUrl,
  };
};

exports.changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findByPk(userId);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new Error("Current password is incorrect");

  user.password = await bcrypt.hash(newPassword, 12);
  user.last_password_change = new Date();
  await user.save();
};

exports.getBookings = async (userId) => {
  // First get the AccUser ID
  const accUser = await AccUser.findOne({
    where: { user_id: userId },
  });

  if (!accUser) {
    return [];
  }

  return Booking.findAll({
    where: { acc_user_id: accUser.id },
    attributes: [
      "id",
      "mentor_id",
      "acc_user_id",
      "position_id",
      "session_id",
      "mentor_name_snapshot",
      "acc_user_name_snapshot",
      "position_name_snapshot",
      "session_price_snapshot",
      "start_date_snapshot",
      "end_date_snapshot",
      "total_amount",
      "status",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: Mentor,
        as: "mentorUser",
        attributes: [
          "id",
          "first_name",
          "last_name",
          "job_title",
          "company_name",
          "profile_image",
        ],
        required: false,
        include: [
          {
            model: User,
            attributes: ["email"],
            required: false,
          },
        ],
      },
      {
        model: Position,
        attributes: ["id", "position_name"],
        required: false,
      },
      {
        model: Session,
        attributes: ["id", "location_name"],
        required: false,
      },
      {
        model: ScheduleTimeslot,
        as: "ScheduleTimeslot",
        attributes: ["id", "start_time", "end_time"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

// exports.getCertificates = async (userId) => {
//   // Resolve AccUser
//   const accUser = await AccUser.findOne({
//     where: { user_id: userId },
//     attributes: ["id"]
//   });

//   if (!accUser) return [];

//   // 🔴 NO INCLUDES — BASE QUERY ONLY
//   return Certificate.findAll({
//     where: { acc_user_id: accUser.id }
//   });
// };

exports.getCertificates = async (userId) => {
  try {
    const accUser = await AccUser.findOne({
      where: { user_id: userId },
      attributes: ["id"],
    });

    if (!accUser) return [];

    return await Certificate.findAll({
      where: { acc_user_id: accUser.id },
      include: [
        {
          model: Booking,
          attributes: [
            "id",
            "mentor_name_snapshot",
            "acc_user_name_snapshot",
            "position_name_snapshot",
            "start_date_snapshot",
            "end_date_snapshot"
          ],
          required: false,
        },
        {
          model: Position,
          attributes: ["id", "position_name"],
          required: false,
        },
        {
          model: Mentor,
          as: "Issuer",
          attributes: ["id", "first_name", "last_name"],
          required: false,
        },
        {
          model: Mentor,
          attributes: ["id", "first_name", "last_name"],
          required: false,
        },
        {
          model: AccUser,
          attributes: ["id", "first_name", "last_name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw error;
  }
};
