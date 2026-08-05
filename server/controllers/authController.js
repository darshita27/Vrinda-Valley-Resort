const crypto = require("crypto");

const bcrypt = require("bcrypt");

const Admin = require("../models/Admin");
const { ApiError, asyncHandler } = require("../middleware/errorHandler");
const { signAdminToken, JWT_EXPIRES_IN } = require("../utils/token");
const { sendPasswordResetEmail } = require("../utils/email");
const logger = require("../utils/logger");

/**
 * Same message for every failure case — unknown email, wrong password, and a
 * locked account all look identical to the client. Anything more specific
 * ("this account is locked") would let an attacker distinguish a real email
 * from a fake one just by repeating a guess five times.
 */
const INVALID_CREDENTIALS = "Invalid email or password";
const DUMMY_HASH = "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

/** POST /api/auth/login */
exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // password/loginAttempts/lockUntil are select:false on the schema.
  const admin = await Admin.findOne({ email }).select("+password +loginAttempts +lockUntil");
  const locked = !!admin && admin.isLocked();

  // Always run a real bcrypt comparison, even for an unknown email or a
  // locked account, against either the real hash or a dummy one of the same
  // cost. This keeps response timing uniform across all three cases, so a
  // timing side-channel can't be used to enumerate which emails exist or are
  // currently locked out.
  const hashToCompare = admin && !locked ? admin.password : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);

  if (!admin) {
    logger.warn(`Failed admin login for unknown email: ${email}`);
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  if (locked) {
    logger.warn(`Login blocked for locked account: ${email}`);
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  if (!isMatch) {
    await admin.registerFailedLogin();
    logger.warn(
      `Failed admin login (wrong password) for: ${email} (attempt ${admin.loginAttempts}/${Admin.MAX_LOGIN_ATTEMPTS})`
    );
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  await admin.resetLoginAttempts();
  logger.info(`Admin logged in: ${email}`);

  res.status(200).json({
    success: true,
    token: signAdminToken(admin),
    expiresIn: JWT_EXPIRES_IN,
    admin: { email: admin.email }
  });
});

/**
 * Same reasoning as INVALID_CREDENTIALS above: one message for "no such
 * admin", "no code was requested", "code expired", and "wrong code", so the
 * forgot-password flow can't be used to enumerate accounts either.
 */
const RESET_REQUESTED_MESSAGE = "If an account exists for this email, a password reset code has been sent.";
const RESET_FAILED_MESSAGE = "Invalid or expired code. Please request a new one.";

/** 6-digit numeric code — familiar OTP UX or an emailed, copy-pasted code. */
function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** POST /api/auth/forgot-password */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const admin = await Admin.findOne({ email }).select("+resetOtpHash +resetOtpExpires +resetOtpAttempts");

  // The response is identical either way; only the side effect (an email
  // landing, or not) differs — never anything visible in the HTTP response.
  if (admin) {
    const otp = generateOtp();
    admin.resetOtpHash = await bcrypt.hash(otp, 10);
    admin.resetOtpExpires = new Date(Date.now() + Admin.OTP_EXPIRY_MS);
    admin.resetOtpAttempts = 0;
    await admin.save();

    try {
      await sendPasswordResetEmail(admin.email, otp, Admin.OTP_EXPIRY_MS / 60000);
      logger.info(`Password reset code emailed to ${admin.email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${admin.email}`, error);
    }
  } else {
    logger.warn(`Password reset requested for unknown email: ${email}`);
  }

  res.status(200).json({ success: true, message: RESET_REQUESTED_MESSAGE });
});

/** POST /api/auth/reset-password */
exports.resetPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();
  const newPassword = String(req.body.newPassword || "");

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, code, and new password are required");
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const admin = await Admin.findOne({ email }).select(
    "+password +resetOtpHash +resetOtpExpires +resetOtpAttempts +loginAttempts +lockUntil"
  );
  const pending = !!admin && admin.hasResetOtpPending();

  // Same timing-safe pattern as login: always run a real bcrypt compare, even
  // when there is nothing valid to check against, so response time can't be
  // used to tell "unknown email" / "no pending code" / "wrong code" apart.
  const hashToCompare = pending ? admin.resetOtpHash : DUMMY_HASH;
  const isMatch = await bcrypt.compare(otp, hashToCompare);

  if (!admin || !pending) {
    logger.warn(
      admin
        ? `Password reset attempted with no valid pending code for: ${email}`
        : `Password reset attempted for unknown email: ${email}`
    );
    throw new ApiError(400, RESET_FAILED_MESSAGE);
  }

  if (!isMatch) {
    await admin.registerFailedOtpAttempt();
    logger.warn(
      `Wrong password reset code for: ${email} (attempt ${admin.resetOtpAttempts}/${Admin.MAX_OTP_ATTEMPTS})`
    );
    throw new ApiError(400, RESET_FAILED_MESSAGE);
  }

  // Code is correct: set the new password, burn the OTP, and clear any login
  // lockout — proving identity by email is a stronger check than the
  // password the admin may have just locked themselves out of.
  admin.password = await bcrypt.hash(newPassword, 12);
  admin.resetOtpHash = undefined;
  admin.resetOtpExpires = undefined;
  admin.resetOtpAttempts = 0;
  admin.loginAttempts = 0;
  admin.lockUntil = undefined;
  await admin.save();

  logger.info(`Password reset completed for: ${email}`);

  res.status(200).json({
    success: true,
    message: "Password updated successfully. Please log in with your new password."
  });
});

/**
 * GET /api/auth/me — behind authMiddleware.
 * Lets the browser confirm a stored token is still valid before showing the
 * dashboard, instead of trusting that a token exists in localStorage.
 */
exports.me = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user.sub);

  if (!admin) throw new ApiError(401, "Account no longer exists");

  res.status(200).json({
    success: true,
    admin: { email: admin.email }
  });
});
