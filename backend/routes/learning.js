const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { articleCoverUpload } = require('../middleware/upload'); // Middleware to handle article cover image uploads
const ctrl = require('../controllers/learningController'); // Import the learning controller

router.get('/categories', ctrl.categories); //public (Access to anyone)
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);

router.post('/', auth, adminOnly, articleCoverUpload, ctrl.create);
router.put('/:id', auth, adminOnly, articleCoverUpload, ctrl.update);
router.delete('/:id', auth, adminOnly, ctrl.remove);

module.exports = router;
