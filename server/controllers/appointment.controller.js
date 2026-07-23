const { validationResult } = require('express-validator');
const Appointment          = require('../models/Appointment.model');
const Mechanic             = require('../models/Mechanic.model');
const Vehicle              = require('../models/Vehicle.model');
const ServiceCenter        = require('../models/ServiceCenter.model');
const ApiResponse          = require('../utils/ApiResponse');

// Auto-seed sample mechanics if collection is empty
const seedSampleMechanicsIfEmpty = async () => {
  const count = await Mechanic.countDocuments();
  if (count > 0) return;

  const samples = [
    {
      name: 'Marcus Vance',
      specialization: 'Master Diagnostic & Engine Specialist',
      experience: 12,
      phone: '+1 (555) 789-0123',
      email: 'marcus.vance@autocare.com',
      profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      ratings: 4.9,
      availability: true,
    },
    {
      name: 'Elena Rostova',
      specialization: 'EV Powertrain & Battery System Expert',
      experience: 8,
      phone: '+1 (555) 456-7890',
      email: 'elena.rostova@autocare.com',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      ratings: 4.9,
      availability: true,
    },
    {
      name: 'David Chen',
      specialization: 'Brake, Suspension & Alignment Technician',
      experience: 10,
      phone: '+1 (555) 321-6547',
      email: 'david.chen@autocare.com',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      ratings: 4.8,
      availability: true,
    },
  ];

  await Mechanic.insertMany(samples);
  console.log('[appointment] Seeded sample mechanics');
};

// Cost Estimator Helper based on Service Type
const estimateCost = (serviceType) => {
  const map = {
    'Oil Change & Inspection': 65,
    'Brake Pad & Rotor Replacement': 220,
    'Full Periodic Maintenance': 180,
    'AC Refill & Climate Check': 95,
    'Engine Tune-Up & Diagnostic': 150,
    'Tire Rotation & Wheel Alignment': 75,
  };
  return map[serviceType] || 150;
};

// ─── GET /api/appointments/mechanics ──────────────────────────────────────────
const getMechanics = async (req, res, next) => {
  try {
    await seedSampleMechanicsIfEmpty();
    const mechanics = await Mechanic.find({ availability: true }).sort({ ratings: -1 });
    res.status(200).json(ApiResponse.success({ mechanics }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/appointments/mechanics/:id ──────────────────────────────────────
const getMechanicById = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json(ApiResponse.error('Mechanic profile not found'));

    res.status(200).json(ApiResponse.success({ mechanic }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/appointments/stats ──────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const upcomingCount = await Appointment.countDocuments({
      user: req.user._id,
      status: { $in: ['Pending', 'Confirmed', 'In Progress'] },
    });

    const inProgress = await Appointment.findOne({
      user: req.user._id,
      status: 'In Progress',
    })
      .populate('vehicle', 'brand model registrationNumber')
      .populate('mechanic', 'name phone profileImage');

    res.status(200).json(ApiResponse.success({ upcomingCount, inProgress }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/appointments ────────────────────────────────────────────────────
const getAppointments = async (req, res, next) => {
  try {
    const { status, vehicleId, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;
    if (vehicleId) query.vehicle = vehicleId;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('vehicle', 'brand model registrationNumber year vehicleType image')
        .populate('serviceCenter', 'name address phone')
        .populate('mechanic', 'name specialization phone profileImage ratings'),
      Appointment.countDocuments(query),
    ]);

    res.status(200).json(
      ApiResponse.success({
        appointments,
        pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/appointments/:id ────────────────────────────────────────────────
const getAppointmentById = async (req, res, next) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, user: req.user._id })
      .populate('vehicle')
      .populate('serviceCenter')
      .populate('mechanic');

    if (!appt) return res.status(404).json(ApiResponse.error('Appointment not found'));

    res.status(200).json(ApiResponse.success({ appointment: appt }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/appointments ───────────────────────────────────────────────────
const bookAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    await seedSampleMechanicsIfEmpty();

    const {
      vehicleId, serviceCenterId, mechanicId, appointmentDate,
      appointmentTime, serviceType, notes,
    } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));

    let mechanic = null;
    if (mechanicId) {
      mechanic = await Mechanic.findById(mechanicId);
    } else {
      mechanic = await Mechanic.findOne({ availability: true });
    }

    const estCost = estimateCost(serviceType);

    const appt = await Appointment.create({
      user: req.user._id,
      vehicle: vehicle._id,
      serviceCenter: serviceCenterId || null,
      mechanic: mechanic ? mechanic._id : null,
      appointmentDate,
      appointmentTime,
      serviceType,
      estimatedCost: estCost,
      status: 'Confirmed',
      notes,
      qrCodeData: `AUTOCARE_APPT_${Date.now()}_${vehicle.registrationNumber}`,
    });

    res.status(201).json(ApiResponse.success({ appointment: appt }, 'Appointment booked successfully'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/appointments/:id/reschedule ─────────────────────────────────────
const rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json(ApiResponse.error('New date and time required'));
    }

    const appt = await Appointment.findOne({ _id: req.params.id, user: req.user._id });
    if (!appt) return res.status(404).json(ApiResponse.error('Appointment not found'));

    appt.appointmentDate = appointmentDate;
    appt.appointmentTime = appointmentTime;
    appt.status          = 'Confirmed';
    await appt.save();

    res.status(200).json(ApiResponse.success({ appointment: appt }, 'Appointment rescheduled'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/appointments/:id/cancel ─────────────────────────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const appt = await Appointment.findOne({ _id: req.params.id, user: req.user._id });
    if (!appt) return res.status(404).json(ApiResponse.error('Appointment not found'));

    appt.status = 'Cancelled';
    await appt.save();

    res.status(200).json(ApiResponse.success({ appointment: appt }, 'Appointment cancelled'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/appointments/:id/status (Mechanic or Admin status update) ──────
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json(ApiResponse.error('Invalid status'));
    }

    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json(ApiResponse.error('Appointment not found'));

    appt.status = status;
    await appt.save();

    res.status(200).json(ApiResponse.success({ appointment: appt }, 'Status updated'));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/appointments/:id/review ────────────────────────────────────────
const submitReview = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json(ApiResponse.error('Rating between 1 and 5 is required'));
    }

    const appt = await Appointment.findOne({ _id: req.params.id, user: req.user._id });
    if (!appt) return res.status(404).json(ApiResponse.error('Appointment not found'));

    appt.rating = rating;
    appt.review = review || '';
    await appt.save();

    res.status(200).json(ApiResponse.success({ appointment: appt }, 'Thank you for your rating & review!'));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/appointments/mechanics/dashboard ──────────────────────────────
const getMechanicDashboard = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ status: { $in: ['Confirmed', 'In Progress'] } })
      .sort({ appointmentDate: 1 })
      .populate('vehicle')
      .populate('user', 'name email phone')
      .populate('mechanic');

    res.status(200).json(ApiResponse.success({ assignedAppointments: appointments }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMechanics,
  getMechanicById,
  getStats,
  getAppointments,
  getAppointmentById,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  updateStatus,
  submitReview,
  getMechanicDashboard,
};
