const express = require('express');
const { body, param } = require('express-validator');
const {
  getVehicles, getStats, getVehicle,
  createVehicle, updateVehicle, deleteVehicle,
} = require('../controllers/vehicle.controller');
const { protect }    = require('../middleware/authMiddleware');
const { upload }     = require('../middleware/upload.middleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── All routes require JWT ─────────────────────────────────────────────────────
router.use(protect);
router.use(apiLimiter);

// ── Reusable date validator (optional ISO8601) ─────────────────────────────────
const optDate = (field) =>
  body(field).optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage(`${field}: valid date required`);

// ── Validation rules ───────────────────────────────────────────────────────────
const vehicleValidation = [
  body('vehicleType')
    .trim().notEmpty().withMessage('Vehicle type is required')
    .isIn(['Car', 'Bike', 'Scooter', 'Truck']).withMessage('vehicleType must be Car, Bike, Scooter, or Truck'),

  body('brand')
    .trim().notEmpty().withMessage('Brand is required').isLength({ max: 50 }),

  body('model')
    .trim().notEmpty().withMessage('Model is required').isLength({ max: 50 }),

  body('variant')
    .optional({ checkFalsy: true }).trim().isLength({ max: 50 }),

  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),

  body('registrationNumber')
    .trim().notEmpty().withMessage('Registration number is required')
    .isLength({ max: 20 })
    .toUpperCase(),

  body('color')
    .optional({ checkFalsy: true }).trim().isLength({ max: 30 }),

  body('fuelType')
    .optional({ checkFalsy: true })
    .isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG']),

  body('transmission')
    .optional({ checkFalsy: true })
    .isIn(['Manual', 'Automatic', 'Semi-Automatic']),

  body('odometer')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Odometer must be ≥ 0'),

  body('serviceIntervalKm')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }),

  body('serviceIntervalMonths')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }),

  body('notes')
    .optional({ checkFalsy: true }).isLength({ max: 500 }),

  optDate('purchaseDate'),
  optDate('insuranceExpiry'),
  optDate('pucExpiry'),
  optDate('warrantyExpiry'),
  optDate('lastServiceDate'),
  optDate('nextServiceDate'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid vehicle ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get   ('/',      getVehicles);
router.get   ('/stats', getStats);
router.get   ('/:id',   idValidation,                                          getVehicle);
router.post  ('/',      upload.single('image'), vehicleValidation,             createVehicle);
router.put   ('/:id',   upload.single('image'), idValidation, vehicleValidation, updateVehicle);
router.delete('/:id',   idValidation,                                          deleteVehicle);

module.exports = router;
