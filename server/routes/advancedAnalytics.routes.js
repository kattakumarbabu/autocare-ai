const express = require('express');
const { getAdvancedAnalytics } = require('../controllers/advancedAnalytics.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.get('/', getAdvancedAnalytics);

module.exports = router;
