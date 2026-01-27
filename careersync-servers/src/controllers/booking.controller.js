const bookingService = require("../services/booking.service");

exports.createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    res.status(201).json({
      message: "Booking created successfully",
      booking
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
