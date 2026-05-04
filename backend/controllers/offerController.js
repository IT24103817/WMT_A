/**
 * OFFER CONTROLLER (Module M3)
 * ============================
 * Module owner: M3 (Marketplace + Offers)
 *
 * What this file does:
 *   Negotiation. A customer makes an Offer on a listing that is
 *   `openForOffers`. The admin accepts or rejects. If accepted, the
 *   customer can pay through /api/checkout with source='offer'.
 *
 * Offer lifecycle:
 *   pending → accepted → paid       (the happy path)
 *   pending → rejected               (admin says no)
 *   pending → rejected (auto)        (a sibling offer on the same listing
 *                                     was accepted OR the listing was
 *                                     bought directly via cart)
 */

const Offer = require('../models/Offer');
const Listing = require('../models/Listing');

/**
 * CREATE → POST /api/offers   (customer)
 * Validations:
 *   - listingId + amount required
 *   - listing.status must be 'active'
 *   - listing.openForOffers must be true
 *   - amount becomes a Number (mongoose schema requires min ≥ 0)
 */
exports.create = async (req, res, next) => {
  try {
    const { listingId, amount } = req.body;
    if (!listingId || amount == null) {
      return res.status(400).json({ error: 'listingId and amount are required' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.status !== 'active') {
      return res.status(409).json({ error: 'Listing is not accepting offers' });
    }
    if (!listing.openForOffers) {
      return res.status(409).json({ error: 'This listing is not open for negotiation' });
    }

    const offer = await Offer.create({
      listing: listing._id,
      gem: listing.gem,
      customer: req.user._id,
      amount: Number(amount),
    });
    res.status(201).json(offer);
  } catch (err) { next(err); }
};

/**
 * READ-mine → GET /api/offers/mine   (customer)
 * Returns offers the logged-in customer made, with the listing+gem populated
 * so the mobile app can show photo/name without a second round trip.
 */
exports.mine = async (req, res, next) => {
  try {
    const offers = await Offer.find({ customer: req.user._id })
      .populate({ path: 'listing', populate: { path: 'gem' } })
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) { next(err); }
};

/**
 * READ-all → GET /api/offers   (admin)
 * Optional ?status=pending|accepted|rejected|paid filter.
 */
exports.listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const offers = await Offer.find(filter)
      .populate({ path: 'listing', populate: { path: 'gem' } })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) { next(err); }
};

/**
 * UPDATE → PATCH /api/offers/:id   (admin)
 * Body: { action: 'accept' | 'reject' }
 * Accept-side effect: every other pending offer on the same listing is
 * auto-rejected so the customer who got the green light has a clear path
 * to pay without competing offers in flight.
 */
exports.decide = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or reject' });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.status !== 'pending') {
      return res.status(409).json({ error: 'Offer already decided' });
    }

    offer.status = action === 'accept' ? 'accepted' : 'rejected';
    await offer.save();

    if (action === 'accept') {
      // Reject all other pending offers on the same listing
      await Offer.updateMany(
        { listing: offer.listing, _id: { $ne: offer._id }, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
    }

    res.json(offer);
  } catch (err) { next(err); }
};
