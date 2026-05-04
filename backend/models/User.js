const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
<<<<<<< HEAD
=======
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
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
  },
  { timestamps: true }
);

userSchema.method('toJSON', function () {
<<<<<<< HEAD
  const { _id, name, email, role, createdAt } = this;
  return { id: _id, name, email, role, createdAt };
=======
  const { _id, name, email, role, createdAt, lastAddress } = this;
  return { id: _id, name, email, role, createdAt, lastAddress: lastAddress || null };
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
});

module.exports = mongoose.model('User', userSchema);
