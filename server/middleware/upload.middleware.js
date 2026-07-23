const multer = require('multer');

// ── Determine storage backend ──────────────────────────────────────────────────
// If Cloudinary env vars are present → upload to cloud.
// Otherwise → use in-memory storage (image field will be null).
const isCloudinaryReady =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY    &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (isCloudinaryReady) {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  const cloudinary = require('../utils/cloudinary');

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:              'autocare-ai/vehicles',
      allowed_formats:     ['jpg', 'jpeg', 'png', 'webp'],
      transformation:      [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    },
  });
} else {
  // Fallback: store in memory; the controller will skip cloud persistence
  storage = multer.memoryStorage();
}

// ── File filter ────────────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'), false);
  }
};

// ── Export configured multer instance ─────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload, isCloudinaryReady };
