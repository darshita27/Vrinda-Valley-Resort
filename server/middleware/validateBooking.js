const { body, query, param, validationResult } = require("express-validator");
const Booking = require("../models/Booking");

/** Midnight today, server local time. Used for the "no past check-in" rule. */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Reduces the formats guests actually type ("+91 98765-43210", "098765 43210")
 * to a bare 10-digit number.
 *
 * Prefixes are only stripped while the number is longer than 10 digits, so a
 * legitimate number that happens to begin with 91 or 0 is left intact.
 */
function normalizePhone(value) {
  let digits = String(value).replace(/\D/g, "");

  while (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);

  return digits;
}

/** Collects express-validator errors into a single 400 response. */
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: result.array().map((e) => ({ field: e.path, message: e.msg }))
  });
}

const createBookingRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 80 }).withMessage("Name must be between 2 and 80 characters")
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage("Name can only contain letters, spaces and . ' -"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email address")
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 120 }).withMessage("Email is too long"),

  body("phone")
    .trim()
    // Tolerate the formats guests actually type before validating the digits.
    .customSanitizer(normalizePhone)
    .matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit mobile number starting with 6-9"),

  body("arrival")
    .notEmpty().withMessage("Check-in date is required")
    .isISO8601().withMessage("Check-in date is invalid")
    .custom((value) => {
      if (new Date(value) < startOfToday()) {
        throw new Error("Check-in date cannot be in the past");
      }
      return true;
    }),

  body("departure")
    .notEmpty().withMessage("Check-out date is required")
    .isISO8601().withMessage("Check-out date is invalid")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.arrival)) {
        throw new Error("Check-out date must be after the check-in date");
      }
      return true;
    }),

  body("guests")
    .notEmpty().withMessage("Number of guests is required")
    .isInt({ min: 1, max: 50 }).withMessage("Guests must be a whole number between 1 and 50")
    .toInt(),

  body("accommodationType")
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Select at least one accommodation type");
      }
      if (value.some((v) => !Booking.ACCOMMODATION_TYPES.includes(v))) {
        throw new Error("Please select a valid accommodation type");
      }
      return true;
    }),

  // Only required when "Room" is one of the selected accommodation types;
  // ignored (and never stored) otherwise.
  body("numberOfRooms")
    .custom((value, { req }) => {
      const types = Array.isArray(req.body.accommodationType) ? req.body.accommodationType : [];
      if (!types.includes("Room")) return true;

      if (value === undefined || value === null || value === "") {
        throw new Error("Number of rooms is required when Room is selected");
      }
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw new Error("Number of rooms must be a whole number of at least 1");
      }
      return true;
    }),

  body("specialRequest")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 }).withMessage("Special request cannot exceed 500 characters"),

  // Never client-settable: a guest must not be able to self-confirm a booking.
  body(["status", "paymentStatus", "bookingId", "_id", "createdAt", "updatedAt"])
    .not().exists().withMessage("This field cannot be set directly"),

  handleValidation
];

const updateBookingRules = [
  param("id").isMongoId().withMessage("Invalid booking id"),

  body("status")
    .optional()
    .isIn(Booking.BOOKING_STATUS).withMessage(`Status must be one of: ${Booking.BOOKING_STATUS.join(", ")}`),

  body("paymentStatus")
    .optional()
    .isIn(Booking.PAYMENT_STATUS).withMessage(`Payment status must be one of: ${Booking.PAYMENT_STATUS.join(", ")}`),

  handleValidation
];

const listBookingRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be 1 or greater").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
  query("status").optional().isIn(Booking.BOOKING_STATUS).withMessage("Invalid status filter"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search term is too long"),
  query("from").optional().isISO8601().withMessage("Invalid 'from' date"),
  query("to").optional().isISO8601().withMessage("Invalid 'to' date"),
  query("sort").optional().isIn(["newest", "oldest", "arrival"]).withMessage("Invalid sort option"),

  handleValidation
];

const idRule = [param("id").isMongoId().withMessage("Invalid booking id"), handleValidation];

module.exports = { createBookingRules, updateBookingRules, listBookingRules, idRule };
