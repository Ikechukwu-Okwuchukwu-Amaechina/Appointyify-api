const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

/**
 * @swagger
 * /api/messages/booking/{bookingId}:
 *   get:
 *     summary: Get all messages for a specific booking
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get('/booking/:bookingId', protect, messageController.getBookingMessages);

/**
 * @swagger
 * /api/messages/my-conversations:
 *   get:
 *     summary: Get all conversations for current user (as client)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/my-conversations', protect, messageController.getMyConversations);

/**
 * @swagger
 * /api/messages/business/{businessId}/conversations:
 *   get:
 *     summary: Get all conversations for a business
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversations
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Business not found
 */
router.get('/business/:businessId/conversations', protect, messageController.getBusinessConversations);

/**
 * @swagger
 * /api/messages/mark-read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/mark-read', protect, messageController.markMessagesAsRead);

module.exports = router;
