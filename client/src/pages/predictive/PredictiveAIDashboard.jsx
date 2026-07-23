import { useState, useEffect } from 'react';
import { predictiveAIApi } from '../../api/predictiveAIApi';
import {
  Sparkles, Cpu, Shield, AlertTriangle, TrendingUp, Calendar,
  Download, DollarSign, Fuel, Disc, Battery, CircleDot, Droplet,
  Loader2, ArrowUpRight, Clock, Info, CheckCircle2, AlertCircle,
  FileText, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ComponentWearCard = ({ title, icon: Icon, wearPct, kmRemaining, estDate, status }) => {
  const isDanger  = status === 'Critical' || wearPct >= 80;
  const isWarning = status === 'Warning'  || wearPct >= 60;

  const barColor   = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
  const badgeColor = isDanger ? 'bg-red-500/10 text-red-400 border-red-500/20' : isWarning ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <div className="glass-card p-5 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-brand-400">
            <Icon size={18} />
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{title}</h4>
            <p className="text-slate-500 text-[11px]">
              {kmRemaining ? `${kmRemaining.toLocaleString()} km left` : 'Time-based wear'}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
          {wearPct}% Wear ({status})
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${barColor} transition-all duration-500 rounded-full`} style={{ width: `${wearPct}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Est. Replacement:</span>
        <span className="font-semibold text-white flex items-center gap-1">
          <Calendar size={12} /> {fmtDate(estDate)}
        </span>
      </div>
    </div>
  );
};

