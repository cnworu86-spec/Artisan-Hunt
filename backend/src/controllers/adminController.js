const User = require('../models/User');
const Report = require('../models/Report');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const SystemSettings = require('../models/SystemSettings');
const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');

// Helper to log admin actions
const logAction = async (adminName, action, target, targetId, details, req) => {
  try {
    await ActivityLog.create({
      adminId: req?.user?._id || null,
      adminName: adminName || req?.user?.name || req?.user?.firstName || 'Admin',
      adminEmail: req?.user?.email || 'admin@artisanhunt.com',
      action,
      target,
      targetId: targetId ? String(targetId) : null,
      details,
      ipAddress: req?.ip || '127.0.0.1',
      deviceInfo: req?.headers ? req.headers['user-agent'] : 'Dashboard Portal'
    });
  } catch (err) {
    console.error('Error recording activity log:', err);
  }
};

// @desc    Get complete executive overview for Dashboard Home
// @route   GET /api/admin/analytics/overview
// @access  Admin
const getAnalyticsOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ roles: { $in: ['client'] } });
    const totalProviders = await User.countDocuments({ roles: { $in: ['provider'] } });
    const totalAdmins = await Admin.countDocuments();

    const verifiedProviders = await User.countDocuments({
      roles: { $in: ['provider'] },
      'verification.verificationStatus': 'verified'
    });

    const pendingVerifications = await User.countDocuments({
      roles: { $in: ['provider'] },
      'verification.verificationStatus': 'pending'
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeUsersToday = await User.countDocuments({
      'loginMetadata.lastLogin': { $gte: startOfDay }
    });

    const suspendedUsers = await User.countDocuments({ 'accountStatus.isSuspended': true });
    const blockedUsers = await User.countDocuments({ 'accountStatus.isBlocked': true });

    const totalCompletedBookings = await Booking.countDocuments({ bookingStatus: 'completed' });
    const totalPendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: { $in: ['pending', 'under_review'] } });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });

    const earningsAggregation = await Booking.aggregate([
      { $match: { bookingStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: "$paymentDetails.serviceAmount" } } }
    ]);
    const totalPlatformEarnings = earningsAggregation.length > 0 ? earningsAggregation[0].total : 0;

    // Recent Activity feeds
    const recentRegistrations = await User.find({})
      .select('firstName lastName email roles createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentVerifications = await User.find({ roles: { $in: ['provider'] }, 'verification.verificationStatus': 'pending' })
      .select('firstName lastName email providerDetails verification createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentReports = await Report.find({})
      .populate('reporterId', 'firstName lastName')
      .populate('reportedUserId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentCompletedBookings = await Booking.find({ bookingStatus: 'completed' })
      .populate('clientId', 'firstName lastName')
      .populate('providerId', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Regional breakdown
    const regionAggregation = await User.aggregate([
      { $group: { _id: "$location.region", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top rated providers
    const topProviders = await User.find({ roles: { $in: ['provider'] } })
      .select('firstName lastName email ratings providerDetails')
      .sort({ 'ratings.averageRating': -1, 'ratings.totalReviews': -1 })
      .limit(5);

    res.json({
      summaryCards: {
        totalUsers,
        totalClients,
        totalProviders,
        totalAdmins,
        verifiedProviders,
        pendingVerifications,
        activeUsersToday,
        suspendedUsers,
        blockedUsers,
        totalCompletedBookings,
        totalPendingBookings,
        totalReports,
        pendingReports,
        resolvedReports,
        totalPlatformEarnings
      },
      recentActivity: {
        registrations: recentRegistrations,
        verifications: recentVerifications,
        reports: recentReports,
        completedBookings: recentCompletedBookings
      },
      regionalBreakdown: regionAggregation,
      topProviders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed analytics for Analytics Hub tabs
// @route   GET /api/admin/analytics/detailed
// @access  Admin
const getAnalyticsDetailed = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 'accountStatus.isSuspended': false, 'accountStatus.isBlocked': false });

    // Category popularity
    const categoryStats = await Booking.aggregate([
      { $group: { _id: "$serviceCategory", totalBookings: { $sum: 1 } } },
      { $sort: { totalBookings: -1 } }
    ]);

    // Booking status distribution
    const bookingStatusStats = await Booking.aggregate([
      { $group: { _id: "$bookingStatus", count: { $sum: 1 } } }
    ]);

    // Providers stats
    const totalProviders = await User.countDocuments({ roles: { $in: ['provider'] } });
    const verifiedProviders = await User.countDocuments({ roles: { $in: ['provider'] }, 'verification.verificationStatus': 'verified' });

    // Average rating
    const ratingAggregation = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" }, totalCount: { $sum: 1 } } }
    ]);

    res.json({
      users: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers
      },
      providers: {
        totalProviders,
        verifiedProviders,
        avgRating: ratingAggregation[0]?.avgRating ? Number(ratingAggregation[0].avgRating.toFixed(1)) : 0,
        totalReviews: ratingAggregation[0]?.totalCount || 0
      },
      categories: categoryStats,
      bookingStatuses: bookingStatusStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all platform users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users pending verification
// @route   GET /api/admin/users/pending-verification
// @access  Admin
const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({ 'verification.verificationStatus': 'pending', roles: { $in: ['provider'] } })
      .select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify or reject a user
// @route   PATCH /api/admin/users/:id/verify
// @access  Admin
const verifyUser = async (req, res) => {
  try {
    const { status, notes } = req.body; // 'verified', 'rejected', 'resubmission_requested'
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verification.verificationStatus = status;
    user.verification.verifiedAt = status === 'verified' ? Date.now() : null;
    if (notes) {
      user.verification.resubmissionNotes = notes;
    }

    await user.save();

    await logAction(
      req?.user?.name || 'Admin',
      'User Verification Update',
      `${user.firstName} ${user.lastName}`,
      user._id,
      `Updated status to ${status}${notes ? ` (Note: ${notes})` : ''}`,
      req
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend or unsuspend a user
// @route   PATCH /api/admin/users/:id/suspend
// @access  Admin
const suspendUser = async (req, res) => {
  try {
    const { isSuspended, suspensionReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.accountStatus.isSuspended = isSuspended;
    if (suspensionReason) {
      user.accountStatus.suspensionReason = suspensionReason;
    }

    await user.save();

    await logAction(
      req?.user?.name || 'Admin',
      isSuspended ? 'User Suspended' : 'User Reactivated',
      `${user.firstName} ${user.lastName}`,
      user._id,
      isSuspended ? `Reason: ${suspensionReason || 'Admin Action'}` : 'Account unsuspended',
      req
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block or unblock a user
// @route   PATCH /api/admin/users/:id/block
// @access  Admin
const blockUser = async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.accountStatus.isBlocked = isBlocked;
    await user.save();

    await logAction(
      req?.user?.name || 'Admin',
      isBlocked ? 'User Account Blocked' : 'User Account Unblocked',
      `${user.firstName} ${user.lastName}`,
      user._id,
      isBlocked ? 'Blocked by administrator' : 'Unblocked by administrator',
      req
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password for user
// @route   PATCH /api/admin/users/:id/reset-password
// @access  Admin
const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tempPassword = `Reset${Math.floor(100000 + Math.random() * 900000)}!`;
    user.passwordHash = tempPassword; // Pre-save hook will hash it
    await user.save();

    await logAction(
      req?.user?.name || 'Admin',
      'Password Reset Initiated',
      `${user.firstName} ${user.lastName}`,
      user._id,
      `Generated temporary credentials for user`,
      req
    );

    res.json({ message: 'Password reset successfully', tempPassword });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit basic user info
// @route   PATCH /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, region, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (region) {
      user.location = user.location || {};
      user.location.region = region;
    }
    if (role) {
      user.roles = role === 'both' ? ['client', 'provider'] : [role];
    }

    await user.save();

    await logAction(
      req?.user?.name || 'Admin',
      'User Info Updated',
      `${user.firstName} ${user.lastName}`,
      user._id,
      'Updated demographic details',
      req
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get full deep profile of user
// @route   GET /api/admin/users/:id/full-profile
// @access  Admin
const getUserFullProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookings = await Booking.find({
      $or: [{ clientId: userId }, { providerId: userId }]
    })
      .populate('clientId', 'firstName lastName email phoneNumber')
      .populate('providerId', 'firstName lastName email phoneNumber providerDetails')
      .sort({ createdAt: -1 });

    const reviewsReceived = await Review.find({ reviewedUserId: userId })
      .populate('reviewerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const reviewsGiven = await Review.find({ reviewerId: userId })
      .populate('reviewedUserId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const reports = await Report.find({
      $or: [{ reporterId: userId }, { reportedUserId: userId }]
    })
      .populate('reporterId', 'firstName lastName')
      .populate('reportedUserId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      user,
      bookings,
      reviewsReceived,
      reviewsGiven,
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('clientId', 'firstName lastName email phoneNumber location')
      .populate('providerId', 'firstName lastName email phoneNumber providerDetails')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Admin
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('reviewerId', 'firstName lastName email profileImage')
      .populate('reviewedUserId', 'firstName lastName email providerDetails')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/moderate review
// @route   DELETE /api/admin/reviews/:id
// @access  Admin
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.deleteOne();

    await logAction(
      req?.user?.name || 'Admin',
      'Review Moderated / Deleted',
      `Review ID ${req.params.id}`,
      req.params.id,
      'Deleted abusive review from platform',
      req
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all safety reports
// @route   GET /api/admin/reports
// @access  Admin
const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reporterId', 'firstName lastName email')
      .populate('reportedUserId', 'firstName lastName email accountStatus')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve or update a report
// @route   PATCH /api/admin/reports/:id/resolve
// @access  Admin
const resolveReport = async (req, res) => {
  try {
    const { status, resolutionNotes, suspendReportedUser } = req.body; // 'resolved', 'dismissed', 'under_review'
    
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (resolutionNotes) report.resolutionNotes = resolutionNotes;
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedAt = Date.now();
    }

    await report.save();

    // Optionally suspend reported user if requested
    if (suspendReportedUser && report.reportedUserId) {
      await User.findByIdAndUpdate(report.reportedUserId, {
        'accountStatus.isSuspended': true,
        'accountStatus.suspensionReason': `Suspended due to safety report resolution: ${report.reason}`
      });
    }

    await logAction(
      req?.user?.name || 'Admin',
      'Safety Report Updated',
      `Report #${report._id}`,
      report._id,
      `Set status to ${status}${resolutionNotes ? `. Notes: ${resolutionNotes}` : ''}`,
      req
    );

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Service Categories Controllers
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ displayOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;
    const category = await Category.create({ name, description, icon, status });
    await logAction(req?.user?.name || 'Admin', 'Category Created', name, category._id, 'Added new service category', req);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name;
    if (description) category.description = description;
    if (icon) category.icon = icon;
    if (status) category.status = status;

    await category.save();
    await logAction(req?.user?.name || 'Admin', 'Category Updated', category.name, category._id, 'Modified category properties', req);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const catName = category.name;
    await category.deleteOne();
    await logAction(req?.user?.name || 'Admin', 'Category Deleted', catName, req.params.id, 'Removed category', req);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activity Logs Controller
const getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Administrators Management Controllers
const getAdministrators = async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-passwordHash').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAdministrator = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const adminExists = await Admin.findOne({ email });
    if (adminExists) return res.status(400).json({ message: 'Admin account with this email already exists' });

    const newAdmin = await Admin.create({
      name,
      email,
      passwordHash: password,
      role: role || 'admin'
    });

    await logAction(req?.user?.name || 'Super Admin', 'Administrator Account Created', name, newAdmin._id, `Assigned role ${role || 'admin'}`, req);
    res.status(201).json({
      _id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAdministrator = async (req, res) => {
  try {
    const { name, role, password } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (name) admin.name = name;
    if (role) admin.role = role;
    if (password) admin.passwordHash = password;

    await admin.save();
    await logAction(req?.user?.name || 'Admin', 'Administrator Account Modified', admin.name, admin._id, 'Updated credentials/role', req);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Notifications Controller
const getNotifications = async (req, res) => {
  try {
    const pendingVerifications = await User.countDocuments({ roles: { $in: ['provider'] }, 'verification.verificationStatus': 'pending' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newRegistrationsToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });

    const notificationsList = [];

    if (pendingVerifications > 0) {
      notificationsList.push({
        id: 'verif-1',
        type: 'verification',
        title: 'Pending Verifications',
        message: `${pendingVerifications} artisan application(s) awaiting Ghana Card inspection.`,
        createdAt: new Date()
      });
    }

    if (pendingReports > 0) {
      notificationsList.push({
        id: 'report-1',
        type: 'report',
        title: 'Safety Alerts',
        message: `${pendingReports} unresolved safety incident report(s) flagged by users.`,
        createdAt: new Date()
      });
    }

    if (newRegistrationsToday > 0) {
      notificationsList.push({
        id: 'user-1',
        type: 'user',
        title: 'New Registrations',
        message: `${newRegistrationsToday} new user(s) signed up on the platform today.`,
        createdAt: new Date()
      });
    }

    res.json(notificationsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// System Health & Monitoring Controller
const getSystemStatus = async (req, res) => {
  try {
    const mongooseState = require('mongoose').connection.readyState;
    const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

    res.json({
      server: {
        status: 'Operational',
        uptimeSeconds: process.uptime(),
        nodeVersion: process.version,
        memoryUsageMb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
      },
      database: {
        status: states[mongooseState] || 'Unknown',
        connected: mongooseState === 1
      },
      firebaseEngine: {
        status: 'Operational'
      },
      expoNotificationServer: {
        status: 'Active'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Settings Controllers
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    await logAction(req?.user?.name || 'Admin', 'Platform Settings Updated', 'System Config', settings._id, 'Modified session/retention configurations', req);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Global Search Controller
const globalSearch = async (req, res) => {
  try {
    const query = req.query.q ? String(req.query.q).trim() : '';
    if (!query) return res.json({ users: [], bookings: [], reports: [], admins: [] });

    const regex = new RegExp(query, 'i');

    const users = await User.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phoneNumber: regex },
        { 'verification.ghanaCardNumberEncrypted': regex }
      ]
    }).select('-passwordHash').limit(8);

    const bookings = await Booking.find({
      $or: [
        { serviceCategory: regex },
        { bookingStatus: regex }
      ]
    }).populate('clientId', 'firstName lastName').populate('providerId', 'firstName lastName').limit(8);

    const reports = await Report.find({
      $or: [
        { reason: regex },
        { description: regex },
        { status: regex }
      ]
    }).populate('reporterId', 'firstName lastName').populate('reportedUserId', 'firstName lastName').limit(8);

    const admins = await Admin.find({
      $or: [
        { name: regex },
        { email: regex }
      ]
    }).select('-passwordHash').limit(5);

    res.json({ users, bookings, reports, admins });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Profile Update Requests Controllers
const getProfileUpdateRequests = async (req, res) => {
  try {
    const requests = await ProfileUpdateRequest.find({})
      .populate('userId', 'firstName lastName email phoneNumber profileImage roles location providerDetails')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewProfileUpdateRequest = async (req, res) => {
  try {
    const { status, notes } = req.body; // 'approved', 'rejected', 'resubmission_requested'
    const request = await ProfileUpdateRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Profile update request not found' });
    }

    request.status = status;
    if (notes) request.reviewNotes = notes;
    request.reviewedAt = Date.now();
    if (req.user) request.reviewedByAdmin = req.user._id;

    await request.save();

    // If approved, automatically apply requested changes to User model
    if (status === 'approved') {
      const user = await User.findById(request.userId);
      if (user) {
        const changes = request.requestedChanges;
        if (changes.firstName) user.firstName = changes.firstName;
        if (changes.lastName) user.lastName = changes.lastName;
        if (changes.profileImage) user.profileImage = changes.profileImage;
        if (changes.phoneNumber) user.phoneNumber = changes.phoneNumber;
        if (changes.alternativePhoneNumber) user.alternativePhoneNumber = changes.alternativePhoneNumber;
        if (changes.emergencyContactName !== undefined) user.emergencyContactName = changes.emergencyContactName;
        if (changes.region) {
          user.location = user.location || {};
          user.location.region = changes.region;
          const accraTowns = [
            'Accra', 'Tema', 'Madina', 'East Legon', 'Spintex', 'Osu', 'Cantonments', 'Dansoman', 
            'Achimota', 'Adenta', 'Teshie', 'Nungua', 'Kasoa', 'Lapaz', 'Kaneshie', 'Airport Residential', 'Roman Ridge'
          ];
          const kumasiTowns = [
            'Kumasi', 'Obuasi', 'Ejisu', 'Mampong', 'Tafo', 'Suame', 'Asokwa', 'Bantama', 
            'KNUST/Bomso', 'Ahodwo', 'Santasi', 'Kejetia', 'Asawase', 'Oforikrom'
          ];

          let coords = { latitude: 6.6666, longitude: -1.6163 }; // default Kumasi
          if (accraTowns.includes(changes.region)) {
            coords = { latitude: 5.6037, longitude: -0.1870 };
          } else if (kumasiTowns.includes(changes.region)) {
            coords = { latitude: 6.6666, longitude: -1.6163 };
          } else if (changes.region === 'Takoradi') {
            coords = { latitude: 4.9016, longitude: -1.7831 };
          } else if (changes.region === 'Tamale') {
            coords = { latitude: 9.4008, longitude: -0.8393 };
          } else if (changes.region === 'Cape Coast') {
            coords = { latitude: 5.1315, longitude: -1.2795 };
          } else if (changes.region === 'Sunyani') {
            coords = { latitude: 7.3349, longitude: -2.3124 };
          }
          user.location.latitude = coords.latitude;
          user.location.longitude = coords.longitude;
        }
        if (changes.address) {
          user.location = user.location || {};
          user.location.address = changes.address;
        }
        if (changes.gpsAddress) {
          user.location = user.location || {};
          user.location.gpsAddress = changes.gpsAddress;
        }
        if (changes.bio || changes.jobTitle) {
          user.providerDetails = user.providerDetails || {};
          if (changes.bio) user.providerDetails.bio = changes.bio;
          if (changes.jobTitle) user.providerDetails.jobTitle = changes.jobTitle;
        }

        await user.save();
      }
    }

    await logAction(
      req?.user?.name || 'Admin',
      'Profile Update Request Review',
      `Request #${request._id}`,
      request._id,
      `Set status to ${status}${notes ? `. Notes: ${notes}` : ''}`,
      req
    );

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
