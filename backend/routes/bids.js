const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/bidController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

router.post('/', auth, adminOnly, ctrl.create);
router.put('/:id', auth, adminOnly, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

router.post('/:id/place', auth, ctrl.place);

module.exports = router;
