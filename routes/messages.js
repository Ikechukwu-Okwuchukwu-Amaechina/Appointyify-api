const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.post('/', protect, messageController.sendMessage);
router.put('/read', protect, messageController.markMessagesAsRead);
router.get('/conversations', protect, messageController.getMyConversations);
router.get('/:bookingId', protect, messageController.getBookingMessages);
router.get('/booking/:bookingId', protect, messageController.getBookingMessages);
router.get('/my-conversations', protect, messageController.getMyConversations);
router.get('/business/:businessId/conversations', protect, messageController.getBusinessConversations);
router.post('/mark-read', protect, messageController.markMessagesAsRead);

module.exports = router;
