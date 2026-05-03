const Stripe = require('stripe');
const Order = require('../models/Order');
const { ORDER_STATUSES } = require('../models/Order');
const Payment = require('../models/Payment');
const Gem = require('../models/Gem');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const populateOrder = (q) =>
  q.populate('items.gem')
   .populate('items.listing')
   .populate('customer', 'name email')
   .populate('payment');

exports.mine = async (req, res, next) => {
  try {
    const orders = await populateOrder(Order.find({ customer: req.user._id }).sort({ createdAt: -1 }));
    res.json(orders);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const order = await populateOrder(Order.findById(req.params.id));
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
    const orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
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
 * Admin cancel + refund. Walks every item and reverses inventory + listing
 * + offer side-effects, then refunds the customer via Stripe (skipped for COD).
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
    const isCardPayment = payment.stripeRef && !payment.stripeRef.startsWith('cod_');
    if (payment.status === 'success' && isCardPayment && stripe) {
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
      }
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ order, payment, refundRef });
  } catch (err) { next(err); }
};
