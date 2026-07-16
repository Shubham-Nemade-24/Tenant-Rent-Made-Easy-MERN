const { Router } = require("express");
const crypto = require("crypto");

const router = Router();

/**
 * POST /api/auth/login
 * Body: { password: "..." }
 * Returns a bearer token (SHA-256 of APP_PASSWORD) on success.
 */
router.post("/login", (req, res) => {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    // No password set → always grant access
    return res.json({ token: "open" });
  }
  const { password } = req.body || {};
  if (password === expected) {
    const token = crypto.createHash("sha256").update(expected).digest("hex");
    return res.json({ token });
  }
  return res.status(401).json({ error: "Incorrect password." });
});

module.exports = router;
