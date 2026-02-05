const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById
} = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.get('/mine', protect, getMyBookings);
router.get('/:id', protect, getBookingById);

module.exports = router;
