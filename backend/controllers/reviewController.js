/**
 * REVIEW CONTROLLER (Module M4)
 * =============================
 * Module owner: M4 (Orders + Reviews)
 *
 * What this file does:
 *   Customer reviews of gems they've received. Includes rating, optional
 *   comment, "what went well" tags, photos, and admin replies.
 *
 * Who can do what:
 *   - Customer: post 1 review per delivered order, edit within 30 days,
 *     delete their own review.
 *   - Admin: list all, see seller stats, reply to a review, delete any.
 *   - Public: read reviews on a gem with sort + filter.
 *
 * Validations live in two places:
 *   - Schema (models/Review.js): rating range, photo cap, tag cap, unique
 *     (order, customer)
 *   - This controller: comment length, no URLs, no all-caps, profanity,
 *     30-day edit window, reply length
 *
 * Why server-side hygiene checks?
 *   Defense in depth. The mobile form already blocks bad input, but a
 *   determined attacker could call the API directly.
 */

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

/** Helper → GET /api/reviews/tags/list */
exports.tagsList = (req, res) => res.json(REVIEW_TAGS);

/**
 * READ-by-gem → GET /api/reviews/:gemId   (public)
 * Optional query: ?sort=newest|oldest|highest|lowest, ?tag=<one>, ?withPhotos=true
 */
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

/**
 * READ-stats → GET /api/reviews/:gemId/aggregate   (public)
 * Returns avg + count + tagCounts + withPhotos count for the gem.
 * Used by the gem detail screen to show a compact summary card.
 */
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

/**
 * READ-all → GET /api/reviews/all   (admin)
 * Used by AdminReviewsScreen for moderation.
 */
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

/**
 * READ-stats-global → GET /api/reviews/seller/stats   (admin)
 * Avg rating + 1-5★ distribution + top tag mentions + 5 most recent reviews.
 */
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

/**
 * CREATE → POST /api/reviews   (customer, multipart for photos)
 *
 * Validations applied:
 *   1. orderId + rating required; rating must be integer 1–5
 *   2. comment (if non-empty) must be 10–500 chars
 *   3. comment cannot contain URLs (anti-spam)
 *   4. comment cannot be all-caps (≥8 letters all upper)
 *   5. comment cannot contain words from the profanity blocklist
 *   6. order must belong to req.user AND status === 'Delivered'
 *   7. only one review per (order, customer) — compound unique index
 *   8. photos array max 3 (multer enforces; we double-check)
 *   9. tags max 3, all from REVIEW_TAGS list
 */

// ---- Comment hygiene checks (server-side, defense-in-depth) ---------------
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/i;
const PROFANITY = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'cunt'];

function validateComment(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  if (trimmed.length > 500) return 'Comment is too long (max 500 characters)';
  if (trimmed.length > 0 && trimmed.length < 10) return 'Comment must be at least 10 characters';
  if (URL_RE.test(trimmed)) return 'Comment cannot contain links';
  const letters = trimmed.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 8 && letters === letters.toUpperCase()) {
    return 'Please don\'t shout (avoid all-caps)';
  }
  const lower = trimmed.toLowerCase();
  if (PROFANITY.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower))) {
    return 'Comment contains inappropriate language';
  }
  return null;
}

