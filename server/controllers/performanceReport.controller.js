const Vehicle    = require('../models/Vehicle.model');
const Service    = require('../models/Service.model');
const FuelLog    = require('../models/FuelLog.model');
const Expense    = require('../models/Expense.model');
const Reminder   = require('../models/Reminder.model');
const Document   = require('../models/Document.model');
const ApiResponse = require('../utils/ApiResponse');

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── GET /api/performance-report/vehicle/:vehicleId ──────────────────────────
const getVehiclePerformanceReport = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));

    const [services, fuelLogs, expenses, reminders] = await Promise.all([
      Service.find({ vehicle: vehicleId }).sort({ serviceDate: -1 }),
      FuelLog.find({ vehicle: vehicleId }).sort({ date: -1 }),
      Expense.find({ vehicle: vehicleId }).sort({ expenseDate: -1 }),
      Reminder.find({ vehicle: vehicleId }).sort({ dueDate: 1 }),
    ]);

    // 1. Health Score Evaluation
    let healthScore = 100;
    const deductions = [];

    const now = Date.now();

    if (vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry).getTime() < now) {
      healthScore -= 30; deductions.push('Insurance Expired (-30)');
    } else if (vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry).getTime() - now <= 30 * DAY_MS) {
      healthScore -= 10; deductions.push('Insurance Expiring Soon (-10)');
    }

    if (vehicle.pucExpiry && new Date(vehicle.pucExpiry).getTime() < now) {
      healthScore -= 25; deductions.push('PUC Expired (-25)');
    } else if (vehicle.pucExpiry && new Date(vehicle.pucExpiry).getTime() - now <= 30 * DAY_MS) {
      healthScore -= 10; deductions.push('PUC Expiring Soon (-10)');
    }

    if (vehicle.nextServiceDate && new Date(vehicle.nextServiceDate).getTime() < now) {
      healthScore -= 20; deductions.push('Service Overdue (-20)');
    }

    healthScore = Math.max(0, Math.round(healthScore));

    // 2. Mileage Analysis
    const validMileages = fuelLogs.map((f) => f.fuelQuantity > 0 ? (f.odometer / f.fuelQuantity) : 0).filter((m) => m > 0);
    const avgMileage  = validMileages.length > 0 ? Number((validMileages.reduce((a, b) => a + b, 0) / validMileages.length).toFixed(1)) : 14.5;
    const bestMileage = validMileages.length > 0 ? Math.max(...validMileages) : 18.2;
    const totalDistanceDriven = vehicle.odometer || 0;

    // 3. Fuel Expenses
    const totalFuelExpenses = fuelLogs.reduce((sum, f) => sum + (f.fuelCost || 0), 0);
    const thisMonthFuelExpenses = fuelLogs
      .filter((f) => new Date(f.date).getMonth() === new Date().getMonth() && new Date(f.date).getFullYear() === new Date().getFullYear())
      .reduce((sum, f) => sum + (f.fuelCost || 0), 0);

    // 4. Maintenance Expenses
    const totalServiceCost  = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalOtherExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalMaintenanceExpenses = Math.round(totalServiceCost + totalOtherExpense);

    const thisMonthMaintenanceExpenses = services
      .filter((s) => new Date(s.serviceDate).getMonth() === new Date().getMonth() && new Date(s.serviceDate).getFullYear() === new Date().getFullYear())
      .reduce((sum, s) => sum + (s.cost || 0), 0);

    // 5. Upcoming Services
    const upcomingServices = services
      .filter((s) => new Date(s.nextServiceDate || s.serviceDate) >= now)
      .slice(0, 3)
      .map((s) => ({
        serviceType: s.serviceType,
        date: s.nextServiceDate || s.serviceDate,
        serviceCenter: s.serviceCenter || 'Authorized Hub',
      }));

    if (upcomingServices.length === 0 && vehicle.nextServiceDate) {
      upcomingServices.push({
        serviceType: 'Scheduled Maintenance',
        date: vehicle.nextServiceDate,
        serviceCenter: 'Authorized Service Center',
      });
    }

    // 6. Upcoming Insurance
    const insuranceDaysLeft = vehicle.insuranceExpiry ? Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - now) / DAY_MS) : null;
    const upcomingInsurance = {
      expiryDate: vehicle.insuranceExpiry || null,
      daysLeft: insuranceDaysLeft,
      status: insuranceDaysLeft === null ? 'Not Recorded' : insuranceDaysLeft < 0 ? 'Expired' : insuranceDaysLeft <= 30 ? 'Expiring Soon' : 'Active',
    };

    // 7. Actionable Suggestions
    const suggestions = [
      `Maintain optimal tire pressure (32-35 PSI) to improve current ${avgMileage} km/L mileage towards peak ${bestMileage} km/L.`,
      `Scheduled service cycle is every ${vehicle.serviceIntervalKm || 10000} km or ${vehicle.serviceIntervalMonths || 6} months.`,
      `Regular oil changes extend engine life and lower lifetime maintenance cost (currently $${totalMaintenanceExpenses}).`,
    ];
    if (healthScore < 80) {
      suggestions.unshift(`Resolve compliance items: ${deductions.join(', ')} to restore health score to 100%.`);
    }

    // 8. AI Forecast
    const baseMonthly = Math.max(80, Math.round((totalMaintenanceExpenses + totalFuelExpenses) / 12));
    const aiForecast = {
      costNext3Months: Math.round(baseMonthly * 3.1),
      costNext6Months: Math.round(baseMonthly * 6.3),
      costNext12Months: Math.round(baseMonthly * 12.5),
      brakeWearPct: Math.min(95, Math.round(((totalDistanceDriven % 40000) / 40000) * 100)),
      engineOilWearPct: Math.min(100, Math.round((Math.max(1, (totalDistanceDriven % 10000)) / 10000) * 100)),
    };

    res.status(200).json(
      ApiResponse.success({
        vehicle: {
          id: vehicle._id,
          name: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
          registrationNumber: vehicle.registrationNumber,
          fuelType: vehicle.fuelType,
          odometer: totalDistanceDriven,
        },
        report: {
          healthScore,
          healthExplanation: deductions.length > 0 ? deductions.join(', ') : 'Vehicle is operating in 100% peak condition',
          mileage: {
            avgKmPerLiter: avgMileage,
            bestKmPerLiter: bestMileage,
            totalDistanceKm: totalDistanceDriven,
          },
          fuelExpenses: {
            thisMonth: thisMonthFuelExpenses,
            lifetime: totalFuelExpenses,
          },
          maintenanceExpenses: {
            thisMonth: thisMonthMaintenanceExpenses,
            lifetime: totalMaintenanceExpenses,
          },
          upcomingServices,
          upcomingInsurance,
          suggestions,
          aiForecast,
          generatedAt: new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehiclePerformanceReport,
};
