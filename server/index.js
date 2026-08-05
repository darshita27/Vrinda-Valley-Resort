require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { assertJwtConfig } = require("./utils/token");
const bookingRoutes = require("./routes/bookingRoutes");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");

// Fail before accepting traffic rather than 500-ing on the first login attempt.
try {
  assertJwtConfig();
} catch (error) {
  logger.error("Startup aborted", error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Render and other proxies sit in front of the app; without this the rate
// limiter sees the proxy IP for every request instead of the real client.
app.set("trust proxy", 1);

/**
 * Allowed browser origins. Set ALLOWED_ORIGINS as a comma-separated list in
 * the environment; falls back to the production site plus local development.
 */
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "https://vrindavalleyresort.com,https://www.vrindavalleyresort.com,http://localhost:3000,http://127.0.0.1:5500"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests with no Origin header (curl, health checks, same-origin) pass.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(logger.requestLogger);

// Health check — also used to warm the instance after a cold start.
app.get("/", (req, res) => res.status(200).json({ success: true, message: "Server is working" }));

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);

app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected");
    app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    logger.error("MongoDB connection failed — server not started", error);
    process.exit(1);
  });

process.on("unhandledRejection", (reason) => logger.error("Unhandled promise rejection", reason));
