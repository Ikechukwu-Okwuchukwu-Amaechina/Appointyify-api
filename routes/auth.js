const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); // Let's stop those hackers!
const { protect } = require('../middleware/auth');
const { register, login, getMe, updateProfile, forgotPassword, resetPassword, uploadProfileImage, deleteProfileImage, verifyOTP } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const { uploadUserImage } = require('../middleware/upload');

// Security! Brute force protection on login route! Max 5 attempts per 15 mins.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: { msg: 'Too many login attempts, please try again after 15 minutes' }
});

router.post('/register', registerValidator, register);
// Adding loginLimiter right before the validator!
router.post('/login', loginLimiter, loginValidator, login);
// New route for OTP verification!
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/profile/image', protect, uploadUserImage.single('image'), uploadProfileImage);
router.delete('/profile/image', protect, deleteProfileImage);

module.exports = router;
