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
    // IMPORTANT: Never use API URL as frontend URL
    let frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL;
    const apiUrl = process.env.APP_URL || process.env.API_URL || '';
    
    // Safety check: If frontendUrl is empty, missing, or points to API domain, use production fallback
    if (!frontendUrl || frontendUrl.includes('/api') || frontendUrl.includes('api-4be') || frontendUrl === apiUrl) {
      const isProduction = process.env.NODE_ENV === 'production' || 
                           (apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1'));
      frontendUrl = isProduction 
        ? 'https://careersync-4be.ptascloud.online' 
        : 'http://localhost:5174';
      console.warn('⚠️ Frontend URL not set or points to API. Using fallback:', frontendUrl);
    }
    
    // Ensure proper URL formatting - remove trailing slashes and ensure it's an absolute URL
    frontendUrl = frontendUrl.trim().replace(/\/+$/, '');
    
    // Final safety check: Ensure it's NOT the API URL
    if (frontendUrl.includes('api-4be') || frontendUrl === apiUrl) {
      console.error('❌ Frontend URL still points to API! Forcing correct frontend URL.');
      frontendUrl = 'https://careersync-4be.ptascloud.online';
    }
    
    // Validate URL format - must start with http:// or https://
    if (!frontendUrl.match(/^https?:\/\//)) {
      console.error('Invalid frontend URL format:', frontendUrl);
      frontendUrl = 'https://careersync-4be.ptascloud.online';
    }
    
    const redirectUrl = `${frontendUrl}/signin?verified=true`;
    
    console.log('✅ Email verification successful, redirecting to:', redirectUrl);
    return res.redirect(302, redirectUrl);

  } catch (err) {
    console.error("Verification error:", err.message);
    // Redirect to frontend with error flag
    // IMPORTANT: Never use API URL as frontend URL
    let frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL;
    const apiUrl = process.env.APP_URL || process.env.API_URL || '';
    
    // Safety check: If frontendUrl is empty, missing, or points to API domain, use production fallback
    if (!frontendUrl || frontendUrl.includes('/api') || frontendUrl.includes('api-4be') || frontendUrl === apiUrl) {
      const isProduction = process.env.NODE_ENV === 'production' || 
                           (apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1'));
      frontendUrl = isProduction 
        ? 'https://careersync-4be.ptascloud.online' 
        : 'http://localhost:5174';
      console.warn('⚠️ Frontend URL not set or points to API. Using fallback:', frontendUrl);
    }
    
    // Ensure proper URL formatting - remove trailing slashes and ensure it's an absolute URL
    frontendUrl = frontendUrl.trim().replace(/\/+$/, '');
    
    // Final safety check: Ensure it's NOT the API URL
    if (frontendUrl.includes('api-4be') || frontendUrl === apiUrl) {
      console.error('❌ Frontend URL still points to API! Forcing correct frontend URL.');
      frontendUrl = 'https://careersync-4be.ptascloud.online';
    }
    
    // Validate URL format - must start with http:// or https://
    if (!frontendUrl.match(/^https?:\/\//)) {
      console.error('Invalid frontend URL format:', frontendUrl);
      frontendUrl = 'https://careersync-4be.ptascloud.online';
    }
    
    const redirectUrl = `${frontendUrl}/signin?error=verification_failed`;
    
    console.log('❌ Email verification failed, redirecting to:', redirectUrl);
    return res.redirect(302, redirectUrl);
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
// NOTE: This route should only be accessed via /api/auth/reset/:token
// If email links point directly to frontend, this won't be called
exports.showResetPasswordForm = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      let frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || process.env.CLIENT_BASE_URL_PUBLIC;
      if (!frontendUrl) {
        const isProduction = process.env.NODE_ENV === 'production' || 
                             (process.env.APP_URL && !process.env.APP_URL.includes('localhost') && !process.env.APP_URL.includes('127.0.0.1'));
        frontendUrl = isProduction 
          ? 'https://careersync-4be.ptascloud.online' 
          : 'http://localhost:5174';
      }
      return res.redirect(302, `${frontendUrl}/reset?error=invalid`);
    }
    
    // Validate token exists and is not expired
    const { User } = require('../models');
    const user = await User.findOne({ where: { reset_token: token } });
    
    // Get frontend URL - ensure it's NOT the backend API URL
    let frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || process.env.CLIENT_BASE_URL_PUBLIC || process.env.FRONTEND_URL;
    
    // Smart production detection: check NODE_ENV or if APP_URL contains production domain
    const isProduction = process.env.NODE_ENV === 'production' || 
                         (process.env.APP_URL && !process.env.APP_URL.includes('localhost') && !process.env.APP_URL.includes('127.0.0.1'));
    
    // Only use localhost fallback in development
    if (!frontendUrl) {
      if (isProduction) {
        frontendUrl = 'https://careersync-4be.ptascloud.online';
        console.warn('⚠️ CLIENT_BASE_URL_STUDENT not set! Using production domain fallback.');
      } else {
        frontendUrl = 'http://localhost:5174';
      }
    }
    
    // Safety check: prevent redirect loop - ensure frontendUrl is NOT pointing to backend
    const apiPort = process.env.PORT || '5001';
    const apiHost = process.env.APP_URL || process.env.API_URL || `http://localhost:${apiPort}`;
    
    // Remove any trailing slashes and normalize
    frontendUrl = frontendUrl.replace(/\/$/, '').replace(/\/api\/?$/, '');
    const normalizedApiUrl = apiHost.replace(/\/$/, '').replace(/\/api\/?$/, '');
    
    // If frontendUrl matches backend URL or contains API paths, use production domain
    if (frontendUrl === normalizedApiUrl || frontendUrl.includes('/api') || frontendUrl.includes(`:${apiPort}`)) {
      console.warn('⚠️ Frontend URL appears to point to backend! Using production domain.');
      frontendUrl = isProduction 
        ? 'https://careersync-4be.ptascloud.online' 
        : 'http://localhost:5174';
    }

    if (!user) {
      return res.redirect(302, `${frontendUrl}/reset/${token}?error=invalid`);
    }
    
    if (user.reset_token_exp && new Date(user.reset_token_exp) < new Date()) {
      return res.redirect(302, `${frontendUrl}/reset/${token}?error=expired`);
    }
    
    // Valid token - redirect to frontend reset password page (302 temporary redirect)
    res.redirect(302, `${frontendUrl}/reset/${token}`);
  } catch (err) {
    console.error('Error showing reset password form:', err);
    let frontendUrl = process.env.CLIENT_BASE_URL_STUDENT || process.env.CLIENT_BASE_URL_PUBLIC;
    if (!frontendUrl) {
      const isProduction = process.env.NODE_ENV === 'production' || 
                           (process.env.APP_URL && !process.env.APP_URL.includes('localhost') && !process.env.APP_URL.includes('127.0.0.1'));
      frontendUrl = isProduction 
        ? 'https://careersync-4be.ptascloud.online' 
        : 'http://localhost:5174';
    }
    res.redirect(302, `${frontendUrl}/reset?error=invalid`);
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
