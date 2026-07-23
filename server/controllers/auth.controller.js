const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const generateToken = require('../utils/generateToken');
const ApiResponse = require('../utils/ApiResponse');

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json(ApiResponse.error('Email already registered'));
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json(
      ApiResponse.success({ token, user: user.toPublicJSON() }, 'Registration successful')
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json(ApiResponse.error('Invalid email or password'));
    }

    const token = generateToken(user._id);

    res.status(200).json(
      ApiResponse.success({ token, user: user.toPublicJSON() }, 'Login successful')
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json(ApiResponse.success({ user: req.user.toPublicJSON() }));
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// With stateless JWTs the client simply discards the token.
// This endpoint exists for consistency and future blocklist integration.
const logout = (_req, res) => {
  res.status(200).json(ApiResponse.success({}, 'Logged out successfully'));
};

module.exports = { register, login, getMe, logout };
