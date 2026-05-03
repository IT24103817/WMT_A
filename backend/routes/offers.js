const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/offerController');

router.post('/', auth, ctrl.create);
router.get('/mine', auth, ctrl.mine);
router.get('/', auth, adminOnly, ctrl.listAll);
router.patch('/:id', auth, adminOnly, ctrl.decide);

module.exports = router;
