const mongoose = require('mongoose');

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
<<<<<<< HEAD
    startPrice: { type: Number, required: true, min: 0 },
=======
    description: { type: String, default: '', trim: true },
    startPrice: { type: Number, required: true, min: 0 },
    /**
     * When set + in the future, bid is in 'scheduled' status and not biddable.
     * lazyOpenBids() flips status → 'active' once the time passes.
     * If null, bid goes live immediately on create.
     */
    scheduledStartAt: { type: Date, default: null },
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    endTime: { type: Date, required: true },
    currentHighest: {
      amount: { type: Number, default: 0 },
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    history: { type: [bidEntrySchema], default: [] },
<<<<<<< HEAD
    status: { type: String, enum: ['active', 'closed', 'cancelled'], default: 'active' },
=======
    status: { type: String, enum: ['scheduled', 'active', 'closed', 'cancelled'], default: 'active' },
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);
