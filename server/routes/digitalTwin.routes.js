const express = require('express');
const { param } = require('express-validator');
const { getVehicleDigitalTwin } = require('../controllers/digitalTwin.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.get(
  '/vehicle/:vehicleId',
  [param('vehicleId').isMongoId().withMessage('Invalid vehicle ID')],
  getVehicleDigitalTwin
);

module.exports = router;
