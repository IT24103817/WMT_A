/**
 * ORDER MODEL (Module M4)
 * =======================
 *
 * One Order = one checkout. Can contain multiple items (multi-item cart).
 * The items[] array hides the source heterogeneity — each item knows
 * whether it came from a direct listing, an accepted offer, or a won bid.
 *
 * Validations:
 *   - orderNumber: required, unique across the collection
 *   - subtotal/totalAmount: required Numbers, ≥ 0
 *   - paymentMethod: enum ['card', 'cod']
 *   - status: enum (5 values, defaults to 'Confirmed')
 *   - shippingAddress: required subfields fullName/phone/line1/city/postal/country
 *
 * Snapshot fields (gemNameSnapshot, photoSnapshot):
 *   Captured at order creation time so the customer's order history still
 *   displays correctly even if the gem is later deleted from inventory.
 */

const mongoose = require('mongoose');

const ORDER_STATUSES = ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const PAYMENT_METHODS = ['card', 'cod'];

// One line item inside an Order. Source can be 'direct' (cart), 'offer', or 'bid'.
const orderItemSchema = new mongoose.Schema(
  {
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    source: { type: String, enum: ['direct', 'offer', 'bid'], required: true },
    qty: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    gemNameSnapshot: String,   // denormalised for orders list display
    photoSnapshot: String,
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    notes: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    shippingAddress: shippingAddressSchema,
    status: { type: String, enum: ORDER_STATUSES, default: 'Confirmed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
