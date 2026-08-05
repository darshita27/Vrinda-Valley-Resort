/**
 * Verifies the contact-form validation, storage, and fail-soft email
 * behaviour WITHOUT a live MongoDB or real SMTP — same stubbing approach as
 * booking.test.js / email.test.js.
 */
const express = require("express");
const request = require("supertest");

process.env.LOG_LEVEL = "error";

const { notFound, errorHandler } = require("../middleware/errorHandler");
const { createContactMessageRules } = require("../middleware/validateContact");
const ContactMessage = require("../models/ContactMessage");

/* ---- stub the data layer ---- */
const state = { created: [], failNextCreate: false };

ContactMessage.create = async (doc) => {
  if (state.failNextCreate) {
    state.failNextCreate = false;
    throw new Error("simulated database failure");
  }
  const saved = { _id: `contact-${state.created.length}`, status: "New", ...doc };
  state.created.push(saved);
  return saved;
};

/* ---- stub nodemailer so utils/email.js's sendContactMessageEmail has
   something (or deliberately nothing) to send through ---- */
process.env.EMAIL_HOST = "smtp.test.local";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USER = "sender@test.local";
process.env.EMAIL_PASS = "test-pass";
process.env.OWNER_EMAIL = "owner@test.local";

const nodemailer = require("nodemailer");
const sentMails = [];
nodemailer.createTransport = () => ({
  sendMail: async (options) => {
    sentMails.push(options);
    return { messageId: "test-message-id" };
  }
});

const ctrl = require("../controllers/contactController");

const app = express();
app.use(express.json());
app.post("/api/contact", createContactMessageRules, ctrl.createContactMessage);
app.use(notFound);
app.use(errorHandler);

const base = {
  name: "Darshita Singh",
  email: "guest@example.com",
  phone: "9876543210",
  subject: "Question about wedding packages",
  message: "Hi, I'd like to know more about your wedding packages and pricing."
};

let passed = 0, failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  " + detail}`);
  if (ok) passed++; else failed++;
};

(async () => {
  console.log("\n=== 1. Valid submission is stored and emailed ===");
  {
    sentMails.length = 0;
    const res = await request(app).post("/api/contact").send(base);

    check("201 on valid submission", res.status === 201, `(got ${res.status})`);
    check("success message returned, no internal details leaked", res.body.success === true && typeof res.body.message === "string");
    check("message actually stored", state.created.some((m) => m.email === "guest@example.com" && m.subject === base.subject));
    check("notification email sent to OWNER_EMAIL", sentMails.some((m) => m.to === "owner@test.local"));
    const mail = sentMails.find((m) => m.to === "owner@test.local");
    check("email subject is correct", mail?.subject === "New Contact Message - Vrinda Valley Resort", `(got "${mail?.subject}")`);
    check("replyTo is set to the submitter's email (so owner can just hit Reply)", mail?.replyTo === "guest@example.com");
    check("email body includes the message text", mail?.html.includes("wedding packages"));
  }

  console.log("\n=== 2. Validation rules ===");
  {
    const cases = [
      ["missing name", { name: "" }, "name"],
      ["numeric name", { name: "12345" }, "name"],
      ["invalid email", { email: "not-an-email" }, "email"],
      ["invalid phone", { phone: "12345" }, "phone"],
      ["missing subject", { subject: "" }, "subject"],
      ["subject too short", { subject: "Hi" }, "subject"],
      ["missing message", { message: "" }, "message"],
      ["message too short", { message: "short" }, "message"]
    ];

    for (const [label, override, field] of cases) {
      const res = await request(app).post("/api/contact").send({ ...base, ...override });
      const hit = res.body.errors?.some((e) => e.field === field);
      check(`${label} -> 400 on '${field}'`, res.status === 400 && hit, `(got ${res.status}: ${JSON.stringify(res.body.errors)})`);
    }
  }

  console.log("\n=== 3. Privilege escalation blocked ===");
  {
    const res = await request(app).post("/api/contact").send({ ...base, status: "Resolved" });
    check("submitter cannot set status -> 400", res.status === 400, `(got ${res.status})`);
  }

  console.log("\n=== 4. Fail-soft: DB failure still surfaces as a real error (this one isn't email-related) ===");
  {
    state.failNextCreate = true;
    const res = await request(app).post("/api/contact").send({ ...base, email: "another@example.com" });
    check("DB failure -> 500", res.status === 500, `(got ${res.status})`);
  }

  console.log("\n=== 5. Email failure does not block the success response ===");
  {
    const originalOwner = process.env.OWNER_EMAIL;
    delete process.env.OWNER_EMAIL; // makes sendContactMessageEmail throw

    const res = await request(app).post("/api/contact").send({ ...base, email: "third@example.com" });
    check("still 201 even though the notification email will fail", res.status === 201, `(got ${res.status})`);
    check("message was still stored", state.created.some((m) => m.email === "third@example.com"));

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
