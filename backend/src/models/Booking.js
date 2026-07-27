const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  serviceCategory: { type: String, required: true },
  serviceDescription: { type: String },

  bookingStatus: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
      "delayed",
      "no_show"
    ],
    default: "pending"
  },

  scheduledDate: { type: String, required: true },
  scheduledTime: { type: String, required: true },

  actualStartTime: { type: Date },
  actualEndTime: { type: Date },

  durationInMinutes: { type: Number },

  paymentDetails: {
    serviceAmount: { type: Number },
    partsAmount: { type: Number },
    paymentMethod: { type: String }
  },

  clientRating: { type: Number },
  providerRating: { type: Number },

  reportExists: { type: Boolean, default: false },

  locationSnapshot: {
    region: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  },

  cancellationReason: { type: String },

  chatMetadata: {
    firebaseChatRoomId: { type: String },
    visibleUntil: { type: Date }
  }

}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
