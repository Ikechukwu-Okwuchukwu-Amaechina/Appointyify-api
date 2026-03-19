const { check } = require('express-validator');

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validates that workingHours (if provided) is either:
 *   - a legacy string  "HH:mm-HH:mm"
 *   - a per-day object { monday: { open:'09:00', close:'17:00', enabled:true }, ... }
 */
function validateWorkingHours(value) {
  if (typeof value === 'string') {
    // legacy format: '09:00-17:00'
    const parts = value.split('-');
    if (parts.length !== 2 || !TIME_RE.test(parts[0]) || !TIME_RE.test(parts[1])) {
      throw new Error('workingHours string must be in HH:mm-HH:mm format');
    }
    return true;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    for (const day of Object.keys(value)) {
      if (!DAYS.includes(day.toLowerCase())) {
        throw new Error(`Unknown day key in workingHours: "${day}"`);
      }
      const cfg = value[day];
      if (typeof cfg !== 'object') throw new Error(`workingHours.${day} must be an object`);
      // open and close are required when enabled is true (or not set)
      if (cfg.enabled !== false) {
        const open  = cfg.open  || cfg.start || cfg.openTime;
        const close = cfg.close || cfg.end   || cfg.closeTime;
        if (!open  || !TIME_RE.test(open))  throw new Error(`workingHours.${day}.open must be HH:mm`);
        if (!close || !TIME_RE.test(close)) throw new Error(`workingHours.${day}.close must be HH:mm`);
        if (open >= close) throw new Error(`workingHours.${day}: open must be before close`);
      }
    }
    return true;
  }
  throw new Error('workingHours must be a string or a per-day object');
}

exports.createBusinessValidator = [
  check('name', 'Name is required').notEmpty(),
  check('category').optional().isString(),
  check('address').optional().isString(),
  check('phone').optional().isString(),
  check('email').optional().isEmail(),
  check('slotDuration').optional().isInt({ min: 5 }),
  check('workingHours').optional().custom(validateWorkingHours)
];

exports.updateBusinessValidator = [
  check('name').optional().notEmpty(),
  check('category').optional().isString(),
  check('address').optional().isString(),
  check('phone').optional().isString(),
  check('email').optional().isEmail(),
  check('slotDuration').optional().isInt({ min: 5 }),
  check('workingHours').optional().custom(validateWorkingHours)
];
