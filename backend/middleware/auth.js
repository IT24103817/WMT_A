/**
 * AUTH MIDDLEWARE (Group module — used by every protected route)
 * ==============================================================
 *
 * What it does:
 *   1. Reads the `Authorization: Bearer <token>` header
 *   2. Verifies the JWT signature (rejects forged or expired tokens)
 *   3. Looks up the user from the token's `id` claim
 *   4. Attaches the User document to req.user (without passwordHash)
 *
 * Failure responses:
 *   - 401 "Missing token" — header absent
 *   - 401 "Invalid token" — token valid but user no longer exists
 *   - 401 "Invalid or expired token" — signature mismatch or expired
 *
 * Why .select('-passwordHash')?
 *   Defense in depth. Even though User.toJSON strips it, this guarantees
 *   the hash never enters memory on a request handler.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    // Standard "Bearer <token>" format — slice off the prefix.
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Throws if the signature doesn't match JWT_SECRET or token expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
