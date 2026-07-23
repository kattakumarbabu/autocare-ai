const Vehicle  = require('../models/Vehicle.model');
const Service  = require('../models/Service.model');
const FuelLog  = require('../models/FuelLog.model');
const Expense  = require('../models/Expense.model');
const Reminder = require('../models/Reminder.model');
const Document = require('../models/Document.model');

// Haversine / helper utilities
const now = () => Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

class PredictiveAIService {
  /**
   * Main Predictive Analysis Engine for a User's Garage
   */
  static async analyzeUserData(userId) {
    const [vehicles, services, fuelLogs, expenses, reminders, documents] = await Promise.all([
      Vehicle.find({ owner: userId }),
      Service.find({ user: userId }).sort({ serviceDate: -1 }),
      FuelLog.find({ user: userId }).sort({ date: -1 }),
      Expense.find({ user: userId }).sort({ expenseDate: -1 }),
      Reminder.find({ user: userId }).sort({ dueDate: 1 }),
      Document.find({ user: userId }).sort({ expiryDate: 1 }),
    ]);

    const primaryVeh = vehicles[0] || null;

    // 1. Driving Frequency & Odometer Rate Estimation
    let dailyKm = 35; // Default average daily km
    if (fuelLogs.length >= 2) {
      const latest = fuelLogs[0];
      const oldest = fuelLogs[fuelLogs.length - 1];
      const daysDiff = Math.max(1, Math.ceil((new Date(latest.date) - new Date(oldest.date)) / DAY_MS));
      const kmDiff   = Math.max(0, latest.odometer - oldest.odometer);
      if (kmDiff > 0 && daysDiff > 0) {
        dailyKm = Math.min(250, Math.round(kmDiff / daysDiff));
      }
    }

    // 2. Component Replacements Prediction Engine
    const currentOdo = primaryVeh ? primaryVeh.odometer : 35000;
    const vehAgeYears = primaryVeh ? Math.max(1, new Date().getFullYear() - primaryVeh.year) : 3;

    // Brake Replacement Prediction (typically every 40,000 km)
    const brakeWearPct = Math.min(95, Math.round(((currentOdo % 40000) / 40000) * 100));
    const kmToBrakes   = Math.max(500, 40000 - (currentOdo % 40000));
    const daysToBrakes = Math.ceil(kmToBrakes / Math.max(10, dailyKm));
    const brakeEstDate = new Date(now() + daysToBrakes * DAY_MS);

    // Battery Replacement Prediction (typically every 3 years / 36 months)
    const batteryAgeMonths = (vehAgeYears * 12) % 36;
    const batteryWearPct   = Math.min(95, Math.round((batteryAgeMonths / 36) * 100));
    const daysToBattery    = Math.max(30, (36 - batteryAgeMonths) * 30);
    const batteryEstDate   = new Date(now() + daysToBattery * DAY_MS);

    // Tire Replacement Prediction (typically every 50,000 km)
    const tireWearPct = Math.min(95, Math.round(((currentOdo % 50000) / 50000) * 100));
    const kmToTires   = Math.max(500, 50000 - (currentOdo % 50000));
    const daysToTires = Math.ceil(kmToTires / Math.max(10, dailyKm));
    const tireEstDate = new Date(now() + daysToTires * DAY_MS);

    // Engine Oil Replacement Prediction (typically every 10,000 km or 6 months)
    const lastServiceDate = primaryVeh?.lastServiceDate ? new Date(primaryVeh.lastServiceDate) : new Date(now() - 90 * DAY_MS);
    const daysSinceService = Math.max(0, Math.ceil((now() - lastServiceDate) / DAY_MS));
    const oilWearPct = Math.min(100, Math.round((daysSinceService / 180) * 100));
    const daysToOil  = Math.max(1, 180 - daysSinceService);
    const oilEstDate = new Date(now() + daysToOil * DAY_MS);

    const componentPredictions = {
      brakes:  { wearPct: brakeWearPct,  kmRemaining: kmToBrakes, estDate: brakeEstDate, status: brakeWearPct > 80 ? 'Critical' : brakeWearPct > 60 ? 'Warning' : 'Good' },
      battery: { wearPct: batteryWearPct, kmRemaining: null,       estDate: batteryEstDate, status: batteryWearPct > 80 ? 'Critical' : batteryWearPct > 60 ? 'Warning' : 'Good' },
      tires:   { wearPct: tireWearPct,   kmRemaining: kmToTires,  estDate: tireEstDate, status: tireWearPct > 80 ? 'Critical' : tireWearPct > 60 ? 'Warning' : 'Good' },
      engineOil: { wearPct: oilWearPct,  kmRemaining: Math.max(100, 10000 - (dailyKm * daysSinceService)), estDate: oilEstDate, status: oilWearPct > 80 ? 'Critical' : oilWearPct > 60 ? 'Warning' : 'Good' },
    };

    // 3. Maintenance Cost Forecast Engine
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0) + services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const baseMonthlySpend = expenses.length > 0 ? Math.round(totalSpent / Math.max(1, expenses.length)) : 120;