const PredictiveAIDashboard = () => {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await predictiveAIApi.getDashboard();
        setData(res.data.data);
      } catch {
        toast.error('Failed to load predictive telemetry');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // PDF Report Download Engine (Monthly or Annual)
  const handlePrintReport = async (type = 'monthly') => {
    try {
      const apiCall = type === 'annual' ? predictiveAIApi.getAnnualReport : predictiveAIApi.getMonthlyReport;
      const res = await apiCall();
      const report = res.data.data.report;

      const win = window.open('', '_blank');
      if (!win) {
        toast.error('Pop-up blocked. Allow pop-ups to view printable report.');
        return;
      }

      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${report.title}</title>
            <style>
              body { font-family: sans-serif; padding: 30px; color: #0f172a; }
              .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
              .header h1 { margin: 0; color: #1e3a8a; font-size: 22px; }
              .header p { margin: 4px 0 0 0; color: #64748b; font-size: 12px; }
              .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
              th { background: #f1f5f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${report.title}</h1>
              <p>Generated for: ${report.user} | Period: ${report.period || report.year} | Date: ${new Date(report.generatedAt).toLocaleString()}</p>
            </div>

            <div class="card">
              <h3>Overall Predictive Health Score: ${report.healthScore}%</h3>
              <p><b>Analysis & Explanations:</b> ${report.healthExplanation}</p>
            </div>

            <div class="card">
              <h3>Predicted Component Replacement Timelines</h3>
              <table>
                <thead><tr><th>Component</th><th>Wear %</th><th>Status</th></tr></thead>
                <tbody>
                  ${Object.entries(report.componentPredictions || {}).map(([k, v]) => `
                    <tr><td style="text-transform:capitalize">${k}</td><td>${v.wearPct}%</td><td>${v.status}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="card">
              <h3>Maintenance Cost Projections</h3>
              <p>Next Month: $${report.costForecast?.nextMonth || 0} | 3 Months: $${report.costForecast?.next3Months || 0} | 6 Months: $${report.costForecast?.next6Months || 0} | 12 Months: $${report.costForecast?.next12Months || 0}</p>
            </div>
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    } catch {
      toast.error('Failed to generate report PDF');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  const {
    primaryVehicle, dailyKm, healthScore = 100, healthExplanation,
    componentPredictions = {}, costForecast = {}, unusualSpendingAlerts = [],
    fuelEfficiency = {}, riskyDrivingPatterns = [], timelineEvents = [],
  } = data || {};

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <Cpu size={22} className="text-brand-400" />
              <h1 className="font-display font-bold text-3xl text-white">AI Predictive Vehicle Intelligence</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Enterprise predictive telemetry, component wear forecasting, and anomaly detection
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrintReport('monthly')}
              className="btn-ghost py-2.5 px-4 text-xs flex items-center gap-1.5"
            >
              <Download size={14} /> Monthly AI Report
            </button>
            <button
              onClick={() => handlePrintReport('annual')}
              className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5"
            >
              <Download size={14} /> Annual Vehicle Report (PDF)
            </button>
          </div>
        </div>

        {/* Health Score Gauge & Daily Telemetry Summary */}
        <div className="grid lg:grid-cols-12 gap-6 mb-8 animate-slide-up">

          {/* Health Score Dial Card */}
          <div className="lg:col-span-4 glass-card p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Predictive Health Score
            </h3>

            <div className="relative w-40 h-40 flex items-center justify-center mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-red-400'}
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display font-extrabold text-4xl text-white">{healthScore}%</span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">HEALTH INDEX</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed max-w-xs">{healthExplanation}</p>
          </div>

          {/* Telemetry Overview & Cost Forecast Cards */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card p-5 flex items-center justify-between flex-wrap gap-4 border border-brand-500/20 bg-brand-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center text-white">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">
                    {primaryVehicle ? `${primaryVehicle.year} ${primaryVehicle.brand} ${primaryVehicle.model}` : 'Garage Vehicle Telemetry'}
                  </h4>
                  <p className="text-slate-400 text-xs">Calculated Driving Rate: <span className="text-white font-semibold">{dailyKm} km/day</span></p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                AI Active Telemetry
              </span>
            </div>

            {/* Cost Forecast Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <p className="text-slate-400 text-xs mb-1">Next Month</p>
                <p className="text-xl font-bold text-white">${costForecast.nextMonth || 0}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-slate-400 text-xs mb-1">Next 3 Months</p>
                <p className="text-xl font-bold text-brand-300">${costForecast.next3Months || 0}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-slate-400 text-xs mb-1">Next 6 Months</p>
                <p className="text-xl font-bold text-purple-400">${costForecast.next6Months || 0}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-slate-400 text-xs mb-1">Next 12 Months</p>
                <p className="text-xl font-bold text-emerald-400">${costForecast.next12Months || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Component Wear Replacement Predictions */}
        <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
          <Disc size={20} className="text-brand-400" /> Component Replacement Predictions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <ComponentWearCard
            title="Brake Pads"
            icon={Disc}
            wearPct={componentPredictions.brakes?.wearPct || 0}
            kmRemaining={componentPredictions.brakes?.kmRemaining}
            estDate={componentPredictions.brakes?.estDate}
            status={componentPredictions.brakes?.status || 'Good'}
          />
          <ComponentWearCard
            title="Battery Life"
            icon={Battery}
            wearPct={componentPredictions.battery?.wearPct || 0}
            kmRemaining={null}
            estDate={componentPredictions.battery?.estDate}
            status={componentPredictions.battery?.status || 'Good'}
          />
          <ComponentWearCard
            title="Tire Tread"
            icon={CircleDot}
            wearPct={componentPredictions.tires?.wearPct || 0}
            kmRemaining={componentPredictions.tires?.kmRemaining}
            estDate={componentPredictions.tires?.estDate}
            status={componentPredictions.tires?.status || 'Good'}
          />
          <ComponentWearCard
            title="Engine Oil"
            icon={Droplet}
            wearPct={componentPredictions.engineOil?.wearPct || 0}
            kmRemaining={componentPredictions.engineOil?.kmRemaining}
            estDate={componentPredictions.engineOil?.estDate}
            status={componentPredictions.engineOil?.status || 'Good'}
          />
        </div>

        {/* Anomaly Detection: Spending Spikes & Risky Driving Alerts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8 animate-fade-in">

          {/* Unusual Spending Alerts */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-3 text-base flex items-center gap-2">
              <DollarSign size={18} className="text-amber-400" /> Unusual Spending Spikes
            </h3>
            {unusualSpendingAlerts.length === 0 ? (
              <p className="text-slate-400 text-xs">No unusual expense spikes detected in your logs.</p>
            ) : (
              <div className="space-y-3">
                {unusualSpendingAlerts.map((alt, idx) => (
                  <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
                    <p className="text-amber-400 font-semibold">{alt.title}</p>
                    <p className="text-slate-300 text-[11px] mt-0.5">{alt.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risky Driving Pattern Detection */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-3 text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-red-400" /> Driving Pattern & Fuel Anomaly Detection
            </h3>
            {riskyDrivingPatterns.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 size={16} /> Fuel consumption rate is smooth with no aggressive driving patterns detected!
              </div>
            ) : (
              <div className="space-y-3">
                {riskyDrivingPatterns.map((pat, idx) => (
                  <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs">
                    <p className="text-red-400 font-semibold">{pat.title}</p>
                    <p className="text-slate-300 text-[11px] mt-0.5">{pat.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Predictive AI Timeline */}
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="font-semibold text-white mb-4 text-base flex items-center gap-2">
            <Clock size={18} className="text-brand-400" /> Predictive Maintenance Timeline
          </h3>
          <div className="space-y-3">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{evt.desc}</p>
                    <p className="text-slate-400 text-[11px]">{evt.type}</p>
                  </div>
                </div>
                <span className="font-mono text-slate-300 font-medium">{fmtDate(evt.date)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAIDashboard;
