const userService = require("../services/user.service");

exports.getProfile = async (req, res) => {
  try {
    const data = await userService.getProfile(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log('updateProfile controller - req.file:', req.file);
    console.log('updateProfile controller - req.body:', req.body);
    
    // Extract profile image URL from R2 upload if file is provided
    let profileImageUrl = null;
    if (req.file) {
      // R2 uploads have 'key' property, use R2_PUBLIC_URL to construct full URL
      if (process.env.R2_PUBLIC_URL && req.file.key) {
        profileImageUrl = `${process.env.R2_PUBLIC_URL}/${req.file.key}`;
        console.log('✅ Profile image uploaded to R2:', profileImageUrl);
      } else if (req.file.location) {
        // Fallback to location if R2_PUBLIC_URL not set
        profileImageUrl = req.file.location;
        console.log('✅ Profile image uploaded to R2 (using location):', profileImageUrl);
      } else if (req.file.filename) {
        // Fallback for local storage (shouldn't happen in production)
        profileImageUrl = `${process.env.APP_URL || 'http://localhost:5001'}/uploads/${req.file.filename}`;
        console.log('⚠️ Profile image saved locally (fallback):', profileImageUrl);
      }
    }
    
    const updatedProfile = await userService.updateProfile(req.user.id, req.body, profileImageUrl);
    console.log('updateProfile controller - updatedProfile:', JSON.stringify(updatedProfile, null, 2));
    res.json({ 
      message: "Profile updated successfully",
      data: updatedProfile
    });
  } catch (err) {
    console.error('updateProfile controller error:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.bookingHistory = async (req, res) => {
  const data = await userService.getBookings(req.user.id);
  res.json(data);
};

// exports.certificateList = async (req, res) => {
//   const data = await userService.getCertificates(req.user.id);
//   res.json(data);
// };

exports.certificateList = async (req, res) => {
  try {
    const data = await userService.getCertificates(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("CERTIFICATE SQL ERROR:", err);
    res.status(500).json({
      message: "Certificate query failed",
      error: err.message
    });
  }
};
