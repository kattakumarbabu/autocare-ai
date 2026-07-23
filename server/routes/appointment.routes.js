const express = require('express');
const { body, param } = require('express-validator');
const {
  getMechanics,
  getMechanicById,
  getStats,
  getAppointments,
  getAppointmentById,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  updateStatus,
  submitReview,
  getMechanicDashboard,
} = require('../controllers/appointment.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

const bookValidation = [
  body('vehicleId').notEmpty().isMongoId().withMessage('Valid vehicle ID required'),
  body('appointmentDate').notEmpty().isISO8601().withMessage('Valid appointment date required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time slot is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid appointment ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get ('/mechanics/dashboard', getMechanicDashboard);
router.get ('/mechanics',           getMechanics);
router.get ('/mechanics/:id',       getMechanicById);

router.get ('/stats',        getStats);
router.get ('/',             getAppointments);
router.get ('/:id',          idValidation, getAppointmentById);
router.post('/',             bookValidation, bookAppointment);
router.put ('/:id/reschedule', idValidation, rescheduleAppointment);
router.put ('/:id/cancel',   idValidation, cancelAppointment);
router.put ('/:id/status',   idValidation, updateStatus);
router.post('/:id/review',   idValidation, submitReview);

module.exports = router;
