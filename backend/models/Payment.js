/**
 * PAYMENT MODEL (Module M6)
 * =========================
 *
 * One Payment per Order. Created in checkoutController.js after Stripe
 * confirms (or, for COD, immediately with status='pending').
 *
 * Validations:
 *   - customer/gem: required refs
 *   - amount: required Number, ≥ 0
 *   - stripeRef: required (for COD we generate "cod_<timestamp>_<rand>")
 *   - status enum: pending | success | failed | refunded
 *   - paymentMethod enum: card | cod
 *   - source enum: direct | offer | bid
 *
 * Why we never store card details:
 *   The mobile Stripe SDK creates a `paymentMethod` on Stripe's servers and
 *   only sends us the opaque ID. We send that to Stripe; Stripe sends back
 *   a PaymentIntent ID. We store the PaymentIntent ID, not the card.
 *   That keeps us out of PCI-DSS scope.
 */

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
