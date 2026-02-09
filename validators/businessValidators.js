const { check } = require('express-validator');

exports.createBusinessValidator = [
  check('name', 'Name is required').notEmpty(),
  check('category').optional().isString(),
  check('address').optional().isString(),
  check('phone').optional().isString(),
  check('email').optional().isEmail(),
  check('slotDuration').optional().isInt({ min: 5 })
];

exports.updateBusinessValidator = [
  check('name').optional().notEmpty(),
  check('category').optional().isString(),
  check('address').optional().isString(),
  check('phone').optional().isString(),
  check('email').optional().isEmail(),
  check('slotDuration').optional().isInt({ min: 5 })
];
