const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness
} = require('../controllers/businessController');

router.post('/', protect, createBusiness);
router.get('/', getAllBusinesses);
router.get('/:id', getBusinessById);
router.patch('/:id', protect, updateBusiness);
router.delete('/:id', protect, restrictTo('admin'), deleteBusiness);

module.exports = router;
