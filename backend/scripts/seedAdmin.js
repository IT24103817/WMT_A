require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    const email = (process.env.ADMIN_EMAIL || 'admin@gemmarket.local').toLowerCase();
    const name = process.env.ADMIN_NAME || 'GemMarket Admin';
    const password = process.env.ADMIN_PASSWORD;
    if (!password) throw new Error('ADMIN_PASSWORD must be set in .env');

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await User.findOneAndUpdate(
      { email },
      { name, email, passwordHash, role: 'admin' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`Admin user ready: ${result.email} (role=${result.role})`);
    console.log('Use these credentials to log in from the mobile app.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
