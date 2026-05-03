const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { listingMediaUpload } = require('../middleware/upload');
const ctrl = require('../controllers/marketplaceController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

router.post('/', auth, adminOnly, listingMediaUpload, ctrl.create);
router.put('/:id', auth, adminOnly, listingMediaUpload, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

module.exports = router;
