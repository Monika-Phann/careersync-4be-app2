const mentorService = require("../services/mentor.service");
const mentorAdminService = require("../services/mentorAdmin.service");
const sessionService = require("../services/session.service");

// Register mentor (guest registration)
exports.registerMentor = async (req, res) => {
  try {
    const mentorData = req.body;
    
    // Extract profile image URL from R2 upload
    let profileImageUrl = null;
    if (req.files?.profile_image?.[0]) {
      const file = req.files.profile_image[0];
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && file.key) {
        profileImageUrl = `${process.env.R2_PUBLIC_URL}/${file.key}`;
      } else if (file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        profileImageUrl = file.location;
      } else if (file.filename) {
        // Legacy fallback for local uploads
        profileImageUrl = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/${file.filename}`;
      }
    }
    
    const documents = req.files?.mentor_documents || [];
    const education = req.body.education ? (typeof req.body.education === 'string' ? JSON.parse(req.body.education) : req.body.education) : [];
    
    const result = await mentorService.registerMentor(mentorData, profileImageUrl, documents, education);
    res.status(201).json({ message: "Mentor registered successfully", ...result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Apply as mentor (authenticated user)
exports.applyAsMentor = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.user_id; // Support both authenticated and unauthenticated
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }
    
    const mentorData = req.body;
    
    // Extract profile image URL from R2 upload
    let profileImageUrl = null;
    if (req.files?.profile_image?.[0]) {
      const file = req.files.profile_image[0];
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && file.key) {
        profileImageUrl = `${process.env.R2_PUBLIC_URL}/${file.key}`;
      } else if (file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        profileImageUrl = file.location;
      } else if (file.filename) {
        // Legacy fallback for local uploads
        profileImageUrl = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/${file.filename}`;
      }
    }
    
    const documents = req.files?.mentor_documents || [];
    const education = req.body.education ? (typeof req.body.education === 'string' ? JSON.parse(req.body.education) : req.body.education) : [];
    
    const mentor = await mentorService.applyAsMentor(userId, mentorData, profileImageUrl, documents, education);
    res.status(201).json({ message: "Application submitted successfully", mentor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get my application
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id;
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }
    const mentor = await mentorService.getMyApplication(userId);
    res.json(mentor);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Get all approved mentors (public)
exports.getAllMentors = async (req, res) => {
  try {
    const mentors = await mentorService.getAllApprovedMentors();
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get mentor by ID (public)
exports.getMentorById = async (req, res) => {
  try {
    const mentor = await mentorService.getMentorById(req.params.id);
    res.json(mentor);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Get my profile
exports.getMyProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user.id;
    const profile = await mentorService.getMyProfile(userId);
    const mentor = profile.mentor;
    
    if (!mentor) {
      return res.status(404).json({ message: "Mentor profile not found" });
    }
    
    // Format response
    const formattedProfile = {
      id: mentor.id,
      first_name: mentor.first_name || '',
      last_name: mentor.last_name || '',
      phone: mentor.phone || null,
      gender: mentor.gender || null,
      dob: mentor.dob || null,
      profile_image: mentor.profile_image || null,
      job_title: mentor.job_title || null,
      company_name: mentor.company_name || null,
      experience_years: mentor.experience_years || null,
      expertise_areas: mentor.expertise_areas || null,
      about_mentor: mentor.about_mentor || null,
      social_media: mentor.social_media || null,
      session_rate: mentor.session_rate || null,
      meeting_location: mentor.meeting_location || null,
      session_agenda_pdf: mentor.session_agenda_pdf || null,
      portfolio_pdf: mentor.portfolio_pdf || null,
      User: mentor.User ? {
        id: mentor.User.id,
        email: mentor.User.email || '',
        role_name: mentor.User.role_name || '',
        status: mentor.User.status || ''
      } : null,
      Position: mentor.Position ? {
        id: mentor.Position.id,
        position_name: mentor.Position.position_name,
        image_position: mentor.Position.image_position
      } : null,
      Industry: mentor.Industry ? {
        id: mentor.Industry.id,
        industry_name: mentor.Industry.industry_name
      } : null,
      MentorEducations: mentor.MentorEducations && Array.isArray(mentor.MentorEducations)
        ? mentor.MentorEducations.map(edu => ({
            id: edu.id,
            university_name: edu.university_name || null,
            degree_name: edu.degree_name || null,
            field_of_study: edu.field_of_study || null,
            year_graduated: edu.year_graduated || null,
            grade_gpa: edu.grade_gpa || null,
            activities: edu.activities || null
          }))
        : [],
      MentorDocuments: mentor.MentorDocuments && Array.isArray(mentor.MentorDocuments)
        ? mentor.MentorDocuments.map(doc => ({
            id: doc.id,
            document_type: doc.document_type || null,
            document_url: doc.document_url || null,
            created_at: doc.created_at || null
          }))
        : []
    };
    
    res.json({ mentor: formattedProfile });
  } catch (err) {
    console.error('getMyProfile error:', err);
    res.status(404).json({ message: err.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user.id;
    
    // Extract profile image URL from R2 upload
    let profileImageUrl = null;
    if (req.file) {
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && req.file.key) {
        profileImageUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      } else if (req.file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        profileImageUrl = req.file.location;
      } else if (req.file.filename) {
        // Legacy fallback for local uploads
        profileImageUrl = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/${req.file.filename}`;
      }
    }
    
    // ✅ Only include fields that are provided and not empty
    // Important: Don't set required fields to null/empty as they cannot be null in DB
    const updates = {};
    
    // Handle name fields (required, but only update if provided)
    if (req.body.first_name && typeof req.body.first_name === 'string' && req.body.first_name.trim()) {
      updates.first_name = req.body.first_name.trim();
    } else if (req.body.firstName && typeof req.body.firstName === 'string' && req.body.firstName.trim()) {
      updates.first_name = req.body.firstName.trim();
    }
    
    if (req.body.last_name && typeof req.body.last_name === 'string' && req.body.last_name.trim()) {
      updates.last_name = req.body.last_name.trim();
    } else if (req.body.lastName && typeof req.body.lastName === 'string' && req.body.lastName.trim()) {
      updates.last_name = req.body.lastName.trim();
    }
    
    // Handle optional fields
    if (req.body.phone && typeof req.body.phone === 'string' && req.body.phone.trim()) {
      updates.phone = req.body.phone.trim();
    } else if (req.body.phoneNumber && typeof req.body.phoneNumber === 'string' && req.body.phoneNumber.trim()) {
      updates.phone = req.body.phoneNumber.trim();
    }
    
    // Handle gender
    if (req.body.gender !== undefined && req.body.gender !== null && req.body.gender !== '') {
      updates.gender = req.body.gender.trim();
    }
    
    // Handle dob (date of birth)
    if (req.body.dob !== undefined && req.body.dob !== null && req.body.dob !== '') {
      updates.dob = req.body.dob.trim();
    }
    
    if (req.body.job_title && typeof req.body.job_title === 'string' && req.body.job_title.trim()) {
      updates.job_title = req.body.job_title.trim();
    } else if (req.body.jobTitle && typeof req.body.jobTitle === 'string' && req.body.jobTitle.trim()) {
      updates.job_title = req.body.jobTitle.trim();
    }
    
    if (req.body.company_name && typeof req.body.company_name === 'string' && req.body.company_name.trim()) {
      updates.company_name = req.body.company_name.trim();
    } else if (req.body.companyName && typeof req.body.companyName === 'string' && req.body.companyName.trim()) {
      updates.company_name = req.body.companyName.trim();
    }
    
    if (req.body.experience_years !== undefined && req.body.experience_years !== null && req.body.experience_years !== '') {
      const expYears = parseInt(req.body.experience_years);
      if (!isNaN(expYears)) {
        updates.experience_years = expYears;
      }
    } else if (req.body.experience !== undefined && req.body.experience !== null && req.body.experience !== '') {
      const expYears = parseInt(req.body.experience);
      if (!isNaN(expYears)) {
        updates.experience_years = expYears;
      }
    }
    
    if (req.body.about_mentor !== undefined && req.body.about_mentor !== null) {
      updates.about_mentor = req.body.about_mentor;
    } else if (req.body.aboutMentor !== undefined && req.body.aboutMentor !== null) {
      updates.about_mentor = req.body.aboutMentor;
    } else if (req.body.about !== undefined && req.body.about !== null) {
      updates.about_mentor = req.body.about;
    }
    
    // Handle expertise_areas
    if (req.body.expertise_areas !== undefined && req.body.expertise_areas !== null) {
      let expertiseValue = req.body.expertise_areas;
      
      // If it's a JSON string, parse it
      if (typeof expertiseValue === 'string') {
        try {
          const parsed = JSON.parse(expertiseValue);
          if (Array.isArray(parsed)) {
            // Convert array to comma-separated string for database storage
            updates.expertise_areas = parsed.join(', ');
          } else {
            updates.expertise_areas = expertiseValue;
          }
        } catch (e) {
          // If parsing fails, use as-is (might already be a comma-separated string)
          updates.expertise_areas = expertiseValue;
        }
      } else {
        updates.expertise_areas = expertiseValue;
      }
    }
    
    if (req.body.social_media && typeof req.body.social_media === 'string' && req.body.social_media.trim()) {
      updates.social_media = req.body.social_media.trim();
    } else if (req.body.socialMedia && typeof req.body.socialMedia === 'string' && req.body.socialMedia.trim()) {
      updates.social_media = req.body.socialMedia.trim();
    } else if (req.body.linkedin && typeof req.body.linkedin === 'string' && req.body.linkedin.trim()) {
      updates.social_media = req.body.linkedin.trim();
    }
    
    // Handle session_rate - convert to number
    if (req.body.session_rate !== undefined && req.body.session_rate !== null && req.body.session_rate !== '') {
      const rate = parseFloat(req.body.session_rate);
      if (!isNaN(rate) && rate >= 0) {
        updates.session_rate = rate;
      }
    } else if (req.body.sessionRate !== undefined && req.body.sessionRate !== null && req.body.sessionRate !== '') {
      const rate = parseFloat(req.body.sessionRate);
      if (!isNaN(rate) && rate >= 0) {
        updates.session_rate = rate;
      }
    }
    
    if (req.body.meeting_location && typeof req.body.meeting_location === 'string' && req.body.meeting_location.trim()) {
      updates.meeting_location = req.body.meeting_location.trim();
    } else if (req.body.meetingLocation && typeof req.body.meetingLocation === 'string' && req.body.meetingLocation.trim()) {
      updates.meeting_location = req.body.meetingLocation.trim();
    }
    
    // Handle position_id (UUID, not integer)
    if (req.body.position_id !== undefined && req.body.position_id !== null && req.body.position_id !== '') {
      const positionId = String(req.body.position_id).trim();
      // Validate UUID format (basic check)
      if (positionId.length > 0 && positionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        updates.position_id = positionId;
      } else {
        console.warn('Invalid position_id format (expected UUID):', positionId);
      }
    } else if (req.body.positionId !== undefined && req.body.positionId !== null && req.body.positionId !== '') {
      const positionId = String(req.body.positionId).trim();
      // Validate UUID format (basic check)
      if (positionId.length > 0 && positionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        updates.position_id = positionId;
      } else {
        console.warn('Invalid positionId format (expected UUID):', positionId);
      }
    }
    
    // Handle industry_id (UUID, not integer)
    if (req.body.industry_id !== undefined && req.body.industry_id !== null && req.body.industry_id !== '') {
      const industryId = String(req.body.industry_id).trim();
      // Validate UUID format (basic check)
      if (industryId.length > 0 && industryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        updates.industry_id = industryId;
      } else {
        console.warn('Invalid industry_id format (expected UUID):', industryId);
      }
    } else if (req.body.industryId !== undefined && req.body.industryId !== null && req.body.industryId !== '') {
      const industryId = String(req.body.industryId).trim();
      // Validate UUID format (basic check)
      if (industryId.length > 0 && industryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        updates.industry_id = industryId;
      } else {
        console.warn('Invalid industryId format (expected UUID):', industryId);
      }
    }
    
    // Handle education updates if provided
    let education = null;
    if (req.body.education !== undefined) {
      try {
        // Parse education if it's a JSON string
        if (typeof req.body.education === 'string') {
          education = JSON.parse(req.body.education);
        } else if (Array.isArray(req.body.education)) {
          education = req.body.education;
        }
      } catch (e) {
        console.warn('Failed to parse education data:', e);
        education = null;
      }
    }
    
    console.log('📝 Updates to apply:', JSON.stringify(updates, null, 2));
    console.log('📝 Education updates:', education ? `${education.length} entries` : 'none');
    
    if (req.body.email) {
      const { User } = require('../models');
      await User.update(
        { email: req.body.email.toLowerCase().trim() },
        { where: { id: userId } }
      );
    }
    
    // Use updateProfileWithEducation if education is provided, otherwise use updateProfile
    let mentor;
    if (education !== null && Array.isArray(education)) {
      updates.education = education;
      console.log('✅ Calling mentorService.updateProfileWithEducation with:', { userId, updatesCount: Object.keys(updates).length, educationCount: education.length, hasProfileImage: !!profileImageUrl });
      mentor = await mentorService.updateProfileWithEducation(userId, updates, profileImageUrl);
      console.log('✅ mentorService.updateProfileWithEducation completed successfully');
    } else {
      console.log('✅ Calling mentorService.updateProfile with:', { userId, updatesCount: Object.keys(updates).length, hasProfileImage: !!profileImageUrl });
      mentor = await mentorService.updateProfile(userId, updates, profileImageUrl);
      console.log('✅ mentorService.updateProfile completed successfully');
    }
    
    const formattedProfile = {
      id: mentor.id,
      first_name: mentor.first_name || '',
      last_name: mentor.last_name || '',
      phone: mentor.phone || null,
      gender: mentor.gender || null,
      dob: mentor.dob || null,
      profile_image: mentor.profile_image || null,
      job_title: mentor.job_title || null,
      company_name: mentor.company_name || null,
      experience_years: mentor.experience_years || null,
      expertise_areas: mentor.expertise_areas || null,
      about_mentor: mentor.about_mentor || null,
      social_media: mentor.social_media || null,
      session_rate: mentor.session_rate || null,
      meeting_location: mentor.meeting_location || null,
      User: mentor.User ? {
        email: mentor.User.email || req.body.email || ''
      } : null,
      Position: mentor.Position ? {
        id: mentor.Position.id,
        position_name: mentor.Position.position_name,
        image_position: mentor.Position.image_position
      } : null,
      Industry: mentor.Industry ? {
        id: mentor.Industry.id,
        industry_name: mentor.Industry.industry_name
      } : null,
      MentorEducations: mentor.MentorEducations ? mentor.MentorEducations.map(edu => ({
        id: edu.id,
        degree_name: edu.degree_name || '',
        university_name: edu.university_name || '',
        year_graduated: edu.year_graduated || null
      })) : []
    };
    
    res.json({ 
      message: "Profile updated successfully",
      mentor: formattedProfile
    });
  } catch (err) {
    console.error('❌ updateProfile error:', err);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      sql: err.sql
    });
    
    // Return appropriate status code
    const statusCode = err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError' ? 400 : 500;
    
    res.status(statusCode).json({ 
      message: err.message || 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? {
        name: err.name,
        stack: err.stack,
        sql: err.sql
      } : undefined
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
    
    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }
    
    // Check if new password is the same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }
    
    const { User } = require('../models');
    const bcrypt = require('bcrypt');
    
    // Find user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    
    console.log('✅ Password changed successfully for user:', req.user.id);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error('❌ Change password error:', err);
    res.status(400).json({ message: err.message || "Failed to change password" });
  }
};

// Get pending mentors (admin)
exports.getPending = async (req, res) => {
  try {
    const mentors = await mentorAdminService.getPendingApplications();
    res.json(mentors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve mentor (admin)
exports.approve = async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    const adminUserId = req.user?.id || req.body.admin_id;
    if (!adminUserId) {
      return res.status(401).json({ message: "Admin ID required" });
    }
    
    await mentorAdminService.approveApplication(mentorId, adminUserId);
    res.json({ message: "Mentor approved successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Reject mentor (admin)
exports.reject = async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    const adminUserId = req.user?.id || req.body.admin_id;
    const rejectionReason = req.body.rejection_reason || req.body.reason;
    
    if (!adminUserId) {
      return res.status(401).json({ message: "Admin ID required" });
    }
    
    await mentorAdminService.rejectApplication(mentorId, adminUserId, rejectionReason);
    res.json({ message: "Mentor rejected successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get my stats
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id;
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }
    const stats = await mentorService.getMyStats(userId);
    res.json(stats);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Get my available sessions
exports.getMyAvailableSessions = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id;
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }
    const sessions = await mentorService.getMyAvailableSessions(userId);
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// Update profile full (with education)
exports.updateProfileFull = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user.id;
    
    // Extract profile image URL from R2 upload
    let profileImageUrl = null;
    if (req.file) {
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && req.file.key) {
        profileImageUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
      } else if (req.file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        profileImageUrl = req.file.location;
      } else if (req.file.filename) {
        // Legacy fallback for local uploads
        profileImageUrl = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/${req.file.filename}`;
      }
    }
    const updates = req.body;
    
    if (updates.expertise_areas && typeof updates.expertise_areas === 'string') {
      try {
        const parsed = JSON.parse(updates.expertise_areas);
        if (Array.isArray(parsed)) {
          updates.expertise_areas = parsed.join(', ');
        } else {
          updates.expertise_areas = parsed;
        }
      } catch (e) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid expertise_areas format. Expected JSON array.' 
        });
      }
    }
    
    const mentor = await mentorService.updateProfileWithEducation(
      userId, 
      updates, 
      profileImageUrl
    );
    
    res.status(200).json({ 
      success: true,
      message: "Profile updated successfully", 
      mentor 
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(400).json({ 
      success: false,
      message: err.message || 'Failed to update profile'
    });
  }
};

/**
 * Upload PDF file (session agenda or CV/portfolio)
 * POST /api/mentors/me/upload
 */
exports.uploadPDF = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const fileType = req.body.fileType; // 'session_agenda' or 'cv_portfolio'
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!fileType || !['session_agenda', 'cv_portfolio'].includes(fileType)) {
      return res.status(400).json({ message: "Invalid fileType. Must be 'session_agenda' or 'cv_portfolio'" });
    }

    // Validate PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }

    // Check file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "File size must be less than 5MB" });
    }

    const { Mentor } = require('../models');
    const mentor = await Mentor.findOne({ where: { user_id: userId } });
    
    if (!mentor) {
      return res.status(404).json({ message: "Mentor profile not found" });
    }

    const filePath = `/uploads/documents/${req.file.filename}`;
    
    // Update mentor record with file path
    if (fileType === 'session_agenda') {
      await mentor.update({ session_agenda_pdf: filePath });
    } else if (fileType === 'cv_portfolio') {
      await mentor.update({ portfolio_pdf: filePath });
    }

    res.json({
      success: true,
      filePath: filePath,
      fileName: req.file.filename,
      message: "File uploaded successfully"
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ message: "Failed to upload file" });
  }
};

