const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getMyBusinesses,
  uploadBusinessImage,
  deleteBusinessImage
} = require('../controllers/businessController');
const { createBusinessValidator, updateBusinessValidator } = require('../validators/businessValidators');
const { idValidator } = require('../validators/idValidator');
const { uploadBusinessImage: uploadBusinessImageMiddleware } = require('../middleware/upload');

router.post('/', protect, createBusinessValidator, createBusiness);
router.get('/', getAllBusinesses);

// Fixing the 404 routing bug by explicitly adding the /profile route here!
router.get('/profile', protect, getMyBusinesses);
router.get('/mine', protect, getMyBusinesses);
router.get('/my-business', protect, getMyBusinesses);

router.get('/:id', idValidator, getBusinessById);
router.patch('/:id', protect, idValidator, updateBusinessValidator, updateBusiness);
router.delete('/:id', protect, idValidator, deleteBusiness);
router.post('/:id/image', protect, idValidator, uploadBusinessImageMiddleware.array('images', 10), uploadBusinessImage);
router.delete('/:id/image', protect, idValidator, deleteBusinessImage);

module.exports = router;
