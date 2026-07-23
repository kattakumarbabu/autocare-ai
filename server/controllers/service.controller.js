const { validationResult } = require('express-validator');
const Service               = require('../models/Service.model');
const Vehicle               = require('../models/Vehicle.model');
const ApiResponse           = require('../utils/ApiResponse');
const { isCloudinaryReady } = require('../middleware/upload.middleware');

// Helper — Extract Cloudinary image info from req.file
const extractInvoiceData = (file) => {
  if (!file || !isCloudinaryReady) return {};
  return {
    invoiceImage:         file.path,
    invoiceImagePublicId: file.filename,
  };
};

// Helper — Delete image from Cloudinary
const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || !isCloudinaryReady) return;
  try {
    const cloudinary = require('../utils/cloudinary');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('[cloudinary] Failed to delete invoice image:', err.message);
  }
};

const { syncVehicleReminders } = require('../services/reminderGenerator.service');

// Helper — Sync Vehicle's lastServiceDate, nextServiceDate, and odometer
const syncVehicleServiceData = async (vehicleId) => {
  try {
    // Get latest service by serviceDate
    const latestService = await Service.findOne({ vehicle: vehicleId }).sort({ serviceDate: -1 });
    // Get latest nextServiceDate in the future (or most recent)
    const latestNextService = await Service.findOne({
      vehicle: vehicleId,
      nextServiceDate: { $ne: null },
    }).sort({ nextServiceDate: -1 });

    const updates = {};
    if (latestService) {
      if (latestService.serviceDate) updates.lastServiceDate = latestService.serviceDate;
      if (latestService.odometer) {
        const vehicle = await Vehicle.findById(vehicleId);
        if (vehicle && (!vehicle.odometer || latestService.odometer > vehicle.odometer)) {
          updates.odometer = latestService.odometer;
        }
      }
    }

    if (latestNextService && latestNextService.nextServiceDate) {
      updates.nextServiceDate = latestNextService.nextServiceDate;
    }

    if (Object.keys(updates).length > 0) {
      await Vehicle.findByIdAndUpdate(vehicleId, updates, { runValidators: true });
    }

    // Also sync automated reminders for this vehicle
    await syncVehicleReminders(vehicleId);
  } catch (err) {
    console.warn('[syncVehicleServiceData] Failed to sync vehicle service data:', err.message);
  }
};

