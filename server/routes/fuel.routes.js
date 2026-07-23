const express = require('express');
const { body, param } = require('express-validator');
const {
  getStats,
  getFuelLogs,
  getFuelLog,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
} = require('../controllers/fuel.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

const fuelValidation = [
  body('vehicleId')
    .notEmpty().withMessage('Vehicle is required')
    .isMongoId().withMessage('Invalid vehicle ID'),

  body('date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Valid date required'),

  body('odometer')
    .notEmpty().withMessage('Odometer reading is required')
    .isFloat({ min: 0 }).withMessage('Odometer must be ≥ 0'),

  body('fuelQuantity')
    .notEmpty().withMessage('Fuel quantity (liters) is required')
    .isFloat({ min: 0.01 }).withMessage('Fuel quantity must be > 0'),

  body('fuelCost')
    .notEmpty().withMessage('Fuel cost is required')
    .isFloat({ min: 0 }).withMessage('Fuel cost must be ≥ 0'),

  body('fuelPricePerLiter')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Price per liter must be ≥ 0'),

  body('fuelStation')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }),

  body('paymentMethod')
    .optional({ checkFalsy: true })
    .isIn(['Cash', 'Card', 'UPI']).withMessage('Invalid payment method'),

  body('fullTank')
    .optional().isBoolean(),

  body('notes')
    .optional({ checkFalsy: true }).isLength({ max: 500 }),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid fuel entry ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get   ('/stats', getStats);
router.get   ('/',      getFuelLogs);
router.get   ('/:id',   idValidation, getFuelLog);
router.post  ('/',      fuelValidation, createFuelLog);
router.put   ('/:id',   idValidation, fuelValidation, updateFuelLog);
router.delete('/:id',   idValidation, deleteFuelLog);

module.exports = router;
