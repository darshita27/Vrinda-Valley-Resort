const logger = require("../utils/logger");

/**
 * Application error carrying an HTTP status code.
 * Anything thrown that is not an ApiError is treated as a 500.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Wraps an async route handler so rejected promises reach Express's error
 * pipeline instead of hanging the request. Removes the try/catch from every
 * controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 404 for unmatched routes. Registered after all real routes. */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralised error handler. Must be the last app.use(). */
// eslint-disable-next-line no-unused-vars -- Express identifies this by arity (4 args).
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let details;

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Malformed ObjectId in a :id param
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for '${err.path}'`;
  }

  // Unique index violation
  if (err.code === 11000) {
    statusCode = 409;
    message = "This record already exists";
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${message}`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { errors: details }),
    // Stack traces are for local debugging only, never for production clients.
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
}

module.exports = { ApiError, asyncHandler, notFound, errorHandler };
