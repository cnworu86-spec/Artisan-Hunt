const Booking = require('../models/Booking');
const User = require('../models/User');
const { db, admin } = require('../firebase/firebaseAdmin');
const { sendNotificationToUser } = require('../utils/notification');

// @desc    Create new booking request
// @route   POST /api/bookings
// @access  Public (should be protected by auth middleware in real app)
const createBooking = async (req, res) => {
  try {
    const { clientId, providerId, serviceCategory, serviceDescription, scheduledDate, scheduledTime, locationSnapshot } = req.body;
    const generatedBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    let firebaseChatRoomId = null;

    if (db) {
      const chatRef = db.ref('chats').push();
      firebaseChatRoomId = chatRef.key;
      await chatRef.set({
        bookingId: generatedBookingId,
        clientId,
        providerId,
        createdAt: admin.database.ServerValue.TIMESTAMP
      });
    }

    const booking = await Booking.create({
      bookingId: generatedBookingId,
      clientId,
      providerId,
      serviceCategory,
      serviceDescription,
      scheduledDate: scheduledDate || 'TBD',
      scheduledTime: scheduledTime || 'TBD',
      locationSnapshot,
      chatMetadata: {
        firebaseChatRoomId,
        visibleUntil: null
      }
    });

    // Increment booking statistics
    await User.findByIdAndUpdate(clientId, { $inc: { 'statistics.totalBookingsAsClient': 1 } });
    await User.findByIdAndUpdate(providerId, { $inc: { 'statistics.totalBookingsAsProvider': 1 } });

    // Send push notification to provider
    try {
      const clientUser = await User.findById(clientId);
      const clientName = clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'A client';
      await sendNotificationToUser(
        providerId,
        'New Booking Request!',
        `${clientName} has requested a booking for ${serviceCategory} service.`
      );
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send booking request notification:', notifErr);
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Public (should be protected in real app)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    
    // Status can be: pending, accepted, in_progress, completed, cancelled, delayed, no_show
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.bookingStatus = status;

    if (status === 'cancelled' && cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }

    // Handle timestamp updates based on status
    if (status === 'in_progress') {
      booking.actualStartTime = Date.now();
    } else if (status === 'completed') {
      booking.actualEndTime = Date.now();
      // Calculate duration in minutes if startTime exists
      if (booking.actualStartTime) {
        const diffMs = booking.actualEndTime - booking.actualStartTime;
        booking.durationInMinutes = Math.round(diffMs / 60000);
      }
    }

    await booking.save();

    // Trigger push notifications for status updates
    try {
      const clientUser = await User.findById(booking.clientId);
      const providerUser = await User.findById(booking.providerId);
      const providerName = providerUser ? `${providerUser.firstName} ${providerUser.lastName}` : 'Artisan';
      const clientName = clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : 'Client';

      if (status === 'accepted') {
        await sendNotificationToUser(
          booking.clientId,
          'Booking Accepted!',
          `${providerName} accepted your request for ${booking.serviceCategory}.`
        );
      } else if (status === 'completed') {
        await sendNotificationToUser(
          booking.clientId,
          'Booking Completed!',
          `Your job with ${providerName} is completed. Please leave a review!`
        );
      } else if (status === 'cancelled') {
        const { senderId } = req.body;
        if (senderId) {
          if (senderId.toString() === booking.clientId.toString()) {
            await sendNotificationToUser(
              booking.providerId,
              'Booking Cancelled',
              `${clientName} cancelled the booking request for ${booking.serviceCategory}.`
            );
          } else if (senderId.toString() === booking.providerId.toString()) {
            await sendNotificationToUser(
              booking.clientId,
              'Booking Cancelled',
              `${providerName} cancelled the booking for ${booking.serviceCategory}.`
            );
          }
        }
      }
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send status update notification:', notifErr);
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking description/note
// @route   PATCH /api/bookings/:id/description
// @access  Public
const updateBookingDescription = async (req, res) => {
  try {
    const { description } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    booking.serviceDescription = description;
    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking schedule (time/date)
// @route   PATCH /api/bookings/:id/schedule
// @access  Public
const updateBookingSchedule = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (scheduledDate) booking.scheduledDate = scheduledDate;
    if (scheduledTime) booking.scheduledTime = scheduledTime;

    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user bookings
// @route   GET /api/bookings/user/:userId
// @access  Public
const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find bookings where user is either client or provider
    const bookings = await Booking.find({
      $or: [{ clientId: userId }, { providerId: userId }]
    })
      .populate('providerId', 'firstName lastName providerDetails phoneNumber location')
      .populate('clientId', 'firstName lastName phoneNumber location')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send chat message via Admin SDK (bypassing client auth rules)
// @route   POST /api/bookings/:id/chat
// @access  Public
const sendChatMessage = async (req, res) => {
  try {
    const { text, senderId } = req.body;
    const bookingId = req.params.id;

    if (!text || !senderId) {
      return res.status(400).json({ message: 'Text and senderId are required' });
    }

    if (!db) {
      return res.status(500).json({ message: 'Firebase Realtime Database is not initialized' });
    }

    const messagesRef = db.ref(`chats/${bookingId}/messages`);
    const newMessageRef = messagesRef.push();
    await newMessageRef.set({
      text: text.trim(),
      senderId,
      timestamp: admin.database.ServerValue.TIMESTAMP
    });

    res.status(201).json({ success: true, messageId: newMessageRef.key });

    // Send push notification to message recipient in the background
    try {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        const recipientId = senderId.toString() === booking.clientId.toString() 
          ? booking.providerId 
          : booking.clientId;
          
        const senderUser = await User.findById(senderId);
        const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : 'User';
        
        await sendNotificationToUser(
          recipientId,
          `New message from ${senderName}`,
          text.trim()
        );
      }
    } catch (notifErr) {
      console.error('[Notification Error] Failed to send chat message notification:', notifErr);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get chat messages for a booking via Admin SDK
// @route   GET /api/bookings/:id/chat
// @access  Public
const getChatMessages = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!db) {
      return res.status(500).json({ message: 'Firebase Realtime Database is not initialized' });
    }

    const snapshot = await db.ref(`chats/${bookingId}/messages`).once('value');
    const data = snapshot.val();

    if (!data) {
      return res.json([]);
    }

    const messages = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));

    // Sort by timestamp safely
    messages.sort((a, b) => {
      const tA = typeof a.timestamp === 'number' ? a.timestamp : 0;
      const tB = typeof b.timestamp === 'number' ? b.timestamp : 0;
      return tA - tB;
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  updateBookingStatus,
  updateBookingSchedule,
  updateBookingDescription,
  sendChatMessage,
  getChatMessages,
  getUserBookings
};
