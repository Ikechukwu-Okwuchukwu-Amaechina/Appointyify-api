const { check } = require('express-validator');

function ensureDateOrDays(req, res, next) {
  const { date, days, time, startTime } = req.body;
  if (!date && !days) return res.status(400).json({ msg: 'Either date or days is required' });
  if (date && days) return res.status(400).json({ msg: 'Provide either date or days, not both' });
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ msg: 'Invalid date format YYYY-MM-DD' });
  if (days) {
    if (!Array.isArray(days) || days.length === 0) return res.status(400).json({ msg: 'days must be a non-empty array' });
    const allowed = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday','0','1','2','3','4','5','6'];
    for (const d of days) {
      if (!allowed.includes(String(d).toLowerCase())) return res.status(400).json({ msg: 'Invalid day value in days' });
    }
  }
  // normalize time field to startTime if provided
  if (!startTime && time) req.body.startTime = time;
  if (!req.body.startTime) return res.status(400).json({ msg: 'time/startTime is required' });
  if (!/^\d{2}:\d{2}$/.test(req.body.startTime)) return res.status(400).json({ msg: 'startTime must be in HH:mm format' });
  return next();
}

exports.bookingValidator = [
  check('business', 'Valid business is required').isMongoId(),
  ensureDateOrDays
];
