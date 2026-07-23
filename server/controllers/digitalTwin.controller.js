const Vehicle    = require('../models/Vehicle.model');
const Service    = require('../models/Service.model');
const FuelLog    = require('../models/FuelLog.model');
const Expense    = require('../models/Expense.model');
const Reminder   = require('../models/Reminder.model');
const Document   = require('../models/Document.model');
const ApiResponse = require('../utils/ApiResponse');

const DAY_MS = 24 * 60 * 60 * 1000;

// Helper to evaluate compliance status
const getComplianceStatus = (date) => {
  if (!date) return { status: 'Missing', cls: 'text-slate-400' };
  const diff = new Date(date).getTime() - Date.now();
  if (diff < 0) return { status: 'Expired', cls: 'text-red-400' };
  if (diff <= 30 * DAY_MS) return { status: 'Expiring Soon', cls: 'text-amber-400' };
  return { status: 'Active', cls: 'text-emerald-400' };
};

// ─── GET /api/digital-twin/vehicle/:vehicleId ──────────────────────────────────
const getVehicleDigitalTwin = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));

    // Parallel fetch from all collections for this vehicle
    const [services, fuelLogs, expenses, reminders, documents] = await Promise.all([
      Service.find({ vehicle: vehicleId }).sort({ serviceDate: -1 }),
      FuelLog.find({ vehicle: vehicleId }).sort({ date: -1 }),
      Expense.find({ vehicle: vehicleId }).sort({ expenseDate: -1 }),
      Reminder.find({ vehicle: vehicleId }).sort({ dueDate: 1 }),
      Document.find({ vehicle: vehicleId }).sort({ expiryDate: 1 }),
    ]);

    // 1. Calculated Metrics
    const totalDistanceDriven = vehicle.odometer || 0;

    const totalFuelConsumed = fuelLogs.reduce((sum, f) => sum + (f.fuelQuantity || 0), 0);
    const lifetimeFuelCost  = fuelLogs.reduce((sum, f) => sum + (f.fuelCost || 0), 0);

    const validMileages = fuelLogs.map((f) => f.fuelQuantity > 0 ? (f.odometer / f.fuelQuantity) : 0).filter((m) => m > 0);
    const averageMileage = validMileages.length > 0
      ? Number((validMileages.reduce((a, b) => a + b, 0) / validMileages.length).toFixed(1))
      : 14.5;

    const totalServiceCost  = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalOtherExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const lifetimeMaintenanceCost = Math.round(totalServiceCost + totalOtherExpense);

    const totalServiceCount = services.length;

    // 2. Compliance Statuses
    const insuranceStatus = getComplianceStatus(vehicle.insuranceExpiry);
    const warrantyStatus  = getComplianceStatus(vehicle.warrantyExpiry);
    const pucStatus       = getComplianceStatus(vehicle.pucExpiry);
    const documentsStatus = documents.length > 0 ? { status: 'Complete', count: documents.length } : { status: 'No Files', count: 0 };

    // 3. AI Health & Risk Score Calculation
    let healthScore = 100;
    const deductions = [];

    if (insuranceStatus.status === 'Expired') { healthScore -= 30; deductions.push('Insurance Expired (-30)'); }
    else if (insuranceStatus.status === 'Expiring Soon') { healthScore -= 10; deductions.push('Insurance Expiring Soon (-10)'); }

    if (pucStatus.status === 'Expired') { healthScore -= 25; deductions.push('PUC Expired (-25)'); }
    else if (pucStatus.status === 'Expiring Soon') { healthScore -= 10; deductions.push('PUC Expiring Soon (-10)'); }

    if (vehicle.nextServiceDate && new Date(vehicle.nextServiceDate) < Date.now()) {
      healthScore -= 20; deductions.push('Service Overdue (-20)');
    }

    healthScore = Math.max(0, Math.round(healthScore));

    const aiRiskScore = healthScore >= 80 ? 'Low Risk' : healthScore >= 50 ? 'Moderate Risk' : 'High Risk';

    // 4. Estimated Resale Value Engine
    // Base MSRP estimate: Car $28,000, Bike $6,000, Scooter $2,500, Truck $45,000
    const msrpBase = vehicle.vehicleType === 'Bike' ? 6000 : vehicle.vehicleType === 'Scooter' ? 2500 : vehicle.vehicleType === 'Truck' ? 45000 : 28000;
    const ageYears = Math.max(1, new Date().getFullYear() - vehicle.year);
    const depreciationFactor = Math.pow(0.85, ageYears); // 15% depreciation per year
    const odoDeduction = (totalDistanceDriven / 100000) * 0.15;
    const healthMultiplier = healthScore / 100;

    const estimatedResaleValue = Math.max(500, Math.round(msrpBase * depreciationFactor * (1 - odoDeduction) * healthMultiplier));

    // 5. Estimated Next Year Maintenance Cost
    const avgMonthlySpend = (lifetimeMaintenanceCost + lifetimeFuelCost) / Math.max(1, ageYears * 12);
    const estimatedNextYearMaintenanceCost = Math.round(avgMonthlySpend * 12 * 1.15);

    // 6. Unified Visual Timeline Generation
    const timeline = [];

    // Event 1: Vehicle Purchase
    timeline.push({
      id: `purchase_${vehicle._id}`,
      type: 'Purchased',
      category: 'Vehicle Purchased',
      date: vehicle.purchaseDate || new Date(`${vehicle.year}-01-01`),
      title: `Purchased ${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
      details: `Color: ${vehicle.color || 'Standard'}, Odometer at Registration: ${vehicle.odometer} km`,
      badge: 'Milestone',
    });

    // Event 2: Fuel Logs
    fuelLogs.forEach((f) => {
      timeline.push({
        id: `fuel_${f._id}`,
        type: 'Fuel',
        category: 'Fuel Log',
        date: f.date,
        title: `Logged ${f.fuelQuantity} L Fuel Fill-up`,
        details: `Cost: $${f.fuelCost} ($${f.fuelPricePerLiter}/L) at ${f.fuelStation || 'Station'} • Odometer: ${f.odometer} km`,
        badge: `${(f.odometer / (f.fuelQuantity || 1)).toFixed(1)} km/L`,
      });
    });

    // Event 3: Services
    services.forEach((s) => {
      timeline.push({
        id: `service_${s._id}`,
        type: 'Services',
        category: 'Service Record',
        date: s.serviceDate,
        title: `${s.serviceType} Completed`,
        details: `Center: ${s.serviceCenter || 'Service Station'} • Cost: $${s.cost} • Parts: ${s.partsChanged?.join(', ') || 'None'}`,
        badge: `$${s.cost}`,
      });
    });

    // Event 4: Expenses
    expenses.forEach((e) => {
      timeline.push({
        id: `expense_${e._id}`,
        type: 'Expenses',
        category: 'Expense Log',
        date: e.expenseDate,
        title: `${e.category}: ${e.title}`,
        details: `Amount: $${e.amount} • Payment: ${e.paymentMethod || 'Card'}`,
        badge: `$${e.amount}`,
      });
    });

    // Event 5: Reminders
    reminders.forEach((r) => {
      timeline.push({
        id: `reminder_${r._id}`,
        type: 'Reminders',
        category: 'Smart Reminder',
        date: r.dueDate,
        title: `Reminder: ${r.title}`,
        details: `Type: ${r.reminderType} • Status: ${r.status} • Priority: ${r.priority}`,
        badge: r.status,
      });
    });

    // Event 6: Documents
    documents.forEach((d) => {
      timeline.push({
        id: `document_${d._id}`,
        type: 'Documents',
        category: 'Digital Document',
        date: d.issueDate || d.createdAt,
        title: `Document Uploaded: ${d.title}`,
        details: `Type: ${d.documentType} • Expiry: ${d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : 'None'}`,
        badge: d.documentType,
      });
    });

    // Event 7: AI Predictions
    if (vehicle.nextServiceDate) {
      timeline.push({
        id: `ai_pred_${vehicle._id}`,
        type: 'AI Predictions',
        category: 'AI Prediction',
        date: vehicle.nextServiceDate,
        title: `AI Predicted Next Scheduled Maintenance`,
        details: `Predicted Service Window around ${new Date(vehicle.nextServiceDate).toLocaleDateString()}`,
        badge: 'AI Telemetry',
      });
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(
      ApiResponse.success({
        vehicle,
        digitalTwin: {
          healthScore,
          healthExplanation: deductions.length > 0 ? deductions.join(', ') : 'All systems operating at 100% efficiency',
          totalDistanceDriven,
          totalFuelConsumed,
          averageMileage,
          lifetimeFuelCost,
          lifetimeMaintenanceCost,
          totalServiceCount,
          insuranceStatus,
          warrantyStatus,
          pucStatus,
          documentsStatus,
          aiRiskScore,
          estimatedResaleValue,
          estimatedNextYearMaintenanceCost,
          timeline,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehicleDigitalTwin,
};
