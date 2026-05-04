const mongoose = require('mongoose');

const ORDER_STATUSES = ['Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];
<<<<<<< HEAD

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
=======
const PAYMENT_METHODS = ['card', 'cod'];

const orderItemSchema = new mongoose.Schema(
  {
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', default: null },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
    source: { type: String, enum: ['direct', 'offer', 'bid'], required: true },
<<<<<<< HEAD
    amount: { type: Number, required: true, min: 0 },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
=======
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
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    status: { type: String, enum: ORDER_STATUSES, default: 'Confirmed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
<<<<<<< HEAD
=======
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
