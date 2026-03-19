const Booking = require('../models/Booking');
const Business = require('../models/Business');
const { validationResult } = require('express-validator');

function parseDateOnly(dateStr) {
  // expects YYYY-MM-DD
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return null;
  return d;
}

// Day-name helpers used for per-day working hours lookup
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

/** Returns the nearest future Date (or today) for a given weekday name (e.g. 'monday') */
function nextWeekdayDate(dayName) {
  const target = DAY_NAMES.indexOf(dayName.toLowerCase());
  if (target === -1) return new Date();
  const now = new Date();
  const diff = (target - now.getDay() + 7) % 7;
  const d = new Date(now);
  d.setDate(d.getDate() + diff);
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

function buildSlotsFromRange(open, close, slotDuration) {
  const slots = [];
  let cur = open;
  while (true) {
    const next = addMinutesToTime(cur, slotDuration);
    if (next > close) break;
    slots.push({ startTime: cur, endTime: next });
    cur = next;
  }
  return slots;
}

/**
 * Generate time slots for a given date.
 * workingHours can be:
 *   - per-day object: { monday: { open:'09:00', close:'17:00', enabled:true }, ... }
 *   - legacy string:  '09:00-17:00'  (applied to every day)
 * dateObj is optional; if omitted, legacy string path is used.
 */
function generateSlotsFromWorkingHours(workingHours, slotDuration, dateObj) {
  if (!workingHours) return [];

  // Per-day object format
  if (typeof workingHours === 'object' && !Array.isArray(workingHours)) {
    if (!dateObj) return [];
    const dayName = DAY_NAMES[dateObj.getDay()];
    const dayConfig = workingHours[dayName];
    // day disabled or missing
    if (!dayConfig || dayConfig.enabled === false) return [];
    const open  = dayConfig.open  || dayConfig.start || dayConfig.openTime;
    const close = dayConfig.close || dayConfig.end   || dayConfig.closeTime;
    if (!open || !close) return [];
    return buildSlotsFromRange(open, close, slotDuration);
  }

  // Legacy string format: '09:00-17:00'
  if (typeof workingHours === 'string') {
    const parts = workingHours.split('-');
    if (parts.length !== 2) return [];
    return buildSlotsFromRange(parts[0], parts[1], slotDuration);
  }

  return [];
}

function buildSamplePayload(file) {
  if (!file) return undefined;

  return {
    url: file.path,
    publicId: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
}

function emitBookingEvent(io, booking, businessOwnerId, eventName) {
  if (!io || !booking) return;

  const bookingUserId = booking.user && booking.user._id ? booking.user._id : booking.user;
  const ownerId = businessOwnerId && businessOwnerId._id ? businessOwnerId._id : businessOwnerId;
  const payload = typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
  io.to(`user_${String(bookingUserId)}`).emit(eventName, payload);
  io.to(`user_${String(ownerId)}`).emit(eventName, payload);
}

exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const {
      business: businessId,
      date,
      days,
      startTime,
      notes,
      serviceType,
      phone,
      location,
      addressDirection,
      budget
    } = req.body;
    if (!businessId) return res.status(400).json({ msg: 'business is required' });

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ msg: 'Business not found' });

    const bookingExtras = {
      notes,
      serviceType,
      phone,
      location,
      addressDirection,
      budget,
      sample: buildSamplePayload(req.file)
    };

    // If a single date booking
    if (date) {
      const dateObj = parseDateOnly(date);
      if (!dateObj) return res.status(400).json({ msg: 'Invalid date format, use YYYY-MM-DD' });
      const slots = generateSlotsFromWorkingHours(business.workingHours, business.slotDuration || 30, dateObj);
      if (slots.length === 0) return res.status(400).json({ msg: 'Business is not open on that day' });
      const match = slots.find(s => s.startTime === startTime);
      if (!match) return res.status(400).json({ msg: `Requested time is not an available slot. Available slots: ${slots.map(s=>s.startTime).join(', ')}` });

      // prevent double booking for exact same startTime on that date
      const existing = await Booking.findOne({ business: businessId, date: dateObj, startTime, status: { $ne: 'cancelled' } });
      if (existing) return res.status(409).json({ msg: 'Slot already booked' });

      const bookingData = {
        user: req.user._id,
        business: businessId,
        date: dateObj,
        startTime,
        endTime: match.endTime,
        recurring: false,
        ...bookingExtras
      };
      const booking = await Booking.create(bookingData);
      const populatedBooking = await Booking.findById(booking._id).populate('business user');
      emitBookingEvent(req.app.get('io'), populatedBooking, business.owner, 'bookingCreated');
      return res.status(201).json(populatedBooking);
    }

    // If recurring days booking
    if (days) {
      // days expected to be normalized by validator (array of weekday names or numbers)
      const normalizedDays = days.map(d => String(d).toLowerCase());
      // For recurring, validate the slot against the first provided day
      const sampleDateObj = nextWeekdayDate(normalizedDays[0]);
      const slots = generateSlotsFromWorkingHours(business.workingHours, business.slotDuration || 30, sampleDateObj);
      if (slots.length === 0) return res.status(400).json({ msg: `Business is not open on ${normalizedDays[0]}` });
      const match = slots.find(s => s.startTime === startTime);
      if (!match) return res.status(400).json({ msg: `Requested time is not an available slot. Available slots: ${slots.map(s=>s.startTime).join(', ')}` });

      // prevent duplicate recurring for same business/days/startTime
      const existing = await Booking.findOne({ business: businessId, recurring: true, days: { $all: normalizedDays }, startTime, status: { $ne: 'cancelled' } });
      if (existing) return res.status(409).json({ msg: 'Recurring slot already exists' });

      const bookingData = {
        user: req.user._id,
        business: businessId,
        days: normalizedDays,
        recurring: true,
        startTime,
        endTime: match.endTime,
        ...bookingExtras
      };
      const booking = await Booking.create(bookingData);
      const populatedBooking = await Booking.findById(booking._id).populate('business user');
      emitBookingEvent(req.app.get('io'), populatedBooking, business.owner, 'bookingCreated');
      return res.status(201).json(populatedBooking);
    }

    return res.status(400).json({ msg: 'Either date or days must be provided' });
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

    const slots = generateSlotsFromWorkingHours(business.workingHours, business.slotDuration || 30, dateObj);
    if (slots.length === 0) return res.json({ open: false, slots: [], msg: 'Business is not open on that day' });
    const bookings = await Booking.find({ business: businessId, date: dateObj, status: { $ne: 'cancelled' } });
    const busy = new Set(bookings.map(b => b.startTime));
    const result = slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, available: !busy.has(s.startTime) }));
    res.json({ open: true, slots: result });
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
    emitBookingEvent(req.app.get('io'), b, b.business.owner, 'bookingUpdated');
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
    emitBookingEvent(req.app.get('io'), b, b.business.owner, 'bookingUpdated');
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};
