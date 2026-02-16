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

router.post('/', protect, bookingValidator, createBooking);
router.get('/', protect, getMyBookings);
router.get('/mine', protect, getMyBookings);
router.get('/availability/:businessId', getAvailableSlots);
router.get('/business/:businessId', protect, getBusinessBookings);
router.patch('/:id/cancel', protect, idValidator, cancelBooking);
router.put('/:id/cancel', protect, idValidator, cancelBooking);
router.patch('/:id/status', protect, idValidator, updateBookingStatus);
router.get('/:id', protect, idValidator, getBookingById);
router.put('/:id', protect, idValidator, updateBookingStatus);

module.exports = router;
