const Booking = require("../models/Booking");
const BookingLock = require("../models/BookingLock");
const { ApiError, asyncHandler } = require("../middleware/errorHandler");
const { sendBookingEmails } = require("../utils/email");
const logger = require("../utils/logger");

const DUPLICATE_WINDOW_SECONDS = Number(process.env.DUPLICATE_WINDOW_SECONDS || 300);

/** Escapes user input before it is used inside a RegExp for search. */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/bookings
 * Paginated, searchable, filterable list for the admin dashboard.
 */
exports.getBookings = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const { status, search, from, to, sort = "newest" } = req.query;

  const filter = {};

  if (status) filter.status = status;

  if (search) {
    // Anchored to the escaped term so a guest cannot inject regex operators.
    const term = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: term }, { email: term }, { phone: term }, { bookingId: term }];
  }

  // Date range applies to arrival date (what an admin actually plans around).
  if (from || to) {
    filter.arrival = {};
    if (from) filter.arrival.$gte = new Date(from);
    if (to) {
      // Make `to` inclusive of the whole day.
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.arrival.$lte = end;
    }
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    arrival: { arrival: 1 }
  };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(sortMap[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  });
});

/**
 * POST /api/bookings  (public)
 *
 * Duplicate protection: a de-duplication lock is inserted BEFORE the booking is
 * created. Its unique index means only one of N simultaneous identical requests
 * can proceed, which closes the race that a findOne()-then-save() check leaves
 * open. The lock expires via TTL so the same guest can re-book later.
 */
exports.createBooking = asyncHandler(async (req, res) => {
  const { name, email, phone, arrival, departure, guests, accommodationType, numberOfRooms, specialRequest } = req.body;
  const includesRoom = Array.isArray(accommodationType) && accommodationType.includes("Room");

  const lockKey = BookingLock.buildKey({ email, arrival, departure });

  try {
    await BookingLock.create({ key: lockKey });
  } catch (error) {
    if (error.code === 11000) {
      logger.warn(`Duplicate booking blocked for ${email} (${arrival} -> ${departure})`);
      throw new ApiError(
        409,
        "We have already received this booking request. Please check your email for confirmation, or wait a few minutes before trying again."
      );
    }
    throw error;
  }

  let booking;
  try {
    booking = await Booking.create({
      name,
      email,
      phone,
      arrival,
      departure,
      guests,
      accommodationType,
      // Explicitly omitted (not just falsy) when Room isn't selected, so it is
      // never stored — undefined fields are dropped by Mongoose on save.
      numberOfRooms: includesRoom ? Number(numberOfRooms) : undefined,
      specialRequest: specialRequest || ""
    });

    logger.info(`Booking created: ${booking.bookingId} for ${booking.email}`);
  } catch (error) {
    // The booking failed, so the lock must not block the guest's honest retry.
    await BookingLock.deleteOne({ key: lockKey }).catch((cleanupError) =>
      logger.error("Failed to release booking lock", cleanupError)
    );
    throw error;
  }

  // The booking is already saved at this point — email is a best-effort
  // notification, not part of the transaction. sendBookingEmails() never
  // throws, but the try/catch is kept as a second line of defence so a bug
  // there can never turn a successful booking into a 500 for the guest.
  try {
    await sendBookingEmails(booking);
  } catch (error) {
    logger.error(`Unexpected error while sending booking emails for ${booking.bookingId}`, error);
  }

  res.status(201).json({
    success: true,
    message: "Booking request received successfully",
    data: {
      bookingId: booking.bookingId,
      name: booking.name,
      email: booking.email,
      arrival: booking.arrival,
      departure: booking.departure,
      guests: booking.guests,
      accommodationType: booking.accommodationType,
      numberOfRooms: booking.numberOfRooms,
      specialRequest: booking.specialRequest,
      status: booking.status
    }
  });
});

/** GET /api/bookings/:id  (admin) */
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) throw new ApiError(404, "Booking not found");

  res.status(200).json({ success: true, data: booking });
});

/**
 * PUT /api/bookings/:id  (admin)
 * Only status and paymentStatus are updatable; guest details are immutable here.
 */
exports.updateBooking = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Provide a status or paymentStatus to update");
  }

  const booking = await Booking.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!booking) throw new ApiError(404, "Booking not found");

  logger.info(`Booking ${booking.bookingId} updated: ${JSON.stringify(updates)}`);

  res.status(200).json({
    success: true,
    message: "Booking updated successfully",
    data: booking
  });
});

/** DELETE /api/bookings/:id  (admin) */
exports.deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) throw new ApiError(404, "Booking not found");

  logger.info(`Booking deleted: ${booking.bookingId}`);

  res.status(200).json({ success: true, message: "Booking deleted successfully" });
});

/** GET /api/bookings/stats  (admin) */
exports.getStats = asyncHandler(async (req, res) => {
  // One grouped pass instead of four separate countDocuments round-trips.
  const [grouped, total] = await Promise.all([
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.countDocuments()
  ]);

  const counts = grouped.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      total,
      pending: counts.Pending || 0,
      confirmed: counts.Confirmed || 0,
      cancelled: counts.Cancelled || 0
    }
  });
});

exports.DUPLICATE_WINDOW_SECONDS = DUPLICATE_WINDOW_SECONDS;
