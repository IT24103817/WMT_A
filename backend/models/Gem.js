/**
 * GEM MODEL (Module M1 — Inventory)
 * =================================
 *
 * The Gem is the SKU. Listings, bids, offers, and orders all reference a
 * Gem doc for its specs and photos. There is exactly ONE source of truth
 * for any gem's photos: the `photos` array on this document.
 *
 * Validations:
 *   - name, type, colour: required, trimmed
 *   - carats: required Number, ≥ 0
 *   - stockQty: required Number, ≥ 0, defaults to 1
 *   - photos: array of Cloudinary URLs (multer caps at 6 in upload.js)
 *
 * Auto-managed:
 *   - isAvailable is recomputed on every save: stockQty > 0
 *     (also handled in findOneAndUpdate hooks for consistency)
 */

const mongoose = require('mongoose');

const gemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    colour: { type: String, required: true, trim: true },
    carats: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 1 },
    isAvailable: { type: Boolean, default: true },
    photos: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Keep isAvailable in sync with stockQty automatically.
gemSchema.pre('save', function (next) {
  this.isAvailable = this.stockQty > 0;
  next();
});

// Same logic for findOneAndUpdate / findByIdAndUpdate paths.
gemSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const stockQty = update.stockQty ?? update.$set?.stockQty;
  if (typeof stockQty === 'number') {
    this.set('isAvailable', stockQty > 0);
  }
  next();
});

module.exports = mongoose.model('Gem', gemSchema);
