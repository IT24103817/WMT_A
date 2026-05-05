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
