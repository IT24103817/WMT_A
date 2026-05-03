const Offer = require('../models/Offer');
const Listing = require('../models/Listing');

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

exports.mine = async (req, res, next) => {
  try {
    const offers = await Offer.find({ customer: req.user._id })
      .populate({ path: 'listing', populate: { path: 'gem' } })
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) { next(err); }
};

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
