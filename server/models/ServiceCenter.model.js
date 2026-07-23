const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Service center name is required'],
      trim:      true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },

    address: {
      type:     String,
      required: [true, 'Address is required'],
      trim:      true,
    },

    latitude: {
      type:     Number,
      required: [true, 'Latitude is required'],
    },

    longitude: {
      type:     Number,
      required: [true, 'Longitude is required'],
    },

    location: {
      type: {
        type:    String,
        enum:    ['Point'],
        default: 'Point',
      },
      coordinates: {
        type:     [Number], // [longitude, latitude]
        required: true,
      },
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },

    category: {
      type:    String,
      enum:    ['Service Center', 'Fuel Station', 'EV Charging', 'Towing Service'],
      default: 'Service Center',
      index:   true,
    },

    servicesOffered: [
      {
        type: String,
        trim: true,
      },
    ],

    openingHours: {
      type:    String,
      default: '08:00 AM - 08:00 PM',
    },

    ratings: {
      type:    Number,
      default: 4.5,
      min:     0,
      max:     5,
    },

    vehicleBrandsSupported: [
      {
        type: String,
        trim: true,
      },
    ],

    emergencySupport: {
      type:    Boolean,
      default: false,
    },

    verified: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 2DSphere spatial index for geo-queries
serviceCenterSchema.index({ location: '2dsphere' });
serviceCenterSchema.index({ name: 'text', address: 'text', servicesOffered: 'text' });

const ServiceCenter = mongoose.model('ServiceCenter', serviceCenterSchema);
module.exports = ServiceCenter;
