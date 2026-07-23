const express = require('express');
const { body, param } = require('express-validator');
const {
  createService,
  getServicesByVehicle,
  getService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');
const { protect }    = require('../middleware/authMiddleware');
const { upload }     = require('../middleware/upload.middleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Protect all routes with JWT & rate limiter
router.use(protect);
router.use(apiLimiter);

const optDate = (field) =>
  body(field).optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage(`${field}: valid date required`);

const serviceValidation = [
  body('vehicleId')
    .optional({ checkFalsy: true })
    .isMongoId().withMessage('Invalid vehicle ID'),

  body('serviceType')
    .trim().notEmpty().withMessage('Service type is required')
    .isIn([
      'General Service',
      'Oil Change',
      'Brake Repair',
      'Tire Replacement',
      'Battery Replacement',
      'Engine Repair',
      'Transmission Repair',
      'AC Service',
      'Body Work',
      'Inspection',
      'Other',
    ]).withMessage('Invalid service type'),

  body('serviceCenter')
    .optional({ checkFalsy: true }).trim().isLength({ max: 100 }),

  body('mechanicName')
    .optional({ checkFalsy: true }).trim().isLength({ max: 50 }),

  body('odometer')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Odometer reading must be ≥ 0'),

  body('cost')
    .optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Cost must be ≥ 0'),

  body('notes')
    .optional({ checkFalsy: true }).isLength({ max: 1000 }),

  optDate('serviceDate'),
  optDate('nextServiceDate'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid service record ID')];
const vehicleIdValidation = [param('vehicleId').isMongoId().withMessage('Invalid vehicle ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.post  ('/',                      upload.single('invoiceImage'), serviceValidation, createService);
router.get   ('/vehicle/:vehicleId',    vehicleIdValidation, getServicesByVehicle);
router.get   ('/:id',                   idValidation, getService);
router.put   ('/:id',                   upload.single('invoiceImage'), idValidation, serviceValidation, updateService);
router.delete('/:id',                   idValidation, deleteService);

module.exports = router;