exports.create = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || rating == null) {
      return res.status(400).json({ error: 'orderId and rating are required' });
    }
    const r = Number(rating);
    if (!Number.isInteger(r) || !(r >= 1 && r <= 5)) {
      return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
    }

    const commentErr = validateComment(comment);
    if (commentErr) return res.status(400).json({ error: commentErr });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.customer) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your order' });
    }
    if (order.status !== 'Delivered') {
      return res.status(409).json({ error: 'You can only review delivered orders' });
    }

    // Resolve which gem this review is for.
    // New orders have items[]; legacy orders may have a top-level `gem`.
    let gemId = req.body.gemId || order.gem;
    if (!gemId && Array.isArray(order.items) && order.items.length) {
      gemId = order.items[0].gem;
    }
    if (!gemId) return res.status(400).json({ error: 'Could not resolve gem for this order' });

    const existing = await Review.findOne({ order: order._id, customer: req.user._id });
    if (existing) return res.status(409).json({ error: 'You already reviewed this order' });

    const files = req.files || [];
    if (files.length > 3) return res.status(400).json({ error: 'Maximum 3 photos per review' });
    const photos = files.map((f) => f.path);

    const tags = parseTags(req.body.tags);
    if (tags.length > 3) return res.status(400).json({ error: 'Maximum 3 tags' });

    const review = await Review.create({
      gem: gemId,
      order: order._id,
      customer: req.user._id,
      rating: r,
      comment: (comment || '').trim(),
      photos,
      tags,
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
};

/**
 * DELETE → DELETE /api/reviews/:id   (owner OR admin)
 * Owner = the customer who wrote it. Admin can remove for moderation.
 */
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

const EDIT_WINDOW_DAYS = 30;

/**
 * UPDATE → PUT /api/reviews/:id   (owner only, multipart)
 * Validations:
 *   - only the original author can edit
 *   - within 30 days of creation (industry standard window)
 *   - rating: integer 1–5
 *   - comment: same rules as create
 *   - tags: max 3, all from REVIEW_TAGS
 *   - photos: new files REPLACE entirely; OR keepPhotos JSON keeps a subset
 */
exports.update = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (String(review.customer) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // 30-day edit window from original posting
    const ageDays = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > EDIT_WINDOW_DAYS) {
      return res.status(409).json({ error: `Reviews can only be edited within ${EDIT_WINDOW_DAYS} days` });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) {
      const r = Number(rating);
      if (!Number.isInteger(r) || !(r >= 1 && r <= 5)) {
        return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5' });
      }
      review.rating = r;
    }
    if (comment !== undefined) {
      const commentErr = validateComment(comment);
      if (commentErr) return res.status(400).json({ error: commentErr });
      review.comment = String(comment).trim();
    }

    if (req.body.tags !== undefined) {
      const tags = parseTags(req.body.tags);
      if (tags.length > 3) return res.status(400).json({ error: 'Maximum 3 tags' });
      review.tags = tags;
    }

    // Photo handling: new files REPLACE entirely. Otherwise honour `keepPhotos`
    // (a JSON array of URLs the client wants to keep). Otherwise photos stay as-is.
    if (req.files && req.files.length) {
      if (req.files.length > 3) return res.status(400).json({ error: 'Maximum 3 photos per review' });
      review.photos = req.files.map((f) => f.path);
    } else if (req.body.keepPhotos !== undefined) {
      try {
        const keep = JSON.parse(req.body.keepPhotos);
        if (Array.isArray(keep)) review.photos = keep.filter((u) => typeof u === 'string').slice(0, 3);
      } catch { /* ignore */ }
    }

    await review.save();
    res.json(review);
  } catch (err) { next(err); }
};

/**
 * READ-mine → GET /api/reviews/mine   (customer)
 * Lets a customer see all reviews they've posted (the "My Reviews" tab).
 */
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

/**
 * UPDATE (admin reply) → POST /api/reviews/:id/reply   (admin)
 * Adds an embedded `adminReply: { text, by, repliedAt }` subdocument.
 * Validation: text 5–300 chars after trim.
 */
exports.reply = async (req, res, next) => {
  try {
    const raw = req.body?.text;
    const text = (raw == null ? '' : String(raw)).trim();
    if (!text) return res.status(400).json({ error: 'Reply text is required' });
    if (text.length < 5) return res.status(400).json({ error: 'Reply must be at least 5 characters' });
    if (text.length > 300) return res.status(400).json({ error: 'Reply must be at most 300 characters' });

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    review.adminReply = {
      text,
      by: req.user._id,
      repliedAt: new Date(),
    };
    await review.save();
    await review.populate('adminReply.by', 'name role');
    res.json(review);
  } catch (err) { next(err); }
};

/**
 * DELETE (admin reply) → DELETE /api/reviews/:id/reply   (admin)
 * Clears the embedded reply.
 */
exports.removeReply = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    review.adminReply = null;
    await review.save();
    res.json(review);
  } catch (err) { next(err); }
};
