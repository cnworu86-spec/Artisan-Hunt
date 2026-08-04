const mongoose = require('mongoose');

const profileUpdateRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedChanges: {
    firstName: { type: String },
    lastName: { type: String },
    profileImage: { type: String },
    phoneNumber: { type: String },
    alternativePhoneNumber: { type: String }, // emergency contact phone
    emergencyContactName: { type: String },
    bio: { type: String },
    jobTitle: { type: String },
    region: { type: String }
  },
  previousData: {
    firstName: { type: String },
    lastName: { type: String },
    profileImage: { type: String },
    phoneNumber: { type: String },
    alternativePhoneNumber: { type: String },
    emergencyContactName: { type: String },
    bio: { type: String },
    jobTitle: { type: String },
    region: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'resubmission_requested'],
    default: 'pending'
  },
  reviewNotes: { type: String },
  reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt: { type: Date }
}, { timestamps: true });

const ProfileUpdateRequest = mongoose.model('ProfileUpdateRequest', profileUpdateRequestSchema);
module.exports = ProfileUpdateRequest;
