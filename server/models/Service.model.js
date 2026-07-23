const mongoose = require('mongoose');

const SERVICE_TYPES = [
  'General Service',
  'Oil Change',
  'Brake Repair',
  'Tire Replacement',
  'Battery Replacement',
  'Engine Repair',
  'Transmission Repair',
  'AC Service',
  'Body Work',
  'Inspection',
  'Other',
];

const serviceSchema = new mongoose.Schema(
  {
    vehicle: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Vehicle',
      required: [true, 'Vehicle reference is required'],
      index:    true,
    },
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
      index:    true,
    },

    serviceType: {
      type:     String,
      enum:     SERVICE_TYPES,
      required: [true, 'Service type is required'],
    },
    serviceCenter: {
      type:      String,
      trim:      true,
      maxlength: [100, 'Service center name cannot exceed 100 characters'],
    },
    mechanicName: {
      type:      String,
      trim:      true,
      maxlength: [50, 'Mechanic name cannot exceed 50 characters'],
    },
    serviceDate: {
      type:     Date,
      required: [true, 'Service date is required'],
      default:  Date.now,
    },
    odometer: {
      type: Number,
      min:  [0, 'Odometer reading cannot be negative'],
    },
    cost: {
      type:    Number,
      min:     [0, 'Cost cannot be negative'],
      default: 0,
    },

    invoiceImage:         { type: String, default: null },
    invoiceImagePublicId: { type: String, default: null },

    partsChanged: [
      {
        type: String,
        trim: true,
      },
    ],

    nextServiceDate: { type: Date, default: null },

    notes: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// Indexes for fast vehicle-scoped timeline queries
serviceSchema.index({ vehicle: 1, serviceDate: -1 });
serviceSchema.index({ user: 1, serviceDate: -1 });

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;
