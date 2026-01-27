// src/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Mentor, sequelize } = require("../models");
const { Op } = require("sequelize");
const sendEmail = require("../utils/sendEmail");
const path = require("path");


const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "7d";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d";
const APP_URL = process.env.APP_URL;
if (!APP_URL) throw new Error('APP_URL environment variable is required');

function generateToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

// ---- Register ----

exports.register = async (req, res) => {
  try {
    let { email, password, role, firstname,lastname, phone, gender,currentstatus, dob, institution, profileImage } = req.body;

    // 1. Trim all string fields and lowercase email
    email = email?.toLowerCase().trim();
    firstname = firstname?.trim();
    lastname = lastname?.trim();
    password = password?.trim();
    gender = gender?.trim();
    institution = institution?.trim();
    currentstatus = currentstatus?.trim();
    dob = dob?.trim();
    phone = phone?.trim();
    currentstatus = currentstatus?.trim();
    institution = institution?.trim();

    // Assign profileImage from req.file if available, otherwise use trimmed value from body
    profileImage = req.file ? req.file.filename : profileImage?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    // ✅ FIX: Use case-insensitive email check for PostgreSQL
    const exist = await User.findOne({ 
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        email.toLowerCase()
      )
    });
    if (exist) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "user",
      firstname,
      lastname,
      phone,
      gender,
      currentstatus,
      dob: dob || null,
      institution,
      profileImage,
      verifyToken,
      verifyTokenExp,
      emailVerified: false
    });

    const verifyUrl = `${process.env.APP_URL}/api/auth/verify/${verifyToken}`;
    const html = `
      <p>Hi ${firstname || lastname || "there"},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `;

      // 2. Send email only if trimmed email is valid
    const trimmedEmail = (email || "").trim();
    
      await sendEmail({
      to: trimmedEmail,
      subject: "Verify your email to complete registration with CareerySync",
      html
    });

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};





// ---- Verify email ----

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        verifyToken: token,
        verifyTokenExp: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    await user.update({
      emailVerified: true,
      verifyToken: true,
      verifyTokenExp: true
    });

    // res.json({ message: "Email verified successfully!" });
    res.send('<h3 style="text-align: center">Email verified successfully!</h3>');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// ---- Login ----
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Please verify your email before login" });
    }

    const accessToken = generateToken({ id: user.id, role: user.role }, JWT_ACCESS_SECRET, ACCESS_EXPIRES);
    const refreshToken = generateToken({ id: user.id }, JWT_REFRESH_SECRET, REFRESH_EXPIRES);

    await user.update({ refreshToken });

    // set httpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      gender: user.gender,
      currentstatus: user.currentstatus,
      institution: user.institution,  
      dob: user.dob,
      profileImage: user.profileImage,
      emailVerified: user.emailVerified
    };

    res.json({ message: "Logged in", accessToken, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---- Refresh token ----
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const user = await User.findOne({ where: { refreshToken: token } });
    if (!user) return res.status(403).json({ message: "Invalid refresh token" });

    jwt.verify(token, JWT_REFRESH_SECRET, (err) => {
      if (err) return res.status(403).json({ message: "Token expired" });

      const accessToken = generateToken({ id: user.id, role: user.role }, JWT_ACCESS_SECRET, ACCESS_EXPIRES);
      res.json({ accessToken });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---- Logout ----
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(204);

    const user = await User.findOne({ where: { refreshToken: token } });
    if (!user) {
      res.clearCookie("refreshToken");
      return res.sendStatus(204);
    }

    await user.update({ refreshToken: null });
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---- Reset password request ----
exports.resetRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: "If an account exists, a reset email was sent" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({ resetToken, resetTokenExp: resetExp });

    const resetUrl = `${APP_URL}/api/auth/reset/${resetToken}`;
    const html = `<p>Reset your password by clicking below:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link is valid for 1 hour.</p>`;

    await sendEmail({ to: email, subject: "Password reset", html });

    res.json({ message: "If an account exists, a reset email was sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ---- Reset password (use token) ----
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Missing token or password" });

    const user = await User.findOne({ where: { resetToken: token } });
    if (!user) return res.status(400).json({ message: "Invalid token" });
    if (user.resetTokenExp < new Date()) return res.status(400).json({ message: "Token expired" });

    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed, resetToken: null, resetTokenExp: null });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Add to authController.js
exports.changePassword = async (req, res) => {
  try {
    // 1. Check authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Please login first" });
    }

    const { currentPassword, newPassword } = req.body;
    
    // 2. Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // 3. Find user
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // 5. Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: err.message });
  }
};


// ---- Verify Mentor (after admin approval) ----
exports.verifyMentor = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        verifyToken: token,
        verifyTokenExp: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    // Upgrade user role to mentor AND verify email
    await user.update({
      role: "mentor",
      emailVerified: true,
      verifyToken: null,
      verifyTokenExp: null
    });

    res.json({
      message: "Congratulations! Your mentor account is now active. You can login and start creating sessions.",
      role: "mentor"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};