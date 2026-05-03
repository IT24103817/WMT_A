const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/orderController');

router.get('/', auth, ctrl.mine);
router.get('/all', auth, adminOnly, ctrl.listAll);
router.get('/:id', auth, ctrl.get);
router.patch('/:id', auth, adminOnly, ctrl.advance);
router.post('/:id/cancel-refund', auth, adminOnly, ctrl.cancelWithRefund);
router.delete('/:id', auth, ctrl.cancel);

module.exports = router;
