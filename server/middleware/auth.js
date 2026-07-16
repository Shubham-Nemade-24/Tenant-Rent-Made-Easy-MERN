const crypto = require("crypto");

/**
 * Simple token-based auth middleware.
 * The client sends  Authorization: Bearer <token>  where <token> is a
 * SHA-256 hash of APP_PASSWORD.  This avoids sending the raw password on
 * every request while keeping the scheme dead-simple (no JWT library).
 */
function authMiddleware(req, res, next) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    // No password configured → open access
    return next();
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = crypto.createHash("sha256").update(password).digest("hex");

  if (token === expected) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = authMiddleware;
