const User = require('../models/User');
const Business = require('../models/Business');
const Booking = require('../models/Booking');

exports.getStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const businessesCount = await Business.countDocuments();
    const bookingsCount = await Booking.countDocuments();
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    res.json({ usersCount, businessesCount, bookingsCount, byRole });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    if (role) filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), users });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    await User.findByIdAndDelete(userId);
    await Business.deleteMany({ owner: userId });
    await Booking.deleteMany({ user: userId });

    res.json({ msg: 'User and related data deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getBusinesses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, owner } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (owner) filter.owner = owner;

    const total = await Business.countDocuments(filter);
    const businesses = await Business.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), businesses });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, business, user, status, dateFrom, dateTo } = req.query;
    const filter = {};
    if (business) filter.business = business;
    if (user) filter.user = user;
    if (status) filter.status = status;
    if (dateFrom || dateTo) filter.date = {};
    if (dateFrom) filter.date.$gte = new Date(dateFrom);
    if (dateTo) filter.date.$lte = new Date(dateTo);

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('user', 'name email')
      .populate('business', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ total, page: parseInt(page), limit: parseInt(limit), bookings });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
