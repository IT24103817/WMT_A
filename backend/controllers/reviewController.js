const mongoose = require('mongoose');
const Review = require('../models/Review');
const { REVIEW_TAGS } = require('../models/Review');
const Order = require('../models/Order');
const Gem = require('../models/Gem');

/**
 * Coerce req.body.tags into an array of valid tag strings.
 * FormData typically sends an array as repeated `tags=X` fields, but multer's
 * default behaviour gives us a string when only one is set, or an array when
 * many. We also accept a JSON-encoded array for clients that prefer that.
 */
function parseTags(raw) {
  if (raw == null) return [];
  let arr = raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : raw.split(',').map((s) => s.trim());
    } catch {
      arr = raw.split(',').map((s) => s.trim());
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter((t) => typeof t === 'string' && REVIEW_TAGS.includes(t));
}

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

exports.tagsList = (req, res) => res.json(REVIEW_TAGS);

exports.byGem = async (req, res, next) => {
  try {
    const filter = { gem: req.params.gemId };
    if (req.query.tag && REVIEW_TAGS.includes(req.query.tag)) {
      filter.tags = req.query.tag;
    }
    if (req.query.withPhotos === 'true' || req.query.withPhotos === '1') {
      filter['photos.0'] = { $exists: true };
    }

    const sort = SORT_MAP[req.query.sort] || SORT_MAP.newest;

    const reviews = await Review.find(filter)
      .populate('customer', 'name')
      .populate('adminReply.by', 'name role')
      .sort(sort);
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.aggregateForGem = async (req, res, next) => {
  try {
    const gemId = new mongoose.Types.ObjectId(req.params.gemId);
    const [stats] = await Review.aggregate([
      { $match: { gem: gemId } },
      { $group: { _id: '$gem', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const tagCounts = await Review.aggregate([
      { $match: { gem: gemId, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const withPhotos = await Review.countDocuments({ gem: gemId, 'photos.0': { $exists: true } });

    res.json({
      avg: stats ? Number(stats.avg.toFixed(2)) : 0,
      count: stats?.count || 0,
      tagCounts: tagCounts.map((t) => ({ tag: t._id, count: t.count })),
      withPhotos,
    });
  } catch (err) { next(err); }
};

exports.listAll = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name email')
      .populate('gem', 'name type colour carats')
      .populate('order', 'orderNumber')
      .populate('adminReply.by', 'name role')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.sellerStats = async (req, res, next) => {
  try {
    const [agg] = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const totalGems = await Gem.countDocuments();

    const distribution = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => { dist[d._id] = d.count; });

    const tagCounts = await Review.aggregate([
      { $match: { tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recent = await Review.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .populate('gem', 'name');

    res.json({
      avg: agg ? Number(agg.avg.toFixed(2)) : 0,
      count: agg?.count || 0,
      totalGems,
      distribution: dist,
      tagCounts: tagCounts.map((t) => ({ tag: t._id, count: t.count })),
      recent,
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || rating == null) {
      return res.status(400).json({ error: 'orderId and rating are required' });
    }
    const r = Number(rating);
    if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'rating must be 1-5' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.customer) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (order.status !== 'Delivered') {
      return res.status(409).json({ error: 'You can only review delivered orders' });
    }

    const existing = await Review.findOne({ order: order._id, customer: req.user._id });
    if (existing) return res.status(409).json({ error: 'You already reviewed this order' });

    const photos = (req.files || []).map((f) => f.path);
    const tags = parseTags(req.body.tags);

    const review = await Review.create({
      gem: order.gem,
      order: order._id,
      customer: req.user._id,
      rating: r,
      comment: comment || '',
      photos,
      tags,
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const isOwner = String(review.customer) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });

    await Review.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (String(review.customer) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) {
      const r = Number(rating);
      if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'rating must be 1-5' });
      review.rating = r;
    }
    if (comment !== undefined) review.comment = String(comment);

    if (req.body.tags !== undefined) {
      review.tags = parseTags(req.body.tags);
    }

    // Photo handling: new files REPLACE entirely. Otherwise honour `keepPhotos`
    // (a JSON array of URLs the client wants to keep). Otherwise photos stay as-is.
    if (req.files && req.files.length) {
      review.photos = req.files.map((f) => f.path);
    } else if (req.body.keepPhotos !== undefined) {
      try {
        const keep = JSON.parse(req.body.keepPhotos);
        if (Array.isArray(keep)) review.photos = keep.filter((u) => typeof u === 'string');
      } catch { /* ignore */ }
    }

    await review.save();
    res.json(review);
  } catch (err) { next(err); }
};

exports.mine = async (req, res, next) => {
  try {
    const reviews = await Review.find({ customer: req.user._id })
      .populate('gem', 'name type colour carats')
      .populate('order', 'orderNumber')
      .populate('adminReply.by', 'name role')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { next(err); }
};

// ---- Admin reply ----------------------------------------------------------

exports.reply = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text is required' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    review.adminReply = {
      text: text.trim(),
      by: req.user._id,
      repliedAt: new Date(),
    };
    await review.save();
    await review.populate('adminReply.by', 'name role');
    res.json(review);
  } catch (err) { next(err); }
};

exports.removeReply = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    review.adminReply = null;
    await review.save();
    res.json(review);
  } catch (err) { next(err); }
};
