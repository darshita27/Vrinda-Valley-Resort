/**
 * Booking notification emails (Nodemailer, SMTP). Two independent sends per
 * booking: one to the resort owner, one confirming receipt to the guest.
 *
 * Deliberately fail-soft: sendBookingEmails() never throws. A booking must be
 * saved and returned to the guest as a success even if SMTP is down or
 * unconfigured — email is a notification, not part of the booking transaction.
 */
const nodemailer = require("nodemailer");

const logger = require("./logger");

let transporter; // created once, lazily, and reused across requests

/**
 * Returns null (rather than throwing) when EMAIL_* env vars are not fully
 * set, so local/dev environments without SMTP configured can still create
 * bookings — sendBookingEmails() just skips sending and logs why.
 */
function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) return null;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    // 465 is implicit TLS; every other port (587, 25, ...) negotiates TLS via STARTTLS.
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });

  return transporter;
}

/** Escapes booking fields before they are interpolated into email HTML. */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAccommodationType(types) {
  if (!Array.isArray(types) || types.length === 0) return "-";
  return types.join(", ");
}

const BRAND = { accent: "#f6ac0f", dark: "#0f1a2c" };

/** Shared shell so both emails look like they came from the same brand. */
function emailShell({ heading, intro, bodyHtml }) {
  return `
  <div style="background:#f4f4f4; padding:24px 12px; font-family:Arial, Helvetica, sans-serif;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #eaeaea;">
      <div style="background:${BRAND.dark}; padding:20px 24px;">
        <h1 style="margin:0; color:${BRAND.accent}; font-size:20px; letter-spacing:0.5px;">Vrinda Valley Resort</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px; font-size:18px; color:${BRAND.dark};">${heading}</h2>
        ${intro ? `<p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#333;">${intro}</p>` : ""}
        ${bodyHtml}
      </div>
      <div style="background:#fafafa; padding:16px 24px; font-size:12px; color:#888; border-top:1px solid #eee;">
        Vrinda Valley Resort, Jaipur — this is an automated message.
      </div>
    </div>
  </div>`;
}

function detailsTable(rows) {
  const cells = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px; font-size:13px; color:#888; border-bottom:1px solid #f0f0f0; white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px; font-size:14px; color:#222; border-bottom:1px solid #f0f0f0;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");

  return `<table style="width:100%; border-collapse:collapse; margin-top:8px;">${cells}</table>`;
}

function ownerEmail(booking) {
  const bodyHtml = detailsTable([
    ["Booking ID", booking.bookingId],
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email],
    ["Check-in", formatDate(booking.arrival)],
    ["Check-out", formatDate(booking.departure)],
    ["Guests", booking.guests],
    ["Accommodation Type", formatAccommodationType(booking.accommodationType)],
    ["Number of Rooms", booking.numberOfRooms],
    ["Special Request", booking.specialRequest],
    ["Status", booking.status]
  ]);

  return {
    subject: "New Booking Received - Vrinda Valley Resort",
    html: emailShell({
      heading: "New Booking Received",
      intro: "A new booking request has come in through the website. Details below.",
      bodyHtml
    }),
    text: [
      "New booking received - Vrinda Valley Resort",
      `Booking ID: ${booking.bookingId || "-"}`,
      `Name: ${booking.name}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email}`,
      `Check-in: ${formatDate(booking.arrival)}`,
      `Check-out: ${formatDate(booking.departure)}`,
      `Guests: ${booking.guests}`,
      `Accommodation Type: ${formatAccommodationType(booking.accommodationType)}`,
      booking.numberOfRooms ? `Number of Rooms: ${booking.numberOfRooms}` : null,
      booking.specialRequest ? `Special Request: ${booking.specialRequest}` : null,
      `Status: ${booking.status}`
    ]
      .filter(Boolean)
      .join("\n")
  };
}

function customerEmail(booking) {
  const bodyHtml =
    detailsTable([
      ["Check-in", formatDate(booking.arrival)],
      ["Check-out", formatDate(booking.departure)],
      ["Guests", booking.guests],
      ["Accommodation Type", formatAccommodationType(booking.accommodationType)],
      ["Number of Rooms", booking.numberOfRooms]
    ]) +
    `<p style="margin:20px 0 0; font-size:14px; line-height:1.6; color:#333;">
      Thank you for choosing Vrinda Valley Resort. Our team will contact you shortly to confirm your booking.
    </p>`;

  return {
    subject: "Booking Request Received",
    html: emailShell({
      heading: `Thank you, ${escapeHtml(booking.name)}!`,
      intro: "We've received your booking request. Here's a summary:",
      bodyHtml
    }),
    text: [
      `Hi ${booking.name},`,
      "",
      "We've received your booking request at Vrinda Valley Resort.",
      `Check-in: ${formatDate(booking.arrival)}`,
      `Check-out: ${formatDate(booking.departure)}`,
      `Guests: ${booking.guests}`,
      `Accommodation Type: ${formatAccommodationType(booking.accommodationType)}`,
      booking.numberOfRooms ? `Number of Rooms: ${booking.numberOfRooms}` : null,
      "",
      "Thank you for choosing Vrinda Valley Resort. Our team will contact you shortly to confirm your booking."
    ]
      .filter((line) => line !== null)
      .join("\n")
  };
}

/**
 * Sends the admin password-reset OTP. Unlike sendBookingEmails, this is a
 * single send with no independent-failure fan-out to manage, so it's left as
 * a plain async function — the caller (authController) decides how to react
 * if it throws, same as any other awaited call.
 */
async function sendPasswordResetEmail(toEmail, otp, expiryMinutes) {
  const smtp = getTransporter();

  if (!smtp) {
    throw new Error("Email is not configured (EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS).");
  }

  const bodyHtml = `
    <div style="margin:20px 0; padding:16px; background:#f9f5ea; border:1px dashed ${BRAND.accent}; border-radius:8px; text-align:center;">
      <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:${BRAND.dark};">${escapeHtml(otp)}</span>
    </div>
    <p style="margin:0 0 8px; font-size:13px; line-height:1.6; color:#555;">
      This code expires in ${escapeHtml(expiryMinutes)} minutes and can only be used once.
    </p>
    <p style="margin:16px 0 0; font-size:13px; line-height:1.6; color:#888;">
      If you did not request a password reset, you can safely ignore this email — your password has not been changed.
    </p>`;

  await smtp.sendMail({
    from: `"Vrinda Valley Resort" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Vrinda Valley Resort Admin Password Reset Code",
    html: emailShell({
      heading: "Password Reset Code",
      intro: "Use this code to reset your admin password:",
      bodyHtml
    }),
    text: [
      "Password reset code: " + otp,
      `This code expires in ${expiryMinutes} minutes and can only be used once.`,
      "",
      "If you did not request a password reset, you can safely ignore this email."
    ].join("\n")
  });
}

