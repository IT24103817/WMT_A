const mongoose = require('mongoose');

const gemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    colour: { type: String, required: true, trim: true },
    carats: { type: Number, required: true, min: 0 },
    stockQty: { type: Number, required: true, min: 0, default: 1 },
    isAvailable: { type: Boolean, default: true },
<<<<<<< HEAD
=======
    photos: { type: [String], default: [] },
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
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
