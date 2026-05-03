const Gem = require('../models/Gem');
const Listing = require('../models/Listing');
const Offer = require('../models/Offer');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const generateOrderNumber = require('./generateOrderNumber');

/**
 * Atomically finalises a sale after a successful payment.
 *
 * Steps:
 *  1. Decrement the gem's stock; flip availability if it reaches 0.
 *  2. Close the originating listing / offer / bid.
 *  3. Reject all other pending offers on the same listing (offer + direct paths).
 *  4. Create the order record linked to the payment.
 *
 * Source determines which of listing/offer/bid is provided.
 */
async function finalizeSale({ source, sourceId, customerId, payment }) {
  let gemId;
  let listingId = null;
  let offerId = null;
  let bidId = null;

  if (source === 'direct') {
    listingId = sourceId;
    const listing = await Listing.findById(listingId);
    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'active') {
      const err = new Error('Listing is no longer available');
      err.status = 409;
      throw err;
    }
    gemId = listing.gem;
    listing.status = 'sold';
    await listing.save();
    await Offer.updateMany(
      { listing: listingId, status: 'pending' },
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
    gemId = offer.gem;
    listingId = offer.listing;
    offer.status = 'paid';
    await offer.save();
    const listing = await Listing.findById(listingId);
    if (listing && listing.status === 'active') {
      listing.status = 'sold';
      await listing.save();
    }
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
    gemId = bid.gem;
  } else {
    throw new Error(`Unknown sale source: ${source}`);
  }

  const gem = await Gem.findById(gemId);
  if (!gem) throw new Error('Gem not found');
  if (gem.stockQty <= 0) {
    const err = new Error('Gem is out of stock');
    err.status = 409;
    throw err;
  }
  gem.stockQty = Math.max(0, gem.stockQty - 1);
  gem.isAvailable = gem.stockQty > 0;
  await gem.save();

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customerId,
    gem: gemId,
    listing: listingId,
    offer: offerId,
    bid: bidId,
    source,
    amount: payment.amount,
    payment: payment._id,
    status: 'Confirmed',
  });

  return order;
}

module.exports = finalizeSale;
