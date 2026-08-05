/**
 * Single source of truth for admin JWT signing and verification.
 *
 * Before this module existed the secret was hard-coded as "secret123" in both
 * authController and authMiddleware, which meant anyone who read the repository
 * could forge an admin token. The secret now comes from the environment only.
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const JWT_ISSUER = "vrinda-valley-resort";
const MIN_SECRET_LENGTH = 32;

// Pinned everywhere the secret is used to sign or verify. jsonwebtoken will not
// accept an unsigned ("none" alg) token without this being opted into, but
// pinning it explicitly removes any ambiguity and stops a future edit from
// widening it by accident.
const JWT_ALGORITHM = "HS256";

/**
 * Called once at startup. A missing OR weak secret is fatal — running with no
 * secret, or one short enough to be brute-forced, would silently re-introduce
 * the forgeable-token problem this module was written to close.
 */
function assertJwtConfig() {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not set. Add it to the environment (see .env.example) before starting the server."
    );
  }

  if (JWT_SECRET.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is too short (${JWT_SECRET.length} characters, minimum ${MIN_SECRET_LENGTH}). ` +
        "A short secret can be brute-forced offline, letting an attacker forge admin tokens. " +
        "Generate a strong one with: openssl rand -hex 32"
    );
  }
}

/** Signs a short-lived token for an authenticated admin document. */
function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin._id.toString(), email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, issuer: JWT_ISSUER, algorithm: JWT_ALGORITHM }
  );
}

/** Throws jwt's TokenExpiredError / JsonWebTokenError; callers map them to 401. */
function verifyAdminToken(token) {
  // Pinning `algorithms` stops algorithm-confusion attacks: without it, a
  // library will honor whatever "alg" the token itself claims, so a token
  // that swaps in a different algorithm than the one used to sign it (e.g.
  // asymmetric RS256 -> HS256, using the public key as the HMAC secret) can
  // slip through. Restricting verification to the exact algorithm we sign
  // with removes that entire attack class regardless of what the token claims.
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER, algorithms: [JWT_ALGORITHM] });
}

module.exports = { assertJwtConfig, signAdminToken, verifyAdminToken, JWT_EXPIRES_IN };
