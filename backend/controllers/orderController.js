const Stripe = require('stripe');
const Order = require('../models/Order');
const { ORDER_STATUSES } = require('../models/Order');
const Payment = require('../models/Payment');
const Gem = require('../models/Gem');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

<<<<<<< HEAD
exports.mine = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('gem')
      .populate('listing')
      .sort({ createdAt: -1 });
=======
const populateOrder = (q) =>
  q.populate('items.gem')
   .populate('items.listing')
   .populate('customer', 'name email')
   .populate('payment');

exports.mine = async (req, res, next) => {
  try {
    const orders = await populateOrder(Order.find({ customer: req.user._id }).sort({ createdAt: -1 }));
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    res.json(orders);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
<<<<<<< HEAD
    const order = await Order.findById(req.params.id)
      .populate('gem')
      .populate('listing')
      .populate('customer', 'name email');
=======
    const order = await populateOrder(Order.findById(req.params.id));
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (
      req.user.role !== 'admin' &&
      String(order.customer._id || order.customer) !== String(req.user._id)
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(order);
  } catch (err) { next(err); }
};

exports.listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
<<<<<<< HEAD
    const orders = await Order.find(filter)
      .populate('gem')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
=======
    const orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
    res.json(orders);
  } catch (err) { next(err); }
};

exports.advance = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isOwner = String(order.customer) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    if (!isAdmin && order.status !== 'Confirmed') {
      return res.status(400).json({ error: 'Order can only be cancelled before processing' });
    }

    order.status = 'Cancelled';
    await order.save();
    res.json(order);
  } catch (err) { next(err); }
};

/**
<<<<<<< HEAD
 * Admin-only: cancel an order AND refund the customer.
 * Steps:
 *  1. Find the original Payment + Stripe paymentIntent
 *  2. Issue a Stripe refund (test mode shows the refund record on dashboard, no real money moves)
 *  3. Mark payment.status='refunded', save refund reference
 *  4. Restore gem.stockQty + flip availability
 *  5. Reopen the originating listing (if any) so it can sell again
 *  6. Set order.status='Cancelled'
=======
 * Admin cancel + refund. Walks every item and reverses inventory + listing
 * + offer side-effects, then refunds the customer via Stripe (skipped for COD).
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
 */
exports.cancelWithRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'Cancelled') {
      return res.status(409).json({ error: 'Order already cancelled' });
    }
    if (order.status === 'Delivered') {
      return res.status(409).json({ error: 'Cannot cancel a delivered order — use returns flow' });
    }

    const payment = await Payment.findById(order.payment);
    if (!payment) return res.status(404).json({ error: 'Linked payment record missing' });

    let refundRef = '';
<<<<<<< HEAD
    if (payment.status === 'success' && payment.stripeRef && stripe) {
=======
    const isCardPayment = payment.stripeRef && !payment.stripeRef.startsWith('cod_');
    if (payment.status === 'success' && isCardPayment && stripe) {
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
      try {
        const refund = await stripe.refunds.create({ payment_intent: payment.stripeRef });
        refundRef = refund.id;
      } catch (stripeErr) {
        console.error('[order.cancelWithRefund] Stripe refund failed:', stripeErr.message);
        return res.status(402).json({ error: `Refund failed: ${stripeErr.message}` });
      }
    }

    payment.status = 'refunded';
    payment.refundRef = refundRef;
    payment.refundedAt = new Date();
    await payment.save();

<<<<<<< HEAD
    // Restore stock
    const gem = await Gem.findById(order.gem);
    if (gem) {
      gem.stockQty = (gem.stockQty || 0) + 1;
      gem.isAvailable = gem.stockQty > 0;
      await gem.save();
    }

    // Reopen listing (only if direct or offer source — bid auctions are permanent)
    if (order.listing && (order.source === 'direct' || order.source === 'offer')) {
      const listing = await Listing.findById(order.listing);
      if (listing && listing.status === 'sold') {
        listing.status = 'active';
        await listing.save();
      }
    }

    // Reset offer status from 'paid' so the audit trail is clear
    if (order.offer) {
      const offer = await Offer.findById(order.offer);
      if (offer && offer.status === 'paid') {
        offer.status = 'rejected';
        await offer.save();
=======
    // Walk every item and undo
    for (const it of order.items || []) {
      const gem = await Gem.findById(it.gem);
      if (gem) {
        gem.stockQty = (gem.stockQty || 0) + (it.qty || 1);
        gem.isAvailable = gem.stockQty > 0;
        await gem.save();
      }

      if (it.listing && (it.source === 'direct' || it.source === 'offer')) {
        const listing = await Listing.findById(it.listing);
        if (listing && listing.status === 'sold') {
          listing.status = 'active';
          await listing.save();
        }
      }

      if (it.offer) {
        const offer = await Offer.findById(it.offer);
        if (offer && offer.status === 'paid') {
          offer.status = 'rejected';
          await offer.save();
        }
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
      }
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ order, payment, refundRef });
  } catch (err) { next(err); }
};
