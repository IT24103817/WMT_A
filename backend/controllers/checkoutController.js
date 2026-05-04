/**
 * CHECKOUT CONTROLLER (Module M6)
 * ===============================
 * Module owner: M6 (Payment + Cloudinary + Deployment)
 *
 * What this file does:
 *   The one and only purchase endpoint. Customers reach it from three
 *   different starting points:
 *     1. Cart of direct listings  (source: 'cart')
 *     2. An accepted offer         (source: 'offer')
 *     3. A won bid                 (source: 'bid')
 *
 *   Each source has different validation, but they all flow through the
 *   same finalizeSale() utility so side-effects are consistent.
 *
 * Why is `totalAmount` ALWAYS server-derived?
 *   Trust boundary. The mobile client could tamper with prices. The server
 *   reads listing/offer/bid amounts from the database, computes the total
 *   itself, and uses THAT for the Stripe charge. The client never tells us
 *   how much to charge.
 *
 * Card vs COD:
 *   - card: requires paymentMethodId from the Stripe SDK; we create a
 *     PaymentIntent and confirm immediately. On success the Payment doc
 *     is marked 'success'.
 *   - cod: no Stripe call. Payment is marked 'pending'. Admin will mark it
 *     'success' later when the courier returns the cash (manual flow).
 */

const Stripe = require('stripe');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const Bid = require('../models/Bid');
const Payment = require('../models/Payment');
const User = require('../models/User');
const finalizeSale = require('../utils/finalizeSale');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Shipping address validation. Returns null if OK, or an error message.
// Required: fullName, phone, line1, city, postalCode, country.
// Optional: line2, notes.
function validateAddress(addr) {
  if (!addr || typeof addr !== 'object') return 'Shipping address is required';
  const required = ['fullName', 'phone', 'line1', 'city', 'postalCode', 'country'];
  for (const f of required) {
    if (!addr[f] || !String(addr[f]).trim()) return `Address: ${f} is required`;
  }
  return null;
}

/**
 * Resolve the cart into authoritative line items + total. The client may pass
 * any of the three shapes:
 *
 *   { source: 'cart',  cartItems: [{ listingId, qty? }] }
 *   { source: 'offer', sourceId: '<offer id>' }
 *   { source: 'bid',   sourceId: '<bid id>' }
 *
 * The amount is ALWAYS server-derived.
 */
async function resolveItems(body, customerId) {
  if (body.source === 'offer') {
    const offer = await Offer.findById(body.sourceId).populate('listing');
    if (!offer) throw Object.assign(new Error('Offer not found'), { status: 404 });
    if (String(offer.customer) !== String(customerId)) {
      throw Object.assign(new Error('Not your offer'), { status: 403 });
    }
    if (offer.status !== 'accepted') {
      throw Object.assign(new Error('Offer is not accepted'), { status: 409 });
    }
    return [{
      source: 'offer',
      sourceId: offer._id,
      gemId: offer.gem,
      listingId: offer.listing?._id,
      qty: 1,
      unitPrice: offer.amount,
    }];
  }

  if (body.source === 'bid') {
    const bid = await Bid.findById(body.sourceId);
    if (!bid) throw Object.assign(new Error('Bid not found'), { status: 404 });
    if (bid.status !== 'closed') {
      throw Object.assign(new Error('Bid is not closed'), { status: 409 });
    }
    if (!bid.winner || String(bid.winner) !== String(customerId)) {
      throw Object.assign(new Error('Only the winner can pay'), { status: 403 });
    }
    return [{
      source: 'bid',
      sourceId: bid._id,
      gemId: bid.gem,
      qty: 1,
      unitPrice: bid.currentHighest?.amount || 0,
    }];
  }

  // Default: cart of direct listings
  const cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
  if (cartItems.length === 0) {
    throw Object.assign(new Error('Cart is empty'), { status: 400 });
  }

  const out = [];
  for (const ci of cartItems) {
    const listing = await Listing.findById(ci.listingId).populate('gem');
    if (!listing) throw Object.assign(new Error('Listing not found'), { status: 404 });
    if (listing.status !== 'active') {
      throw Object.assign(new Error(`Listing "${listing.gem?.name || listing._id}" is no longer available`), { status: 409 });
    }
    const requested = Math.max(1, Number(ci.qty) || 1);
    const available = Math.max(0, Number(listing.gem?.stockQty) || 0);
    if (requested > available) {
      throw Object.assign(
        new Error(`Only ${available} of "${listing.gem?.name || 'gem'}" left in stock`),
        { status: 409 }
      );
    }
    out.push({
      source: 'direct',
      sourceId: listing._id,
      gemId: listing.gem._id,
      listingId: listing._id,
      qty: requested,
      unitPrice: listing.price,
    });
  }
  return out;
}

