const PredictiveAIService = require('../services/predictiveAI.service');
const ApiResponse          = require('../utils/ApiResponse');

// ─── GET /api/predictive-ai/dashboard ─────────────────────────────────────────
const getDashboardData = async (req, res, next) => {
  try {
    const data = await PredictiveAIService.analyzeUserData(req.user._id);
    res.status(200).json(ApiResponse.success(data));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/predictive-ai/timeline ──────────────────────────────────────────
const getTimeline = async (req, res, next) => {
  try {
    const data = await PredictiveAIService.analyzeUserData(req.user._id);
    res.status(200).json(ApiResponse.success({ timelineEvents: data.timelineEvents }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/predictive-ai/reports/monthly ───────────────────────────────────
const getMonthlyReportData = async (req, res, next) => {
  try {
    const data = await PredictiveAIService.analyzeUserData(req.user._id);
    const report = {
      title: 'Monthly AI Maintenance Report',
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      user: req.user.name,
      healthScore: data.healthScore,
      healthExplanation: data.healthExplanation,
      componentPredictions: data.componentPredictions,
      costForecast: data.costForecast,
      unusualSpendingAlerts: data.unusualSpendingAlerts,
      riskyDrivingPatterns: data.riskyDrivingPatterns,
      generatedAt: new Date().toISOString(),
    };
    res.status(200).json(ApiResponse.success({ report }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/predictive-ai/reports/annual ────────────────────────────────────
const getAnnualReportData = async (req, res, next) => {
  try {
    const data = await PredictiveAIService.analyzeUserData(req.user._id);
    const report = {
      title: 'Annual Vehicle Intelligence & Maintenance Audit',
      year: new Date().getFullYear(),
      user: req.user.name,
      primaryVehicle: data.primaryVehicle ? `${data.primaryVehicle.year} ${data.primaryVehicle.brand} ${data.primaryVehicle.model} (${data.primaryVehicle.registrationNumber})` : 'Garage Fleet',
      healthScore: data.healthScore,
      healthExplanation: data.healthExplanation,
      annualCostForecast: data.costForecast.next12Months,
      componentPredictions: data.componentPredictions,
      fuelEfficiency: data.fuelEfficiency,
      unusualSpendingAlerts: data.unusualSpendingAlerts,
      generatedAt: new Date().toISOString(),
    };
    res.status(200).json(ApiResponse.success({ report }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/predictive-ai/chat ─────────────────────────────────────────────
const predictiveChat = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json(ApiResponse.error('Prompt is required'));
    }

    const data = await PredictiveAIService.analyzeUserData(req.user._id);

    let reply = await PredictiveAIService.queryGeminiPredictive(prompt.trim(), data);

    if (!reply) {
      const q = prompt.toLowerCase();
      if (q.includes('brake') || q.includes('brakes')) {
        reply = `Brake pad wear is at ${data.componentPredictions.brakes.wearPct}%. Estimated replacement in ${data.componentPredictions.brakes.kmRemaining} km (around ${new Date(data.componentPredictions.brakes.estDate).toLocaleDateString()}).`;
      } else if (q.includes('battery')) {
        reply = `Battery wear is at ${data.componentPredictions.battery.wearPct}%. Estimated replacement date is ${new Date(data.componentPredictions.battery.estDate).toLocaleDateString()}.`;
      } else if (q.includes('tire') || q.includes('tires')) {
        reply = `Tire wear is at ${data.componentPredictions.tires.wearPct}%. Estimated replacement in ${data.componentPredictions.tires.kmRemaining} km.`;
      } else if (q.includes('oil')) {
        reply = `Engine oil wear is at ${data.componentPredictions.engineOil.wearPct}%. Service recommended around ${new Date(data.componentPredictions.engineOil.estDate).toLocaleDateString()}.`;
      } else if (q.includes('cost') || q.includes('forecast')) {
        reply = `Cost Forecast: Next Month: $${data.costForecast.nextMonth}, 3 Months: $${data.costForecast.next3Months}, 6 Months: $${data.costForecast.next6Months}, 12 Months: $${data.costForecast.next12Months}.`;
      } else {
        reply = `Predictive Audit: Health score is ${data.healthScore}%. Brakes wear ${data.componentPredictions.brakes.wearPct}%, Battery ${data.componentPredictions.battery.wearPct}%, Engine Oil ${data.componentPredictions.engineOil.wearPct}%. Estimated 12-month budget is $${data.costForecast.next12Months}.`;
      }
    }

    res.status(200).json(ApiResponse.success({ reply, timestamp: new Date() }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardData,
  getTimeline,
  getMonthlyReportData,
  getAnnualReportData,
  predictiveChat,
};
