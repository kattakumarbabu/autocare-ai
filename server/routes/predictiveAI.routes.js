const express = require('express');
const { body }  = require('express-validator');
const {
  getDashboardData,
  getTimeline,
  getMonthlyReportData,
  getAnnualReportData,
  predictiveChat,
} = require('../controllers/predictiveAI.controller');
const { protect }    = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(apiLimiter);

router.get ('/dashboard',        getDashboardData);
router.get ('/timeline',         getTimeline);
router.get ('/reports/monthly',  getMonthlyReportData);
router.get ('/reports/annual',   getAnnualReportData);
router.post('/chat',            [body('prompt').notEmpty().withMessage('Prompt is required')], predictiveChat);

module.exports = router;
