const Vehicle  = require('../models/Vehicle.model');
const Service  = require('../models/Service.model');
const FuelLog  = require('../models/FuelLog.model');
const Expense  = require('../models/Expense.model');
const ApiResponse = require('../utils/ApiResponse');

// Helper to call Gemini API for resale valuation explanation
const queryGeminiResaleExplanation = async (vehicle, metrics) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `
You are an Enterprise Automotive Valuation Specialist AI.
Vehicle Details:
- Vehicle: ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.variant || ''})
- Odometer: ${metrics.odometer} km
- Age: ${metrics.ageYears} years
- Fuel Efficiency: ${metrics.avgMileage} km/L
- Service Count: ${metrics.serviceCount} completed services
- Health Score & Quality: ${metrics.healthScore}%
- Current Estimated Value: $${metrics.currentValue}
- Forecasted Value (6 Months): $${metrics.val6Months}
- Forecasted Value (1 Year): $${metrics.val1Year}
- Forecasted Value (2 Years): $${metrics.val2Years}

Provide a 3-bullet point natural language explanation explaining why this vehicle retained or lost value based on brand reliability, odometer rate, service history, and maintenance quality.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error('Gemini Resale API error:', err.message);
    return null;
  }
};

// ─── GET /api/resale-ai/vehicle/:vehicleId ────────────────────────────────────
const getResalePrediction = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
    if (!vehicle) return res.status(404).json(ApiResponse.error('Vehicle not found'));

    const [services, fuelLogs, expenses] = await Promise.all([
      Service.find({ vehicle: vehicleId }),
      FuelLog.find({ vehicle: vehicleId }),
      Expense.find({ vehicle: vehicleId }),
    ]);

    // 1. Inputs Calculation
    const ageYears = Math.max(1, new Date().getFullYear() - vehicle.year);
    const odometer = vehicle.odometer || 0;

    const validMileages = fuelLogs.map((f) => f.fuelQuantity > 0 ? (f.odometer / f.fuelQuantity) : 0).filter((m) => m > 0);
    const avgMileage  = validMileages.length > 0 ? Number((validMileages.reduce((a, b) => a + b, 0) / validMileages.length).toFixed(1)) : 14.5;

    const serviceCount = services.length;
    const healthScore  = vehicle.healthScore || 100;

    // Check accident/repair history from expenses or services
    const accidentServices = services.filter((s) => s.serviceType?.toLowerCase().includes('accident') || s.serviceType?.toLowerCase().includes('bodywork'));
    const accidentExpenses = expenses.filter((e) => e.category === 'Repair' && e.amount > 500);
    const hasAccidentHistory = accidentServices.length > 0 || accidentExpenses.length > 0;

    // 2. MSRP Base & Brand Value Retention Rate
    const brandRetentionRates = {
      Toyota: 0.92, Honda: 0.90, BMW: 0.82, Mercedes: 0.81, Tesla: 0.88,
      Ford: 0.84, Hyundai: 0.86, Tata: 0.85, MG: 0.83,
    };
    const brandRate = brandRetentionRates[vehicle.brand] || 0.85;

    const baseMsrp = vehicle.vehicleType === 'Bike' ? 6000 : vehicle.vehicleType === 'Scooter' ? 2500 : vehicle.vehicleType === 'Truck' ? 45000 : 32000;

    // Depreciation Model Calculations
    const annualDepreciation = Math.pow(brandRate, ageYears);
    const odoPenalty = (odometer / 100000) * 0.12; // -12% per 100k km
    const serviceBonus = Math.min(0.10, serviceCount * 0.02); // +2% per regular service up to +10%
    const accidentPenalty = hasAccidentHistory ? 0.15 : 0; // -15% if accident recorded
    const healthMultiplier = (healthScore / 100);

    const currentValue = Math.max(
      600,
      Math.round(baseMsrp * annualDepreciation * (1 - odoPenalty + serviceBonus - accidentPenalty) * healthMultiplier)
    );

    // Future Predictions (6 months, 1 year, 2 years)
    const val6Months = Math.round(currentValue * 0.94);
    const val1Year   = Math.round(currentValue * 0.88);
    const val2Years  = Math.round(currentValue * 0.77);

    // Depreciation Graph Data Points
    const depreciationGraph = [
      { label: 'Current Value', months: 0,  value: currentValue, percentage: 100 },
      { label: 'After 6 Months', months: 6,  value: val6Months,   percentage: 94 },
      { label: 'After 1 Year',  months: 12, value: val1Year,    percentage: 88 },
      { label: 'After 2 Years', months: 24, value: val2Years,   percentage: 77 },
    ];

    // Factors Impact Breakdown
    const valuationFactors = [
      { factor: 'Brand & Model Retention', impact: `${Math.round(brandRate * 100)}%`, effect: 'Positive', desc: `${vehicle.brand} retains strong market demand.` },
      { factor: 'Odometer Mileage', impact: `-${Math.round(odoPenalty * 100)}%`, effect: 'Negative', desc: `${odometer.toLocaleString()} km accumulated mileage.` },
      { factor: 'Service History Quality', impact: `+${Math.round(serviceBonus * 100)}%`, effect: 'Positive', desc: `${serviceCount} documented services in database.` },
      { factor: 'Accident History', impact: hasAccidentHistory ? '-15%' : '0%', effect: hasAccidentHistory ? 'Negative' : 'Positive', desc: hasAccidentHistory ? 'Minor repair records detected.' : 'Clean accident-free record.' },
    ];

    // 3. AI Explanation
    const metrics = { odometer, ageYears, avgMileage, serviceCount, healthScore, currentValue, val6Months, val1Year, val2Years };
    let aiExplanation = await queryGeminiResaleExplanation(vehicle, metrics);

    if (!aiExplanation) {
      aiExplanation = `Valuation Analysis for ${vehicle.year} ${vehicle.brand} ${vehicle.model}:
• Strong ${vehicle.brand} brand value retention contributes positively to current valuation of $${currentValue.toLocaleString()}.
• Documented service history (${serviceCount} verified records) and a ${healthScore}% health score add +${Math.round(serviceBonus * 100)}% premium value.
• Accumulated odometer mileage of ${odometer.toLocaleString()} km accounts for expected market depreciation over ${ageYears} years.`;
    }

    res.status(200).json(
      ApiResponse.success({
        vehicle: {
          id: vehicle._id,
          name: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
          registrationNumber: vehicle.registrationNumber,
          odometer,
          ageYears,
        },
        resalePrediction: {
          currentValue,
          valueRange: { min: Math.round(currentValue * 0.95), max: Math.round(currentValue * 1.05) },
          val6Months,
          val1Year,
          val2Years,
          depreciationGraph,
          valuationFactors,
          aiExplanation,
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getResalePrediction,
};
