const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const ctrl = require('../controllers/paymentController');

<<<<<<< HEAD
router.post('/', auth, ctrl.charge);
=======
>>>>>>> 1c80615661ab77c09d44967b404fe9f76d1af461
router.get('/', auth, adminOnly, ctrl.list);
router.get('/:id', auth, adminOnly, ctrl.get);

module.exports = router;
