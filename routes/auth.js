const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

router.post('/register', [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Include a valid email').isEmail(),
  check('password', 'Password min 6 chars').isLength({ min: 6 }),
], register);

router.post('/login', [
  check('email', 'Include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
], login);

router.get('/me', protect, getMe);

module.exports = router;
