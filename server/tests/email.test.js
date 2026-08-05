/**
 * Verifies the Nodemailer wiring WITHOUT sending real email: nodemailer's
 * createTransport is stubbed before utils/email.js is required, same
 * approach booking.test.js uses to stub the Mongoose layer.
 *
 * (The "EMAIL_* not configured -> booking still succeeds, email just skipped"
 * path is already exercised for real by booking.test.js and auth.test.js,
 * neither of which sets these env vars.)
 */
process.env.LOG_LEVEL = "error";
process.env.EMAIL_HOST = "smtp.test.local";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USER = "sender@test.local";
process.env.EMAIL_PASS = "test-pass";
process.env.OWNER_EMAIL = "owner@test.local";

const nodemailer = require("nodemailer");

const sent = [];
let failRecipient = null; // set to an address to make that one send() reject

nodemailer.createTransport = () => ({
  sendMail: async (options) => {
    if (failRecipient && options.to === failRecipient) {
      throw new Error("simulated SMTP failure");
    }
    sent.push(options);
    return { messageId: "test-message-id" };
  }
});

const { sendBookingEmails } = require("../utils/email");

const booking = {
  bookingId: "VV-TEST-1",
  name: "Darshita Singh",
  email: "guest@example.com",
  phone: "9876543210",
  arrival: new Date("2026-09-10"),
  departure: new Date("2026-09-14"),
  guests: 3,
  accommodationType: ["Room", "Pool"],
  numberOfRooms: 2,
  specialRequest: "",
  status: "Pending"
};

let passed = 0, failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  " + detail}`);
  if (ok) passed++; else failed++;
};

(async () => {
  console.log("\n=== 1. Both emails sent with the required subjects/recipients ===");
  {
    sent.length = 0;
    await sendBookingEmails(booking);

    const owner = sent.find((m) => m.to === "owner@test.local");
    const customer = sent.find((m) => m.to === "guest@example.com");

    check("owner email sent", !!owner);
    check("owner subject exact match", owner?.subject === "New Booking Received - Vrinda Valley Resort", `(got "${owner?.subject}")`);
    check("customer email sent", !!customer);
    check("customer subject exact match", customer?.subject === "Booking Request Received", `(got "${customer?.subject}")`);
    check("owner email includes booking id", owner?.html.includes("VV-TEST-1"));
    check("owner email includes phone", owner?.html.includes("9876543210"));
    check("customer email includes required thank-you copy", customer?.html.includes("Thank you for choosing Vrinda Valley Resort. Our team will contact you shortly to confirm your booking."));
    check("customer email includes guest count", customer?.html.includes(">3<"), "(guests=3 not found in HTML)");
    check("owner email includes accommodation types", owner?.html.includes("Room, Pool"), "(\"Room, Pool\" not found in HTML)");
    check("owner email includes number of rooms", owner?.html.includes(">2<"), "(numberOfRooms=2 not found in HTML)");
    check("customer email includes accommodation types", customer?.html.includes("Room, Pool"), "(\"Room, Pool\" not found in HTML)");
    check("from address uses configured EMAIL_USER", owner?.from.includes("sender@test.local"));
  }

  console.log("\n=== 2. One send failing does not block the other, and the function never throws ===");
  {
    sent.length = 0;
    failRecipient = "guest@example.com"; // customer send will reject

    let threw = false;
    try {
      await sendBookingEmails(booking);
    } catch (e) {
      threw = true;
    }

    check("sendBookingEmails does not throw even when one send fails", !threw);
    check("owner email still sent despite customer send failing", sent.some((m) => m.to === "owner@test.local"));
    check("failed customer send was not recorded as sent", !sent.some((m) => m.to === "guest@example.com"));

    failRecipient = null;
  }

  console.log("\n=== 3. Special request text is HTML-escaped ===");
  {
    sent.length = 0;
    const maliciousBooking = { ...booking, specialRequest: '<script>alert("xss")</script>' };
    await sendBookingEmails(maliciousBooking);

    const owner = sent.find((m) => m.to === "owner@test.local");
    check("raw <script> tag not present in owner HTML", !owner.html.includes("<script>alert"));
    check("escaped form present instead", owner.html.includes("&lt;script&gt;"));
  }

  console.log("\n=== 4. Missing OWNER_EMAIL fails only the owner send ===");
  {
    sent.length = 0;
    const originalOwner = process.env.OWNER_EMAIL;
    delete process.env.OWNER_EMAIL;

    await sendBookingEmails(booking);

    check("customer email still sent when OWNER_EMAIL is unset", sent.some((m) => m.to === "guest@example.com"));
    check("no owner email sent when OWNER_EMAIL is unset", !sent.some((m) => m.to === "owner@test.local"));

    process.env.OWNER_EMAIL = originalOwner;
  }

  console.log("\n" + "=".repeat(52));
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(52));
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error("Test harness crashed:", err);
  process.exit(1);
});
