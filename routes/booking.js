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

router.post('/', protect, createBooking);
router.get('/mine', protect, getMyBookings);
router.get('/availability/:businessId', getAvailableSlots);
router.get('/business/:businessId', protect, getBusinessBookings);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/status', protect, updateBookingStatus);
router.get('/:id', protect, getBookingById);

module.exports = router;
