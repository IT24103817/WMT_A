/**
 * ARTICLE MODEL (Module M2 — Learning Hub)
 * ========================================
 *
 * Educational content. Public read; admin write.
 *
 * Validations:
 *   - title: required, trimmed
 *   - category: required, must be one of ARTICLE_CATEGORIES (4 values)
 *   - body: required (markdown-friendly long text)
 *   - coverImageUrl: optional Cloudinary URL set by upload middleware
 */

const mongoose = require('mongoose');

const ARTICLE_CATEGORIES = ['Gem Types', 'Buying Guide', 'Grading & Quality', 'Care & Maintenance'];

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ARTICLE_CATEGORIES, required: true },
    body: { type: String, required: true },
    coverImageUrl: { type: String, default: '' },
    coverImagePublicId: { type: String, default: '' },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
module.exports.ARTICLE_CATEGORIES = ARTICLE_CATEGORIES;
