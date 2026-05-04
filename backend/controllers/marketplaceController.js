/**
 * MARKETPLACE CONTROLLER (Module M3)
 * ==================================
 * Module owner: M3 (Marketplace + Offers)
 *
 * What this file does:
 *   Listings — pieces for sale at a fixed price (or open for offers).
 *   A listing references a Gem document; photos live on the Gem so we
 *   never duplicate them.
 *
 * Listing lifecycle:
 *   active → sold (paid through cart or accepted offer or won bid)
 *   active → removed (admin pulled it)
 *
 * Sort modes:
 *   newest, oldest, priceAsc, priceDesc, rating
 *   The first 4 are simple Mongo sort; 'rating' uses an aggregation over
 *   reviews and re-ranks in JS.
 */

const Listing = require('../models/Listing');
const Gem = require('../models/Gem');
const Review = require('../models/Review');

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
};

/**
 * READ-all → GET /api/marketplace   (public)
 * Query params: q (search text), category/type, min/max (price range), sort.
 * Only returns 'active' listings.
 */
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

/**
 * READ-one → GET /api/marketplace/:id   (public)
 */
exports.get = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('gem');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
};

/**
 * CREATE → POST /api/marketplace   (admin, multipart with optional video)
 * Validations:
 *   - gemId, price, description required
 *   - referenced gem must exist with stockQty > 0
 *   - photos are read from the gem (no duplicate storage)
 */
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

/**
 * UPDATE → PUT /api/marketplace/:id   (admin)
 * Edits price/description/openForOffers/status. Optional new video upload.
 */
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

/**
 * DELETE (soft) → DELETE /api/marketplace/:id   (admin)
 * Soft delete: status='removed'. Existing orders that reference this listing
 * still display correctly (snapshot fields on Order.items).
 */
exports.remove = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    listing.status = 'removed';
    await listing.save();
    res.json({ ok: true });
  } catch (err) { next(err); }
};
