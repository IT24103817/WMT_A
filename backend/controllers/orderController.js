/**
 * ORDER CONTROLLER (Module M4)
 * ============================
 * Module owner: M4 (Orders + Reviews)
 *
 * What this file does:
 *   Orders are READ-mostly — they're created by the checkout controller
 *   (see controllers/checkoutController.js + utils/finalizeSale.js). This
 *   file handles:
 *     - customer reads (their orders)
 *     - admin reads (all orders) + status advancement
 *     - cancellation (customer pre-dispatch, OR admin with refund)
 *
 * Order status flow:
 *   Confirmed → Processing → Out for Delivery → Delivered
 *   any of the above → Cancelled (customer can only cancel from 'Confirmed')
 */

const Stripe = require('stripe');
const Order = require('../models/Order');
const { ORDER_STATUSES } = require('../models/Order');
const Payment = require('../models/Payment');
const Gem = require('../models/Gem');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');

// Stripe is optional — if no key, refunds will skip and only COD-style
// cancellations work. Production always has the key.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Hydrate the references so the mobile app can render order cards in one
// fetch (gem photo, listing title, payment method, etc).
const populateOrder = (q) =>
  q.populate('items.gem')
   .populate('items.listing')
   .populate('customer', 'name email')
   .populate('payment');

/**
 * READ-mine → GET /api/orders   (customer)
 */
exports.mine = async (req, res, next) => {
  try {
    const orders = await populateOrder(Order.find({ customer: req.user._id }).sort({ createdAt: -1 }));
    res.json(orders);
  } catch (err) { next(err); }
};

/**
 * READ-one → GET /api/orders/:id   (customer or admin)
 * Validation: customers can only read their own orders; admins can read any.
 */
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

/**
 * READ-all → GET /api/orders/all   (admin)
 * Optional ?status filter.
 */
exports.listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
    res.json(orders);
  } catch (err) { next(err); }
};

/**
 * UPDATE → PATCH /api/orders/:id   (admin)
 * Advance the order status. Validation: status must be one of the 5 enum
 * values defined on the Order model.
 */
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

/**
 * DELETE (soft) → DELETE /api/orders/:id   (customer or admin)
 * Validation: customers can only cancel from 'Confirmed' (before dispatch).
 * Admin can cancel anytime, but for refunds they should use cancelWithRefund.
 */
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
 * UPDATE (cancel + refund) → POST /api/orders/:id/cancel-refund   (admin)
 * Walks every item in the order and reverses ALL side effects:
 *   1. Restore gem.stockQty (and isAvailable)
 *   2. Reopen the listing if it was 'sold'
 *   3. Revert paid offers back to 'rejected' (frees the listing)
 *   4. For card payments: call Stripe refunds.create
 *   5. Mark Payment as 'refunded' with refundRef + refundedAt
 *   6. Set order status to 'Cancelled'
 *
 * COD orders skip the Stripe call but still mark refunded for audit.
 * If Stripe refund fails, we abort BEFORE touching inventory — keeps state
 * consistent.
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
