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
    // Mongoose won't auto-detect changes on Mixed fields — mark it explicitly
    if (req.body.workingHours !== undefined) b.markModified('workingHours');
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

// Upload one or more business images (up to 10 per request)
exports.uploadBusinessImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No image files provided' });
    }

    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ msg: 'Business not found' });

    if (String(business.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    // Append newly uploaded files to the images array
    req.files.forEach(file => {
      business.images.push({ url: file.path, publicId: file.filename });
    });
    await business.save();

    res.json({ msg: 'Images uploaded successfully', images: business.images, business });
  } catch (err) {
    res.status(500).json({ msg: 'Image upload failed', error: err.message });
  }
};

// Delete a specific business image by publicId (sent in request body)
exports.deleteBusinessImage = async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ msg: 'Business not found' });

    if (String(business.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ msg: 'publicId is required' });

    const imageIndex = business.images.findIndex(img => img.publicId === publicId);
    if (imageIndex === -1) return res.status(404).json({ msg: 'Image not found' });

    await cloudinary.uploader.destroy(publicId);
    business.images.splice(imageIndex, 1);
    await business.save();

    res.json({ msg: 'Image deleted successfully', images: business.images });
  } catch (err) {
    res.status(500).json({ msg: 'Image deletion failed', error: err.message });
  }
};
