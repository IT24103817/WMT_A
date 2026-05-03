const Payment = require('../models/Payment');

/**
 * Note: the customer-facing charge endpoint moved to POST /api/checkout.
 * This file keeps only the admin-facing read endpoints.
 */

exports.list = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'name email')
      .populate('gem')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('gem');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};
