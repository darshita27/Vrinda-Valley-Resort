const { ApiError } = require("./errorHandler");
const { verifyAdminToken } = require("../utils/token");

/**
 * Guards admin-only routes. Attaches the decoded payload as req.user.
 *
 * 401 = "you are not (or no longer) authenticated" — the browser reacts by
 * clearing the stored token and sending the user back to the login page.
 */
module.exports = function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (!authHeader || scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  let decoded;
  try {
    // verifyAdminToken pins { algorithms: ["HS256"] } and checks the issuer;
    // any mismatch throws JsonWebTokenError, same as a bad signature.
    decoded = verifyAdminToken(token);
  } catch (error) {
    // Every rejection path — expired, bad signature, wrong issuer, wrong
    // algorithm, malformed — ends up as the same shape of response
    // (ApiError -> the shared errorHandler's {success:false, message} JSON),
    // just with wording that tells the client whether a fresh login will
    // help (expired) or the token is simply unusable (everything else).
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Session expired. Please log in again."));
    }
    return next(new ApiError(401, "Invalid or malformed token"));
  }

  // Defense in depth: a token that verifies but is missing an expected claim
  // (e.g. issued by older code, or hand-crafted) is treated the same as an
  // invalid one rather than let a downstream handler dereference undefined.
  if (!decoded.sub || decoded.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }

  req.user = decoded;
  return next();
};
