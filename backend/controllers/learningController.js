const Article = require('../models/Article');
const { ARTICLE_CATEGORIES } = require('../models/Article');

// Get list of articles
exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const articles = await Article.find(filter).sort({ publishedAt: -1 });
    res.json(articles);
  } catch (err) { next(err); }
};

// Get article by ID
exports.get = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) { next(err); }
};

// Create new article (admin only)
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

// Update article (admin only)
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

// Delete article (admin only)
exports.remove = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
};

// Get list of article categories
exports.categories = (req, res) => res.json(ARTICLE_CATEGORIES);
