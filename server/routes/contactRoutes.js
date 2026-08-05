const express = require("express");
const rateLimit = require("express-rate-limit");

const { createContactMessageRules } = require("../middleware/validateContact");
const { createContactMessage } = require("../controllers/contactController");

const router = express.Router();

/** Caps how many messages one IP can submit — same shape as the booking limiter. */
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent. Please try again in a few minutes."
  }
});

router.post("/", contactLimiter, createContactMessageRules, createContactMessage);

module.exports = router;
