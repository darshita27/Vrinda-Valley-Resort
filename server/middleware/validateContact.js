const { body, validationResult } = require("express-validator");

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

/**
 * Mirrors the server's phone normalisation used for bookings, so both forms
 * accept the same range of formats a guest might actually type.
 */
function normalizePhone(value) {
  let digits = String(value).replace(/\D/g, "");

  while (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);

  return digits;
}

const createContactMessageRules = [
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
    .customSanitizer(normalizePhone)
    .matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit mobile number starting with 6-9"),

  body("subject")
    .trim()
    .notEmpty().withMessage("Subject is required")
    .isLength({ min: 3, max: 150 }).withMessage("Subject must be between 3 and 150 characters"),

  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 10, max: 1000 }).withMessage("Message must be between 10 and 1000 characters"),

  // Never client-settable.
  body(["status", "_id", "createdAt", "updatedAt"])
    .not().exists().withMessage("This field cannot be set directly"),

  handleValidation
];

module.exports = { createContactMessageRules };
