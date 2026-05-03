const Listing = require('../models/Listing');
const Gem = require('../models/Gem');

exports.list = async (req, res, next) => {
  try {
    const { q, category, type, min, max } = req.query;
    const listingFilter = { status: 'active' };
    if (min || max) {
      listingFilter.price = {};
      if (min) listingFilter.price.$gte = Number(min);
      if (max) listingFilter.price.$lte = Number(max);
    }

    let listings = await Listing.find(listingFilter).populate('gem').sort({ createdAt: -1 });

    if (q) {
      const re = new RegExp(q, 'i');
      listings = listings.filter((l) => re.test(l.gem?.name || '') || re.test(l.description || ''));
    }
    if (category || type) {
      const target = (category || type || '').toLowerCase();
      listings = listings.filter((l) => (l.gem?.type || '').toLowerCase() === target);
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

    const photos = (req.files?.photos || []).map((f) => f.path);
    const videoUrl = req.files?.video?.[0]?.path || '';

    console.log('[marketplace.create]', {
      gemName: gem.name,
      photoCount: photos.length,
      videoAttached: !!videoUrl,
      receivedFiles: Object.keys(req.files || {}),
      bodyKeys: Object.keys(req.body || {}),
    });

    const listing = await Listing.create({
      gem: gem._id,
      price: Number(price),
      description,
      photos,
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
    if (req.files?.photos?.length) {
      listing.photos = [...listing.photos, ...req.files.photos.map((f) => f.path)];
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
