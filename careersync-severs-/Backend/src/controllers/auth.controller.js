const authService = require("../services/auth.service");

exports.register = async (req, res) => {
  try {
    // 1. Check if a file was uploaded to R2
    let profileImageUrl = null;
    
    if (req.file) {
      // ✅ FIX: Force use of the R2_PUBLIC_URL from .env
      // This ensures we get the 'pub-...' link instead of the long 'cloudflarestorage' link
      if (process.env.R2_PUBLIC_URL && req.file.key) {
        profileImageUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      } else {
        // Fallback if env var is missing
        profileImageUrl = req.file.location;
      }
    }

    // 2. Send the body data AND the image URL to your service
    await authService.registerUser(req.body, profileImageUrl);
    
    res.status(201).json({ message: "User registered successfully. Please check your email to verify your account." });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    // Support both path parameter and query parameter
    const token = req.params.token || req.query.token;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }
    
    await authService.verifyEmailToken(token);
    
    // Redirect to the student frontend using env
    const frontendUrl = process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL || 'http://localhost:5174';
    return res.redirect(`${frontendUrl}/signin?verified=true`);

  } catch (err) {
    console.error("Verification error:", err.message);
    // Redirect to frontend with error flag
    const frontendUrl = process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL || 'http://localhost:5174';
    return res.redirect(`${frontendUrl}/signin?error=verification_failed`);
  }
};

exports.login = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body.email, req.body.password);
    
    // Convert Sequelize model to plain object to avoid serialization issues
    const userData = user.toJSON ? user.toJSON() : user;
    
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7*24*60*60*1000 });
    res.json({ message: "Logged in", accessToken, user: userData });
  } catch (err) {
    console.error("Login error:", err);
    // Return 500 for unexpected errors, 400 for validation errors
    const statusCode = err.message && (err.message.includes("required") || err.message.includes("Invalid") || err.message.includes("verify")) ? 400 : 500;
    res.status(statusCode).json({ message: err.message || "Login failed" });
  }
  console.log("VERIFYING TOKEN WITH:", process.env.JWT_ACCESS_SECRET);
};

exports.refresh = async (req, res) => {
  try {
    const accessToken = await authService.refreshToken(req.cookies.refreshToken);
    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await authService.logoutUser(req.cookies.refreshToken);
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetRequest = async (req, res) => {
  try {
    await authService.resetPasswordRequest(req.body.email);
    res.json({ message: "If an account exists, a reset email was sent" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET route to handle reset password link clicks from email
exports.showResetPasswordForm = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Validate token exists and is not expired
    const { User } = require('../models');
    const user = await User.findOne({ where: { reset_token: token } });
    
    // Use the hardcoded production URL to be safe, or fallback to env
    const frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || 'https://careersync-4be.ptascloud.online';

    if (!user) {
      return res.redirect(`${frontendUrl}/reset/${token}?error=invalid`);
    }
    
    if (user.reset_token_exp && new Date(user.reset_token_exp) < new Date()) {
      return res.redirect(`${frontendUrl}/reset/${token}?error=expired`);
    }
    
    // Valid token - redirect to frontend reset password page
    res.redirect(`${frontendUrl}/reset/${token}`);
  } catch (err) {
    console.error('Error showing reset password form:', err);
    const frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || 'https://careersync-4be.ptascloud.online';
    res.redirect(`${frontendUrl}/reset?error=invalid`);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get current authenticated user
exports.getMe = async (req, res) => {
  try {
    const { User, Admin, Mentor, AccUser } = require('../models');
    
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role_name', 'status', 'email_verified'],
      include: [
        { model: Admin, attributes: ['id', 'full_name', 'phone', 'profile_image'], required: false },
        { model: Mentor, attributes: ['id', 'first_name', 'last_name', 'profile_image', 'approval_status'], required: false },
        { model: AccUser, attributes: ['id', 'user_id', 'first_name', 'last_name', 'phone', 'gender', 'dob', 'types_user', 'institution_name', 'profile_image', 'deleted_at', 'created_at', 'updated_at'], required: false }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response based on role
    let userData = {
      id: user.id,
      email: user.email,
      role_name: user.role_name,
      status: user.status,
      email_verified: user.email_verified
    };

    if (user.role_name === 'admin' && user.Admin) {
      userData.full_name = user.Admin.full_name;
      userData.profile_image = user.Admin.profile_image;
    } else if (user.role_name === 'mentor' && user.Mentor) {
      userData.first_name = user.Mentor.first_name;
      userData.last_name = user.Mentor.last_name;
      userData.profile_image = user.Mentor.profile_image;
      userData.approval_status = user.Mentor.approval_status;
    } else if (user.role_name === 'acc_user' && user.AccUser) {
      userData.first_name = user.AccUser.first_name;
      userData.last_name = user.AccUser.last_name;
      userData.profile_image = user.AccUser.profile_image;
    }

    res.json(userData);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
