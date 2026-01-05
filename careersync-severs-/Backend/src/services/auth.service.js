const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, AccUser, Admin, Mentor, sequelize } = require("../models");
const sendEmail = require("../utils/sendEmail");
const { Op } = require("sequelize");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m";
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

  // ✅ FIX: Handle R2 Image URL correctly
  // If 'fileUrl' is passed (from controller), use it. 
  // Otherwise fall back to 'default.png'.
  if (fileUrl && typeof fileUrl === 'string') {
    profileImage = fileUrl;
  } else {
    profileImage = "default.png";
  }

  if (!email || !password) throw new Error("email and password are required");

  // ✅ FIX: Use case-insensitive email check for PostgreSQL
  console.log('🔍 Checking if email exists:', email.toLowerCase());
  const exist = await User.findOne({ 
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      email.toLowerCase()
    )
  });
  
  if (exist) {
    console.log('❌ Email found in database:', exist.email, '| ID:', exist.id, '| Created:', exist.createdAt);
    throw new Error("Email already exists");
  }
  
  console.log('✅ Email not found, proceeding with registration');

  const hashedPassword = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create User record
  const user = await User.create({
    email,
    password: hashedPassword,
    role_name: role || "acc_user",
    verify_token: verifyToken, 
    verify_token_exp: verifyTokenExp,
    email_verified: false,
  });

  // Create AccUser record if role is acc_user
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
      profile_image: profileImage, // Now correctly contains the URL or "default.png"
    });
  }

  // ✅ Use the Frontend URL for verification link
  const frontendUrl = process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL;
  if (!frontendUrl) throw new Error('CLIENT_BASE_URL_PUBLIC or FRONTEND_URL environment variable is required');
  
  // Point to the API endpoint which handles verification logic and redirects
  const verifyUrl = `${APP_URL}/api/auth/verify/${verifyToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #4F46E5;">Welcome, ${firstname || "User"}!</h2>
      <p>Please verify your email address to activate your account.</p>
      <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verify Email</a>
      <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
    </div>
  `;

  await sendEmail({ to: email, subject: "Verify your CareerSync Email", html });

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

  // ✅ FIX: Use case-insensitive email check for PostgreSQL
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

  // Check verification
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

  const userData = user.toJSON ? user.toJSON() : user;
  return { user: userData, accessToken, refreshToken };
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

  // ✅ FIX: Use case-insensitive email check for PostgreSQL
  const user = await User.findOne({ 
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      email.toLowerCase()
    )
  });
  if (!user) return; // Silent return for security

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExp = new Date(Date.now() + 60 * 60 * 1000);

  await user.update({
    reset_token: resetToken,
    reset_token_exp: resetExp,
  });

  // ✅ Point to the Student Frontend for password reset
  const frontendUrl = process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL;
  if (!frontendUrl) throw new Error('CLIENT_BASE_URL_PUBLIC or FRONTEND_URL environment variable is required');
  const resetUrl = `${frontendUrl}/reset/${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #4F46E5;">Reset Password</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
      <p style="color: #666; font-size: 12px;">This link is valid for 1 hour.</p>
    </div>
  `;

  await sendEmail({ to: email, subject: "CareerSync Password Reset", html });
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
