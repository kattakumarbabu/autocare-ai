const { validationResult } = require('express-validator');
const FuelLog               = require('../models/FuelLog.model');
const Vehicle               = require('../models/Vehicle.model');
const ApiResponse           = require('../utils/ApiResponse');

// Helper to compute mileage and costPerKm on a list of logs sorted by date ascending
const computeFuelLogMetrics = (logs) => {
  return logs.map((entry, idx) => {
    const obj = entry.toObject ? entry.toObject() : { ...entry };
    if (idx === 0) {
      obj.calculatedMileage = null;
      obj.costPerKm         = null;
      obj.distanceDriven    = 0;
    } else {
      const prev = logs[idx - 1];
      const dist = entry.odometer - prev.odometer;
      if (dist > 0 && entry.fuelQuantity > 0) {
        obj.distanceDriven    = dist;
        obj.calculatedMileage = Number((dist / entry.fuelQuantity).toFixed(2));
        obj.costPerKm         = Number((entry.fuelCost / dist).toFixed(2));
      } else {
        obj.distanceDriven    = Math.max(0, dist);
        obj.calculatedMileage = null;
        obj.costPerKm         = null;
      }
    }
    return obj;
  });
};

// ─── GET /api/fuel/stats ───────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const query = { user: req.user._id };
    if (vehicleId) query.vehicle = vehicleId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all logs sorted by date ascending to calculate mileage history
    const allLogsAsc = await FuelLog.find(query).sort({ date: 1, odometer: 1 });
    const computedLogs = computeFuelLogMetrics(allLogsAsc);

    // Monthly consumption & expenses
    const currentMonthLogs = computedLogs.filter((l) => new Date(l.date) >= startOfMonth);
    const monthlyFuelConsumption = Number(currentMonthLogs.reduce((sum, l) => sum + (l.fuelQuantity || 0), 0).toFixed(1));
    const monthlyFuelExpenses    = Number(currentMonthLogs.reduce((sum, l) => sum + (l.fuelCost || 0), 0).toFixed(2));

    // Valid calculated mileages
    const validMileages = computedLogs.map((l) => l.calculatedMileage).filter((m) => typeof m === 'number' && m > 0);

    const avgMileage    = validMileages.length > 0 ? Number((validMileages.reduce((a, b) => a + b, 0) / validMileages.length).toFixed(2)) : 0;
    const bestMileage   = validMileages.length > 0 ? Math.max(...validMileages) : 0;
    const lowestMileage = validMileages.length > 0 ? Math.min(...validMileages) : 0;

    const validCostsPerKm = computedLogs.map((l) => l.costPerKm).filter((c) => typeof c === 'number' && c > 0);
    const avgCostPerKm    = validCostsPerKm.length > 0 ? Number((validCostsPerKm.reduce((a, b) => a + b, 0) / validCostsPerKm.length).toFixed(2)) : 0;

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const mLogs = computedLogs.filter((l) => {
        const date = new Date(l.date);
        return date >= d && date < nextD;
      });

      const cost = mLogs.reduce((sum, l) => sum + (l.fuelCost || 0), 0);
      const mValid = mLogs.map((l) => l.calculatedMileage).filter((m) => typeof m === 'number' && m > 0);
      const mileage = mValid.length > 0 ? Number((mValid.reduce((a, b) => a + b, 0) / mValid.length).toFixed(2)) : 0;

      monthlyTrends.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        cost:  Math.round(cost),
        mileage,
      });
    }

    const lastEntry = computedLogs.length > 0 ? computedLogs[computedLogs.length - 1] : null;

    res.status(200).json(
      ApiResponse.success({
        avgMileage,
        bestMileage,
        lowestMileage,
        avgCostPerKm,
        monthlyFuelConsumption,
        monthlyFuelExpenses,
        totalLogs: computedLogs.length,
        monthlyTrends,
        lastEntry,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/fuel ─────────────────────────────────────────────────────────────
const getFuelLogs = async (req, res, next) => {
  try {
    const {
      search,
      vehicleId,
      startDate,
      endDate,
      sort = '-date',
      page = 1,
      limit = 30,
    } = req.query;

    const query = { user: req.user._id };

    if (vehicleId) query.vehicle = vehicleId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ fuelStation: rx }, { notes: rx }];
    }

    // Fetch all logs for metrics computation
    const allLogsAsc = await FuelLog.find({ user: req.user._id })
      .sort({ date: 1, odometer: 1 })
      .populate('vehicle', 'brand model registrationNumber year vehicleType');

    const computedAll = computeFuelLogMetrics(allLogsAsc);

    // Apply filtering to computed list
    let filtered = computedAll.filter((l) => {
      if (vehicleId && l.vehicle?._id?.toString() !== vehicleId && l.vehicle !== vehicleId) return false;
      if (startDate && new Date(l.date) < new Date(startDate)) return false;
      if (endDate && new Date(l.date) > new Date(endDate)) return false;
      if (search && search.trim()) {
        const rx = new RegExp(search.trim(), 'i');
        const matchStation = l.fuelStation && rx.test(l.fuelStation);
        const matchNotes   = l.notes && rx.test(l.notes);
        if (!matchStation && !matchNotes) return false;
      }
      return true;
    });

    // Apply sort
    if (sort === '-date') filtered.reverse();

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(skip, skip + limitNum);

    res.status(200).json(
      ApiResponse.success({
        fuelLogs: paginated,
        pagination: {
          total: filtered.length,
          page:  pageNum,
          limit: limitNum,
          pages: Math.ceil(filtered.length / limitNum),
          hasNext: pageNum < Math.ceil(filtered.length / limitNum),
          hasPrev: pageNum > 1,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/fuel/:id ─────────────────────────────────────────────────────────
const getFuelLog = async (req, res, next) => {
  try {
    const log = await FuelLog.findOne({ _id: req.params.id, user: req.user._id }).populate('vehicle');
    if (!log) return res.status(404).json(ApiResponse.error('Fuel log entry not found'));

    // Fetch previous entry for this vehicle to compute exact mileage & distance
    const prevLog = await FuelLog.findOne({
      vehicle: log.vehicle._id,
      date: { $lt: log.date },
    }).sort({ date: -1, odometer: -1 });

    const obj = log.toObject();
    if (prevLog && log.odometer > prevLog.odometer) {
      const dist = log.odometer - prevLog.odometer;
      obj.distanceDriven    = dist;
      obj.calculatedMileage = Number((dist / log.fuelQuantity).toFixed(2));
      obj.costPerKm         = Number((log.fuelCost / dist).toFixed(2));
    } else {
      obj.distanceDriven    = 0;
      obj.calculatedMileage = null;
      obj.costPerKm         = null;
    }

    res.status(200).json(ApiResponse.success({ fuelLog: obj }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/fuel ────────────────────────────────────────────────────────────
const createFuelLog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const {
      vehicleId, date, odometer, fuelQuantity, fuelCost,
      fuelPricePerLiter, fuelStation, paymentMethod, fullTank, notes,
    } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
    }

    const log = await FuelLog.create({
      user: req.user._id,
      vehicle: vehicle._id,
      date: date || new Date(),
      odometer: Number(odometer),
      fuelQuantity: Number(fuelQuantity),
      fuelCost: Number(fuelCost),
      fuelPricePerLiter: fuelPricePerLiter ? Number(fuelPricePerLiter) : Number((fuelCost / fuelQuantity).toFixed(2)),
      fuelStation,
      paymentMethod: paymentMethod || 'Card',
      fullTank: fullTank !== undefined ? Boolean(fullTank) : true,
      notes,
    });

    // Automatically update vehicle odometer if log odometer is greater
    if (Number(odometer) > (vehicle.odometer || 0)) {
      vehicle.odometer = Number(odometer);
      await vehicle.save();
    }

    res.status(201).json(ApiResponse.success({ fuelLog: log }, 'Fuel log added successfully'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/fuel/:id ─────────────────────────────────────────────────────────
const updateFuelLog = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const log = await FuelLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) return res.status(404).json(ApiResponse.error('Fuel log entry not found'));

    const {
      vehicleId, date, odometer, fuelQuantity, fuelCost,
      fuelPricePerLiter, fuelStation, paymentMethod, fullTank, notes,
    } = req.body;

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
    }

    const q = fuelQuantity !== undefined ? Number(fuelQuantity) : log.fuelQuantity;
    const c = fuelCost !== undefined ? Number(fuelCost) : log.fuelCost;
    const p = fuelPricePerLiter !== undefined ? Number(fuelPricePerLiter) : Number((c / q).toFixed(2));

    const updated = await FuelLog.findByIdAndUpdate(
      log._id,
      {
        vehicle: vehicleId || log.vehicle,
        date: date || log.date,
        odometer: odometer !== undefined ? Number(odometer) : log.odometer,
        fuelQuantity: q,
        fuelCost: c,
        fuelPricePerLiter: p,
        fuelStation: fuelStation !== undefined ? fuelStation : log.fuelStation,
        paymentMethod: paymentMethod || log.paymentMethod,
        fullTank: fullTank !== undefined ? Boolean(fullTank) : log.fullTank,
        notes: notes !== undefined ? notes : log.notes,
      },
      { new: true, runValidators: true }
    );

    // Sync vehicle odometer if needed
    if (updated.odometer) {
      const vehicle = await Vehicle.findById(updated.vehicle);
      if (vehicle && updated.odometer > (vehicle.odometer || 0)) {
        vehicle.odometer = updated.odometer;
        await vehicle.save();
      }
    }

    res.status(200).json(ApiResponse.success({ fuelLog: updated }, 'Fuel log entry updated'));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/fuel/:id ──────────────────────────────────────────────────────
const deleteFuelLog = async (req, res, next) => {
  try {
    const log = await FuelLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) return res.status(404).json(ApiResponse.error('Fuel log entry not found'));

    await log.deleteOne();
    res.status(200).json(ApiResponse.success({}, 'Fuel log entry deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getFuelLogs,
  getFuelLog,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
};
