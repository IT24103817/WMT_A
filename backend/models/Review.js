const mongoose = require('mongoose');

const REVIEW_TAGS = [
  'Authentic Gem',
  'Fast Shipping',
  'Secure Packaging',
  'Excellent Communication',
  'Beautiful Cut',
  'As Described',
  'Great Value',
  'Quick Response',
];

const adminReplySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repliedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    gem: { type: mongoose.Schema.Types.ObjectId, ref: 'Gem', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Comment is too long (max 500 chars)'],
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: 'Maximum 3 photos per review',
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (arr) => arr.every((t) => REVIEW_TAGS.includes(t)),
          message: 'Invalid tag',
        },
        {
          validator: (arr) => arr.length <= 3,
          message: 'Maximum 3 tags',
        },
      ],
    },
    adminReply: { type: adminReplySchema, default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ order: 1, customer: 1 }, { unique: true });
reviewSchema.index({ gem: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
module.exports.REVIEW_TAGS = REVIEW_TAGS;
