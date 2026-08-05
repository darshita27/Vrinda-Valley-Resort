const mongoose = require("mongoose");

// Per-account brute-force lockout, in addition to the IP-based rate limiter on
// the /login route: an attacker rotating IPs still can't out-guess a single
// account's password.
const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCK_TIME_MS = Number(process.env.ACCOUNT_LOCK_MINUTES || 15) * 60 * 1000;

// Forgot-password OTP: short-lived, single-use, and capped on wrong guesses so
// a 6-digit code stays infeasible to brute force even without the IP limiter.
const MAX_OTP_ATTEMPTS = Number(process.env.MAX_OTP_ATTEMPTS || 5);
const OTP_EXPIRY_MS = Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000;

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      // Never returned by a plain find(); the login flow opts in with
      // .select("+password") so a hash cannot leak through another query.
      select: false
    },
    // Hidden by default for the same reason as password: this is
    // account-security metadata, not something any normal query should surface.
    loginAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lockUntil: {
      type: Date,
      select: false
    },
    // Forgot-password flow. The OTP itself is never stored in plain text —
    // only its bcrypt hash, same treatment as the password.
    resetOtpHash: {
      type: String,
      select: false
    },
    resetOtpExpires: {
      type: Date,
      select: false
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
      select: false
    }
  },
  { timestamps: true }
);

/** True while the account is locked out from failed login attempts. */
adminSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

/**
 * Called on a wrong password. Locks the account once MAX_LOGIN_ATTEMPTS is
 * reached; the lock itself expires naturally via lockUntil rather than needing
 * a reset step.
 */
adminSchema.methods.registerFailedLogin = async function () {
  this.loginAttempts += 1;

  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
  }

  await this.save();
};

/** Called on a successful login so past failures don't linger. */
adminSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts === 0 && !this.lockUntil) return;

  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

/** True while a requested OTP exists and hasn't expired yet. */
adminSchema.methods.hasResetOtpPending = function () {
  return !!(this.resetOtpHash && this.resetOtpExpires && this.resetOtpExpires.getTime() > Date.now());
};

/**
 * Called on a wrong OTP. Once MAX_OTP_ATTEMPTS is reached the code itself is
 * invalidated (not just further attempts blocked), forcing a fresh
 * forgot-password request rather than leaving a guessable code live.
 */
adminSchema.methods.registerFailedOtpAttempt = async function () {
  this.resetOtpAttempts += 1;

  if (this.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    this.resetOtpHash = undefined;
    this.resetOtpExpires = undefined;
  }

  await this.save();
};

adminSchema.statics.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;
adminSchema.statics.LOCK_TIME_MS = LOCK_TIME_MS;
adminSchema.statics.MAX_OTP_ATTEMPTS = MAX_OTP_ATTEMPTS;
adminSchema.statics.OTP_EXPIRY_MS = OTP_EXPIRY_MS;

module.exports = mongoose.model("Admin", adminSchema);
