/**
 * LISTING MODEL (Module M3)
 * =========================
 *
 * A Listing is "this Gem is for sale at this price". The gem field is the
 * source of truth for photos/specs; the listing only adds price +
 * description + optional video.
 *
 * Validations:
 *   - gem: required ref
 *   - price: required Number, ≥ 0
 *   - description: required
 *   - openForOffers: bool — if true, customers can submit offers
 *   - status enum: active | sold | removed
 *
 * Why `photos` is still here:
 *   Some legacy listings created before the schema migration carry their
 *   own photos. The `listingPhoto()` helper (mobile/src/utils/photo.js)
 *   prefers gem.photos and falls back to listing.photos.
 */

const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    // Photos now live on the Gem (inventory). This array stays for legacy listings.
    photos: { type: [String], default: [] },
    videoUrl: { type: String, default: '' },
    openForOffers: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'sold', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);
