const Booking = require('../models/Booking');

exports.createBooking = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };
    const booking = await Booking.create(data);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const list = await Booking.find({ user: req.user._id }).populate('business');
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id).populate('business user');
    if (!b) return res.status(404).json({ msg: 'Not found' });
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request' });
  }
};
