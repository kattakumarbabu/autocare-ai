const { validationResult } = require('express-validator');
const Reminder              = require('../models/Reminder.model');
const Vehicle               = require('../models/Vehicle.model');
const ApiResponse           = require('../utils/ApiResponse');

// ─── GET /api/reminders/stats ──────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now    = new Date();

    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // End of today
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    // End of this week (7 days from start of today)
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [dueToday, dueThisWeek, overdue, totalPending, pendingList] = await Promise.all([
      Reminder.countDocuments({
        user: userId,
        status: { $in: ['Pending', 'Overdue'] },
        dueDate: { $gte: startOfToday, $lte: endOfToday },
      }),
      Reminder.countDocuments({
        user: userId,
        status: { $in: ['Pending', 'Overdue'] },
        dueDate: { $gte: startOfToday, $lte: endOfWeek },
      }),
      Reminder.countDocuments({
        user: userId,
        status: 'Overdue',
      }),
      Reminder.countDocuments({
        user: userId,
        status: { $in: ['Pending', 'Overdue'] },
      }),
      Reminder.find({
        user: userId,
        status: { $in: ['Pending', 'Overdue'] },
      })
        .sort({ dueDate: 1 })
        .limit(10)
        .populate('vehicle', 'brand model registrationNumber year vehicleType'),
    ]);

    res.status(200).json(
      ApiResponse.success({
        dueToday,
        dueThisWeek,
        overdue,
        totalPending,
        upcomingList: pendingList,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reminders ────────────────────────────────────────────────────────
const getReminders = async (req, res, next) => {
  try {
    const {
      search,
      reminderType,
      status,
      priority,
      vehicleId,
      startDate,
      endDate,
      sort = 'dueDate',
      page = 1,
      limit = 30,
    } = req.query;

    const query = { user: req.user._id };

    if (vehicleId) query.vehicle = vehicleId;
    if (reminderType && reminderType !== 'All') query.reminderType = reminderType;
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ title: rx }, { description: rx }];
    }

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const ALLOWED_SORTS = {
      dueDate:   'dueDate',
      '-dueDate': '-dueDate',
      priority:  'priority',
      createdAt: '-createdAt',
    };
    const sortField = ALLOWED_SORTS[sort] || 'dueDate';

    const [total, reminders] = await Promise.all([
      Reminder.countDocuments(query),
      Reminder.find(query)
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .populate('vehicle', 'brand model registrationNumber year vehicleType'),
    ]);

    res.status(200).json(
      ApiResponse.success({
        reminders,
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

// ─── GET /api/reminders/:id ────────────────────────────────────────────────────
const getReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id }).populate('vehicle');
    if (!reminder) {
      return res.status(404).json(ApiResponse.error('Reminder not found'));
    }
    res.status(200).json(ApiResponse.success({ reminder }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/reminders ───────────────────────────────────────────────────────
const createReminder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const {
      vehicleId,
      title,
      description,
      reminderType = 'Custom',
      dueDate,
      priority = 'Medium',
      isRecurring = false,
      recurringInterval,
    } = req.body;

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) {
        return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
      }
    }

    const due = new Date(dueDate);
    const isOverdue = due.getTime() < Date.now();

    const reminder = await Reminder.create({
      user: req.user._id,
      vehicle: vehicleId || null,
      title,
      description,
      reminderType,
      dueDate: due,
      priority,
      status: isOverdue ? 'Overdue' : 'Pending',
      isRecurring: Boolean(isRecurring),
      recurringInterval: isRecurring ? recurringInterval : null,
    });

    res.status(201).json(ApiResponse.success({ reminder }, 'Reminder created successfully'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/reminders/:id ────────────────────────────────────────────────────
const updateReminder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json(ApiResponse.error('Reminder not found'));
    }

    const {
      vehicleId,
      title,
      description,
      reminderType,
      dueDate,
      priority,
      isRecurring,
      recurringInterval,
      status,
    } = req.body;

    if (vehicleId) {
      const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
      if (!vehicle) {
        return res.status(404).json(ApiResponse.error('Associated vehicle not found'));
      }
    }

    const due = dueDate ? new Date(dueDate) : reminder.dueDate;
    let newStatus = status || reminder.status;
    if (newStatus !== 'Completed') {
      newStatus = due.getTime() < Date.now() ? 'Overdue' : 'Pending';
    }

    const updated = await Reminder.findByIdAndUpdate(
      reminder._id,
      {
        vehicle: vehicleId !== undefined ? (vehicleId || null) : reminder.vehicle,
        title: title || reminder.title,
        description: description !== undefined ? description : reminder.description,
        reminderType: reminderType || reminder.reminderType,
        dueDate: due,
        priority: priority || reminder.priority,
        status: newStatus,
        isRecurring: isRecurring !== undefined ? Boolean(isRecurring) : reminder.isRecurring,
        recurringInterval: isRecurring ? recurringInterval : null,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(ApiResponse.success({ reminder: updated }, 'Reminder updated'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/reminders/:id/complete ──────────────────────────────────────────
const markCompleted = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json(ApiResponse.error('Reminder not found'));
    }

    reminder.status = 'Completed';
    await reminder.save();

    // If recurring, automatically create next occurrence
    if (reminder.isRecurring && reminder.recurringInterval) {
      const nextDue = new Date(reminder.dueDate);
      switch (reminder.recurringInterval) {
        case 'Monthly':
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case 'Quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case 'Semi-Annually':
          nextDue.setMonth(nextDue.getMonth() + 6);
          break;
        case 'Annually':
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        default:
          nextDue.setMonth(nextDue.getMonth() + 1);
      }

      await Reminder.create({
        user: reminder.user,
        vehicle: reminder.vehicle,
        title: reminder.title,
        description: reminder.description,
        reminderType: reminder.reminderType,
        dueDate: nextDue,
        priority: reminder.priority,
        status: 'Pending',
        isRecurring: true,
        recurringInterval: reminder.recurringInterval,
      });
    }

    res.status(200).json(ApiResponse.success({ reminder }, 'Reminder marked as completed'));
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/reminders/:id/snooze ───────────────────────────────────────────
const snoozeReminder = async (req, res, next) => {
  try {
    const { days = 3 } = req.body;
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json(ApiResponse.error('Reminder not found'));
    }

    const currentDue = new Date(reminder.dueDate);
    const baseDate = currentDue.getTime() < Date.now() ? new Date() : currentDue;
    const newDue = new Date(baseDate.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    reminder.dueDate = newDue;
    reminder.status = newDue.getTime() < Date.now() ? 'Overdue' : 'Pending';
    await reminder.save();

    res.status(200).json(
      ApiResponse.success({ reminder }, `Reminder snoozed for ${days} day(s)`)
    );
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/reminders/:id/restore ──────────────────────────────────────────
const restoreReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json(ApiResponse.error('Reminder not found'));
    }

    const isOverdue = new Date(reminder.dueDate).getTime() < Date.now();
    reminder.status = isOverdue ? 'Overdue' : 'Pending';
    await reminder.save();

    res.status(200).json(ApiResponse.success({ reminder }, 'Reminder restored to active status'));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/reminders/:id ────────────────────────────────────────────────
const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) {
      return res.status(404).json(ApiResponse.error('Reminder not found'));
    }

    await reminder.deleteOne();
    res.status(200).json(ApiResponse.success({}, 'Reminder deleted successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  markCompleted,
  snoozeReminder,
  restoreReminder,
  deleteReminder,
};
