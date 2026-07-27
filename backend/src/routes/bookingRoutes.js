const express = require('express');
const router = express.Router();
const { createBooking, updateBookingStatus, updateBookingSchedule, updateBookingDescription, sendChatMessage, getChatMessages, getUserBookings } = require('../controllers/bookingController');

router.post('/', createBooking);
router.post('/:id/chat', sendChatMessage);
router.get('/:id/chat', getChatMessages);
router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/schedule', updateBookingSchedule);
router.patch('/:id/description', updateBookingDescription);
router.get('/user/:userId', getUserBookings);

module.exports = router;
