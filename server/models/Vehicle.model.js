const mongoose = require('mongoose');

const VEHICLE_TYPES  = ['Car', 'Bike', 'Scooter', 'Truck'];
const FUEL_TYPES     = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
const TRANSMISSIONS  = ['Manual', 'Automatic', 'Semi-Automatic'];

const vehicleSchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── Identity ──────────────────────────────────────────────────
    vehicleType: {
      type:     String,
      enum:     VEHICLE_TYPES,
      required: [true, 'Vehicle type is required'],
    },
    brand: {
      type:      String,
      required:  [true, 'Brand is required'],
      trim:      true,
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },
    model: {
      type:      String,
      required:  [true, 'Model is required'],
      trim:      true,
      maxlength: [50, 'Model cannot exceed 50 characters'],
    },
    variant: {
      type:      String,
      trim:      true,
      maxlength: [50, 'Variant cannot exceed 50 characters'],
    },
    year: {
      type:     Number,
      required: [true, 'Year is required'],
      min:      [1900, 'Year must be 1900 or later'],
      max:      [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    registrationNumber: {
      type:      String,
      required:  [true, 'Registration number is required'],
      unique:    true,
      trim:      true,
      uppercase: true,
      maxlength: [20, 'Registration number cannot exceed 20 characters'],
    },
    color: {
      type:      String,
      trim:      true,
      maxlength: [30, 'Color cannot exceed 30 characters'],
    },

    // ── Specifications ────────────────────────────────────────────
    fuelType: {
      type: String,
      enum: FUEL_TYPES,
    },
    transmission: {
      type: String,
      enum: TRANSMISSIONS,
    },
    odometer: {
      type: Number,
      min:  [0, 'Odometer cannot be negative'],
      default: 0,
    },

    // ── Dates ─────────────────────────────────────────────────────
    purchaseDate:    { type: Date, default: null },
    insuranceExpiry: { type: Date, default: null },
    pucExpiry:       { type: Date, default: null },
    warrantyExpiry:  { type: Date, default: null },
    lastServiceDate: { type: Date, default: null },
    nextServiceDate: { type: Date, default: null },

    // ── Service Intervals ─────────────────────────────────────────
    serviceIntervalKm: {
      type: Number,
      min:  [0, 'Service interval cannot be negative'],
    },
    serviceIntervalMonths: {
      type: Number,
      min:  [0, 'Service interval months cannot be negative'],
    },

    // ── Media ─────────────────────────────────────────────────────
    image:         { type: String, default: null },
    imagePublicId: { type: String, default: null },

    // ── Misc ──────────────────────────────────────────────────────
    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
vehicleSchema.index({ owner: 1, vehicleType: 1 });
vehicleSchema.index({ owner: 1, nextServiceDate: 1 });
vehicleSchema.index({ owner: 1, createdAt: -1 });

// ── Computed health score virtual ─────────────────────────────────────────────
// Score starts at 100 and is deducted based on expired / expiring documents and service.
vehicleSchema.virtual('healthScore').get(function () {
  let score = 100;
  const now    = Date.now();
  const day    = 24 * 60 * 60 * 1000;
  const soon   = 30 * day; // 30 days

  const deduct = (date, expiredBy, soonBy) => {
    if (!date) return;
    const diff = new Date(date).getTime() - now;
    if (diff < 0)    score -= expiredBy; // already expired
    else if (diff < soon) score -= soonBy;  // expiring within 30 days
  };

  deduct(this.insuranceExpiry, 35, 12); // Insurance is most critical
  deduct(this.pucExpiry,       25, 10); // PUC is legally required
  deduct(this.nextServiceDate, 20,  8); // Service overdue
  deduct(this.warrantyExpiry,   8,  3); // Warranty less critical

  return Math.max(0, Math.round(score));
});

// ── Virtuals: convenience helpers ─────────────────────────────────────────────
vehicleSchema.virtual('displayName').get(function () {
  const parts = [this.year, this.brand, this.model];
  if (this.variant) parts.push(this.variant);
  return parts.join(' ');
});

vehicleSchema.virtual('isServiceDueSoon').get(function () {
  if (!this.nextServiceDate) return false;
  const diff = new Date(this.nextServiceDate).getTime() - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
});

vehicleSchema.virtual('isInsuranceExpiringSoon').get(function () {
  if (!this.insuranceExpiry) return false;
  const diff = new Date(this.insuranceExpiry).getTime() - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
});

vehicleSchema.set('toJSON', { virtuals: true });

// ── Export ────────────────────────────────────────────────────────────────────
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;
