const mongoose = require("mongoose");

/**
 * Messages submitted through the Customer Support contact form. Stored (not
 * just emailed) so a message survives even if the notification email fails —
 * same reasoning as Booking: the record is the source of truth, email is a
 * best-effort notification on top of it.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please provide a valid email address"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian mobile number"]
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters"],
      maxlength: [150, "Subject cannot exceed 150 characters"]
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    status: {
      type: String,
      enum: ["New", "Read", "Resolved"],
      default: "New",
      index: true
    }
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

contactMessageSchema.statics.STATUS = ["New", "Read", "Resolved"];

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
