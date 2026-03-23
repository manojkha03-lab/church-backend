const path = require('path');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'church-app/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif']);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(String(file.originalname || '').toLowerCase());
  if ((file.mimetype && file.mimetype.startsWith('image/')) || allowedExtensions.has(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only image uploads are allowed (jpg, png, webp, heic, avif).'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

module.exports = upload;