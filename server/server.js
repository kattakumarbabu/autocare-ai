// Load env vars before any other module reads them
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { PORT, CLIENT_ORIGIN, NODE_ENV } = require('./config/env');
const connectDB      = require('./config/db');
const routes         = require('./routes/index');
const errorHandler   = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Create Express app ────────────────────────────────────────────────────────
const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ──────────────────────────────────────────────────────────────
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start server & background jobs ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] AutoCare AI API running on http://localhost:${PORT} (${NODE_ENV})`);

  // Run overdue reminder check on startup and schedule every 6 hours
  const { checkAndMarkOverdueReminders } = require('./services/reminderGenerator.service');
  checkAndMarkOverdueReminders();
  setInterval(checkAndMarkOverdueReminders, 6 * 60 * 60 * 1000);
});

module.exports = app; // For testing
