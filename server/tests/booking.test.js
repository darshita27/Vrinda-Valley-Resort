/**
 * Verifies booking validation, error handling and the duplicate-guard control
 * flow WITHOUT a live MongoDB (none available on this machine).
 *
 * The model layer is stubbed; express-validator, the controller logic, the
 * routing and the centralised error handler are all real.
 */
const express = require("express");
const request = require("supertest");

process.env.LOG_LEVEL = "error";

const { notFound, errorHandler } = require("../middleware/errorHandler");
const { createBookingRules } = require("../middleware/validateBooking");
const Booking = require("../models/Booking");
const BookingLock = require("../models/BookingLock");

/* ---- stub the data layer ---- */
const state = { locks: new Set(), created: [], failNextCreate: false };

BookingLock.create = async ({ key }) => {
  if (state.locks.has(key)) {
    const err = new Error("E11000 duplicate key error");
    err.code = 11000; // what MongoDB's unique index actually returns
    throw err;
  }
  state.locks.add(key);
  return { key };
};

BookingLock.deleteOne = async ({ key }) => {
  state.locks.delete(key);
  return { deletedCount: 1 };
};

Booking.create = async (doc) => {
  if (state.failNextCreate) {
    state.failNextCreate = false;
    throw new Error("simulated database failure");
  }
  const saved = { ...doc, bookingId: `VV-TEST-${state.created.length}`, status: "Pending" };
  state.created.push(saved);
  return saved;
};

const ctrl = require("../controllers/bookingController");

const app = express();
app.use(express.json());
app.post("/api/bookings", createBookingRules, ctrl.createBooking);
app.use(notFound);
app.use(errorHandler);

const future = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const base = {
  name: "Darshita Singh",
  email: "guest@example.com",
  phone: "9876543210",
  arrival: future(10),
  departure: future(14),
  guests: 3,
  accommodationType: ["Room"],
  numberOfRooms: 2
};

