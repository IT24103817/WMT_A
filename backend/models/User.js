const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    lastAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      postalCode: String,
      country: String,
      notes: String,
    },
  },
  { timestamps: true }
);

userSchema.method('toJSON', function () {
  const { _id, name, email, role, createdAt, lastAddress } = this;
  return { id: _id, name, email, role, createdAt, lastAddress: lastAddress || null };
});

module.exports = mongoose.model('User', userSchema);
