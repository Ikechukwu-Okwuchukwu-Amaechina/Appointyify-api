const Business = require('../models/Business');
const User = require('../models/User');

exports.createBusiness = async (req, res) => {
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
  try {
    const b = await Business.findById(req.params.id);
    if (!b) return res.status(404).json({ msg: 'Not found' });
    if (String(b.owner) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    await b.remove();
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
