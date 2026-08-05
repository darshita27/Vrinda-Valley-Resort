/**
 * Verifies login lockout, generic-error consistency, token verification, and
 * the forgot/reset-password OTP flow — WITHOUT a live MongoDB or real SMTP
 * (same stubbing approach as booking.test.js / email.test.js).
 *
 * The model's instance methods (isLocked/registerFailedLogin/resetLoginAttempts/
 * hasResetOtpPending/registerFailedOtpAttempt) are exercised for real — only
 * the Mongoose query layer and Nodemailer transport are stubbed.
 */
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

process.env.LOG_LEVEL = "error";
process.env.JWT_SECRET = "a".repeat(32);
process.env.JWT_EXPIRES_IN = "1h";
process.env.EMAIL_HOST = "smtp.test.local";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USER = "sender@test.local";
process.env.EMAIL_PASS = "test-pass";
process.env.OWNER_EMAIL = "owner@test.local";

const { notFound, errorHandler } = require("../middleware/errorHandler");
const auth = require("../middleware/authMiddleware");
const Admin = require("../models/Admin");
const { signAdminToken, verifyAdminToken } = require("../utils/token");

/* ---- stub Nodemailer before authController (which requires utils/email.js) ---- */
const nodemailer = require("nodemailer");
const sentMails = [];
nodemailer.createTransport = () => ({
  sendMail: async (options) => {
    sentMails.push(options);
    return { messageId: "test-message-id" };
  }
});

/* ---- stub the data layer: a fake Admin "document" with real schema methods ---- */
const db = new Map(); // email -> admin-like object

function makeAdmin({ email, passwordHash }) {
  const doc = {
    _id: { toString: () => "64b000000000000000000001" },
    email,
    password: passwordHash,
    loginAttempts: 0,
    lockUntil: undefined,
    resetOtpHash: undefined,
    resetOtpExpires: undefined,
    resetOtpAttempts: 0,
    isLocked: Admin.schema.methods.isLocked,
    registerFailedLogin: Admin.schema.methods.registerFailedLogin,
    resetLoginAttempts: Admin.schema.methods.resetLoginAttempts,
    hasResetOtpPending: Admin.schema.methods.hasResetOtpPending,
    registerFailedOtpAttempt: Admin.schema.methods.registerFailedOtpAttempt,
    save: async () => doc
  };
  db.set(email, doc);
  return doc;
}

Admin.findOne = ({ email }) => ({
  select: async () => db.get(email) || null
});

const REAL_PASSWORD = "correct-horse-battery-staple";
const HASH = bcrypt.hashSync(REAL_PASSWORD, 4); // low cost round for test speed

makeAdmin({ email: "admin@vrinda.test", passwordHash: HASH });

const { login, forgotPassword, resetPassword } = require("../controllers/authController");

const app = express();
app.use(express.json());
app.post("/api/auth/login", login);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);
app.get("/api/auth/protected", auth, (req, res) => res.json({ success: true, user: req.user }));
app.use(notFound);
app.use(errorHandler);

/** Pulls the 6-digit code out of the last email sent to a given address. */
function otpSentTo(email) {
  const mail = [...sentMails].reverse().find((m) => m.to === email);
  const match = mail && mail.text.match(/Password reset code: (\d{6})/);
  return match ? match[1] : null;
}

let passed = 0, failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  " + detail}`);
  if (ok) passed++; else failed++;
};

