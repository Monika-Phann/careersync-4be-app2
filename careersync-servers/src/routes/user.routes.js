const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const userController = require("../controllers/user.controller");

router.get("/profile", auth, userController.getProfile);
router.put("/profile", auth, upload.single("profileImage"), userController.updateProfile);

router.put("/change-password", auth, userController.changePassword);

router.get("/bookings", auth, userController.bookingHistory);
router.get("/certificates", auth, userController.certificateList);

module.exports = router;
