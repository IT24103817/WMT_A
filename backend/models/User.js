/**
 * USER MODEL (Auth — Group module)
 * ================================
 *
 * Validations enforced by mongoose:
 *   - name: required, whitespace trimmed
 *   - email: required, unique, lowercased, trimmed
 *   - passwordHash: required (we never store the original password)
 *   - role: must be 'customer' or 'admin' (defaults to 'customer')
 *
 * Notes:
 *   - `lastAddress` is a subdocument storing the most recent shipping
 *     address the customer used. The mobile checkout screen prefills the
 *     form from this on next purchase.
 *   - The custom `toJSON` strips `passwordHash` from API responses — even
 *     if a route accidentally sends the whole user, the hash stays private.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    // Saved at end of every checkout so the next one can prefill.
    lastAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      postalCode: String,
      country: String,
      notes: String,
    },
  },
  { timestamps: true } // mongoose auto-fills createdAt + updatedAt
);

// Custom serialization: hide passwordHash, expose `id` (not `_id`).
userSchema.method('toJSON', function () {
  const { _id, name, email, role, createdAt, lastAddress } = this;
  return { id: _id, name, email, role, createdAt, lastAddress: lastAddress || null };
});

module.exports = mongoose.model('User', userSchema);
