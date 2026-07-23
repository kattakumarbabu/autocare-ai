const ServiceCenter = require('../models/ServiceCenter.model');
const ApiResponse    = require('../utils/ApiResponse');

// Haversine distance calculator in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

// Initial seed data helper
const seedSampleCentersIfEmpty = async () => {
  const count = await ServiceCenter.countDocuments();
  if (count > 0) return;

  const samples = [
    {
      name: 'AutoCare Premier Service Station',
      address: '42 MG Road, Downtown Sector 4',
      latitude: 28.6139,
      longitude: 77.209,
      location: { type: 'Point', coordinates: [77.209, 28.6139] },
      phone: '+1 (555) 234-5678',
      email: 'service@autocarepremier.com',
      category: 'Service Center',
      servicesOffered: ['General Service', 'Oil Change', 'Brake Repair', 'AC Repair', 'Engine Diagnostic'],
      openingHours: '08:00 AM - 08:00 PM',
      ratings: 4.9,
      vehicleBrandsSupported: ['Honda', 'Toyota', 'Ford', 'BMW', 'Hyundai', 'All Brands'],
      emergencySupport: true,
      verified: true,
    },
    {
      name: 'EcoCharge HyperFast EV Station',
      address: '88 Green Tech Park, Boulevard Street',
      latitude: 28.621,
      longitude: 77.215,
      location: { type: 'Point', coordinates: [77.215, 28.621] },
      phone: '+1 (555) 987-6543',
      email: 'support@ecocharge.com',
      category: 'EV Charging',
      servicesOffered: ['150kW DC Fast Charge', 'Type 2 AC Charging', 'Battery Health Check'],
      openingHours: '24/7 Open',
      ratings: 4.8,
      vehicleBrandsSupported: ['Tesla', 'Hyundai', 'Tata', 'MG', 'BMW'],
      emergencySupport: true,
      verified: true,
    },
    {
      name: 'Shell Ultra Express Fuel & Mart',
      address: '15 Highway Junction Bypass',
      latitude: 28.605,
      longitude: 77.201,
      location: { type: 'Point', coordinates: [77.201, 28.605] },
      phone: '+1 (555) 345-6789',
      email: 'station15@shell.com',
      category: 'Fuel Station',
      servicesOffered: ['V-Power Petrol', 'High-Grade Diesel', 'Air & Nitrogen Refill', 'Convenience Store'],
      openingHours: '24/7 Open',
      ratings: 4.7,
      vehicleBrandsSupported: ['All Brands'],
      emergencySupport: false,
      verified: true,
    },
    {
      name: '24/7 Rapid Towing & Roadside Assistance',
      address: 'Central Highway Ring Road Service Bay 3',
      latitude: 28.628,
      longitude: 77.195,
      location: { type: 'Point', coordinates: [77.195, 28.628] },
      phone: '+1 (800) 555-TOWS',
      email: 'sos@rapidtowing.com',
      category: 'Towing Service',
      servicesOffered: ['Flatbed Towing', 'Battery Jumpstart', 'Flat Tire Change', 'Lockout Assistance'],
      openingHours: '24/7 Open',
      ratings: 4.9,
      emergencySupport: true,
      verified: true,
    },
  ];

  await ServiceCenter.insertMany(samples);
  console.log('[serviceCenter] Seeded sample service centers and facilities');
};

// ─── GET /api/service-centers/nearby ──────────────────────────────────────────
const getNearbyServiceCenters = async (req, res, next) => {
  try {
    await seedSampleCentersIfEmpty();

    const {
      lat,
      lng,
      radius = 50, // default 50 km
      category,
      brand,
      service,
    } = req.query;

    const userLat = lat ? parseFloat(lat) : 28.6139; // Default fallback to city center
    const userLng = lng ? parseFloat(lng) : 77.209;

    const query = {};
    if (category) query.category = category;
    if (brand) query.vehicleBrandsSupported = { $in: [new RegExp(brand.trim(), 'i'), 'All Brands'] };
    if (service) query.servicesOffered = { $in: [new RegExp(service.trim(), 'i')] };

    const centers = await ServiceCenter.find(query);

    // Compute distance in km and sort by nearest
    const withDistance = centers.map((c) => {
      const obj = c.toObject();
      const dist = calculateDistanceKm(userLat, userLng, c.latitude, c.longitude);
      obj.distanceKm = dist;
      return obj;
    });

    const filtered = withDistance
      .filter((c) => c.distanceKm <= parseFloat(radius))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json(
      ApiResponse.success({
        serviceCenters: filtered,
        userLocation: { latitude: userLat, longitude: userLng },
        count: filtered.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/service-centers ──────────────────────────────────────────────────
const searchServiceCenters = async (req, res, next) => {
  try {
    await seedSampleCentersIfEmpty();

    const { search, category, brand, service } = req.query;
    const query = {};

    if (category) query.category = category;
    if (brand) query.vehicleBrandsSupported = { $in: [new RegExp(brand.trim(), 'i'), 'All Brands'] };
    if (service) query.servicesOffered = { $in: [new RegExp(service.trim(), 'i')] };

    if (search && search.trim()) {
      const rx = { $regex: search.trim(), $options: 'i' };
      query.$or = [{ name: rx }, { address: rx }, { servicesOffered: rx }];
    }

    const centers = await ServiceCenter.find(query).sort({ ratings: -1 });
    res.status(200).json(ApiResponse.success({ serviceCenters: centers, count: centers.length }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/service-centers/:id ─────────────────────────────────────────────
const getServiceCenterById = async (req, res, next) => {
  try {
    const center = await ServiceCenter.findById(req.params.id);
    if (!center) return res.status(404).json(ApiResponse.error('Service center not found'));

    res.status(200).json(ApiResponse.success({ serviceCenter: center }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNearbyServiceCenters,
  searchServiceCenters,
  getServiceCenterById,
};
