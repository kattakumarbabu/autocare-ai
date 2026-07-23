const mongoose = require('mongoose');

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI'];

const fuelLogSchema = new mongoose.Schema(
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

    date: {
      type:     Date,
      required: [true, 'Fill-up date is required'],
      default:  Date.now,
      index:    true,
    },

    odometer: {
      type:     Number,
      required: [true, 'Odometer reading is required'],
      min:      [0, 'Odometer reading cannot be negative'],
    },

    fuelQuantity: {
      type:     Number,
      required: [true, 'Fuel quantity (liters) is required'],
      min:      [0.01, 'Fuel quantity must be greater than 0'],
    },

    fuelCost: {
      type:     Number,
      required: [true, 'Fuel cost is required'],
      min:      [0, 'Fuel cost cannot be negative'],
    },

    fuelPricePerLiter: {
      type: Number,
      min:  [0, 'Price per liter cannot be negative'],
    },

    fuelStation: {
      type:      String,
      trim:      true,
      maxlength: [100, 'Fuel station name cannot exceed 100 characters'],
    },

    paymentMethod: {
      type:    String,
      enum:    PAYMENT_METHODS,
      default: 'Card',
    },

    fullTank: {
      type:    Boolean,
      default: true,
    },

    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Indexes for timeline queries
fuelLogSchema.index({ vehicle: 1, date: -1 });
fuelLogSchema.index({ user: 1, date: -1 });

// Auto-calculate fuelPricePerLiter before save if missing
fuelLogSchema.pre('save', function (next) {
  if (this.fuelCost && this.fuelQuantity && (!this.fuelPricePerLiter || this.fuelPricePerLiter === 0)) {
    this.fuelPricePerLiter = Number((this.fuelCost / this.fuelQuantity).toFixed(2));
  }
  next();
});

const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
module.exports = FuelLog;
