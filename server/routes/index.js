const express                 = require('express');
const authRoutes              = require('./auth.routes');
const vehicleRoutes           = require('./vehicle.routes');
const serviceRoutes           = require('./service.routes');
const reminderRoutes          = require('./reminder.routes');
const fuelRoutes              = require('./fuel.routes');
const expenseRoutes           = require('./expense.routes');
const documentRoutes          = require('./document.routes');
const serviceCenterRoutes    = require('./serviceCenter.routes');
const aiRoutes                = require('./ai.routes');
const predictiveAIRoutes      = require('./predictiveAI.routes');
const appointmentRoutes       = require('./appointment.routes');
const digitalTwinRoutes       = require('./digitalTwin.routes');
const resaleAIRoutes          = require('./resaleAI.routes');
const performanceReportRoutes = require('./performanceReport.routes');
const advancedAnalyticsRoutes = require('./advancedAnalytics.routes');
const emergencyRoutes         = require('./emergency.routes');

const router = express.Router();

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AutoCare AI API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Feature routes ────────────────────────────────────────────────────────────
router.use('/auth',               authRoutes);
router.use('/vehicles',           vehicleRoutes);
router.use('/services',           serviceRoutes);
router.use('/reminders',          reminderRoutes);
router.use('/fuel',               fuelRoutes);
router.use('/expenses',           expenseRoutes);
router.use('/documents',          documentRoutes);
router.use('/service-centers',    serviceCenterRoutes);
router.use('/ai',                 aiRoutes);
router.use('/predictive-ai',      predictiveAIRoutes);
router.use('/appointments',       appointmentRoutes);
router.use('/digital-twin',       digitalTwinRoutes);
router.use('/resale-ai',          resaleAIRoutes);
router.use('/performance-report', performanceReportRoutes);
router.use('/advanced-analytics', advancedAnalyticsRoutes);
router.use('/emergency',          emergencyRoutes);

module.exports = router;
