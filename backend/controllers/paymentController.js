<<<<<<< HEAD
const Stripe = require('stripe');
const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const Bid = require('../models/Bid');
const finalizeSale = require('../utils/finalizeSale');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * POST /api/payments
 * Body: { source: 'direct'|'offer'|'bid', sourceId, paymentMethodId }
 *
 * Server-derived amount (never trust client price):
 *  - direct → listing.price
 *  - offer  → offer.amount (and offer must be 'accepted')
 *  - bid    → bid.currentHighest.amount (and bid must be 'closed' with this user as winner)
 */
exports.charge = async (req, res, next) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe is not configured' });

    const { source, sourceId, paymentMethodId } = req.body;
    if (!['direct', 'offer', 'bid'].includes(source) || !sourceId || !paymentMethodId) {
      return res.status(400).json({ error: 'source, sourceId, paymentMethodId are required' });
    }

    let amount;
    let gemId;

    if (source === 'direct') {
      const listing = await Listing.findById(sourceId);
      if (!listing) return res.status(404).json({ error: 'Listing not found' });
      if (listing.status !== 'active') return res.status(409).json({ error: 'Listing not available' });
      amount = listing.price;
      gemId = listing.gem;
    } else if (source === 'offer') {
      const offer = await Offer.findById(sourceId);
      if (!offer) return res.status(404).json({ error: 'Offer not found' });
      if (String(offer.customer) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Not your offer' });
      }
      if (offer.status !== 'accepted') return res.status(409).json({ error: 'Offer not accepted' });
      amount = offer.amount;
      gemId = offer.gem;
    } else {
      const bid = await Bid.findById(sourceId);
      if (!bid) return res.status(404).json({ error: 'Bid not found' });
      if (bid.status !== 'closed') return res.status(409).json({ error: 'Bid is not closed' });
      if (!bid.winner || String(bid.winner) !== String(req.user._id)) {
        return res.status(403).json({ error: 'Only the winner can pay' });
      }
      amount = bid.currentHighest?.amount || 0;
      gemId = bid.gem;
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });
    } catch (stripeErr) {
      return res.status(402).json({ error: stripeErr.message || 'Payment failed' });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({
        error: 'Payment did not succeed',
        status: paymentIntent.status,
      });
    }

    const payment = await Payment.create({
      customer: req.user._id,
      gem: gemId,
      amount,
      stripeRef: paymentIntent.id,
      status: 'success',
      source,
      sourceId,
    });

    let order;
    try {
      order = await finalizeSale({ source, sourceId, customerId: req.user._id, payment });
    } catch (err) {
      // Compensating action: mark the payment as failed-after-success so an admin can refund.
      payment.status = 'failed';
      await payment.save();
      throw err;
    }

    res.status(201).json({ payment, order });
  } catch (err) { next(err); }
};
=======
const Payment = require('../models/Payment');

/**
 * Note: the customer-facing charge endpoint moved to POST /api/checkout.
 * This file keeps only the admin-facing read endpoints.
 */
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461

exports.list = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'name email')
      .populate('gem')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('gem');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};
