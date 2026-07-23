const express  = require('express');
const multer   = require('multer');
const { body, param } = require('express-validator');
const {
  getStats,
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} = require('../controllers/document.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for PDFs & images
});

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

const DOCUMENT_TYPES = [
  'RC',
  'Insurance',
  'PUC',
  'Driving License',
  'Warranty',
  'Service Bill',
  'Pollution Certificate',
  'Other',
];

const documentValidation = [
  body('title')
    .notEmpty().withMessage('Document title is required')
    .trim().isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),

  body('documentType')
    .notEmpty().withMessage('Document type is required')
    .isIn(DOCUMENT_TYPES).withMessage('Invalid document type'),

  body('vehicleId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid vehicle ID'),

  body('issueDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Valid issue date required'),

  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Valid expiry date required'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid document ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get   ('/stats', getStats);
router.get   ('/',      getDocuments);
router.get   ('/:id',   idValidation, getDocument);
router.post  ('/',      upload.single('file'), documentValidation, createDocument);
router.put   ('/:id',   idValidation, upload.single('file'), documentValidation, updateDocument);
router.delete('/:id',   idValidation, deleteDocument);

module.exports = router;
