const ContactMessage = require("../models/ContactMessage");
const { asyncHandler } = require("../middleware/errorHandler");
const { sendContactMessageEmail } = require("../utils/email");
const logger = require("../utils/logger");

/**
 * POST /api/contact  (public)
 *
 * Same fail-soft principle as bookings: the message is saved first and is
 * the source of truth. Email is a best-effort notification on top of it —
 * a submitter always gets a success response once their message is stored,
 * even if the notification email fails to send.
 */
exports.createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const contactMessage = await ContactMessage.create({ name, email, phone, subject, message });

  logger.info(`Contact message received from ${contactMessage.email}: "${contactMessage.subject}"`);

  try {
    await sendContactMessageEmail(contactMessage);
    logger.info(`Contact message notification emailed for ${contactMessage._id}`);
  } catch (error) {
    logger.error(`Failed to send contact message notification for ${contactMessage._id}`, error);
  }

  res.status(201).json({
    success: true,
    message: "Thank you for reaching out. Our team will get back to you shortly."
  });
});
