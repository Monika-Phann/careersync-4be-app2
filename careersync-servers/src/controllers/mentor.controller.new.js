/**
 * NEW FUNCTIONS TO ADD TO mentor.controller.js
 * 
 * ⚠️ IMPORTANT: The mentor.controller.js file was accidentally overwritten.
 * Please restore it from git first, then add these exports to it.
 * 
 * Add these exports to your existing mentor.controller.js file:
 * - exports.uploadPDF
 * - exports.addEducation
 * - exports.updateEducation
 * - exports.deleteEducation
 */

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



