const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/paymentController');

router.post('/', auth, ctrl.charge);
router.get('/', auth, adminOnly, ctrl.list);
router.get('/:id', auth, adminOnly, ctrl.get);

module.exports = router;
