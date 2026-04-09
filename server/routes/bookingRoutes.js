const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

// IMPORT CONTROLLER FUNCTIONS
const {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getStats
} = require("../controllers/bookingController");

// ROUTES
router.get("/", auth, getBookings);
router.get("/stats", auth, getStats);
router.post("/", createBooking);
router.put("/:id", auth, updateBooking);
router.delete("/:id", auth, deleteBooking);

module.exports = router;