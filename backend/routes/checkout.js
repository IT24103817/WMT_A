const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/checkoutController');

router.post('/', auth, ctrl.checkout);

module.exports = router;
