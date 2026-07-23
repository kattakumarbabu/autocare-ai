const express = require('express');
const { body }  = require('express-validator');
const {
  getAIInsights,
  chatWithAI,
  getMonthlyReport,
} = require('../controllers/ai.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.get ('/insights',       getAIInsights);
router.get ('/monthly-report', getMonthlyReport);
router.post('/chat',           [body('prompt').notEmpty().withMessage('Prompt is required')], chatWithAI);

module.exports = router;
