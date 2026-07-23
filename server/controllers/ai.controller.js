const Vehicle  = require('../models/Vehicle.model');
const Service  = require('../models/Service.model');
const FuelLog  = require('../models/FuelLog.model');
const Expense  = require('../models/Expense.model');
const Reminder = require('../models/Reminder.model');
const Document = require('../models/Document.model');
const ApiResponse = require('../utils/ApiResponse');

// Helper to assemble full user context from database
const getUserDataContext = async (userId) => {
  const [vehicles, services, fuelLogs, expenses, reminders, documents] = await Promise.all([
    Vehicle.find({ owner: userId }),
    Service.find({ user: userId }).sort({ serviceDate: -1 }),
    FuelLog.find({ user: userId }).sort({ date: -1 }),
    Expense.find({ user: userId }).sort({ expenseDate: -1 }),
    Reminder.find({ user: userId }).sort({ dueDate: 1 }),
    Document.find({ user: userId }).sort({ expiryDate: 1 }),
  ]);

  // Compute Health Score Breakdown for each vehicle
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const soon = 30 * day;

  const vehicleHealthBreakdowns = vehicles.map((v) => {
    const deductions = [];
    let score = 100;

    const check = (date, name, expiredLoss, soonLoss) => {
      if (!date) return;
      const diff = new Date(date).getTime() - now;
      if (diff < 0) {
        score -= expiredLoss;
        deductions.push(`-${expiredLoss} pts: ${name} is EXPIRED`);
      } else if (diff < soon) {
        score -= soonLoss;
        deductions.push(`-${soonLoss} pts: ${name} expires within 30 days`);
      }
    };

    check(v.insuranceExpiry, 'Insurance', 35, 12);
    check(v.pucExpiry,       'PUC Certificate', 25, 10);
    check(v.nextServiceDate, 'Scheduled Service', 20, 8);
    check(v.warrantyExpiry,  'Warranty', 8, 3);

    return {
      vehicleId: v._id,
      name: `${v.year} ${v.brand} ${v.model} (${v.registrationNumber})`,
      healthScore: Math.max(0, Math.round(score)),
      deductions: deductions.length > 0 ? deductions : ['No deductions — Vehicle is in 100% optimal health!'],
      nextServiceDate: v.nextServiceDate,
      insuranceExpiry: v.insuranceExpiry,
      pucExpiry: v.pucExpiry,
      odometer: v.odometer,
    };
  });

  // Calculate past monthly average maintenance cost
  const totalServiceCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
  const avgMonthlyServiceCost = services.length > 0 ? totalServiceCost / Math.max(1, services.length) : 50;

  const estimatedCosts = {
    threeMonths:  Math.round(avgMonthlyServiceCost * 3),
    sixMonths:    Math.round(avgMonthlyServiceCost * 6),
    twelveMonths: Math.round(avgMonthlyServiceCost * 12),
  };

  // Expiry Warnings
  const expiryWarnings = [];
  documents.forEach((d) => {
    if (!d.expiryDate) return;
    const diff = new Date(d.expiryDate).getTime() - now;
    if (diff < 0) {
      expiryWarnings.push({ title: `${d.documentType} EXPIRED`, text: `Document "${d.title}" expired on ${new Date(d.expiryDate).toLocaleDateString()}`, urgency: 'Critical' });
    } else if (diff <= soon) {
      expiryWarnings.push({ title: `${d.documentType} Expiring Soon`, text: `Document "${d.title}" expires on ${new Date(d.expiryDate).toLocaleDateString()}`, urgency: 'High' });
    }
  });

  vehicles.forEach((v) => {
    if (v.insuranceExpiry && new Date(v.insuranceExpiry).getTime() - now <= soon) {
      expiryWarnings.push({ title: `Insurance Warning`, text: `Insurance for ${v.brand} ${v.model} expires on ${new Date(v.insuranceExpiry).toLocaleDateString()}`, urgency: 'High' });
    }
    if (v.pucExpiry && new Date(v.pucExpiry).getTime() - now <= soon) {
      expiryWarnings.push({ title: `PUC Warning`, text: `PUC for ${v.brand} ${v.model} expires on ${new Date(v.pucExpiry).toLocaleDateString()}`, urgency: 'High' });
    }
  });

  // Fuel & Mileage Optimization
  const validMileages = fuelLogs.map((f) => f.fuelQuantity > 0 ? (f.odometer / f.fuelQuantity) : 0).filter((m) => m > 0);
  const avgMileage  = validMileages.length > 0 ? Number((validMileages.reduce((a, b) => a + b, 0) / validMileages.length).toFixed(1)) : 14.5;
  const bestMileage = validMileages.length > 0 ? Math.max(...validMileages) : 18.2;

  const mileageTips = [
    `Current avg fuel economy is ${avgMileage} km/L vs best peak of ${bestMileage} km/L.`,
    'Maintain recommended tire pressure (32-35 PSI) to save up to 3% on fuel consumption.',
    'Avoid prolonged engine idling and aggressive acceleration to optimize fuel efficiency.',
    'Ensure engine air filter is cleaned or replaced during your next service cycle.',
  ];

  return {
    vehicles,
    services,
    fuelLogs,
    expenses,
    reminders,
    documents,
    vehicleHealthBreakdowns,
    estimatedCosts,
    expiryWarnings,
    mileageStats: { avgMileage, bestMileage, tips: mileageTips },
  };
};

