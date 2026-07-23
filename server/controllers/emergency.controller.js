const Vehicle = require('../models/Vehicle.model');
const User    = require('../models/User.model');
const ApiResponse = require('../utils/ApiResponse');

// Sample emergency database seeder for nearby hospitals, police stations, and towing services
const sampleHospitals = [
  { name: 'City Care Emergency Hospital', address: 'Main Ring Road, Sector 4', distanceKm: 1.2, phone: '+1-800-555-0199' },
  { name: 'Apex Trauma & Cardiac Center', address: 'Grand Highway, Mile 12', distanceKm: 2.8, phone: '+1-800-555-0144' },
];

const samplePoliceStations = [
  { name: 'Central District Police Station', address: 'Station Road, Post 5', distanceKm: 1.8, phone: '911' },
  { name: 'Highway Patrol Headquarters', address: 'North Toll Highway', distanceKm: 3.5, phone: '911' },
];

const sampleTowingServices = [
  { name: '24/7 Express Highway Towing', address: 'Service Road, Exit 8', distanceKm: 0.9, phone: '+1-800-555-TOWS' },
  { name: 'AutoCare Recovery & Breakdown Tow', address: 'Industrial Belt, Zone A', distanceKm: 2.1, phone: '+1-800-555-RESCUE' },
];

// ─── POST /api/emergency/sos ──────────────────────────────────────────────────
const triggerSOS = async (req, res, next) => {
  try {
    const { latitude, longitude, vehicleId, notes } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');
    let vehicle = null;

    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, owner: userId });
    } else {
      vehicle = await Vehicle.findOne({ owner: userId }).sort({ updatedAt: -1 });
    }

    const locText = latitude && longitude
      ? `Lat: ${latitude}, Long: ${longitude}`
      : 'Location detected via IP / Mobile GPS';

    const mapsUrl = latitude && longitude
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : 'https://maps.google.com';

    const sosPayload = {
      dispatchId: `SOS_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone || 'Not provided',
        emergencyContact: user.emergencyContact || { name: 'Primary Family Contact', phone: '+1-800-555-0123' },
      },
      vehicle: vehicle ? {
        id: vehicle._id,
        name: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
        registrationNumber: vehicle.registrationNumber,
        color: vehicle.color || 'Standard',
        fuelType: vehicle.fuelType,
      } : { name: 'No registered vehicle selected', registrationNumber: '—' },
      location: {
        latitude,
        longitude,
        locText,
        mapsUrl,
      },
      nearestServices: {
        hospitals: sampleHospitals,
        policeStations: samplePoliceStations,
        towingServices: sampleTowingServices,
      },
    };

    res.status(200).json(
      ApiResponse.success({
        message: 'EMERGENCY SOS ALERT ACTIVATED! Emergency contacts and dispatch package generated.',
        sosPayload,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/emergency/nearby ────────────────────────────────────────────────
const getNearbyEmergencyServices = async (req, res, next) => {
  try {
    res.status(200).json(
      ApiResponse.success({
        hospitals: sampleHospitals,
        policeStations: samplePoliceStations,
        towingServices: sampleTowingServices,
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  triggerSOS,
  getNearbyEmergencyServices,
};
