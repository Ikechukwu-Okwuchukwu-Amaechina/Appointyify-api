const Booking = require('../models/Booking');
const Business = require('../models/Business');

function parseDateOnly(dateStr) {
  // expects YYYY-MM-DD
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return null;
  return d;
}

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number);
  const dt = new Date(1970, 0, 1, h, m);
  dt.setMinutes(dt.getMinutes() + minutes);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function generateSlotsFromWorkingHours(workingHours, slotDuration) {
  // workingHours expected like "09:00-17:00"
  if (!workingHours) return [];
  const parts = workingHours.split('-');
  if (parts.length !== 2) return [];
  const [start, end] = parts;
  const slots = [];
  let cur = start;
  while (true) {
    const next = addMinutesToTime(cur, slotDuration);
    // stop if next is after end
    if (next > end) break;
    slots.push({ startTime: cur, endTime: next });
    cur = next;
  }
  return slots;
}

exports.createBooking = async (req, res) => {
  try {
    const { business: businessId, date, startTime, notes } = req.body;
    if (!businessId || !date || !startTime) return res.status(400).json({ msg: 'business, date and startTime are required' });

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ msg: 'Business not found' });

    const dateObj = parseDateOnly(date);
    if (!dateObj) return res.status(400).json({ msg: 'Invalid date format, use YYYY-MM-DD' });

    const slots = generateSlotsFromWorkingHours(business.workingHours, business.slotDuration || 30);
    const match = slots.find(s => s.startTime === startTime);
    if (!match) return res.status(400).json({ msg: 'Requested time is not an available slot' });

    // prevent double booking for exact same startTime
    const existing = await Booking.findOne({ business: businessId, date: dateObj, startTime, status: { $ne: 'cancelled' } });
    if (existing) return res.status(409).json({ msg: 'Slot already booked' });

    const bookingData = { user: req.user._id, business: businessId, date: dateObj, startTime, endTime: match.endTime, notes };
    const booking = await Booking.create(bookingData);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const { status, business } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (business) filter.business = business;
    const list = await Booking.find(filter).populate('business');
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id).populate('business user');
    if (!b) return res.status(404).json({ msg: 'Not found' });
    // allow only involved users or business owner or admin to view
    if (String(b.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      const business = await Business.findById(b.business._id);
      if (!business || String(business.owner) !== String(req.user._id)) return res.status(403).json({ msg: 'Forbidden' });
    }
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request' });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: 'date query param required (YYYY-MM-DD)' });
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ msg: 'Business not found' });
    const dateObj = parseDateOnly(date);
    if (!dateObj) return res.status(400).json({ msg: 'Invalid date format' });

    const slots = generateSlotsFromWorkingHours(business.workingHours, business.slotDuration || 30);
    const bookings = await Booking.find({ business: businessId, date: dateObj, status: { $ne: 'cancelled' } });
    const busy = new Set(bookings.map(b => b.startTime));
    const result = slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, available: !busy.has(s.startTime) }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getBusinessBookings = async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ msg: 'Business not found' });
    if (String(business.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
    const { status, date } = req.query;
    const filter = { business: businessId };
    if (status) filter.status = status;
    if (date) {
      const d = parseDateOnly(date);
      if (d) filter.date = d;
    }
    const list = await Booking.find(filter).populate('user');
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id).populate('business');
    if (!b) return res.status(404).json({ msg: 'Not found' });
    // allow booking user, business owner, or admin to cancel
    if (String(b.user) !== String(req.user._id) && String(b.business.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    b.status = 'cancelled';
    await b.save();
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) return res.status(400).json({ msg: 'Invalid status' });
    const b = await Booking.findById(req.params.id).populate('business');
    if (!b) return res.status(404).json({ msg: 'Not found' });
    // only business owner or admin can update status
    if (String(b.business.owner) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
    b.status = status;
    await b.save();
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};
