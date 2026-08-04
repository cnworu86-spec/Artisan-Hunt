const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  chatRetentionDays: { type: Number, default: 30 },
  sessionTimeoutMinutes: { type: Number, default: 30 },
  defaultUserStatus: { type: String, default: 'active' },
  emailNotifications: { type: Boolean, default: true },
  systemAlerts: { type: Boolean, default: true }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
module.exports = SystemSettings;