(async () => {
  console.log("\n=== 1. Unknown email and wrong password look identical ===");
  {
    const unknown = await request(app).post("/api/auth/login").send({ email: "nobody@vrinda.test", password: "x" });
    const wrong = await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: "wrong" });

    check("unknown email -> 401", unknown.status === 401, `(got ${unknown.status})`);
    check("wrong password -> 401", wrong.status === 401, `(got ${wrong.status})`);
    check("identical message", unknown.body.message === wrong.body.message, `("${unknown.body.message}" vs "${wrong.body.message}")`);
  }

  console.log("\n=== 2. Correct login succeeds and resets attempts ===");
  {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: REAL_PASSWORD });
    check("correct password -> 200 with token", res.status === 200 && !!res.body.token, `(got ${res.status})`);
    check("attempts reset to 0", db.get("admin@vrinda.test").loginAttempts === 0);
  }

  console.log("\n=== 3. Per-account lockout after 5 consecutive failures ===");
  {
    for (let i = 0; i < 4; i++) {
      await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: "wrong" });
    }
    check("4 failures, not yet locked", !db.get("admin@vrinda.test").isLocked());

    const fifthFail = await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: "wrong" });
    check("5th failure -> 401", fifthFail.status === 401);
    check("account now locked", db.get("admin@vrinda.test").isLocked());

    const correctButLocked = await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: REAL_PASSWORD });
    check("correct password rejected while locked", correctButLocked.status === 401, `(got ${correctButLocked.status})`);
    check("locked-account message matches generic invalid-credentials message", correctButLocked.body.message === fifthFail.body.message);
  }

  console.log("\n=== 4. JWT algorithm pinning & issuer/role checks ===");
  {
    const admin = db.get("admin@vrinda.test");
    admin.lockUntil = undefined; // unlock for a clean token
    admin.loginAttempts = 0;

    const validToken = signAdminToken(admin);
    const validRes = await request(app).get("/api/auth/protected").set("Authorization", `Bearer ${validToken}`);
    check("valid HS256 token -> 200", validRes.status === 200, `(got ${validRes.status})`);

    const noneAlgToken =
      Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url") +
      "." +
      Buffer.from(JSON.stringify({ sub: "x", role: "admin", iss: "vrinda-valley-resort", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") +
      ".";
    const noneRes = await request(app).get("/api/auth/protected").set("Authorization", `Bearer ${noneAlgToken}`);
    check("alg:none forged token -> 401", noneRes.status === 401, `(got ${noneRes.status})`);

    const wrongIssuer = jwt.sign({ sub: "x", role: "admin" }, process.env.JWT_SECRET, { algorithm: "HS256", issuer: "someone-else" });
    const wrongIssuerRes = await request(app).get("/api/auth/protected").set("Authorization", `Bearer ${wrongIssuer}`);
    check("wrong issuer -> 401", wrongIssuerRes.status === 401, `(got ${wrongIssuerRes.status})`);

    const nonAdmin = jwt.sign({ sub: "x", role: "guest" }, process.env.JWT_SECRET, { algorithm: "HS256", issuer: "vrinda-valley-resort" });
    const nonAdminRes = await request(app).get("/api/auth/protected").set("Authorization", `Bearer ${nonAdmin}`);
    check("non-admin role -> 403", nonAdminRes.status === 403, `(got ${nonAdminRes.status})`);

    const expired = jwt.sign({ sub: "x", role: "admin" }, process.env.JWT_SECRET, { algorithm: "HS256", issuer: "vrinda-valley-resort", expiresIn: -10 });
    const expiredRes = await request(app).get("/api/auth/protected").set("Authorization", `Bearer ${expired}`);
    check("expired token -> 401 with clear message", expiredRes.status === 401 && /expired/i.test(expiredRes.body.message), `(got ${expiredRes.status}: ${expiredRes.body.message})`);

    const noHeader = await request(app).get("/api/auth/protected");
    check("missing Authorization header -> 401", noHeader.status === 401, `(got ${noHeader.status})`);
  }

  console.log("\n=== 5. verifyAdminToken rejects algorithm/secret mismatches directly ===");
  {
    const hs512 = jwt.sign({ sub: "x", role: "admin" }, process.env.JWT_SECRET, { algorithm: "HS512", issuer: "vrinda-valley-resort" });
    let rejected = false;
    try { verifyAdminToken(hs512); } catch (e) { rejected = true; }
    check("HS512-signed token rejected by HS256-pinned verify", rejected);
  }

  console.log("\n=== 6. Forgot-password: known vs unknown email look identical ===");
  {
    sentMails.length = 0;

    const known = await request(app).post("/api/auth/forgot-password").send({ email: "admin@vrinda.test" });
    const unknown = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@vrinda.test" });

    check("known email -> 200", known.status === 200, `(got ${known.status})`);
    check("unknown email -> 200 (same status, no enumeration)", unknown.status === 200, `(got ${unknown.status})`);
    check("identical response message", known.body.message === unknown.body.message);
    check("email actually sent only for the known account", sentMails.length === 1 && sentMails[0].to === "admin@vrinda.test", `(sent to: ${sentMails.map((m) => m.to)})`);
    check("OTP subject is correct", sentMails[0].subject === "Your Vrinda Valley Resort Admin Password Reset Code", `(got "${sentMails[0].subject}")`);
    check("admin now has a pending reset code", db.get("admin@vrinda.test").hasResetOtpPending());
  }

  console.log("\n=== 7. Reset-password: correct OTP changes the password and clears lockout ===");
  {
    const admin = db.get("admin@vrinda.test");
    // Simulate the lockout from section 3 still being active going into this reset.
    admin.loginAttempts = 5;
    admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);

    const otp = otpSentTo("admin@vrinda.test");
    check("OTP was captured from the sent email", /^\d{6}$/.test(otp || ""), `(got "${otp}")`);

    const newPassword = "a-brand-new-strong-password";
    const res = await request(app).post("/api/auth/reset-password").send({ email: "admin@vrinda.test", otp, newPassword });

    check("correct OTP -> 200", res.status === 200, `(got ${res.status})`);
    check("OTP cleared after use", !admin.hasResetOtpPending());
    check("login lockout cleared by a successful reset", !admin.isLocked() && admin.loginAttempts === 0);

    const loginWithNew = await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: newPassword });
    check("can log in with the new password", loginWithNew.status === 200, `(got ${loginWithNew.status})`);

    const loginWithOld = await request(app).post("/api/auth/login").send({ email: "admin@vrinda.test", password: REAL_PASSWORD });
    check("old password no longer works", loginWithOld.status === 401, `(got ${loginWithOld.status})`);
  }

  console.log("\n=== 8. Reset-password: wrong/expired/reused OTP all fail identically ===");
  {
    sentMails.length = 0;
    await request(app).post("/api/auth/forgot-password").send({ email: "admin@vrinda.test" });
    const admin = db.get("admin@vrinda.test");
    const realOtp = otpSentTo("admin@vrinda.test");

    const wrongOtpRes = await request(app).post("/api/auth/reset-password").send({ email: "admin@vrinda.test", otp: "000000", newPassword: "another-strong-password" });
    check("wrong OTP -> 400", wrongOtpRes.status === 400, `(got ${wrongOtpRes.status})`);
    check("attempt counter incremented", admin.resetOtpAttempts === 1);

    admin.resetOtpExpires = new Date(Date.now() - 1000); // force expiry
    const expiredRes = await request(app).post("/api/auth/reset-password").send({ email: "admin@vrinda.test", otp: realOtp, newPassword: "another-strong-password" });
    check("expired OTP (even if correct) -> 400", expiredRes.status === 400, `(got ${expiredRes.status})`);
    check("expired-OTP message matches wrong-OTP message (no signal leak)", expiredRes.body.message === wrongOtpRes.body.message);

    const unknownEmailRes = await request(app).post("/api/auth/reset-password").send({ email: "nobody@vrinda.test", otp: "123456", newPassword: "another-strong-password" });
    check("unknown email -> same 400 message too", unknownEmailRes.status === 400 && unknownEmailRes.body.message === wrongOtpRes.body.message);

    const tooShortRes = await request(app).post("/api/auth/reset-password").send({ email: "admin@vrinda.test", otp: "123456", newPassword: "short" });
    check("new password under 8 chars -> 400", tooShortRes.status === 400, `(got ${tooShortRes.status})`);
  }

  console.log("\n=== 9. Reset-password: OTP is invalidated after MAX_OTP_ATTEMPTS wrong guesses ===");
  {
    sentMails.length = 0;
    await request(app).post("/api/auth/forgot-password").send({ email: "admin@vrinda.test" });
    const admin = db.get("admin@vrinda.test");
    const realOtp = otpSentTo("admin@vrinda.test");

    for (let i = 0; i < Admin.MAX_OTP_ATTEMPTS; i++) {
      await request(app).post("/api/auth/reset-password").send({ email: "admin@vrinda.test", otp: "999999", newPassword: "another-strong-password" });
    }
    check(`OTP invalidated after ${Admin.MAX_OTP_ATTEMPTS} wrong guesses`, !admin.hasResetOtpPending());

    const tryRealOtp = await request(app).post("/api/auth/reset-password").send({ email: "admin@vrinda.test", otp: realOtp, newPassword: "another-strong-password" });
    check("even the correct OTP is now rejected — must request a fresh code", tryRealOtp.status === 400, `(got ${tryRealOtp.status})`);
  }

  console.log("\n" + "=".repeat(52));
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(52));
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error("Test harness crashed:", err);
  process.exit(1);
});
