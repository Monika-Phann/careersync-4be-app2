const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, AccUser, Admin, Mentor, sequelize } = require("../models");
// Change this line to use the fixed email service
const emailService = require("./email.service"); 
const { Op } = require("sequelize");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "7d";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d";
const APP_URL = process.env.APP_URL;
if (!APP_URL) throw new Error('APP_URL environment variable is required');

function generateToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, {
    expiresIn,
    algorithm: "HS256",
  });
}

async function registerUser(data, fileUrl) {
  let {
    email,
    password,
    role,
    firstname,
    lastname,
    phone,
    gender,
    currentstatus,
    dob,
    institution,
    profileImage,
  } = data;

  email = email?.toLowerCase().trim();
  firstname = firstname?.trim();
  lastname = lastname?.trim();
  password = password?.trim();
  gender = gender?.trim();
  institution = institution?.trim();
  currentstatus = currentstatus?.trim();
  dob = dob?.trim();
  phone = phone?.trim();

  if (fileUrl && typeof fileUrl === 'string') {
    profileImage = fileUrl;
  } else {
    profileImage = "default.png";
  }

  if (!email || !password) throw new Error("email and password are required");

  const exist = await User.findOne({ 
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      email.toLowerCase()
    )
  });
  
  if (exist) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    email,
    password: hashedPassword,
    role_name: role || "acc_user",
    verify_token: verifyToken, 
    verify_token_exp: verifyTokenExp,
    email_verified: false,
  });

  if ((role || "acc_user") === "acc_user") {
    await AccUser.create({
      user_id: user.id,
      first_name: firstname,
      last_name: lastname,
      phone,
      gender,
      dob: dob || null,
      types_user: currentstatus,
      institution_name: institution,
      profile_image: profileImage,
    });
  }

  // --- START ADMIN NOTIFICATION LOGIC ---
  if (role === 'mentor') {
    console.log("🚀 SERVICE: Mentor detected. Sending admin notification...");
    const adminEmail = process.env.ADMIN_EMAIL || 'careersync168@gmail.com';
    
    // Notify Admin via SendGrid
    emailService.sendEmail(
      adminEmail,
      "🚨 Action Required: New Mentor Registration",
      `<h3>New Mentor Approval Needed</h3><p><strong>Email:</strong> ${email}</p><p>Please log in to the admin panel to review.</p>`,
      `New Mentor Registration: ${email}`
    ).then(() => console.log("✅ Admin notification sent to:", adminEmail))
     .catch(err => console.error("❌ Admin notification failed:", err.message));
  }
  // --- END ADMIN NOTIFICATION LOGIC ---

  // Send standard verification email to the user
  await emailService.sendVerificationEmail(email, verifyToken, role || 'acc_user');
  console.log('✅ Verification email sent successfully to:', email);

  return user;
}

async function verifyEmailToken(token) {
  const user = await User.findOne({
    where: {
      verify_token: token,
      verify_token_exp: { [Op.gt]: new Date() },
    },
  });
  if (!user) throw new Error("Invalid or expired token");

  await user.update({
    email_verified: true,
    verify_token: null,
    verify_token_exp: null,
  });

  return user;
}

async function loginUser(email, password) {
  if (!email || !password) throw new Error("Email and password required");
  email = email.toLowerCase().trim();

  const user = await User.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('User.email')),
      email.toLowerCase()
    ),
    include: [
      { model: Admin, attributes: ["id", "full_name", "phone", "profile_image"], required: false },
      { model: Mentor, attributes: ["id", "first_name", "last_name", "profile_image", "approval_status"], required: false },
      { model: AccUser, attributes: ["id", "user_id", "first_name", "last_name", "phone", "profile_image"], required: false },
    ],
  });
  
  if (!user) throw new Error("Invalid email or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid email or password");

  if (user.role_name === "mentor") {
     if (user.Mentor && user.Mentor.approval_status !== "approved") {
        throw new Error("Your mentor account is pending approval or rejected.");
     }
  } else if (user.role_name !== "admin") {
    if (!user.email_verified) {
      throw new Error("Please verify your email before login");
    }
  }

  const accessToken = generateToken({ id: user.id, role: user.role_name }, JWT_ACCESS_SECRET, ACCESS_EXPIRES);
  const refreshToken = generateToken({ id: user.id }, JWT_REFRESH_SECRET, REFRESH_EXPIRES);

  await user.update({ refresh_token: refreshToken });
  return { user: user.toJSON(), accessToken, refreshToken };
}

async function refreshToken(token) {
  if (!token) throw new Error("No refresh token");
  const user = await User.findOne({ where: { refresh_token: token } });
  if (!user) throw new Error("Invalid refresh token");

  jwt.verify(token, JWT_REFRESH_SECRET, (err) => {
    if (err) throw new Error("Token expired");
  });

  return generateToken({ id: user.id, role: user.role_name }, JWT_ACCESS_SECRET, ACCESS_EXPIRES);
}

async function logoutUser(token) {
  if (!token) return null;
  const user = await User.findOne({ where: { refresh_token: token } });
  if (!user) return null;
  await user.update({ refresh_token: null });
  return user;
}

async function resetPasswordRequest(email) {
  if (!email) throw new Error("Email required");
  email = email.toLowerCase().trim();

  const user = await User.findOne({ 
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      email.toLowerCase()
    )
  });
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExp = new Date(Date.now() + 60 * 60 * 1000);

  await user.update({
    reset_token: resetToken,
    reset_token_exp: resetExp,
  });

  await emailService.sendResetPasswordEmail(email, resetToken);
}

async function resetPassword(token, password) {
  const user = await User.findOne({ where: { reset_token: token } });
  if (!user) throw new Error("Invalid token");
  if (user.reset_token_exp < new Date()) throw new Error("Token expired");

  const hashed = await bcrypt.hash(password, 10);
  await user.update({
    password: hashed,
    reset_token: null,
    reset_token_exp: null,
  });
}

module.exports = {
  registerUser,
  verifyEmailToken,
  loginUser,
  refreshToken,
  logoutUser,
  resetPasswordRequest,
  resetPassword,
};
