const mongoose = require('mongoose');

const ORDER_STATUSES = ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    source: { type: String, enum: ['direct', 'offer', 'bid'], required: true },
    amount: { type: Number, required: true, min: 0 },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Confirmed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
