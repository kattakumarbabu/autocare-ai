const { validationResult } = require('express-validator');
const Vehicle               = require('../models/Vehicle.model');
const Reminder              = require('../models/Reminder.model');
const ApiResponse           = require('../utils/ApiResponse');
const { isCloudinaryReady } = require('../middleware/upload.middleware');
const { syncVehicleReminders } = require('../services/reminderGenerator.service');

// ── Cloudinary image helpers ───────────────────────────────────────────────────
const extractImageData = (file) => {
  if (!file || !isCloudinaryReady) return {};
  return { image: file.path, imagePublicId: file.filename };
};

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || !isCloudinaryReady) return;
  try {
    const cloudinary = require('../utils/cloudinary');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[cloudinary] Failed to delete image:', err.message);
  }
};

// ─── GET /api/vehicles ─────────────────────────────────────────────────────────
const getVehicles = async (req, res, next) => {
  try {
    const {
      search, vehicleType,
      sort   = '-createdAt',
      page   = 1,
      limit  = 9,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const query = { owner: req.user._id };

    if (vehicleType && vehicleType !== 'All') {
      query.vehicleType = vehicleType;
    }
    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { registrationNumber: rx },
        { brand:              rx },
        { model:              rx },
        { variant:            rx },
      ];
    }

    const ALLOWED_SORTS = {
      nextServiceDate:  'nextServiceDate',
      '-nextServiceDate': '-nextServiceDate',
      insuranceExpiry:  'insuranceExpiry',
      year:             'year',
      '-year':          '-year',
      brand:            'brand',
      createdAt:        'createdAt',
      '-createdAt':     '-createdAt',
    };
    const sortField = ALLOWED_SORTS[sort] || '-createdAt';

    const [total, vehicles] = await Promise.all([
      Vehicle.countDocuments(query),
      Vehicle.find(query).sort(sortField).skip(skip).limit(limitNum),
    ]);

    res.status(200).json(
      ApiResponse.success({
        vehicles,
        pagination: {
          total,
          page:    pageNum,
          limit:   limitNum,
          pages:   Math.ceil(total / limitNum),
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/vehicles/stats ───────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now    = new Date();
    const in30   = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [total, serviceDueSoon, insuranceExpiringSoon, allVehicles] =
      await Promise.all([
        Vehicle.countDocuments({ owner: userId }),
        Vehicle.countDocuments({
          owner:           userId,
          nextServiceDate: { $gte: now, $lte: in30 },
        }),
        Vehicle.countDocuments({
          owner:           userId,
          insuranceExpiry: { $gte: now, $lte: in30 },
        }),
        Vehicle.find({ owner: userId }),
      ]);

    const avgHealthScore =
      allVehicles.length > 0
        ? Math.round(
            allVehicles.reduce((sum, v) => sum + v.healthScore, 0) /
              allVehicles.length
          )
        : 0;

    res.status(200).json(
      ApiResponse.success({ total, serviceDueSoon, insuranceExpiringSoon, avgHealthScore })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/vehicles/:id ─────────────────────────────────────────────────────
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));
    res.status(200).json(ApiResponse.success({ vehicle }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/vehicles ────────────────────────────────────────────────────────
const createVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));

    const {
      vehicleType, brand, model, variant, year, registrationNumber,
      color, fuelType, transmission, odometer,
      purchaseDate, insuranceExpiry, pucExpiry, warrantyExpiry,
      lastServiceDate, nextServiceDate, serviceIntervalKm, serviceIntervalMonths,
      notes,
    } = req.body;

    const imageData = extractImageData(req.file);

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      vehicleType, brand, model, variant, year, registrationNumber,
      color, fuelType, transmission, odometer,
      purchaseDate, insuranceExpiry, pucExpiry, warrantyExpiry,
      lastServiceDate, nextServiceDate, serviceIntervalKm, serviceIntervalMonths,
      notes,
      ...imageData,
    });

    // Auto-generate reminders for insurance, PUC, warranty & service dates
    await syncVehicleReminders(vehicle._id);

    res.status(201).json(ApiResponse.success({ vehicle }, 'Vehicle added successfully'));
  } catch (err) {
    if (req.file?.filename) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ─── PUT /api/vehicles/:id ─────────────────────────────────────────────────────
const updateVehicle = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));

    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));

    const {
      vehicleType, brand, model, variant, year, registrationNumber,
      color, fuelType, transmission, odometer,
      purchaseDate, insuranceExpiry, pucExpiry, warrantyExpiry,
      lastServiceDate, nextServiceDate, serviceIntervalKm, serviceIntervalMonths,
      notes,
    } = req.body;

    let imageData = {};
    if (req.file) {
      if (vehicle.imagePublicId) await deleteCloudinaryImage(vehicle.imagePublicId);
      imageData = extractImageData(req.file);
    }

    const updated = await Vehicle.findByIdAndUpdate(
      vehicle._id,
      {
        vehicleType, brand, model, variant, year, registrationNumber,
        color, fuelType, transmission, odometer,
        purchaseDate, insuranceExpiry, pucExpiry, warrantyExpiry,
        lastServiceDate, nextServiceDate, serviceIntervalKm, serviceIntervalMonths,
        notes,
        ...imageData,
      },
      { new: true, runValidators: true }
    );

    // Sync automated compliance & service reminders
    await syncVehicleReminders(updated._id);

    res.status(200).json(ApiResponse.success({ vehicle: updated }, 'Vehicle updated successfully'));
  } catch (err) {
    if (req.file?.filename) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ─── DELETE /api/vehicles/:id ──────────────────────────────────────────────────
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));

    await deleteCloudinaryImage(vehicle.imagePublicId);
    // Delete associated reminders
    await Reminder.deleteMany({ vehicle: vehicle._id });
    await vehicle.deleteOne();

    res.status(200).json(ApiResponse.success({}, 'Vehicle deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getVehicles, getStats, getVehicle, createVehicle, updateVehicle, deleteVehicle };
