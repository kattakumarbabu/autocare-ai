const mongoose = require('mongoose');

const REMINDER_TYPES = ['Service', 'Insurance', 'PUC', 'Warranty', 'Custom'];
const STATUSES       = ['Pending', 'Completed', 'Overdue'];
const PRIORITIES     = ['Low', 'Medium', 'High'];
const RECURRING_TYPES= ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      index:    true,
    },
    vehicle: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'Vehicle',
      index: true,
      default: null,
    },

    title: {
      type:      String,
      required:  [true, 'Reminder title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    reminderType: {
      type:     String,
      enum:     REMINDER_TYPES,
      required: [true, 'Reminder type is required'],
      default:  'Custom',
    },

    dueDate: {
      type:     Date,
      required: [true, 'Due date is required'],
      index:    true,
    },

    status: {
      type:    String,
      enum:    STATUSES,
      default: 'Pending',
      index:   true,
    },

    priority: {
      type:    String,
      enum:    PRIORITIES,
      default: 'Medium',
    },

    isRecurring: {
      type:    Boolean,
      default: false,
    },

    recurringInterval: {
      type: String,
      enum: RECURRING_TYPES,
      default: null,
    },

    notificationSent: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for querying user pending/overdue reminders efficiently
reminderSchema.index({ user: 1, dueDate: 1, status: 1 });
reminderSchema.index({ user: 1, reminderType: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;
