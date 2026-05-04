/**
 * PAYMENT CONTROLLER (Module M6)
 * ==============================
 * Module owner: M6 (Payment + Cloudinary + Deployment)
 *
 * What this file does:
 *   Admin-only READ endpoints over the Payment collection. The actual
 *   charge happens in checkoutController.js / finalizeSale.js — this file
 *   is the audit / dashboard side.
 *
 * Why is creation NOT here?
 *   We funnel all 3 sale paths (cart, accepted offer, won bid) through one
 *   POST /api/checkout endpoint so the side effects (decrement stock, close
 *   listing, reject offers, create order) happen in one place. Splitting
 *   "make payment" and "create order" would risk inconsistency.
 */

const Payment = require('../models/Payment');

/**
 * READ-all → GET /api/payments   (admin)
 * Newest first; populates customer + gem for the audit grid.
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

/**
 * READ-one → GET /api/payments/:id   (admin)
 */
exports.get = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('gem');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};