/**
 * Add education entry
 * POST /api/mentors/me/education
 */
exports.addEducation = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { Mentor, MentorEducation } = require('../models');
    
    const mentor = await Mentor.findOne({ where: { user_id: userId } });
    if (!mentor) {
      return res.status(404).json({ message: "Mentor profile not found" });
    }

    const { degree, institution, field_of_study, start_date, end_date, is_current, description } = req.body;

    if (!degree || !institution) {
      return res.status(400).json({ message: "Degree and institution are required" });
    }

    const education = await MentorEducation.create({
      mentor_id: mentor.id,
      degree_name: degree,
      university_name: institution,
      field_of_study: field_of_study || null,
      year_graduated: end_date ? new Date(end_date).getFullYear() : null,
      activities: description || null,
    });

    res.json({
      success: true,
      education: {
        id: education.id,
        degree: education.degree_name,
        institution: education.university_name,
        field_of_study: education.field_of_study,
        year: education.year_graduated?.toString(),
        description: education.activities
      }
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ message: "Failed to add education" });
  }
};

/**
 * Update education entry
 * PUT /api/mentors/education/:educationId
 */
exports.updateEducation = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { educationId } = req.params;
    const userId = req.user.id;
    const { Mentor, MentorEducation } = require('../models');
    
    const mentor = await Mentor.findOne({ where: { user_id: userId } });
    if (!mentor) {
      return res.status(404).json({ message: "Mentor profile not found" });
    }

    const education = await MentorEducation.findOne({
      where: { id: educationId, mentor_id: mentor.id }
    });

    if (!education) {
      return res.status(404).json({ message: "Education entry not found" });
    }

    const { degree, institution, field_of_study, start_date, end_date, is_current, description } = req.body;

    await education.update({
      degree_name: degree || education.degree_name,
      university_name: institution || education.university_name,
      field_of_study: field_of_study !== undefined ? field_of_study : education.field_of_study,
      year_graduated: end_date ? new Date(end_date).getFullYear() : education.year_graduated,
      activities: description !== undefined ? description : education.activities,
    });

    res.json({
      success: true,
      education: {
        id: education.id,
        degree: education.degree_name,
        institution: education.university_name,
        field_of_study: education.field_of_study,
        year: education.year_graduated?.toString(),
        description: education.activities
      }
    });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ message: "Failed to update education" });
  }
};

/**
 * Delete education entry
 * DELETE /api/mentors/education/:educationId
 */
exports.deleteEducation = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { educationId } = req.params;
    const userId = req.user.id;
    const { Mentor, MentorEducation } = require('../models');
    
    const mentor = await Mentor.findOne({ where: { user_id: userId } });
    if (!mentor) {
      return res.status(404).json({ message: "Mentor profile not found" });
    }

    const education = await MentorEducation.findOne({
      where: { id: educationId, mentor_id: mentor.id }
    });

    if (!education) {
      return res.status(404).json({ message: "Education entry not found" });
    }

    await education.destroy();

    res.json({
      success: true,
      message: "Education entry deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ message: "Failed to delete education" });
  }
};
