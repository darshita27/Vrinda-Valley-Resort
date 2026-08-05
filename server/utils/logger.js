/**
 * Minimal levelled logger. Keeps output structured and timestamped without
 * pulling in a logging framework.
 *
 * Set LOG_LEVEL to error | warn | info | debug (default: info).
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const activeLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function write(level, message, meta) {
  if (LEVELS[level] > activeLevel) return;

  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
  const stream = level === "error" ? console.error : console.log;

  if (meta instanceof Error) {
    stream(line, "\n", meta.stack);
  } else if (meta !== undefined) {
    stream(line, meta);
  } else {
    stream(line);
  }
}

module.exports = {
  error: (message, meta) => write("error", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  info: (message, meta) => write("info", message, meta),
  debug: (message, meta) => write("debug", message, meta),

  /** Express middleware: one line per request with status and duration. */
  requestLogger(req, res, next) {
    const startedAt = Date.now();

    res.on("finish", () => {
      const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
      write(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    });

    next();
  }
};
