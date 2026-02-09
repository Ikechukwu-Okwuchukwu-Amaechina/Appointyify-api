const { check } = require('express-validator');

exports.registerValidator = [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Include a valid email').isEmail(),
  check('password', 'Password min 6 chars').isLength({ min: 6 }),
  check('role').optional().isIn(['user', 'business', 'admin'])
];

exports.loginValidator = [
  check('email', 'Include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
];
