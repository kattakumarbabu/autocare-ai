const Vehicle    = require('../models/Vehicle.model');
const Service    = require('../models/Service.model');
const FuelLog    = require('../models/FuelLog.model');
const Expense    = require('../models/Expense.model');
const Reminder   = require('../models/Reminder.model');
const Appointment = require('../models/Appointment.model');
const ApiResponse = require('../utils/ApiResponse');

// ─── GET /api/advanced-analytics ──────────────────────────────────────────────
const getAdvancedAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [vehicles, services, fuelLogs, expenses, reminders, appointments] = await Promise.all([
      Vehicle.find({ owner: userId }),
      Service.find({ user: userId }).sort({ serviceDate: 1 }),
      FuelLog.find({ user: userId }).sort({ date: 1 }),
      Expense.find({ user: userId }).sort({ expenseDate: 1 }),
      Reminder.find({ user: userId }),
      Appointment.find({ user: userId }),
    ]);

    // 1. Monthly Vehicle Expenses (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyExpensesMap = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthlyExpensesMap[k] = { month: k, fuel: 0, maintenance: 0, other: 0, total: 0 };
    }

    fuelLogs.forEach((f) => {
      const d = new Date(f.date);
      const k = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthlyExpensesMap[k]) {
        monthlyExpensesMap[k].fuel += (f.fuelCost || 0);
        monthlyExpensesMap[k].total += (f.fuelCost || 0);
      }
    });

    services.forEach((s) => {
      const d = new Date(s.serviceDate);
      const k = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthlyExpensesMap[k]) {
        monthlyExpensesMap[k].maintenance += (s.cost || 0);
        monthlyExpensesMap[k].total += (s.cost || 0);
      }
    });

    expenses.forEach((e) => {
      const d = new Date(e.expenseDate);
      const k = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (monthlyExpensesMap[k]) {
        if (e.category === 'Fuel') monthlyExpensesMap[k].fuel += (e.amount || 0);
        else monthlyExpensesMap[k].other += (e.amount || 0);
        monthlyExpensesMap[k].total += (e.amount || 0);
      }
    });

    const monthlyExpenses = Object.values(monthlyExpensesMap);

    // 2. Fuel Trends (Monthly Avg Mileage & Price)
    const fuelTrends = monthlyExpenses.map((m) => {
      const logs = fuelLogs.filter((f) => {
        const d = new Date(f.date);
        return `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}` === m.month;
      });
      const valid = logs.filter((l) => l.fuelQuantity > 0);
      const avgKmL = valid.length > 0
        ? Number((valid.reduce((acc, l) => acc + (l.odometer / l.fuelQuantity), 0) / valid.length).toFixed(1))
        : 14.5;

      return {
        month: m.month,
        avgMileage: avgKmL,
        totalCost: m.fuel,
        entriesCount: logs.length,
      };
    });

    // 3. Service Trends (Type Breakdown & Cost)
    const serviceTypeMap = {};
    services.forEach((s) => {
      const type = s.serviceType || 'General Service';
      serviceTypeMap[type] = (serviceTypeMap[type] || 0) + (s.cost || 0);
    });
    const serviceTrends = Object.keys(serviceTypeMap).map((k) => ({
      serviceType: k,
      totalCost: serviceTypeMap[k],
    }));

    // 4. AI Health Trends per Vehicle
    const aiHealthTrends = vehicles.map((v) => ({
      id: v._id,
      name: `${v.year} ${v.brand} ${v.model}`,
      healthScore: v.healthScore || 100,
      status: (v.healthScore || 100) >= 80 ? 'Excellent' : (v.healthScore || 100) >= 60 ? 'Good' : 'Fair',
      registrationNumber: v.registrationNumber,
    }));

    // 5. Expense Forecast (3, 6, 12 Months)
    const totalPastSpend = monthlyExpenses.reduce((acc, m) => acc + m.total, 0);
    const avgMonthlySpend = totalPastSpend > 0 ? Math.round(totalPastSpend / 6) : 250;
    const expenseForecast = {
      avgMonthly: avgMonthlySpend,
      forecast3Months: Math.round(avgMonthlySpend * 3.1),
      forecast6Months: Math.round(avgMonthlySpend * 6.2),
      forecast12Months: Math.round(avgMonthlySpend * 12.5),
    };

    // 6. Vehicle Side-by-Side Comparison
    const vehicleComparison = vehicles.map((v) => {
      const vServices = services.filter((s) => s.vehicle?.toString() === v._id.toString());
      const vFuel     = fuelLogs.filter((f) => f.vehicle?.toString() === v._id.toString());
      const vExpenses = expenses.filter((e) => e.vehicle?.toString() === v._id.toString());

      const maintCost = vServices.reduce((sum, s) => sum + (s.cost || 0), 0) + vExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const fuelCost  = vFuel.reduce((sum, f) => sum + (f.fuelCost || 0), 0);

      const validM = vFuel.filter((f) => f.fuelQuantity > 0);
      const avgM   = validM.length > 0
        ? Number((validM.reduce((sum, f) => sum + (f.odometer / f.fuelQuantity), 0) / validM.length).toFixed(1))
        : 14.5;

      return {
        id: v._id,
        name: `${v.year} ${v.brand} ${v.model}`,
        registrationNumber: v.registrationNumber,
        odometer: v.odometer || 0,
        healthScore: v.healthScore || 100,
        avgMileage: avgM,
        maintenanceCost: Math.round(maintCost),
        fuelCost: Math.round(fuelCost),
        serviceCount: vServices.length,
      };
    });

    // 7. Maintenance Calendar (Events aggregated by date)
    const maintenanceCalendar = [];

    services.forEach((s) => {
      maintenanceCalendar.push({
        id: `srv_${s._id}`,
        title: `Service: ${s.serviceType}`,
        date: s.serviceDate,
        type: 'Service',
        cost: s.cost,
      });
    });

    reminders.forEach((r) => {
      maintenanceCalendar.push({
        id: `rem_${r._id}`,
        title: `Reminder: ${r.title}`,
        date: r.dueDate,
        type: 'Reminder',
        status: r.status,
      });
    });

    appointments.forEach((a) => {
      maintenanceCalendar.push({
        id: `apt_${a._id}`,
        title: `Appointment: ${a.serviceType}`,
        date: a.appointmentDate,
        type: 'Appointment',
        status: a.status,
      });
    });

    maintenanceCalendar.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(
      ApiResponse.success({
        monthlyExpenses,
        fuelTrends,
        serviceTrends,
        aiHealthTrends,
        expenseForecast,
        vehicleComparison,
        maintenanceCalendar: maintenanceCalendar.slice(0, 20),
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdvancedAnalytics,
};
