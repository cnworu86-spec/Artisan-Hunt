const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  userId: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  alternativePhoneNumber: { type: String },
  emergencyContactName: { type: String },
  passwordHash: { type: String, required: true },
  authProvider: {
    type: String,
    enum: ["local", "google", "apple"],
    default: "local"
  },
  gender: { type: String },
  dateOfBirth: { type: Date },
  profileImage: { type: String },
  roles: { type: [String], default: ["client"] }, // client, provider, admin
  pushToken: { type: String },
  
  providerDetails: {
    serviceCategory: { type: String },
    jobTitle: { type: String },
    bio: { type: String },
    services: [{
      name: { type: String, required: true },
      priceType: { type: String, enum: ['Hourly', 'Fixed'], default: 'Hourly' },
      price: { type: String, required: true }
    }],
    hourlyRate: { type: Number },
    fixedCharge: { type: Number },
    workingDays: { type: [String] },
    isAvailable: { type: Boolean, default: false }
  },

  location: {
    address: { type: String },
    gpsAddress: { type: String }, // Ghana postal address format
    region: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  },

  verification: {
    ghanaCardNumberEncrypted: { type: String },
    ghanaCardImage: { type: String },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "resubmission_requested"],
      default: "pending"
    },
    verifiedAt: { type: Date },
    reviewedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    resubmissionNotes: { type: String }
  },

  ratings: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },

  accountStatus: {
    isBlocked: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String }
  },

  statistics: {
    totalBookingsAsClient: { type: Number, default: 0 },
    totalBookingsAsProvider: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    cancelledJobs: { type: Number, default: 0 },
    noShowCount: { type: Number, default: 0 }
  },

  loginMetadata: {
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