    const costForecast = {
      nextMonth:    Math.round(baseMonthlySpend * 1.1),
      next3Months:  Math.round(baseMonthlySpend * 3.2),
      next6Months:  Math.round(baseMonthlySpend * 6.5),
      next12Months: Math.round(baseMonthlySpend * 13.0),
    };

    // 4. Unusual Spending Detector
    const unusualSpendingAlerts = [];
    if (expenses.length > 0) {
      const avgExpense = totalSpent / expenses.length;
      expenses.forEach((e) => {
        if (e.amount > avgExpense * 2.2) {
          unusualSpendingAlerts.push({
            title: `High Expense Spike detected: "${e.title}"`,
            amount: e.amount,
            date: e.expenseDate,
            category: e.category,
            explanation: `Amount ($${e.amount}) is ${(e.amount / avgExpense).toFixed(1)}x higher than your typical average expense ($${Math.round(avgExpense)}).`,
          });
        }
      });
    }

    // 5. Fuel Efficiency Comparison & Risky Driving Patterns Detector
    const fuelMileages = fuelLogs.map((f) => f.fuelQuantity > 0 ? Number((f.odometer / f.fuelQuantity).toFixed(1)) : 0).filter((m) => m > 0);
    const currentAvgMileage = fuelMileages.length > 0 ? Number((fuelMileages.reduce((a, b) => a + b, 0) / fuelMileages.length).toFixed(1)) : 14.8;
    const bestMileage       = fuelMileages.length > 0 ? Math.max(...fuelMileages) : 18.5;

