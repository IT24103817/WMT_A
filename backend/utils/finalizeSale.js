const Gem = require('../models/Gem');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const generateOrderNumber = require('./generateOrderNumber');

/**
 * Atomically finalises a sale once a payment is recorded (Card or COD).
 *
 * Inputs:
 *   - items[]:       [{ source, sourceId, gemId, listingId?, qty, unitPrice }]
 *   - customerId
 *   - payment        the saved Payment doc
 *   - paymentMethod  'card' | 'cod'
 *   - shippingAddress { fullName, phone, line1, line2, city, postalCode, country, notes }
 *   - subtotal, shippingFee, totalAmount
 *
 * For each item:
 *   - source='direct'  → mark listing 'sold', auto-reject pending sibling offers
 *   - source='offer'   → flip offer 'paid', mark listing 'sold' (if active), reject siblings
 *   - source='bid'     → assert closed + winner === customer
 *   - decrement gem.stockQty
 *
 * Then create one Order containing all items.
 */
async function finalizeSale({ items, customerId, payment, paymentMethod, shippingAddress, subtotal, shippingFee = 0, totalAmount }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const orderItems = [];

  for (const it of items) {
    const { source, sourceId, gemId } = it;
    let listingId = it.listingId || null;
    let offerId = null;
    let bidId = null;

    if (source === 'direct') {
      const listing = await Listing.findById(sourceId);
      if (!listing) throw new Error('Listing not found');
      if (listing.status !== 'active') {
        const err = new Error(`Listing "${listing._id}" is no longer available`);
        err.status = 409;
        throw err;
      }
      listingId = listing._id;
      // Listing only flips to 'sold' once the underlying gem stock is depleted
      // (handled below after stock decrement). Pending sibling offers are
      // rejected immediately because the listing has at least one buyer.
      await Offer.updateMany(
        { listing: listing._id, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
    } else if (source === 'offer') {
      offerId = sourceId;
      const offer = await Offer.findById(offerId);
      if (!offer) throw new Error('Offer not found');
      if (offer.status !== 'accepted') {
        const err = new Error('Offer is not accepted');
        err.status = 409;
        throw err;
      }
      if (String(offer.customer) !== String(customerId)) {
        const err = new Error('Offer does not belong to this customer');
        err.status = 403;
        throw err;
      }
      listingId = offer.listing;
      offer.status = 'paid';
      await offer.save();
      // Listing closes via the unified block below (once stock decrement is done).
      await Offer.updateMany(
        { listing: listingId, _id: { $ne: offerId }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
    } else if (source === 'bid') {
      bidId = sourceId;
      const bid = await Bid.findById(bidId);
      if (!bid) throw new Error('Bid not found');
      if (bid.status !== 'closed') {
        const err = new Error('Bid auction has not ended');
        err.status = 409;
        throw err;
      }
      if (!bid.winner || String(bid.winner) !== String(customerId)) {
        const err = new Error('Only the winning bidder can complete this sale');
        err.status = 403;
        throw err;
      }
    } else {
      throw new Error(`Unknown sale source: ${source}`);
    }

    const qty = Math.max(1, Number(it.qty) || 1);
    const gem = await Gem.findById(gemId);
    if (!gem) throw new Error('Gem not found');
    if (gem.stockQty < qty) {
      const err = new Error(`Only ${gem.stockQty} of "${gem.name}" left in stock`);
      err.status = 409;
      throw err;
    }
    gem.stockQty = Math.max(0, gem.stockQty - qty);
    gem.isAvailable = gem.stockQty > 0;
    await gem.save();

    // For direct listings: close the listing once stock is depleted, and for
    // offer/bid sales (which are 1-of-a-kind transactions), always close.
    if (listingId && (source !== 'direct' || gem.stockQty === 0)) {
      const listingDoc = await Listing.findById(listingId);
      if (listingDoc && listingDoc.status === 'active') {
        listingDoc.status = 'sold';
        await listingDoc.save();
      }
    }

    orderItems.push({
      gem: gem._id,
      listing: listingId,
      offer: offerId,
      bid: bidId,
      source,
      qty,
      unitPrice: Number(it.unitPrice),
      gemNameSnapshot: gem.name,
      photoSnapshot: gem.photos?.[0] || '',
    });
  }

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customerId,
    items: orderItems,
    subtotal,
    shippingFee,
    totalAmount,
    paymentMethod,
    payment: payment._id,
    shippingAddress,
    status: 'Confirmed',
  });

  return order;
}

module.exports = finalizeSale;
