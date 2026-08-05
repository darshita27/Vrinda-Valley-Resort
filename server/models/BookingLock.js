const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Short-lived de-duplication lock.
 *
 * A findOne()-then-save() check is not safe against duplicate requests that
 * arrive at the same moment: both reads can miss, and both writes then succeed.
 * Instead we insert into this collection FIRST. The unique index on `key` means
 * exactly one of N simultaneous identical requests wins; the losers get a
 * duplicate-key error (code 11000) and are rejected as duplicates.
 *
 * MongoDB's TTL monitor removes each lock automatically once the window has
 * passed, so the same guest can legitimately re-book the same dates later.
 */
const bookingLockSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL window. MongoDB's background task sweeps roughly every 60 seconds,
    // so a lock may live slightly longer than this — which is harmless here.
    expires: Number(process.env.DUPLICATE_WINDOW_SECONDS || 300)
  }
});

/**
 * Builds the lock key for a booking. Same guest + same dates within the window
 * is treated as one booking.
 */
bookingLockSchema.statics.buildKey = function ({ email, arrival, departure }) {
  const raw = [
    String(email || "").trim().toLowerCase(),
    new Date(arrival).toISOString(),
    new Date(departure).toISOString()
  ].join("|");

  return crypto.createHash("sha256").update(raw).digest("hex");
};

module.exports = mongoose.model("BookingLock", bookingLockSchema);