    const riskyDrivingPatterns = [];
    if (fuelMileages.length >= 3) {
      const recent = fuelMileages.slice(0, 3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      if (recentAvg < currentAvgMileage * 0.85) {
        riskyDrivingPatterns.push({
          severity: 'Warning',
          title: 'Rapid Fuel Consumption Drop Detected',
          details: `Recent fuel logs show a ${( (1 - (recentAvg / currentAvgMileage)) * 100 ).toFixed(1)}% drop in mileage (${recentAvg.toFixed(1)} km/L vs normal ${currentAvgMileage} km/L). This suggests frequent rapid acceleration, hard braking, or extended engine idling.`,
        });
      }
    }

    // 6. Overall Health Score (0-100) & Change Explanation
    let healthScore = 100;
    const deductions = [];

    vehicles.forEach((v) => {
      if (v.insuranceExpiry && new Date(v.insuranceExpiry) < now()) {
        healthScore -= 30;
        deductions.push(`-30 pts: Insurance expired for ${v.brand} ${v.model}`);
      }
      if (v.pucExpiry && new Date(v.pucExpiry) < now()) {
        healthScore -= 25;
        deductions.push(`-25 pts: PUC expired for ${v.brand} ${v.model}`);
      }
      if (v.nextServiceDate && new Date(v.nextServiceDate) < now()) {
        healthScore -= 20;
        deductions.push(`-20 pts: Scheduled service overdue for ${v.brand} ${v.model}`);
      }
    });

    if (componentPredictions.brakes.status === 'Critical') {
      healthScore -= 15;
      deductions.push(`-15 pts: Brake pads wear critical (${brakeWearPct}%)`);
    }
    if (componentPredictions.engineOil.status === 'Critical') {
      healthScore -= 10;
      deductions.push(`-10 pts: Engine oil service overdue (${oilWearPct}%)`);
    }

    healthScore = Math.max(0, Math.round(healthScore));

    const healthExplanation = deductions.length > 0
      ? `Health score is ${healthScore}% due to: ${deductions.join('; ')}.`
      : `Health score is 100%. All vehicles, services, insurance, and component wear metrics are in peak optimal status.`;

    // 7. Predictive AI Timeline Events
    const timelineEvents = [
      { date: oilEstDate, type: 'Engine Oil', desc: 'Predicted Engine Oil & Filter Service', urgency: componentPredictions.engineOil.status },
      { date: brakeEstDate, type: 'Brake Pads', desc: 'Predicted Brake Pad Replacement', urgency: componentPredictions.brakes.status },
      { date: batteryEstDate, type: 'Battery', desc: 'Predicted Battery Replacement', urgency: componentPredictions.battery.status },
      { date: tireEstDate, type: 'Tires', desc: 'Predicted Tire Replacement', urgency: componentPredictions.tires.status },
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      primaryVehicle: primaryVeh,
      dailyKm,
      healthScore,
      healthExplanation,
      componentPredictions,
      costForecast,
      unusualSpendingAlerts,
      fuelEfficiency: { currentAvgMileage, bestMileage, trend: fuelMileages },
      riskyDrivingPatterns,
      timelineEvents,
      vehicles,
      servicesCount: services.length,
      expensesCount: expenses.length,
    };
  }

  /**
   * Gemini API Predictive Prompt Engine
   */
  static async queryGeminiPredictive(userPrompt, contextData) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    try {
      const systemContext = `
You are the Enterprise AI Predictive Intelligence Engine for AutoCare AI.
Here is the live user vehicle telemetry & predictive dataset:
- Primary Vehicle: ${contextData.primaryVehicle ? `${contextData.primaryVehicle.brand} ${contextData.primaryVehicle.model} (${contextData.primaryVehicle.odometer} km)` : 'None'}
- Calculated Daily Driving Rate: ${contextData.dailyKm} km/day
- Overall Vehicle Health Score: ${contextData.healthScore}% (${contextData.healthExplanation})
- Predicted Component Wear: Brakes: ${contextData.componentPredictions.brakes.wearPct}%, Battery: ${contextData.componentPredictions.battery.wearPct}%, Tires: ${contextData.componentPredictions.tires.wearPct}%, Engine Oil: ${contextData.componentPredictions.engineOil.wearPct}%
- Predicted Cost Forecast: Next 1 mo: $${contextData.costForecast.nextMonth}, 3 mo: $${contextData.costForecast.next3Months}, 6 mo: $${contextData.costForecast.next6Months}, 12 mo: $${contextData.costForecast.next12Months}
- Fuel Economy: ${contextData.fuelEfficiency.currentAvgMileage} km/L vs Peak ${contextData.fuelEfficiency.bestMileage} km/L
- Risky Driving Alerts: ${JSON.stringify(contextData.riskyDrivingPatterns)}
- Spending Alerts: ${JSON.stringify(contextData.unusualSpendingAlerts)}

Answer user prompts accurately using their live predictive telemetry. Be concise, highly professional, precise, and actionable.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: systemContext }, { text: userPrompt }] },
            ],
          }),
        }
      );

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
      console.error('Gemini Predictive Service error:', err.message);
      return null;
    }
  }
}

module.exports = PredictiveAIService;
