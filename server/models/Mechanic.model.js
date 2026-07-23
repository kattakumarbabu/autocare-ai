const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Mechanic name is required'],
      trim:      true,
    },

    specialization: {
      type:    String,
      default: 'General Maintenance & Engine Specialist',
      trim:    true,
    },

    experience: {
      type:    Number,
      default: 5,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    },

    ratings: {
      type:    Number,
      default: 4.8,
      min:     0,
      max:     5,
    },

    availability: {
      type:    Boolean,
      default: true,
      index:   true,
    },

    serviceCenter: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'ServiceCenter',
      default: null,
    },
  },
  { timestamps: true }
);

const Mechanic = mongoose.model('Mechanic', mechanicSchema);
module.exports = Mechanic;
