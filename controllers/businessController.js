const Business = require('../models/Business');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

exports.createBusiness = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    // Only users with role 'business' (or admin) can create businesses
    if (!req.user || (req.user.role !== 'business' && req.user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Only business accounts can create businesses' });
    }
    const data = { ...req.body, owner: req.user._id };
    const business = await Business.create(data);
    res.status(201).json(business);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request', error: err.message });
  }
};

exports.getAllBusinesses = async (req, res) => {
  try {
    const { search, category, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const skip = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);
    const list = await Business.find(filter).populate('owner', '-password').skip(skip).limit(parseInt(limit, 10));
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getBusinessById = async (req, res) => {
  try {
    const b = await Business.findById(req.params.id).populate('owner', '-password');
    if (!b) return res.status(404).json({ msg: 'Not found' });
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request' });
  }
};

exports.updateBusiness = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const b = await Business.findById(req.params.id);
    if (!b) return res.status(404).json({ msg: 'Not found' });
    if (String(b.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    Object.assign(b, req.body);
    await b.save();
    res.json(b);
  } catch (err) {
    res.status(400).json({ msg: 'Bad request' });
  }
};

exports.deleteBusiness = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const b = await Business.findById(req.params.id);
    if (!b) return res.status(404).json({ msg: 'Not found' });
    if (String(b.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    await Business.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(400).json({ msg: 'Bad request' });
  }
};

exports.getMyBusinesses = async (req, res) => {
  try {
    const list = await Business.find({ owner: req.user._id });
    res.json(list);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Upload business image
exports.uploadBusinessImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file provided' });
    }

    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ msg: 'Business not found' });

    if (String(business.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    // Delete old image from Cloudinary if it exists
    if (business.imagePublicId) {
      await cloudinary.uploader.destroy(business.imagePublicId);
    }

    business.image = req.file.path;
    business.imagePublicId = req.file.filename;
    await business.save();

    res.json({ msg: 'Image uploaded successfully', image: business.image, business });
  } catch (err) {
    res.status(500).json({ msg: 'Image upload failed', error: err.message });
  }
};

// Delete business image
exports.deleteBusinessImage = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ msg: 'Business not found' });

    if (String(business.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    if (!business.imagePublicId) {
      return res.status(400).json({ msg: 'No image to delete' });
    }

    await cloudinary.uploader.destroy(business.imagePublicId);
    business.image = undefined;
    business.imagePublicId = undefined;
    await business.save();

    res.json({ msg: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Image deletion failed', error: err.message });
  }
};
