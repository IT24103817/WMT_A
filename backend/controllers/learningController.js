/**
 * LEARNING HUB CONTROLLER (Module M2)
 * ===================================
 * Module owner: M2
 *
 * What this file does:
 *   Educational articles with cover images. Public read; admin write.
 *
 * Categories (4):
 *   "Gem Types", "Buying Guide", "Grading & Quality", "Care & Maintenance"
 *   Defined as an enum on the Article model — see models/Article.js.
 *
 * Why an enum and not free text?
 *   The mobile app shows category filter chips. If admins typed
 *   "Buying  Guide" with two spaces it would silently break grouping.
 */

const Article = require('../models/Article');
const { ARTICLE_CATEGORIES } = require('../models/Article');

/**
 * READ-all → GET /api/learning?category=...
 * Optionally filtered by category. Newest first.
 */
exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const articles = await Article.find(filter).sort({ publishedAt: -1 });
    res.json(articles);
  } catch (err) { next(err); }
};

/**
 * READ-one → GET /api/learning/:id
 */
exports.get = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) { next(err); }
};

/**
 * CREATE → POST /api/learning  (multipart, admin)
 * Validations:
 *   - title, category, body required
 *   - category must be one of ARTICLE_CATEGORIES
 *   - cover image (optional) goes through multer → Cloudinary;
 *     we save the resulting URL on the doc.
 */
exports.create = async (req, res, next) => {
  try {
    const { title, category, body } = req.body;
    if (!title || !category || !body) {
      return res.status(400).json({ error: 'title, category, body are required' });
    }
    if (!ARTICLE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${ARTICLE_CATEGORIES.join(', ')}` });
    }
    const coverImageUrl = req.file?.path || '';
    const coverImagePublicId = req.file?.filename || '';
    console.log('[learning.create]', {
      title,
      category,
      coverReceived: !!req.file,
      coverMime: req.file?.mimetype,
      coverUrl: coverImageUrl ? coverImageUrl.slice(0, 60) + '…' : '(none)',
    });
    const article = await Article.create({ title, category, body, coverImageUrl, coverImagePublicId });
    res.status(201).json(article);
  } catch (err) { next(err); }
};

/**
 * UPDATE → PUT /api/learning/:id  (multipart, admin)
 * Edits any of title/category/body. New cover image (if uploaded) replaces
 * the old URL — the old Cloudinary asset stays (we don't garbage-collect).
 */
exports.update = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const fields = ['title', 'category', 'body'];
    for (const f of fields) if (req.body[f] !== undefined) article[f] = req.body[f];
    if (req.body.category && !ARTICLE_CATEGORIES.includes(req.body.category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (req.file) {
      article.coverImageUrl = req.file.path;
      article.coverImagePublicId = req.file.filename;
    }
    await article.save();
    res.json(article);
  } catch (err) { next(err); }
};

/**
 * DELETE → DELETE /api/learning/:id  (admin)
 * Hard delete from Mongo. The Cloudinary cover image stays — Cloudinary
 * cleanup is out of scope for this academic project.
 */
exports.remove = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

/**
 * Helper → GET /api/learning/categories
 * Lets the mobile UI render the chip filter from a single source of truth.
 */
exports.categories = (req, res) => res.json(ARTICLE_CATEGORIES);
