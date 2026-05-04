/**
 * BID MODEL (Module M5)
 * =====================
 *
 * Auction state machine: scheduled → active → closed (winner declared)
 *                        active → cancelled (admin pulled it)
 *
 * Validations:
 *   - gem: required ref
 *   - startPrice: required Number, ≥ 0
 *   - endTime: required Date (controller checks > now on create)
 *   - scheduledStartAt: optional Date; if set and in the future, status='scheduled'
 *   - status enum: scheduled | active | closed | cancelled
 *   - currentHighest.amount: must be > previous amount (enforced in controller.place)
 *
 * Lazy state:
 *   The status field is updated by lazyOpenBids/lazyCloseBids utilities at
 *   the start of every read. The DB snapshot may briefly lag reality.
 */

const mongoose = require('mongoose');

// One row in the bid history. We append on every successful place call.
const bidEntrySchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    placedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bidSchema = new mongoose.Schema(
  {
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    description: { type: String, default: '', trim: true },
    startPrice: { type: Number, required: true, min: 0 },
    /**
     * When set + in the future, bid is in 'scheduled' status and not biddable.
     * lazyOpenBids() flips status → 'active' once the time passes.
     * If null, bid goes live immediately on create.
     */
    scheduledStartAt: { type: Date, default: null },
    endTime: { type: Date, required: true },
    currentHighest: {
      amount: { type: Number, default: 0 },
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    history: { type: [bidEntrySchema], default: [] },
    status: { type: String, enum: ['scheduled', 'active', 'closed', 'cancelled'], default: 'active' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);
