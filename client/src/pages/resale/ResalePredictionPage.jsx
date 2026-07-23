import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resaleAIApi } from '../../api/resaleAIApi';
import {
  ArrowLeft, DollarSign, TrendingDown, Sparkles, Shield,
  Calendar, Award, Info, Download, Loader2, AlertCircle, TrendingUp, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResalePredictionPage = () => {
  const { id }     = useParams();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await resaleAIApi.getPrediction(id);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load resale prediction');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrintValuationReport = () => {
    if (!data) return;
    const { vehicle, resalePrediction } = data;
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked. Allow pop-ups to print report.');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Resale Valuation Report — ${vehicle.name}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #0f172a; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 22px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AI Resale Valuation Certificate</h1>
            <p>Vehicle: ${vehicle.name} (${vehicle.registrationNumber}) | Odometer: ${vehicle.odometer.toLocaleString()} km</p>
          </div>

          <div class="card">
            <h2>Current Valuation: $${resalePrediction.currentValue.toLocaleString()}</h2>
            <p>Estimated Valuation Range: $${resalePrediction.valueRange.min.toLocaleString()} – $${resalePrediction.valueRange.max.toLocaleString()}</p>
          </div>

          <div class="card">
            <h3>Future Valuation Projections</h3>
            <p>After 6 Months: <b>$${resalePrediction.val6Months.toLocaleString()}</b></p>
            <p>After 1 Year: <b>$${resalePrediction.val1Year.toLocaleString()}</b></p>
            <p>After 2 Years: <b>$${resalePrediction.val2Years.toLocaleString()}</b></p>
          </div>

          <div class="card">
            <h3>AI Valuation Reasoning & Analysis</h3>
            <pre style="white-space: pre-wrap; font-family: inherit;">${resalePrediction.aiExplanation}</pre>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/vehicles" className="btn-primary text-sm">Back to My Garage</Link>
      </div>
    </div>
  );

  const { vehicle, resalePrediction } = data;
  const {
    currentValue, valueRange, val6Months, val1Year, val2Years,
    depreciationGraph = [], valuationFactors = [], aiExplanation,
  } = resalePrediction;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link to={`/vehicles/${vehicle.id}/digital-twin`} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-400" />
                <span className="text-xs font-semibold text-brand-300">AI Valuation Engine</span>
              </div>
              <h1 className="font-display font-bold text-3xl text-white mt-0.5">{vehicle.name} Resale Prediction</h1>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-0.5">
                Reg: {vehicle.registrationNumber} • {vehicle.odometer.toLocaleString()} km
              </p>
            </div>
          </div>

          <button onClick={handlePrintValuationReport} className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 self-start sm:self-auto">
            <Download size={15} /> Download Valuation Certificate (PDF)
          </button>
        </div>

        {/* Current Value Hero Card */}
        <div className="glass-card p-8 mb-8 animate-slide-up border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-surface-900 to-surface-900 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current AI Estimated Market Value</span>
            <p className="font-display font-extrabold text-5xl text-white mt-1">
              ${currentValue.toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Estimated Fair Market Range: <span className="text-emerald-400 font-semibold">${valueRange.min.toLocaleString()} – ${valueRange.max.toLocaleString()}</span>
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center sm:text-right min-w-[200px]">
            <p className="text-slate-400 text-xs">Vehicle Age</p>
            <p className="text-lg font-bold text-white mb-2">{vehicle.ageYears} Years Old</p>
            <p className="text-slate-400 text-xs">Accumulated Odometer</p>
            <p className="text-lg font-bold text-brand-300">{vehicle.odometer.toLocaleString()} km</p>
          </div>
        </div>

        {/* Price Predictions Cards (6 months, 1 year, 2 years) */}
        <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-brand-400" /> Future Resale Price Predictions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <div className="glass-card p-5 border hover:border-brand-500/30 transition-all">
            <p className="text-slate-400 text-xs font-medium mb-1">After 6 Months</p>
            <p className="font-display font-bold text-2xl text-white">${val6Months.toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-1">Est. 6% market depreciation</p>
          </div>

          <div className="glass-card p-5 border hover:border-brand-500/30 transition-all">
            <p className="text-slate-400 text-xs font-medium mb-1">After 1 Year</p>
            <p className="font-display font-bold text-2xl text-brand-300">${val1Year.toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-1">Est. 12% market depreciation</p>
          </div>

          <div className="glass-card p-5 border hover:border-brand-500/30 transition-all">
            <p className="text-slate-400 text-xs font-medium mb-1">After 2 Years</p>
            <p className="font-display font-bold text-2xl text-purple-400">${val2Years.toLocaleString()}</p>
            <p className="text-slate-500 text-xs mt-1">Est. 23% market depreciation</p>
          </div>
        </div>

        {/* Visual Depreciation Graph */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h3 className="font-semibold text-white text-base mb-6 flex items-center gap-2">
            <TrendingDown size={18} className="text-amber-400" /> Depreciation Trajectory Graph
          </h3>

          <div className="space-y-4">
            {depreciationGraph.map((point) => (
              <div key={point.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">{point.label}</span>
                  <span className="text-white font-mono">${point.value.toLocaleString()} ({point.percentage}%)</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                    style={{ width: `${point.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valuation Factors & AI Explanation */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">

          {/* Factors Breakdown */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 text-base flex items-center gap-2">
              <Award size={18} className="text-brand-400" /> Valuation Impact Factors
            </h3>
            <div className="space-y-3">
              {valuationFactors.map((f, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{f.factor}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{f.desc}</p>
                  </div>
                  <span className={`font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                    f.effect === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {f.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Explanation Card */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 text-base flex items-center gap-2">
              <Sparkles size={18} className="text-brand-400" /> AI Valuation Reasoning
            </h3>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {aiExplanation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResalePredictionPage;
