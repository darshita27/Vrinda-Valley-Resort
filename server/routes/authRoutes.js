const express = require("express");
const rateLimit = require("express-rate-limit");

const auth = require("../middleware/authMiddleware");
const { login, me, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

/** Caps password guessing from a single IP. Successful logins are not counted. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes."
  }
});

/** Caps how many reset codes can be requested/emailed from one IP. */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many reset requests. Please try again in 15 minutes."
  }
});

/**
 * Secondary defence on top of the per-account OTP attempt cap
 * (Admin.MAX_OTP_ATTEMPTS) — this one blocks distributed guessing across
 * different accounts from the same IP.
 */
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in 15 minutes."
  }
});

router.post("/login", loginLimiter, login);
router.get("/me", auth, me);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

module.exports = router;
