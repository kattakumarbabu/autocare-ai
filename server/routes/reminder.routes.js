const express = require('express');
const { body, param } = require('express-validator');
const {
  getStats,
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  markCompleted,
  snoozeReminder,
  restoreReminder,
  deleteReminder,
} = require('../controllers/reminder.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

const reminderValidation = [
  body('title')
    .trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional({ checkFalsy: true }).trim().isLength({ max: 500 }),

  body('reminderType')
    .optional({ checkFalsy: true })
    .isIn(['Service', 'Insurance', 'PUC', 'Warranty', 'Custom'])
    .withMessage('Invalid reminder type'),

  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Valid due date required'),

  body('priority')
    .optional({ checkFalsy: true })
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid priority level'),

  body('isRecurring')
    .optional().isBoolean(),

  body('recurringInterval')
    .optional({ checkFalsy: true })
    .isIn(['Monthly', 'Quarterly', 'Semi-Annually', 'Annually']),

  body('vehicleId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId().withMessage('Invalid vehicle ID'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid reminder ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get   ('/stats',         getStats);
router.get   ('/',              getReminders);
router.get   ('/:id',           idValidation, getReminder);
router.post  ('/',              reminderValidation, createReminder);
router.put   ('/:id',           idValidation, reminderValidation, updateReminder);
router.put   ('/:id/complete',  idValidation, markCompleted);
router.put   ('/:id/snooze',    idValidation, snoozeReminder);
router.put   ('/:id/restore',   idValidation, restoreReminder);
router.delete('/:id',           idValidation, deleteReminder);

module.exports = router;
