/**
 * Idempotent demo seeder. Creates customers + gems (with photos) + listings +
 * delivered multi-item orders + reviews so the app has realistic data for
 * screenshots and viva walkthroughs.
 *
 *   npm run seed:demo
 *
 * Safe to re-run.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Gem = require('../models/Gem');
const Listing = require('../models/Listing');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Review = require('../models/Review');
const generateOrderNumber = require('../utils/generateOrderNumber');

// Royalty-free Unsplash photos for demo gems and reviews.
const GEM_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800',
];

const REVIEW_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
  'https://images.unsplash.com/photo-1517497466895-1d2ac10b30aa?w=800',
];

const DEMO_GEMS = [
  { name: 'Royal Blue Sapphire', type: 'Sapphire', colour: 'Royal Blue', carats: 2.4, price: 4250, photos: [GEM_PHOTO_POOL[0]] },
  { name: 'Burmese Pigeon Ruby', type: 'Ruby', colour: 'Pigeon Blood Red', carats: 1.8, price: 6800, photos: [GEM_PHOTO_POOL[1]] },
  { name: 'Colombian Emerald', type: 'Emerald', colour: 'Vivid Green', carats: 3.1, price: 5400, photos: [GEM_PHOTO_POOL[2]] },
  { name: 'Padparadscha Sapphire', type: 'Sapphire', colour: 'Salmon Pink', carats: 1.5, price: 7200, photos: [GEM_PHOTO_POOL[3]] },
];

const DEFAULT_ADDR = {
  fullName: 'Demo Customer',
  phone: '+94 71 234 5678',
  line1: '12 Galle Road',
  line2: 'Apt 4B',
  city: 'Colombo',
  postalCode: '00300',
  country: 'Sri Lanka',
  notes: 'Leave with the receptionist',
};

const DEMO_REVIEWS = [
  { rating: 5, comment: 'Absolutely stunning. The colour is even more vivid in person.', tags: ['Authentic Gem', 'Beautiful Cut', 'As Described'], photos: [REVIEW_PHOTO_POOL[0]] },
  { rating: 5, comment: 'Beautifully cut. Arrived well-packaged and the certificate matched.', tags: ['Secure Packaging', 'Fast Shipping', 'Authentic Gem'], photos: [REVIEW_PHOTO_POOL[1]] },
  { rating: 4, comment: 'Lovely piece. Slight inclusion under the loupe but invisible to the naked eye.', tags: ['As Described', 'Excellent Communication'], photos: [] },
  { rating: 5, comment: 'My second purchase from GemMarket. Quality is consistently excellent.', tags: ['Authentic Gem', 'Great Value', 'Quick Response'], photos: [] },
];

async function ensureUser({ name, email, password, role = 'customer', lastAddress }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (lastAddress && !existing.lastAddress) {
      existing.lastAddress = lastAddress;
      await existing.save();
    }
    return existing;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name, email: email.toLowerCase(), passwordHash, role, lastAddress });
}

async function ensureGem(spec) {
  const existing = await Gem.findOne({ name: spec.name });
  if (existing) {
    if (!existing.photos || existing.photos.length === 0) {
      existing.photos = spec.photos;
      await existing.save();
    }
    return existing;
  }
  return Gem.create({
    name: spec.name,
    type: spec.type,
    colour: spec.colour,
    carats: spec.carats,
    stockQty: 1,
    photos: spec.photos,
  });
}

async function ensureListing(gem, price) {
  const existing = await Listing.findOne({ gem: gem._id });
  if (existing) return existing;
  return Listing.create({
    gem: gem._id,
    price,
    description: `${gem.name} — a hand-selected ${gem.carats}ct ${gem.type.toLowerCase()} with ${gem.colour.toLowerCase()} colouration.`,
    photos: [],
    openForOffers: true,
    status: 'sold',
  });
}

async function ensureDeliveredOrderWithReview({ customer, gem, listing, reviewSpec, address }) {
  const existingReview = await Review.findOne({ gem: gem._id, customer: customer._id });
  if (existingReview) return { skipped: true };

  const payment = await Payment.create({
    customer: customer._id,
    gem: gem._id,
    amount: listing.price,
    stripeRef: `pi_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'success',
    source: 'direct',
    sourceId: listing._id,
  });

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: customer._id,
    items: [{
      gem: gem._id,
      listing: listing._id,
      source: 'direct',
      qty: 1,
      unitPrice: listing.price,
      gemNameSnapshot: gem.name,
      photoSnapshot: gem.photos?.[0] || '',
    }],
    subtotal: listing.price,
    shippingFee: 0,
    totalAmount: listing.price,
    paymentMethod: 'card',
    payment: payment._id,
    shippingAddress: address,
    status: 'Delivered',
  });

  const review = await Review.create({
    gem: gem._id,
    order: order._id,
    customer: customer._id,
    rating: reviewSpec.rating,
    comment: reviewSpec.comment,
    tags: reviewSpec.tags || [],
    photos: reviewSpec.photos || [],
  });

  return { payment, order, review };
}

(async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const customer = await ensureUser({
      name: 'Demo Customer',
      email: 'demo@gemmarket.local',
      password: 'demo1234',
      lastAddress: DEFAULT_ADDR,
    });
    console.log(`Customer: ${customer.email} (password: demo1234)`);

    const customer2 = await ensureUser({
      name: 'Aria Bennett',
      email: 'aria@gemmarket.local',
      password: 'aria1234',
      lastAddress: { ...DEFAULT_ADDR, fullName: 'Aria Bennett', line1: '88 Marine Drive', city: 'Galle', postalCode: '80000' },
    });
    console.log(`Customer: ${customer2.email} (password: aria1234)`);

    const gems = [];
    for (const spec of DEMO_GEMS) {
      const gem = await ensureGem(spec);
      gems.push({ gem, price: spec.price });
    }
    console.log(`Gems: ${gems.map((g) => g.gem.name).join(', ')}`);

    let createdReviews = 0;
    for (let i = 0; i < gems.length && i < DEMO_REVIEWS.length; i++) {
      const { gem, price } = gems[i];
      const listing = await ensureListing(gem, price);
      const cust = i % 2 === 0 ? customer : customer2;
      const result = await ensureDeliveredOrderWithReview({
        customer: cust,
        gem,
        listing,
        reviewSpec: DEMO_REVIEWS[i],
        address: cust.lastAddress || DEFAULT_ADDR,
      });
      if (!result.skipped) {
        createdReviews++;
        console.log(`  ✓ ${gem.name} → order ${result.order.orderNumber} → ${DEMO_REVIEWS[i].rating}★`);
      } else {
        console.log(`  ↺ ${gem.name} already has a review from this customer`);
      }
    }

    console.log(`\nDone. ${createdReviews} review(s) + delivered orders created.`);
    console.log('Log in to the admin panel to see them in Reviews + Orders + Payments tabs.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
