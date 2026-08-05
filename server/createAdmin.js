/**
 * One-off script to create or reset the admin account.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node createAdmin.js
 *
 * Re-running it updates the existing account's password instead of failing on
 * the unique email index.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/Admin");

async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  // No default password: a known one in source is the same as no password.
  if (!password) {
    console.error("ADMIN_PASSWORD is required. Example:");
    console.error("  ADMIN_PASSWORD='a-strong-password' node createAdmin.js");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash(password, 12);

  await Admin.findOneAndUpdate(
    { email },
    { email, password: hashedPassword },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin account ready: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error("Failed to create admin:", error.message);
  process.exit(1);
});
