const Listing = require('../models/Listing');
const Gem = require('../models/Gem');
const Review = require('../models/Review');

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
};

exports.list = async (req, res, next) => {
  try {
    const { q, category, type, min, max, sort = 'newest' } = req.query;
    const listingFilter = { status: 'active' };
    if (min || max) {
      listingFilter.price = {};
      if (min) listingFilter.price.$gte = Number(min);
      if (max) listingFilter.price.$lte = Number(max);
    }

    const sortSpec = SORT_MAP[sort] || SORT_MAP.newest;
    let listings = await Listing.find(listingFilter).populate('gem').sort(sortSpec);

    if (q) {
      const re = new RegExp(q, 'i');
      listings = listings.filter((l) => re.test(l.gem?.name || '') || re.test(l.description || ''));
    }
    if (category || type) {
      const target = (category || type || '').toLowerCase();
      listings = listings.filter((l) => (l.gem?.type || '').toLowerCase() === target);
    }

    // For rating-based sort, do a single aggregate over all gem ids and re-rank.
    if (sort === 'rating') {
      const gemIds = listings.map((l) => l.gem?._id).filter(Boolean);
      const ratings = await Review.aggregate([
        { $match: { gem: { $in: gemIds } } },
        { $group: { _id: '$gem', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const ratingMap = new Map(ratings.map((r) => [String(r._id), r]));
      listings = listings
        .map((l) => ({ l, r: ratingMap.get(String(l.gem?._id)) }))
        .sort((a, b) => (b.r?.avg || 0) - (a.r?.avg || 0))
        .map(({ l }) => l);
    }

    res.json(listings);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('gem');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { gemId, price, description, openForOffers } = req.body;
    if (!gemId || price == null || !description) {
      return res.status(400).json({ error: 'gemId, price, description are required' });
    }
    const gem = await Gem.findById(gemId);
    if (!gem) return res.status(404).json({ error: 'Gem not found' });
    if (gem.stockQty <= 0) return res.status(409).json({ error: 'Gem is out of stock' });

    const videoUrl = req.files?.video?.[0]?.path || '';

    console.log('[marketplace.create]', {
      gemName: gem.name,
      gemPhotos: gem.photos?.length || 0,
      videoAttached: !!videoUrl,
    });

    const listing = await Listing.create({
      gem: gem._id,
      price: Number(price),
      description,
      videoUrl,
      openForOffers: openForOffers === 'true' || openForOffers === true,
    });

    const populated = await listing.populate('gem');
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const fields = ['price', 'description', 'openForOffers', 'status'];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        listing[f] =
          f === 'openForOffers' ? req.body[f] === 'true' || req.body[f] === true : req.body[f];
      }
    }
    if (req.files?.video?.[0]) listing.videoUrl = req.files.video[0].path;

    await listing.save();
    const populated = await listing.populate('gem');
    res.json(populated);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    listing.status = 'removed';
    await listing.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
};
