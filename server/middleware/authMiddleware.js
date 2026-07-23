const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Protect middleware — verifies Bearer JWT and attaches req.user.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(ApiResponse.error('Not authorized — no token'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user (without password) to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json(ApiResponse.error('Not authorized — user not found'));
    }

    next();
  } catch (err) {
    return res.status(401).json(ApiResponse.error('Not authorized — invalid token'));
  }
};

/**
 * Role-based authorization factory.
 * Usage: router.get('/admin', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res
      .status(403)
      .json(ApiResponse.error(`Role "${req.user.role}" is not allowed to access this resource`));
  }
  next();
};

module.exports = { protect, authorize };
