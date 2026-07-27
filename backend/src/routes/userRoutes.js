const express = require('express');
const router = express.Router();
const { getProviders, getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/providers', getProviders);
router.route('/me').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
