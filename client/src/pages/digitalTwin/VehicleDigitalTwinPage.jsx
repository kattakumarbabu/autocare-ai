import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { digitalTwinApi } from '../../api/digitalTwinApi';
import {
  Car, Shield, Clock, Wrench, Fuel, DollarSign, FileText, Bell,
  Sparkles, Activity, Gauge, TrendingUp, AlertTriangle, ArrowLeft,
  CheckCircle2, Loader2, Edit3, Calendar, Plus, ChevronRight, Layers, TrendingDown, FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const TIMELINE_FILTERS = ['All', 'Purchased', 'Fuel', 'Services', 'Expenses', 'Reminders', 'Documents', 'AI Predictions'];

const getEventIcon = (type) => {
  if (type === 'Purchased')      return Car;
  if (type === 'Fuel')           return Fuel;
  if (type === 'Services')       return Wrench;
  if (type === 'Expenses')       return DollarSign;
  if (type === 'Reminders')      return Bell;
  if (type === 'Documents')      return FileText;
  if (type === 'AI Predictions') return Sparkles;
  return Activity;
};

const VehicleDigitalTwinPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [activeTab,   setActiveTab]   = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await digitalTwinApi.getByVehicleId(id);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Vehicle digital twin not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

  const { vehicle, digitalTwin } = data;
  const {
    healthScore, healthExplanation, totalDistanceDriven, totalFuelConsumed,
    averageMileage, lifetimeFuelCost, lifetimeMaintenanceCost, totalServiceCount,
    insuranceStatus, warrantyStatus, pucStatus, documentsStatus, aiRiskScore,
    estimatedResaleValue, estimatedNextYearMaintenanceCost, timeline = [],
  } = digitalTwin;

  const filteredTimeline = activeTab === 'All'
    ? timeline
    : timeline.filter((item) => item.type === activeTab);

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link to="/vehicles" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  Vehicle Digital Twin
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  aiRiskScore === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {aiRiskScore}
                </span>
              </div>
              <h1 className="font-display font-bold text-3xl text-white mt-1">
                {vehicle.year} {vehicle.brand} {vehicle.model} {vehicle.variant}
              </h1>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-0.5">
                Reg: {vehicle.registrationNumber} • Fuel: {vehicle.fuelType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/vehicles/${vehicle._id}/performance-report`} className="btn-ghost py-2.5 px-3 text-xs text-brand-300 border-brand-500/30 hover:bg-brand-500/10">
              <FileCheck size={14} /> Performance Report
            </Link>
            <Link to={`/vehicles/${vehicle._id}/resale-prediction`} className="btn-ghost py-2.5 px-3 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10">
              <TrendingDown size={14} /> AI Resale Valuation
            </Link>
            <Link to={`/appointments/book?vehicleId=${vehicle._id}`} className="btn-primary py-2.5 px-4 text-xs">
              <Calendar size={14} /> Book Service
            </Link>
          </div>
        </div>

        {/* ── Key Metrics Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 animate-slide-up">
          <div className="glass-card p-4">
            <p className="text-slate-400 text-[11px] mb-1">Health Score</p>
            <p className="text-2xl font-bold text-emerald-400">{healthScore}%</p>
          </div>
          <Link to={`/vehicles/${vehicle._id}/resale-prediction`} className="glass-card p-4 hover:border-brand-500/30 transition-all group">
            <p className="text-slate-400 text-[11px] mb-1 flex items-center justify-between">
              Resale Valuation <ChevronRight size={12} className="text-slate-600 group-hover:text-brand-400" />
            </p>
            <p className="text-2xl font-bold text-white">${estimatedResaleValue.toLocaleString()}</p>
          </Link>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-[11px] mb-1">Distance Driven</p>
            <p className="text-xl font-bold text-white">{totalDistanceDriven.toLocaleString()} km</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-[11px] mb-1">Average Mileage</p>
            <p className="text-xl font-bold text-amber-400">{averageMileage} km/L</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-[11px] mb-1">Lifetime Maint.</p>
            <p className="text-xl font-bold text-purple-400">${lifetimeMaintenanceCost.toLocaleString()}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-[11px] mb-1">Next Year Maint.</p>
            <p className="text-xl font-bold text-brand-300">${estimatedNextYearMaintenanceCost.toLocaleString()}</p>
          </div>
        </div>

        {/* ── Compliance Badges & Health Breakdown ────────────────────── */}
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
            <Shield size={18} className="text-brand-400" /> Compliance & Vehicle Health Audit
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">Insurance</p>
              <p className={`text-sm font-bold mt-1 ${insuranceStatus.cls}`}>{insuranceStatus.status}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">PUC Certificate</p>
              <p className={`text-sm font-bold mt-1 ${pucStatus.cls}`}>{pucStatus.status}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">Warranty</p>
              <p className={`text-sm font-bold mt-1 ${warrantyStatus.cls}`}>{warrantyStatus.status}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-slate-400 text-xs">Digital Vault</p>
              <p className="text-sm font-bold mt-1 text-emerald-400">{documentsStatus.count} Files Stored</p>
            </div>
          </div>

          <p className="text-slate-300 text-xs bg-white/2 p-3 rounded-xl border border-white/5">
            <span className="font-semibold text-white">Health Score Explanation: </span>{healthExplanation}
          </p>
        </div>

        {/* ── Interactive Chronological Visual Timeline ───────────────── */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                <Layers size={20} className="text-brand-400" /> Complete Vehicle Digital Twin Timeline
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Chronological flow from vehicle purchase to AI predictions</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {TIMELINE_FILTERS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Timeline Stream */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {filteredTimeline.map((item) => {
              const Icon = getEventIcon(item.type);

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Point Icon */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-surface-900 border-2 border-brand-500 flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all shadow-glow">
                    <Icon size={12} />
                  </div>

                  {/* Card Event Content */}
                  <div className="p-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl transition-all">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {item.category}
                        </span>
                        <h4 className="font-semibold text-white text-sm mt-1">{item.title}</h4>
                      </div>
                      <span className="text-xs font-mono text-slate-400 flex-shrink-0">
                        {fmtDate(item.date)}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs mt-1">{item.details}</p>

                    {item.badge && (
                      <span className="inline-block text-[10px] font-semibold mt-2 px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDigitalTwinPage;
