const mongoose = require("mongoose");

const ACCOMMODATION_TYPES = ["Room", "Pool", "Banquet Hall"];
const BOOKING_STATUS = ["Pending", "Confirmed", "Cancelled"];
const PAYMENT_STATUS = ["Unpaid", "Partially Paid", "Paid", "Refunded"];

// Human-readable reference: VV-<base36 time>-<random>. Shown to guests instead of the raw _id.
function generateBookingId() {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VV-${time}-${rand}`;
}

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      default: generateBookingId,
      unique: true,
      // sparse so the pre-existing documents (which have no bookingId) don't
      // collide with each other on the unique index.
      sparse: true,
      immutable: true
    },
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
    arrival: {
      type: Date,
      required: [true, "Check-in date is required"]
    },
    departure: {
      type: Date,
      required: [true, "Check-out date is required"],
      validate: {
        validator: function (value) {
          // `this` is undefined on findOneAndUpdate; guard so updates don't throw.
          if (!this || !this.arrival) return true;
          return value > this.arrival;
        },
        message: "Check-out date must be after the check-in date"
      }
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
      max: [50, "For more than 50 guests, please contact us directly"]
    },
    // Multi-select: a guest can pick any combination of Room / Pool / Banquet Hall.
    accommodationType: {
      type: [String],
      enum: ACCOMMODATION_TYPES,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one accommodation type must be selected"
      }
    },
    // Only meaningful (and only stored) when accommodationType includes "Room".
    numberOfRooms: {
      type: Number,
      min: [1, "Number of rooms must be at least 1"],
      validate: {
        validator: function (value) {
          // `this` is undefined on findOneAndUpdate; guard so updates don't throw.
          if (!this) return true;
          const roomSelected = Array.isArray(this.accommodationType) && this.accommodationType.includes("Room");
          if (!roomSelected) return true;
          return Number.isInteger(value) && value >= 1;
        },
        message: "Number of rooms is required when Room is selected"
      }
    },
    specialRequest: {
      type: String,
      trim: true,
      maxlength: [500, "Special request cannot exceed 500 characters"],
      default: ""
    },
    status: {
      type: String,
      enum: BOOKING_STATUS,
      default: "Pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "Unpaid"
    }
  },
  { timestamps: true }
);

// Admin dashboard sorts by newest first on every page load.
bookingSchema.index({ createdAt: -1 });

// Backs the free-text search (name / email / phone) in the admin dashboard.
bookingSchema.index({ email: 1, arrival: 1, departure: 1 });

bookingSchema.statics.ACCOMMODATION_TYPES = ACCOMMODATION_TYPES;
bookingSchema.statics.BOOKING_STATUS = BOOKING_STATUS;
bookingSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS;

module.exports = mongoose.model("Booking", bookingSchema);
