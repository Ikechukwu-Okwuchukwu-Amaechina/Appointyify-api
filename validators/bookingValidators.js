const { check } = require('express-validator');

exports.bookingValidator = [
  check('business', 'Valid business is required').isMongoId(),
  check('date', 'Valid date is required').isISO8601(),
  check('startTime', 'startTime is required (HH:mm)').matches(/^\d{2}:\d{2}$/)
];
