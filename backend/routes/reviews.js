const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { reviewPhotosUpload } = require('../middleware/upload');
const ctrl = require('../controllers/reviewController');

// Specific routes first
router.get('/seller/stats', ctrl.sellerStats);
router.get('/all', auth, adminOnly, ctrl.listAll);
router.get('/mine', auth, ctrl.mine);
router.get('/tags/list', ctrl.tagsList);

// Per-review write actions
router.post('/', auth, reviewPhotosUpload, ctrl.create);
router.put('/:id', auth, reviewPhotosUpload, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

// Admin reply
router.post('/:id/reply', auth, adminOnly, ctrl.reply);
router.delete('/:id/reply', auth, adminOnly, ctrl.removeReply);

// Per-gem (last — :gemId is generic)
router.get('/:gemId/aggregate', ctrl.aggregateForGem);
router.get('/:gemId', ctrl.byGem);

module.exports = router;
