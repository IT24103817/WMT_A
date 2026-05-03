require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const learningRoutes = require('./routes/learning');
const marketplaceRoutes = require('./routes/marketplace');
const offerRoutes = require('./routes/offers');
const bidRoutes = require('./routes/bids');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const checkoutRoutes = require('./routes/checkout');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return cb(null, true);
      }
      return cb(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'gemmarket-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/checkout', checkoutRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`GemMarket API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
