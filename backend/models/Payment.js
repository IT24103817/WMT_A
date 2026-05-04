const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    amount: { type: Number, required: true, min: 0 },
    stripeRef: { type: String, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'success' },
    paymentMethod: { type: String, enum: ['card', 'cod'], default: 'card' },
    refundRef: { type: String, default: '' },
    refundedAt: { type: Date, default: null },
    source: { type: String, enum: ['direct', 'offer', 'bid'], required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
