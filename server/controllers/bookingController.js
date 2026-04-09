const Booking = require("../models/Booking");

// GET all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Error fetching bookings" });
  }
};

// CREATE booking
exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    console.log("Booking saved");
    // ✅ SEND EMAIL AFTER BOOKING
     

    res.status(201).json({ message: "Booking saved & email sent" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error saving booking" });
  }
};

// UPDATE booking (status)
exports.updateBooking = async (req, res) => {
  try {
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error updating booking" });
  }
};

// DELETE booking
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting booking" });
  }
};
exports.getStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments();

    const confirmed = await Booking.countDocuments({ status: "Confirmed" });
    const pending = await Booking.countDocuments({ status: "Pending" });
    const cancelled = await Booking.countDocuments({ status: "Cancelled" });

    res.json({
      total,
      confirmed,
      pending,
      cancelled
    });

  } catch (error) {
    res.status(500).json({ msg: "Error fetching stats" });
  }
};