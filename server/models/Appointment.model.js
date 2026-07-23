const mongoose = require('mongoose');

const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      index:    true,
    },

    vehicle: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Vehicle',
      required: [true, 'Vehicle reference is required'],
      index:    true,
    },

    serviceCenter: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'ServiceCenter',
      default: null,
      index:   true,
    },

    mechanic: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Mechanic',
      default: null,
      index:   true,
    },

    appointmentDate: {
      type:     Date,
      required: [true, 'Appointment date is required'],
      index:    true,
    },

    appointmentTime: {
      type:     String,
      required: [true, 'Appointment time slot is required'],
      default:  '10:00 AM',
    },

    serviceType: {
      type:     String,
      required: [true, 'Service type is required'],
      default:  'Full Service Maintenance',
    },

    estimatedCost: {
      type:    Number,
      default: 150,
    },

    status: {
      type:    String,
      enum:    APPOINTMENT_STATUSES,
      default: 'Pending',
      index:   true,
    },

    qrCodeData: {
      type: String,
    },

    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    rating: {
      type: Number,
      min:  1,
      max:  5,
    },

    review: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ user: 1, appointmentDate: -1 });
appointmentSchema.index({ mechanic: 1, appointmentDate: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
