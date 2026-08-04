const express = require('express');
const router = express.Router();
const { 
  getProviders, 
  getUserProfile, 
  updateUserProfile, 
  updateUserPushToken,
  submitProfileUpdateRequest,
  getLatestProfileUpdateRequest
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/providers', getProviders);
router.route('/me').get(protect, getUserProfile).put(protect, updateUserProfile);
router.put('/push-token', protect, updateUserPushToken);
router.post('/profile-update-request', protect, submitProfileUpdateRequest);
router.get('/profile-update-request/me', protect, getLatestProfileUpdateRequest);

module.exports = router;
