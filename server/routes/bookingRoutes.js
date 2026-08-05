const express = require("express");
const rateLimit = require("express-rate-limit");

const auth = require("../middleware/authMiddleware");
const {
  createBookingRules,
  updateBookingRules,
  listBookingRules,
  idRule
} = require("../middleware/validateBooking");

const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getStats
} = require("../controllers/bookingController");

const router = express.Router();

/**
 * Second line of defence behind the de-duplication lock: caps how fast a single
 * IP can hammer the public booking endpoint.
 */
const createBookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many booking attempts. Please try again in a few minutes."
  }
});

// Public
router.post("/", createBookingLimiter, createBookingRules, createBooking);

// Admin only — /stats must be declared before any "/:id" route.
router.get("/stats", auth, getStats);
router.get("/", auth, listBookingRules, getBookings);
router.get("/:id", auth, idRule, getBookingById);
router.put("/:id", auth, updateBookingRules, updateBooking);
router.delete("/:id", auth, idRule, deleteBooking);

module.exports = router;
