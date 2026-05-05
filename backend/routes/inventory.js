const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { gemPhotosUpload } = require('../middleware/upload');
const ctrl = require('../controllers/inventoryController');

router.use(auth, adminOnly);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', gemPhotosUpload, ctrl.create);
router.put('/:id', gemPhotosUpload, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