/**
 * Sends the resort a notification for a new Customer Support contact-form
 * message. Single send, same pattern as sendPasswordResetEmail — the caller
 * (contactController) decides how to react if it throws.
 */
async function sendContactMessageEmail(contactMessage) {
  const smtp = getTransporter();

  if (!smtp) {
    throw new Error("Email is not configured (EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS).");
  }

  const ownerAddress = process.env.OWNER_EMAIL;
  if (!ownerAddress) {
    throw new Error("OWNER_EMAIL is not configured.");
  }

  const bodyHtml = detailsTable([
    ["Name", contactMessage.name],
    ["Email", contactMessage.email],
    ["Phone", contactMessage.phone],
    ["Subject", contactMessage.subject]
  ]) + `
    <p style="margin:16px 0 0; font-size:13px; color:#888;">Message</p>
    <p style="margin:6px 0 0; font-size:14px; line-height:1.6; color:#222; white-space:pre-wrap;">${escapeHtml(contactMessage.message)}</p>`;

  await smtp.sendMail({
    from: `"Vrinda Valley Resort" <${process.env.EMAIL_USER}>`,
    to: ownerAddress,
    replyTo: contactMessage.email,
    subject: "New Contact Message - Vrinda Valley Resort",
    html: emailShell({
      heading: "New Contact Message",
      intro: "A visitor submitted the Customer Support contact form on the website.",
      bodyHtml
    }),
    text: [
      "New contact message - Vrinda Valley Resort",
      `Name: ${contactMessage.name}`,
      `Email: ${contactMessage.email}`,
      `Phone: ${contactMessage.phone}`,
      `Subject: ${contactMessage.subject}`,
      "",
      "Message:",
      contactMessage.message
    ].join("\n")
  });
}

/**
 * Sends the owner-notification and guest-confirmation emails for a booking.
 * Both sends are independent (one failing does not stop the other) and this
 * function itself never rejects — call sites can fire-and-forget or await it
 * purely to know sending was attempted, without needing their own try/catch.
 */
async function sendBookingEmails(booking) {
  const smtp = getTransporter();

  if (!smtp) {
    logger.warn(
      `Booking emails skipped for ${booking.bookingId}: EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASS not fully configured.`
    );
    return;
  }

  const from = `"Vrinda Valley Resort" <${process.env.EMAIL_USER}>`;
  const ownerAddress = process.env.OWNER_EMAIL;

  const jobs = [
    {
      label: "owner notification",
      send: () =>
        ownerAddress
          ? smtp.sendMail({ from, to: ownerAddress, ...ownerEmail(booking) })
          : Promise.reject(new Error("OWNER_EMAIL is not configured"))
    },
    {
      label: "customer confirmation",
      send: () => smtp.sendMail({ from, to: booking.email, ...customerEmail(booking) })
    }
  ];

  const results = await Promise.allSettled(jobs.map((job) => job.send()));

  results.forEach((result, index) => {
    const { label } = jobs[index];
    if (result.status === "rejected") {
      logger.error(`Failed to send ${label} email for booking ${booking.bookingId}`, result.reason);
    } else {
      logger.info(`Sent ${label} email for booking ${booking.bookingId}`);
    }
  });
}

module.exports = { sendBookingEmails, sendPasswordResetEmail, sendContactMessageEmail };
