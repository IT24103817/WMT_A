const mongoose = require('mongoose');

const gemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    colour: { type: String, required: true, trim: true },
    carats: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 1 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

gemSchema.pre('save', function (next) {
  this.isAvailable = this.stockQty > 0;
  next();
});

gemSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const stockQty = update.stockQty ?? update.$set?.stockQty;
  if (typeof stockQty === 'number') {
    this.set('isAvailable', stockQty > 0);
  }
  next();
});

module.exports = mongoose.model('Gem', gemSchema);
