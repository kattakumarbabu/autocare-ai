const express  = require('express');
const multer   = require('multer');
const { body, param } = require('express-validator');
const {
  getAnalytics,
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expense.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

const EXPENSE_CATEGORIES = ['Fuel', 'Service', 'Insurance', 'PUC', 'Repair', 'Accessories', 'Parking', 'Toll', 'Fine', 'Other'];
const PAYMENT_METHODS   = ['Cash', 'Card', 'UPI', 'NetBanking', 'Other'];

const expenseValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .trim().isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(EXPENSE_CATEGORIES).withMessage('Invalid expense category'),

  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),

  body('expenseDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Valid date required'),

  body('vehicleId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid vehicle ID'),

  body('paymentMethod')
    .optional({ checkFalsy: true })
    .isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid expense ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get   ('/analytics', getAnalytics);
router.get   ('/',          getExpenses);
router.get   ('/:id',       idValidation, getExpense);
router.post  ('/',          upload.single('receiptImage'), expenseValidation, createExpense);
router.put   ('/:id',       idValidation, upload.single('receiptImage'), expenseValidation, updateExpense);
router.delete('/:id',       idValidation, deleteExpense);

module.exports = router;
