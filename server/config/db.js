const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas.
 * Exits process on first connection failure — keeps container restarts meaningful.
 */
const connectDB = async () => {
  const { MONGO_URI, NODE_ENV } = require('./env');

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      // Mongoose 7+ options (most deprecated options removed)
      serverSelectionTimeoutMS: 5000,
    });

    if (NODE_ENV !== 'test') {
      console.log(`[db] MongoDB connected: ${conn.connection.host}`);
    }
  } catch (err) {
    console.error(`[db] Connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
