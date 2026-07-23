// ─── Environment variable validator ──────────────────────────────────────────
// Fail fast on startup if required env vars are missing.

const required = ['MONGO_URI', 'JWT_SECRET'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[env] Copy server/.env.example → server/.env and fill in the values.');
  process.exit(1);
}

module.exports = {
  PORT:           process.env.PORT           || '5000',
  MONGO_URI:      process.env.MONGO_URI,
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGIN:  process.env.CLIENT_ORIGIN  || 'http://localhost:5173',
  NODE_ENV:       process.env.NODE_ENV       || 'development',
};
