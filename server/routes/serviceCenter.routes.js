const express = require('express');
const { param } = require('express-validator');
const {
  getNearbyServiceCenters,
  searchServiceCenters,
  getServiceCenterById,
} = require('../controllers/serviceCenter.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

const idValidation = [param('id').isMongoId().withMessage('Invalid service center ID')];

// ── Routes ─────────────────────────────────────────────────────────────────────
router.get('/nearby', getNearbyServiceCenters);
router.get('/',       searchServiceCenters);
router.get('/:id',   idValidation, getServiceCenterById);

module.exports = router;
