import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { advancedAnalyticsApi } from '../../api/advancedAnalyticsApi';
import {
  BarChart3, Fuel, Wrench, Shield, Calendar, TrendingUp,
  Cpu, Loader2, AlertCircle, Car, ArrowUpRight, DollarSign, Layers, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const AdvancedAnalyticsDashboard = () => {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await advancedAnalyticsApi.getDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load advanced analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Analytics Error</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/dashboard" className="btn-primary text-sm">Back to Dashboard</Link>
      </div>
    </div>
  );

  const {
    monthlyExpenses = [], fuelTrends = [], serviceTrends = [],
    aiHealthTrends = [], expenseForecast = {}, vehicleComparison = [],
    maintenanceCalendar = [],
  } = data;

  const maxMonthly = Math.max(...monthlyExpenses.map((m) => m.total), 100);

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">Enterprise Telemetry</span>
            </div>
            <h1 className="font-display font-bold text-3xl text-white mt-1">Advanced Analytics Dashboard</h1>
            <p className="text-slate-400 text-xs">Real-time expenditure, fuel efficiency, service trends, & AI forecasts</p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/predictive-ai" className="btn-primary py-2.5 px-4 text-xs">
              <Cpu size={14} /> Predictive Intelligence
            </Link>
          </div>
        </div>

        {/* ── Expense Forecast Banner ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-5 border border-brand-500/20">
            <p className="text-slate-400 text-xs font-medium mb-1">3-Month Expense Forecast</p>
            <p className="font-display font-bold text-2xl text-white">${expenseForecast.forecast3Months?.toLocaleString()}</p>
            <p className="text-slate-500 text-[11px] mt-1">Avg. Monthly: ${expenseForecast.avgMonthly}/mo</p>
          </div>

          <div className="glass-card p-5 border border-brand-500/20">
            <p className="text-slate-400 text-xs font-medium mb-1">6-Month Expense Forecast</p>
            <p className="font-display font-bold text-2xl text-brand-300">${expenseForecast.forecast6Months?.toLocaleString()}</p>
            <p className="text-slate-500 text-[11px] mt-1">Projected total maintenance & fuel</p>
          </div>

          <div className="glass-card p-5 border border-brand-500/20">
            <p className="text-slate-400 text-xs font-medium mb-1">12-Month Expense Forecast</p>
            <p className="font-display font-bold text-2xl text-emerald-400">${expenseForecast.forecast12Months?.toLocaleString()}</p>
            <p className="text-slate-500 text-[11px] mt-1">Annual budget allocation</p>
          </div>
        </div>

        {/* ── Monthly Vehicle Expenses & Interactive Visual Chart ───────── */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h3 className="font-semibold text-white text-base mb-6 flex items-center gap-2">
            <DollarSign size={18} className="text-brand-400" /> Monthly Vehicle Expenses (6-Month Trend)
          </h3>

          <div className="space-y-4">
            {monthlyExpenses.map((m) => {
              const pct = Math.round((m.total / maxMonthly) * 100);
              return (
                <div key={m.month} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300 font-mono">{m.month}</span>
                    <span className="text-white font-mono">${m.total.toLocaleString()} (Fuel: ${m.fuel} | Service: ${m.maintenance})</span>
                  </div>
                  <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-brand-500 transition-all duration-500"
                      style={{ width: `${Math.round((m.fuel / maxMonthly) * 100)}%` }}
                      title={`Fuel: $${m.fuel}`}
                    />
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${Math.round((m.maintenance / maxMonthly) * 100)}%` }}
                      title={`Service: $${m.maintenance}`}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.round((m.other / maxMonthly) * 100)}%` }}
                      title={`Other: $${m.other}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 text-xs text-slate-400 pt-4 border-t border-white/5">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-500 inline-block" /> Fuel Spend</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> Maintenance Spend</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Other Expenses</span>
          </div>
        </div>

        {/* ── Fuel Trends & AI Health Trends Grid ────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8 animate-fade-in">
          {/* Fuel Telemetry Trends */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 text-base flex items-center gap-2">
              <Fuel size={18} className="text-amber-400" /> Fuel Efficiency Trends (km/L)
            </h3>
            <div className="space-y-3">
              {fuelTrends.map((f) => (
                <div key={f.month} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex items-center justify-between">
                  <span className="text-slate-300 font-mono">{f.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 font-bold">{f.avgMileage} km/L</span>
                    <span className="text-slate-400">${f.totalCost} spent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Health Trends */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white mb-4 text-base flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" /> AI Vehicle Health Scores
            </h3>
            <div className="space-y-3">
              {aiHealthTrends.map((v) => (
                <div key={v.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{v.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{v.registrationNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{v.healthScore}%</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Vehicle Comparison Matrix ───────────────────────────────── */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Layers size={18} className="text-brand-400" /> Vehicle Comparison Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Odometer</th>
                  <th className="py-2.5 px-3">Health Score</th>
                  <th className="py-2.5 px-3">Avg Mileage</th>
                  <th className="py-2.5 px-3">Maintenance Spend</th>
                  <th className="py-2.5 px-3">Fuel Spend</th>
                  <th className="py-2.5 px-3">Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {vehicleComparison.map((vc) => (
                  <tr key={vc.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      {vc.name} <span className="text-slate-500 font-mono text-[10px] block">{vc.registrationNumber}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">{vc.odometer.toLocaleString()} km</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{vc.healthScore}%</td>
                    <td className="py-3 px-3 text-amber-400 font-bold">{vc.avgMileage} km/L</td>
                    <td className="py-3 px-3 text-purple-400 font-bold">${vc.maintenanceCost.toLocaleString()}</td>
                    <td className="py-3 px-3 text-brand-300 font-bold">${vc.fuelCost.toLocaleString()}</td>
                    <td className="py-3 px-3">{vc.serviceCount} Records</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Interactive Maintenance Calendar ───────────────────────── */}
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-brand-400" /> Maintenance & Event Calendar Stream
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {maintenanceCalendar.map((evt) => (
              <div key={evt.id} className="p-3 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 text-xs transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    evt.type === 'Service' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                  }`}>
                    {evt.type}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{fmtDate(evt.date)}</span>
                </div>
                <p className="text-white font-medium truncate mt-1">{evt.title}</p>
                {evt.cost && <p className="text-slate-400 text-[11px] mt-0.5">Cost: ${evt.cost}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
