const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const { register, login, getMe, updateProfile, forgotPassword, resetPassword, uploadProfileImage, deleteProfileImage } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const { uploadUserImage } = require('../middleware/upload');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/profile/image', protect, uploadUserImage.single('image'), uploadProfileImage);
router.delete('/profile/image', protect, deleteProfileImage);

module.exports = router;