// ─── POST /api/services ────────────────────────────────────────────────────────
const createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const {
      vehicleId,
      serviceType,
      serviceCenter,
      mechanicName,
      serviceDate,
      odometer,
      cost,
      partsChanged,
      nextServiceDate,
      notes,
    } = req.body;

    // Ensure target vehicle exists & belongs to logged-in user
    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json(ApiResponse.error('Vehicle not found or unauthorized'));
    }

    // Parse partsChanged if sent as string or array
    let partsArray = [];
    if (Array.isArray(partsChanged)) {
      partsArray = partsChanged;
    } else if (typeof partsChanged === 'string' && partsChanged.trim()) {
      try {
        partsArray = JSON.parse(partsChanged);
      } catch {
        partsArray = partsChanged.split(',').map((p) => p.trim()).filter(Boolean);
      }
    }

    const invoiceData = extractInvoiceData(req.file);

    const service = await Service.create({
      vehicle:     vehicle._id,
      user:        req.user._id,
      serviceType,
      serviceCenter,
      mechanicName,
      serviceDate: serviceDate || new Date(),
      odometer:    odometer ? Number(odometer) : undefined,
      cost:        cost ? Number(cost) : 0,
      partsChanged: partsArray,
      nextServiceDate: nextServiceDate || null,
      notes,
      ...invoiceData,
    });

    // Auto-update vehicle nextServiceDate, lastServiceDate, odometer & health score
    await syncVehicleServiceData(vehicle._id);

    res.status(201).json(ApiResponse.success({ service }, 'Service record logged successfully'));
  } catch (err) {
    if (req.file?.filename) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ─── GET /api/services/vehicle/:vehicleId ──────────────────────────────────────
const getServicesByVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { search, serviceType, sort = '-serviceDate', page = 1, limit = 20 } = req.query;

    // Verify vehicle ownership
    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json(ApiResponse.error('Vehicle not found'));
    }

    const query = { vehicle: vehicleId, user: req.user._id };

    if (serviceType && serviceType !== 'All') {
      query.serviceType = serviceType;
    }

    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { serviceCenter: rx },
        { mechanicName:  rx },
        { notes:         rx },
        { partsChanged:  rx },
      ];
    }

    const ALLOWED_SORTS = {
      serviceDate:   'serviceDate',
      '-serviceDate': '-serviceDate',
      cost:          'cost',
      '-cost':       '-cost',
      odometer:      'odometer',
      '-odometer':   '-odometer',
    };

    const sortOption = ALLOWED_SORTS[sort] || '-serviceDate';
    const pageNum    = Math.max(1, parseInt(page, 10));
    const limitNum   = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip       = (pageNum - 1) * limitNum;

    const [total, services, aggregates] = await Promise.all([
      Service.countDocuments(query),
      Service.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Service.aggregate([
        { $match: { vehicle: vehicle._id } },
        {
          $group: {
            _id:          null,
            totalCost:    { $sum: '$cost' },
            totalCount:   { $sum: 1 },
            avgCost:      { $avg: '$cost' },
          },
        },
      ]),
    ]);

    const stats = aggregates[0] || { totalCost: 0, totalCount: 0, avgCost: 0 };

    res.status(200).json(
      ApiResponse.success({
        services,
        stats: {
          totalCost:  Math.round(stats.totalCost || 0),
          totalCount: stats.totalCount || 0,
          avgCost:    Math.round(stats.avgCost || 0),
        },
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

// ─── GET /api/services/:id ─────────────────────────────────────────────────────
const getService = async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, user: req.user._id }).populate('vehicle');
    if (!service) {
      return res.status(404).json(ApiResponse.error('Service record not found'));
    }
    res.status(200).json(ApiResponse.success({ service }));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/services/:id ─────────────────────────────────────────────────────
const updateService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const service = await Service.findOne({ _id: req.params.id, user: req.user._id });
    if (!service) {
      return res.status(404).json(ApiResponse.error('Service record not found'));
    }

    const {
      serviceType,
      serviceCenter,
      mechanicName,
      serviceDate,
      odometer,
      cost,
      partsChanged,
      nextServiceDate,
      notes,
    } = req.body;

    let partsArray = service.partsChanged;
    if (Array.isArray(partsChanged)) {
      partsArray = partsChanged;
    } else if (typeof partsChanged === 'string') {
      try {
        partsArray = JSON.parse(partsChanged);
      } catch {
        partsArray = partsChanged.split(',').map((p) => p.trim()).filter(Boolean);
      }
    }

    let invoiceData = {};
    if (req.file) {
      if (service.invoiceImagePublicId) {
        await deleteCloudinaryImage(service.invoiceImagePublicId);
      }
      invoiceData = extractInvoiceData(req.file);
    }

    const updatedService = await Service.findByIdAndUpdate(
      service._id,
      {
        serviceType,
        serviceCenter,
        mechanicName,
        serviceDate,
        odometer:    odometer ? Number(odometer) : service.odometer,
        cost:        cost ? Number(cost) : service.cost,
        partsChanged: partsArray,
        nextServiceDate: nextServiceDate || null,
        notes,
        ...invoiceData,
      },
      { new: true, runValidators: true }
    );

    // Sync vehicle dates
    await syncVehicleServiceData(service.vehicle);

    res.status(200).json(ApiResponse.success({ service: updatedService }, 'Service record updated'));
  } catch (err) {
    if (req.file?.filename) await deleteCloudinaryImage(req.file.filename);
    next(err);
  }
};

// ─── DELETE /api/services/:id ──────────────────────────────────────────────────
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, user: req.user._id });
    if (!service) {
      return res.status(404).json(ApiResponse.error('Service record not found'));
    }

    const vehicleId = service.vehicle;
    await deleteCloudinaryImage(service.invoiceImagePublicId);
    await service.deleteOne();

    // Sync vehicle dates after deletion
    await syncVehicleServiceData(vehicleId);

    res.status(200).json(ApiResponse.success({}, 'Service record deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createService,
  getServicesByVehicle,
  getService,
  updateService,
  deleteService,
};
