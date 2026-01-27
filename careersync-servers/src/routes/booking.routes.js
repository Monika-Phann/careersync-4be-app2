const router = require("express").Router();
const auth = require("../middleware/auth");
const bookingController = require("../controllers/booking.controller");

router.post("/", auth, bookingController.createBooking);

module.exports = router;
