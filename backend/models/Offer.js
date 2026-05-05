const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'paid'], default: 'pending' },
  },
  { timestamps: true }
);

offerSchema.index({ listing: 1, customer: 1 });

module.exports = mongoose.model('Offer', offerSchema);
