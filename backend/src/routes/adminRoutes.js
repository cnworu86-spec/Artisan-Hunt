const express = require('express');
const router = express.Router();
const { 
  getAnalyticsOverview,
  getAnalyticsDetailed,
  getAllUsers,
  getPendingVerifications,
  verifyUser,
  suspendUser,
  blockUser,
  resetUserPassword,
  updateUser,
  getUserFullProfile,
  getAllBookings,
  getAllReviews,
  deleteReview,
  getReports,
  resolveReport,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getActivityLogs,
  getAdministrators,
  createAdministrator,
  updateAdministrator,
  getNotifications,
  getSystemStatus,
  getSettings,
  updateSettings,
  globalSearch,
  getProfileUpdateRequests,
  reviewProfileUpdateRequest
} = require('../controllers/adminController');

// Analytics & Dashboard Overview
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/detailed', getAnalyticsDetailed);

// Users Management
router.get('/users', getAllUsers);
router.get('/users/pending-verification', getPendingVerifications);
router.get('/users/:id/full-profile', getUserFullProfile);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id', updateUser);

// Profile Update Requests Approvals
router.get('/profile-update-requests', getProfileUpdateRequests);
router.patch('/profile-update-requests/:id/review', reviewProfileUpdateRequest);

// Bookings & Reviews
router.get('/bookings', getAllBookings);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

// Reports Management
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);

// Service Categories Management
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Activity Audit Logs
router.get('/logs', getActivityLogs);

// Admin Management
router.get('/administrators', getAdministrators);
router.post('/administrators', createAdministrator);
router.patch('/administrators/:id', updateAdministrator);

// Platform Notifications & Global Search
router.get('/notifications', getNotifications);
router.get('/search', globalSearch);

// Platform System Health & Settings
router.get('/system-status', getSystemStatus);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