/**
 * CREATE → POST /api/checkout   (customer)
 *
 * Request body:
 *   { source: 'cart'|'offer'|'bid',
 *     cartItems?: [{ listingId, qty }],         // when source='cart'
 *     sourceId?: <offer or bid id>,             // when source='offer'/'bid'
 *     paymentMethod: 'card' | 'cod',
 *     paymentMethodId?: <Stripe PM id>,         // required when paymentMethod='card'
 *     shippingAddress: { fullName, phone, line1, line2?, city, postalCode, country, notes? }
 *   }
 *
 * Validations (in order):
 *   1. paymentMethod must be 'card' or 'cod'
 *   2. shippingAddress must have all required fields
 *   3. resolveItems() validates source-specific rules:
 *      - cart: each listing 'active', qty ≤ gem.stockQty
 *      - offer: must belong to user, status='accepted'
 *      - bid: status='closed', user === winner
 *   4. card path: Stripe must be configured + paymentMethodId provided
 *
 * Side effects (all inside finalizeSale, not here):
 *   - decrement gem.stockQty by qty
 *   - close listing if stockQty hits 0 (or always for offer/bid)
 *   - reject sibling pending offers
 *   - create Order doc with items[]
 *   - update user.lastAddress (for next checkout prefill)
 */
exports.checkout = async (req, res, next) => {
  try {
    const { paymentMethod, paymentMethodId, shippingAddress } = req.body;

    if (!['card', 'cod'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod must be card or cod' });
    }
    const addrErr = validateAddress(shippingAddress);
    if (addrErr) return res.status(400).json({ error: addrErr });

    const items = await resolveItems(req.body, req.user._id);
    const subtotal = items.reduce((s, it) => s + (it.unitPrice * (it.qty || 1)), 0);
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;

    let stripeRef = '';
    let paymentStatus = 'pending';

    if (paymentMethod === 'card') {
      if (!stripe) return res.status(500).json({ error: 'Stripe is not configured' });
      if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId is required for card payments' });
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        });
        if (paymentIntent.status !== 'succeeded') {
          return res.status(402).json({ error: 'Payment did not succeed', status: paymentIntent.status });
        }
        stripeRef = paymentIntent.id;
        paymentStatus = 'success';
      } catch (stripeErr) {
        return res.status(402).json({ error: stripeErr.message || 'Payment failed' });
      }
    }

    // Save the payment (one per order).
    const firstItem = items[0];
    const payment = await Payment.create({
      customer: req.user._id,
      gem: firstItem.gemId,                          // primary gem (legacy field)
      amount: totalAmount,
      stripeRef: stripeRef || `cod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: paymentStatus,
      paymentMethod,
      source: firstItem.source,
      sourceId: firstItem.sourceId,
    });

    let order;
    try {
      order = await finalizeSale({
        items,
        customerId: req.user._id,
        payment,
        paymentMethod,
        shippingAddress,
        subtotal,
        shippingFee,
        totalAmount,
      });
    } catch (err) {
      payment.status = 'failed';
      await payment.save();
      throw err;
    }

    // Update user.lastAddress for next checkout prefill
    await User.findByIdAndUpdate(req.user._id, { $set: { lastAddress: shippingAddress } });

    res.status(201).json({ order, payment });
  } catch (err) { next(err); }
};
