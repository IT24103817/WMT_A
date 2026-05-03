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
    startPrice: { type: Number, required: true, min: 0 },
    endTime: { type: Date, required: true },
    currentHighest: {
      amount: { type: Number, default: 0 },
      customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    history: { type: [bidEntrySchema], default: [] },
    status: { type: String, enum: ['active', 'closed', 'cancelled'], default: 'active' },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);