let passed = 0, failed = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : "  " + detail}`);
  if (ok) passed++; else failed++;
};

(async () => {
  console.log("\n=== 1. THE ORIGINAL BUG: 5 rapid identical submissions ===");
  {
    const res = await Promise.all(
      Array.from({ length: 5 }, () => request(app).post("/api/bookings").send(base))
    );
    const created = res.filter((r) => r.status === 201).length;
    const conflicts = res.filter((r) => r.status === 409).length;

    console.log(`  statuses: ${res.map((r) => r.status).join(", ")}`);
    check("exactly 1 request returns 201", created === 1, `(got ${created})`);
    check("the other 4 return 409", conflicts === 4, `(got ${conflicts})`);
    check("exactly 1 booking written", state.created.length === 1, `(got ${state.created.length})`);
    check("bookingId returned to guest", !!res.find((r) => r.status === 201).body.data.bookingId);
    check("409 body carries a guest-safe message", typeof res.find((r) => r.status === 409).body.message === "string");
  }

  console.log("\n=== 2. Legitimate bookings are NOT blocked ===");
  {
    const before = state.created.length;
    const otherDates = await request(app).post("/api/bookings").send({ ...base, arrival: future(40), departure: future(45) });
    const otherGuest = await request(app).post("/api/bookings").send({ ...base, email: "other@example.com" });

    check("same guest, different dates -> 201", otherDates.status === 201, `(got ${otherDates.status})`);
    check("different guest, same dates -> 201", otherGuest.status === 201, `(got ${otherGuest.status})`);
    check("both were written", state.created.length === before + 2);
  }

  console.log("\n=== 3. Lock is released when the save fails (honest retry works) ===");
  {
    const payload = { ...base, email: "retry@example.com" };
    state.failNextCreate = true;

    const fail = await request(app).post("/api/bookings").send(payload);
    const retry = await request(app).post("/api/bookings").send(payload);

    check("failed save -> 500", fail.status === 500, `(got ${fail.status})`);
    check("retry after failure -> 201 (not stuck on 409)", retry.status === 201, `(got ${retry.status})`);
  }

  console.log("\n=== 4. Validation rules ===");
  {
    const cases = [
      ["missing name", { name: "" }, "name"],
      ["numeric name", { name: "12345" }, "name"],
      ["invalid email", { email: "not-an-email" }, "email"],
      ["invalid phone", { phone: "12345" }, "phone"],
      ["phone starting with 1", { phone: "1234567890" }, "phone"],
      ["check-in in the past", { arrival: "2020-01-01" }, "arrival"],
      ["check-out before check-in", { arrival: future(20), departure: future(15) }, "departure"],
      ["check-out same as check-in", { arrival: future(20), departure: future(20) }, "departure"],
      ["zero guests", { guests: 0 }, "guests"],
      ["too many guests", { guests: 500 }, "guests"],
      ["non-integer guests", { guests: "abc" }, "guests"],
      ["invalid accommodation type", { accommodationType: ["Spaceship"] }, "accommodationType"],
      ["no accommodation type selected", { accommodationType: [] }, "accommodationType"],
      ["room selected without a count", { accommodationType: ["Room"], numberOfRooms: undefined }, "numberOfRooms"],
      ["room selected with zero rooms", { accommodationType: ["Room"], numberOfRooms: 0 }, "numberOfRooms"]
    ];

    for (const [label, override, field] of cases) {
      const res = await request(app)
        .post("/api/bookings")
        .send({ ...base, email: `v${Math.random()}@x.com`, ...override });
      const hit = res.body.errors?.some((e) => e.field === field);
      check(`${label} -> 400 on '${field}'`, res.status === 400 && hit,
        `(got ${res.status}: ${JSON.stringify(res.body.errors)})`);
    }
  }

  console.log("\n=== 5. Privilege escalation blocked ===");
  {
    const status = await request(app).post("/api/bookings").send({ ...base, email: "h1@x.com", status: "Confirmed" });
    const payment = await request(app).post("/api/bookings").send({ ...base, email: "h2@x.com", paymentStatus: "Paid" });

    check("guest cannot set status -> 400", status.status === 400, `(got ${status.status})`);
    check("guest cannot set paymentStatus -> 400", payment.status === 400, `(got ${payment.status})`);
  }

  console.log("\n=== 6. Phone normalisation ===");
  {
    const phoneCases = [
      ["+91 98765-43210", "9876543210"],
      ["098765 43210", "9876543210"],
      ["(98765) 43210", "9876543210"],
      ["0091 98765 43210", "9876543210"],
      ["+919876543210", "9876543210"],
      ["9876543210", "9876543210"],
      // Must NOT be mangled: a real 10-digit number that begins with 91.
      ["9198765432", "9198765432"]
    ];

    for (const [input, expected] of phoneCases) {
      const email = `fmt${Math.random()}@x.com`;
      const res = await request(app).post("/api/bookings").send({ ...base, email, phone: input });
      const doc = state.created.find((b) => b.email === email);
      check(`'${input}' -> ${expected}`, res.status === 201 && doc?.phone === expected,
        `(got ${res.status} / ${doc?.phone})`);
    }
  }

  console.log("\n=== 7. Accommodation Type: multi-select and conditional Number of Rooms ===");
  {
    const poolOnly = await request(app)
      .post("/api/bookings")
      .send({ ...base, email: "pool@x.com", accommodationType: ["Pool"], numberOfRooms: 5 });
    check("Pool-only booking -> 201 (numberOfRooms ignored, not an error)", poolOnly.status === 201, `(got ${poolOnly.status})`);
    const poolDoc = state.created.find((b) => b.email === "pool@x.com");
    check("numberOfRooms NOT stored when Room isn't selected", poolDoc && poolDoc.numberOfRooms === undefined, `(got ${poolDoc?.numberOfRooms})`);

    const roomAndPool = await request(app)
      .post("/api/bookings")
      .send({ ...base, email: "roompool@x.com", accommodationType: ["Room", "Pool"], numberOfRooms: 3 });
    check("Room+Pool booking -> 201", roomAndPool.status === 201, `(got ${roomAndPool.status})`);
    const roomPoolDoc = state.created.find((b) => b.email === "roompool@x.com");
    check("numberOfRooms stored correctly when Room is selected", roomPoolDoc?.numberOfRooms === 3, `(got ${roomPoolDoc?.numberOfRooms})`);
    check("both accommodation types stored", JSON.stringify(roomPoolDoc?.accommodationType) === JSON.stringify(["Room", "Pool"]));

    const allThree = await request(app)
      .post("/api/bookings")
      .send({ ...base, email: "allthree@x.com", accommodationType: ["Room", "Pool", "Banquet Hall"], numberOfRooms: 1 });
    check("all three accommodation types -> 201", allThree.status === 201, `(got ${allThree.status})`);

    const banquetOnly = await request(app)
      .post("/api/bookings")
      .send({ ...base, email: "banquet@x.com", accommodationType: ["Banquet Hall"], numberOfRooms: undefined });
    check("Banquet Hall only, no numberOfRooms given -> 201", banquetOnly.status === 201, `(got ${banquetOnly.status})`);
  }

  console.log("\n=== 8. Unknown route ===");
  {
    const res = await request(app).get("/api/nope");
    check("unknown route -> 404 JSON", res.status === 404 && res.body.success === false, `(got ${res.status})`);
  }

  console.log("\n" + "=".repeat(52));
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(52));
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error("Test harness crashed:", err);
  process.exit(1);
});
