const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminName: { type: String, required: true },
  adminEmail: { type: String },
  action: { type: String, required: true }, // e.g. "User Verification", "User Suspension", "Category Added"
  target: { type: String }, // e.g. "John Doe (Provider)"
  targetId: { type: String },
  details: { type: String },
  ipAddress: { type: String, default: '127.0.0.1' },
  deviceInfo: { type: String, default: 'Web Admin Dashboard' }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;
