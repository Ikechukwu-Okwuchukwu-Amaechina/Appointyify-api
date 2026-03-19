const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary storage for business images
const businessImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'appointyify/businesses',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for user profile images
const userImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'appointyify/users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }],
  },
});

const bookingSampleStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'appointyify/bookings/samples',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  }),
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const bookingSampleFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  if (isImage || isPdf) {
    cb(null, true);
    return;
  }

  cb(new Error('Only image files or PDF files are allowed'), false);
};

const uploadBusinessImage = multer({
  storage: businessImageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const uploadUserImage = multer({
  storage: userImageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const uploadBookingSample = multer({
  storage: bookingSampleStorage,
  fileFilter: bookingSampleFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { uploadBusinessImage, uploadUserImage, uploadBookingSample };
