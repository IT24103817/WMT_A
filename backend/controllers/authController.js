/**
 * AUTH CONTROLLER
 * ===============
 * Module owner: Group (everyone)
 *
 * What this file does:
 *   Handles register, login, and "who am I?" (me).
 *
 * Routes (mounted in routes/auth.js):
 *   POST /api/auth/register   → create a new customer account
 *   POST /api/auth/login      → exchange email+password for a JWT
 *   GET  /api/auth/me         → return the user attached by auth middleware
 *
 * Why JWT?
 *   We don't want to store sessions in the database. A JSON Web Token is a
 *   small signed string the client keeps in AsyncStorage and sends on every
 *   request as `Authorization: Bearer <token>`. The server only needs the
 *   secret (JWT_SECRET) to verify the signature.
 *
 * Why bcrypt?
 *   Passwords are never stored in plain text. bcrypt hashes them with a salt
 *   so even our own database admin can't read them. Cost factor 10 ≈ 100 ms
 *   per hash → fast for users, slow for attackers.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Sign a token that contains the user id + role. Anything signed with our
// JWT_SECRET will be trusted by the auth middleware on later requests.
function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * CREATE → POST /api/auth/register
 * Validates input, checks the email isn't already taken, hashes the
 * password, then creates a 'customer' user. Admin accounts are created
 * separately by the seed script (scripts/seedAdmin.js).
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // Validation: every field is mandatory.
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    // Validation: passwords must be at least 6 characters.
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validation: don't let two people use the same email.
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Hash before saving — the original password never touches the DB.
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'customer' });

    // Sign a token so the client is logged in immediately.
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

/**
 * READ-self / login → POST /api/auth/login
 * Verifies email + password and returns a fresh JWT. Note: the error message
 * is intentionally vague ("Invalid credentials") to avoid telling attackers
 * whether the email exists.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // bcrypt.compare hashes the candidate password and compares — never
    // do `===` between hash and plaintext.
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

/**
 * READ → GET /api/auth/me
 * The `auth` middleware already loaded the user from the token, so we just
 * echo it back. The mobile app calls this on launch to refresh the cached
 * user data.
 */
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
