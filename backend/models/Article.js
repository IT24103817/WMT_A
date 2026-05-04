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