// Helper to call Gemini API endpoint
const callGeminiAPI = async (userPrompt, contextData) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  try {
    const systemContext = `
You are AutoCare AI, an expert AI Vehicle Maintenance Assistant.
Here is the user's REAL live vehicle and maintenance database context:
- Registered Vehicles (${contextData.vehicles.length}): ${JSON.stringify(contextData.vehicles.map(v => ({ brand: v.brand, model: v.model, year: v.year, reg: v.registrationNumber, health: v.healthScore, odometer: v.odometer, nextService: v.nextServiceDate })))}
- Vehicle Health Deductions: ${JSON.stringify(contextData.vehicleHealthBreakdowns)}
- Cost Estimates (3/6/12 mo): ${JSON.stringify(contextData.estimatedCosts)}
- Expiry Warnings: ${JSON.stringify(contextData.expiryWarnings)}
- Fuel Mileage: Avg ${contextData.mileageStats.avgMileage} km/L, Best ${contextData.mileageStats.bestMileage} km/L

Answer the user's question using their EXACT real data. Be concise, professional, helpful, and clear.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemContext },
                { text: userPrompt },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || null;
  } catch (err) {
    console.error('Gemini API call error:', err.message);
    return null;
  }
};

// ─── GET /api/ai/insights ──────────────────────────────────────────────────────
const getAIInsights = async (req, res, next) => {
  try {
    const context = await getUserDataContext(req.user._id);

    res.status(200).json(
      ApiResponse.success({
        healthBreakdowns: context.vehicleHealthBreakdowns,
        estimatedCosts: context.estimatedCosts,
        expiryWarnings: context.expiryWarnings,
        mileageStats: context.mileageStats,
        vehicleCount: context.vehicles.length,
        serviceCount: context.services.length,
        documentCount: context.documents.length,
      })
    );
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/chat ─────────────────────────────────────────────────────────
const chatWithAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json(ApiResponse.error('Prompt is required'));
    }

    const context = await getUserDataContext(req.user._id);

    // Try Gemini API first
    let reply = await callGeminiAPI(prompt.trim(), context);

    // Fallback deterministic AI responses if API key is absent or network fails
    if (!reply) {
      const q = prompt.toLowerCase();
      if (q.includes('health') || q.includes('score')) {
        const bh = context.vehicleHealthBreakdowns[0];
        reply = bh
          ? `Vehicle Health Score Breakdown for ${bh.name}: Current score is ${bh.healthScore}%. Reasons: ${bh.deductions.join(', ')}.`
          : `No vehicles registered yet. Add a vehicle to compute health scores.`;
      } else if (q.includes('predict') || q.includes('service') || q.includes('maintenance')) {
        const v = context.vehicles[0];
        reply = v && v.nextServiceDate
          ? `Next predicted service for ${v.brand} ${v.model} is on ${new Date(v.nextServiceDate).toLocaleDateString()} or around ${(v.odometer || 0) + 5000} km.`
          : `Based on your past services, routine maintenance is recommended every 10,000 km or 6 months.`;
      } else if (q.includes('cost') || q.includes('estimate') || q.includes('spending')) {
        reply = `Estimated upcoming maintenance costs based on your history: 3 Months: $${context.estimatedCosts.threeMonths}, 6 Months: $${context.estimatedCosts.sixMonths}, 12 Months: $${context.estimatedCosts.twelveMonths}.`;
      } else if (q.includes('mileage') || q.includes('fuel')) {
        reply = `Your average fuel economy is ${context.mileageStats.avgMileage} km/L vs a best recorded ${context.mileageStats.bestMileage} km/L. Advice: ${context.mileageStats.tips.join(' ')}`;
      } else if (q.includes('expiry') || q.includes('insurance') || q.includes('puc')) {
        reply = context.expiryWarnings.length > 0
          ? `Compliance Alerts: ${context.expiryWarnings.map((w) => `${w.title}: ${w.text}`).join('; ')}.`
          : `All vehicle documents, insurance, and PUC certificates are active with no urgent expiries.`;
      } else {
        reply = `I have analyzed your garage (${context.vehicles.length} vehicles, ${context.services.length} services, ${context.documents.length} documents). Your estimated 6-month maintenance budget is $${context.estimatedCosts.sixMonths}. Average mileage is ${context.mileageStats.avgMileage} km/L.`;
      }
    }

    res.status(200).json(ApiResponse.success({ reply, timestamp: new Date() }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/monthly-report ────────────────────────────────────────────────
const getMonthlyReport = async (req, res, next) => {
  try {
    const context = await getUserDataContext(req.user._id);

    const report = {
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      user: req.user.name,
      vehiclesSummary: context.vehicles.map((v) => ({
        name: `${v.year} ${v.brand} ${v.model}`,
        registration: v.registrationNumber,
        healthScore: v.healthScore,
        odometer: `${v.odometer.toLocaleString()} km`,
      })),
      healthAnalysis: context.vehicleHealthBreakdowns,
      costProjections: context.estimatedCosts,
      expiryWarnings: context.expiryWarnings,
      mileageStats: context.mileageStats,
      generatedAt: new Date().toISOString(),
    };

    res.status(200).json(ApiResponse.success({ report }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAIInsights,
  chatWithAI,
  getMonthlyReport,
};
