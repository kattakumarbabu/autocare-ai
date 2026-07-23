import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { performanceReportApi } from '../../api/performanceReportApi';
import {
  ArrowLeft, Shield, Gauge, Fuel, Wrench, Calendar, AlertTriangle,
  Lightbulb, Cpu, Download, Loader2, AlertCircle, CheckCircle2, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const VehiclePerformanceReportPage = () => {
  const { id }     = useParams();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await performanceReportApi.getByVehicleId(id);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load performance report');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrintPDF = () => {
    if (!data) return;
    const { vehicle, report } = data;
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked. Allow pop-ups to print report.');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Performance Audit Report — ${vehicle.name}</title>
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
            <h1>Vehicle Performance & Maintenance Audit Report</h1>
            <p>Vehicle: ${vehicle.name} (${vehicle.registrationNumber}) | Odometer: ${vehicle.odometer.toLocaleString()} km | Date: ${new Date(report.generatedAt).toLocaleString()}</p>
          </div>

          <div class="card">
            <h3>1. Health Score: ${report.healthScore}%</h3>
            <p>${report.healthExplanation}</p>
          </div>

          <div class="card">
            <h3>2. Mileage & Fuel Telemetry</h3>
            <p>Average Mileage: <b>${report.mileage.avgKmPerLiter} km/L</b> | Peak Mileage: <b>${report.mileage.bestKmPerLiter} km/L</b></p>
          </div>

          <div class="card">
            <h3>3. Expense Totals</h3>
            <p>Lifetime Fuel Spend: <b>$${report.fuelExpenses.lifetime.toLocaleString()}</b></p>
            <p>Lifetime Maintenance Spend: <b>$${report.maintenanceExpenses.lifetime.toLocaleString()}</b></p>
          </div>

          <div class="card">
            <h3>4. AI Forecast & Predictions</h3>
            <p>Estimated 3-Month Cost: <b>$${report.aiForecast.costNext3Months}</b> | 6-Month: <b>$${report.aiForecast.costNext6Months}</b> | 12-Month: <b>$${report.aiForecast.costNext12Months}</b></p>
            <p>Brake Wear: <b>${report.aiForecast.brakeWearPct}%</b> | Engine Oil Wear: <b>${report.aiForecast.engineOilWearPct}%</b></p>
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
        <Link to="/vehicles" className="btn-primary text-sm">Back to Garage</Link>
      </div>
    </div>
  );

  const { vehicle, report } = data;
  const {
    healthScore, healthExplanation, mileage, fuelExpenses,
    maintenanceExpenses, upcomingServices = [], upcomingInsurance, suggestions = [], aiForecast = {},
  } = report;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link to={`/vehicles/${vehicle.id}/digital-twin`} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                Official Performance Audit
              </span>
              <h1 className="font-display font-bold text-3xl text-white mt-1">{vehicle.name} Performance Report</h1>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-0.5">
                Reg: {vehicle.registrationNumber} • {vehicle.odometer.toLocaleString()} km
              </p>
            </div>
          </div>

          <button onClick={handlePrintPDF} className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 self-start sm:self-auto">
            <Download size={15} /> Download PDF Audit Report
          </button>
        </div>

        {/* ── 1. Health Score ────────────────────────────────────────── */}
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-white text-base flex items-center gap-2">
              <Shield size={18} className="text-brand-400" /> 1. Vehicle Health Score
            </h2>
            <span className="font-display font-extrabold text-3xl text-emerald-400">{healthScore}%</span>
          </div>
          <p className="text-slate-300 text-xs bg-white/5 p-3 rounded-xl border border-white/5">{healthExplanation}</p>
        </div>

        {/* ── 2. Mileage & Telemetry ──────────────────────────────────── */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h2 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-amber-400" /> 2. Mileage & Efficiency Telemetry
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">Average Mileage</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{mileage.avgKmPerLiter} km/L</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">Peak Best Mileage</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{mileage.bestKmPerLiter} km/L</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">Total Distance</p>
              <p className="text-2xl font-bold text-white mt-1">{mileage.totalDistanceKm.toLocaleString()} km</p>
            </div>
          </div>
        </div>

        {/* ── 3 & 4. Fuel & Maintenance Expenses ──────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6 animate-fade-in">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Fuel size={18} className="text-brand-400" /> 3. Fuel Expenses
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">This Month:</span>
                <span className="text-white font-bold">${fuelExpenses.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">Lifetime Total:</span>
                <span className="text-emerald-400 font-bold">${fuelExpenses.lifetime.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Wrench size={18} className="text-purple-400" /> 4. Maintenance Expenses
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">This Month:</span>
                <span className="text-white font-bold">${maintenanceExpenses.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">Lifetime Total:</span>
                <span className="text-purple-400 font-bold">${maintenanceExpenses.lifetime.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 5 & 6. Upcoming Services & Insurance ───────────────────── */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6 animate-fade-in">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Calendar size={18} className="text-brand-400" /> 5. Upcoming Services
            </h2>
            {upcomingServices.length === 0 ? (
              <p className="text-slate-400 text-xs">No upcoming service appointments scheduled.</p>
            ) : (
              <div className="space-y-2">
                {upcomingServices.map((s, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{s.serviceType}</p>
                      <p className="text-slate-400 text-[11px]">{s.serviceCenter}</p>
                    </div>
                    <span className="text-brand-300 font-medium">{fmtDate(s.date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" /> 6. Upcoming Insurance
            </h2>
            <div className="p-4 bg-white/5 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance Status:</span>
                <span className="text-emerald-400 font-bold">{upcomingInsurance.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry Date:</span>
                <span className="text-white font-medium">{fmtDate(upcomingInsurance.expiryDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 7 & 8. Suggestions & AI Forecast ────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-400" /> 7. AI Actionable Suggestions
            </h2>
            <div className="space-y-2 text-xs">
              {suggestions.map((s, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-xl text-slate-300 flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Cpu size={18} className="text-brand-400" /> 8. AI Predictive Forecast
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">3-Month Est. Cost:</span>
                <span className="text-white font-bold">${aiForecast.costNext3Months || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">6-Month Est. Cost:</span>
                <span className="text-brand-300 font-bold">${aiForecast.costNext6Months || 0}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400">12-Month Est. Cost:</span>
                <span className="text-emerald-400 font-bold">${aiForecast.costNext12Months || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehiclePerformanceReportPage;
