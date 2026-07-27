const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String },

  reviewType: {
    type: String,
    enum: [
      "client_to_provider",
      "provider_to_client",
      "service_quality",
      "attitude",
      "communication"
    ],
    required: true
  }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
