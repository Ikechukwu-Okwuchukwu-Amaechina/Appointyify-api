const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getAvailableSlots,
  getBusinessBookings,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { bookingValidator } = require('../validators/bookingValidators');
const { idValidator } = require('../validators/idValidator');

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business
 *               - date
 *               - startTime
 *             properties:
 *               business:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-02-15"
 *               startTime:
 *                 type: string
 *                 example: "10:00"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *   get:
 *     summary: Get user's own bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *       - in: query
 *         name: business
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.post('/', protect, bookingValidator, createBooking);
router.get('/', protect, getMyBookings);

/**
 * @swagger
 * /api/bookings/mine:
 *   get:
 *     summary: Get my bookings
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *       - in: query
 *         name: business
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/mine', protect, getMyBookings);

/**
 * @swagger
 * /api/bookings/availability/{businessId}:
 *   get:
 *     summary: Get available time slots for a business
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-02-15"
 *     responses:
 *       200:
 *         description: Available slots
 */
router.get('/availability/:businessId', getAvailableSlots);

/**
 * @swagger
 * /api/bookings/business/{businessId}:
 *   get:
 *     summary: Get bookings for a business (business owner only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Business bookings
 */
router.get('/business/:businessId', protect, getBusinessBookings);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 *   put:
 *     summary: Cancel a booking
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.patch('/:id/cancel', protect, idValidator, cancelBooking);
router.put('/:id/cancel', protect, idValidator, cancelBooking);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (business owner only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', protect, idValidator, updateBookingStatus);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *   put:
 *     summary: Update booking status (business owner only)
 *     tags: [Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.get('/:id', protect, idValidator, getBookingById);
router.put('/:id', protect, idValidator, updateBookingStatus);

module.exports = router;
