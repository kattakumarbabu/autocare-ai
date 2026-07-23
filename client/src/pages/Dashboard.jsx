import { useState, useEffect, useCallback } from 'react';
import { useAuth }    from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { vehicleApi }        from '../api/vehicleApi';
import { reminderApi }       from '../api/reminderApi';
import { fuelApi }           from '../api/fuelApi';
import { expenseApi }        from '../api/expenseApi';
import { documentApi }       from '../api/documentApi';
import { serviceCenterApi }  from '../api/serviceCenterApi';
import { predictiveAIApi }   from '../api/predictiveAIApi';
import { appointmentApi }    from '../api/appointmentApi';
import { healthMeta } from '../components/vehicles/VehicleCard';
import ReminderCard  from '../components/reminders/ReminderCard';
import {
  Car, Shield, Clock, Wrench, LogOut,
  Bell, Settings, ChevronRight, Plus,
  Calendar, AlertTriangle, Loader2, FileCheck, CheckCircle2,
  Fuel, TrendingUp, Gauge, DollarSign, ArrowUpRight, Receipt,
  PieChart, Tag, FileText, Upload, MapPin, Navigation, Phone, Cpu, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isSoon = (date) => {
  if (!date) return false;
  const diff = new Date(date) - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
};

/* ── Mini vehicle card for the dashboard garage section ─────────────────────── */
const GarageCard = ({ vehicle }) => {
  const {
    _id, vehicleType, brand, model, variant, year,
    registrationNumber, healthScore = 100,
    nextServiceDate, insuranceExpiry, image,
  } = vehicle;

  const hc          = healthMeta(healthScore);
  const serviceSoon = isSoon(nextServiceDate);
  const insSoon     = isSoon(insuranceExpiry);

  return (
    <Link
      to={`/vehicles/${_id}`}
      className="group flex items-center gap-4 p-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-brand-500/30 rounded-2xl transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 bg-surface-800 rounded-xl flex-shrink-0 overflow-hidden">
        {image ? (
          <img src={image} alt={`${year} ${brand} ${model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car size={22} className="text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white font-semibold text-sm truncate">
            {year} {brand} {model} {variant && <span className="text-slate-400 font-normal">{variant}</span>}
          </p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hc.badge}`}>
            {hc.label}
          </span>
        </div>
        <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mt-0.5">{registrationNumber}</p>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
          {/* Health score */}
          <div className="flex items-center gap-1.5 min-w-[90px]">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${hc.bar} rounded-full`} style={{ width: `${healthScore}%` }} />
            </div>
            <span className={`font-bold ${hc.text}`}>{healthScore}%</span>
          </div>

          {/* Next service date */}
          <span className={`flex items-center gap-1 ${serviceSoon ? 'text-orange-400 font-medium' : 'text-slate-400'}`}>
            <Calendar size={11} /> {nextServiceDate ? `Service: ${fmtDate(nextServiceDate)}` : 'No service date'}
          </span>

          {/* Insurance expiry date */}
          {insuranceExpiry && (
            <span className={`flex items-center gap-1 ${insSoon ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
              <Shield size={11} /> {`Ins: ${fmtDate(insuranceExpiry)}`}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </Link>
  );
};

/* ── Dashboard ───────────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [stats,          setStats]          = useState({ total: 0, serviceDueSoon: 0, insuranceExpiringSoon: 0, avgHealthScore: 0 });
  const [reminderStats,  setReminderStats]  = useState({ dueToday: 0, dueThisWeek: 0, overdue: 0, totalPending: 0 });
  const [fuelStats,      setFuelStats]      = useState({ avgMileage: 0, monthlyFuelExpenses: 0, lastEntry: null, bestMileage: 0 });
  const [expenseStats,   setExpenseStats]   = useState({ totalExpenses: 0, thisMonthExpenses: 0, topCategory: 'None', budgetStatus: 'Normal' });
  const [docStats,       setDocStats]       = useState({ totalDocuments: 0, expiringSoonCount: 0, recentUploads: [] });
  const [predictiveData, setPredictiveData] = useState(null);
  const [nearestCenter,  setNearestCenter]  = useState(null);
  const [apptStats,      setApptStats]      = useState({ upcomingCount: 0, inProgress: null });
  const [vehicles,       setVehicles]       = useState([]);
  const [reminders,      setReminders]      = useState([]);
  const [loading,        setLoading]        = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, vehiclesRes, remStatsRes, remListRes, fuelStatsRes, expenseStatsRes, docStatsRes, scRes, predRes, apptRes] = await Promise.all([
        vehicleApi.getStats(),
        vehicleApi.getAll({ limit: 6, page: 1 }),
        reminderApi.getStats(),
        reminderApi.getAll({ limit: 6, status: 'Pending' }),
        fuelApi.getStats(),
        expenseApi.getAnalytics(),
        documentApi.getStats(),
        serviceCenterApi.getNearby({ radius: 50 }),
        predictiveAIApi.getDashboard(),
        appointmentApi.getStats(),
      ]);

      setStats(statsRes.data.data);
      setVehicles(vehiclesRes.data.data.vehicles);
      setReminderStats(remStatsRes.data.data);
      setReminders(remListRes.data.data.reminders);
      setFuelStats(fuelStatsRes.data.data);
      setExpenseStats(expenseStatsRes.data.data);
      setDocStats(docStatsRes.data.data);
      if (scRes.data.data.serviceCenters?.length > 0) {
        setNearestCenter(scRes.data.data.serviceCenters[0]);
      }
      setPredictiveData(predRes.data.data);
      setApptStats(apptRes.data.data);
    } catch {
      // Silently handle network / unauth issues
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await logout();
    toast.success('See you next time!');
    navigate('/');
  };

  const handleCompleteReminder = async (id) => {
    try {
      await reminderApi.complete(id);
      toast.success('Reminder completed');
      fetchData();
    } catch {
      toast.error('Failed to complete reminder');
    }
  };

  const handleSnoozeReminder = async (id, days) => {
    try {
      await reminderApi.snooze(id, days);
      toast.success(`Snoozed for ${days} days`);
      fetchData();
    } catch {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleRestoreReminder = async (id) => {
    try {
      await reminderApi.restore(id);
      toast.success('Reminder restored');
      fetchData();
    } catch {
      toast.error('Failed to restore reminder');
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Delete reminder?')) return;
    try {
      await reminderApi.remove(id);
      toast.success('Reminder deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  /* ── Dynamic Stat Cards ── */
  const statCards = [
    {
      icon: Car,
      label: 'Total Vehicles',
      value: loading ? '…' : stats.total,
      color: 'from-brand-500 to-blue-400',
    },
    {
      icon: Wrench,
      label: 'Service Due Soon',
      value: loading ? '…' : stats.serviceDueSoon,
      color: 'from-orange-500 to-amber-400',
    },
    {
      icon: Calendar,
      label: 'Upcoming Appointments',
      value: loading ? '…' : apptStats.upcomingCount,
      color: 'from-purple-500 to-indigo-400',
    },
    {
      icon: Shield,
      label: 'Avg. Health Score',
      value: loading ? '…' : stats.total ? `${stats.avgHealthScore}%` : '—',
      color: 'from-emerald-500 to-teal-400',
    },
  ];

  const quickActions = [
    { icon: Calendar,   label: 'Book Appointment', desc: 'Schedule maintenance with certified mechanics', to: '/appointments/book' },
    { icon: Plus,       label: 'Add Vehicle',      desc: 'Register a new vehicle to your garage', to: '/vehicles/add' },
    { icon: Cpu,        label: 'Predictive AI',    desc: 'View component wear & cost forecasts',  to: '/predictive-ai' },
    { icon: MapPin,     label: 'Service Locator',  desc: 'Find nearby stations & 24/7 towing',    to: '/service-centers' },
    { icon: Upload,     label: 'Upload Document',  desc: 'Store RC, Insurance, or PUC PDF',       to: '/documents/upload' },
    { icon: DollarSign, label: 'Record Expense',   desc: 'Add new expense and receipt image',   to: '/expenses/add' },
  ];

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top Header */}
      <header className="bg-surface-900 border-b border-white/5 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-gradient rounded-xl flex items-center justify-center">
              <Car size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">AutoCare AI</p>
              <p className="text-slate-500 text-xs mt-0.5">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-white text-xs font-semibold">{user?.name}</p>
              <p className="text-slate-500 text-[10px]">{user?.email}</p>
            </div>
            <div className="w-9 h-9 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm shadow-glow">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Header */}
        <div className="mb-10 animate-fade-in flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-3xl text-white mb-1">
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-400">Here's an overview of your vehicle health and upcoming maintenance.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/appointments/book" className="btn-primary text-sm py-2.5 px-5">
              <Calendar size={16} /> Book Appointment
            </Link>
          </div>
        </div>

        {/* Dynamic Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-5 hover:-translate-y-0.5 transition-transform duration-200">
              <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-0.5">
                {value === '…' ? <Loader2 size={20} className="animate-spin text-slate-500" /> : value}
              </p>
              <p className="text-slate-400 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Live Service Progress Banner Card (if active) ──────────── */}
        {apptStats.inProgress && (
          <div className="glass-card p-5 mb-8 animate-fade-in border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                <Wrench size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  Service In Progress
                </span>
                <h3 className="font-semibold text-white text-base mt-0.5">
                  {apptStats.inProgress.vehicle ? `${apptStats.inProgress.vehicle.brand} ${apptStats.inProgress.vehicle.model}` : 'Active Service'}
                </h3>
                <p className="text-slate-300 text-xs truncate">
                  Assigned Mechanic: {apptStats.inProgress.mechanic?.name || 'Technician'}
                </p>
              </div>
            </div>

            <Link to={`/appointments/${apptStats.inProgress._id}`} className="btn-primary py-2 px-4 text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1">
              View Check-in & Status
            </Link>
          </div>
        )}

        {/* Garage & Quick Actions Grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Garage Section */}
          <div className="lg:col-span-2 glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Car size={16} className="text-brand-400" /> My Garage
              </h3>
              <Link to="/vehicles" className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 font-medium">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 size={28} className="animate-spin text-brand-500" />
              </div>
            ) : vehicles.length === 0 ? (
              /* Empty Garage State */
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mb-4">
                  <Car size={26} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">No vehicles yet</h3>
                <p className="text-slate-400 text-sm mb-5 max-w-xs">
                  Add your first vehicle to start tracking maintenance, health scores, insurance expiries, and service history.
                </p>
                <Link to="/vehicles/add" className="btn-primary text-sm px-5 py-2.5">
                  <Plus size={15} /> Add Your First Vehicle
                </Link>
              </div>
            ) : (
              /* Real Vehicle Cards */
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <GarageCard key={v._id} vehicle={v} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map(({ icon: Icon, label, desc, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/20 transition-colors">
                    <Icon size={14} className="text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-slate-500 text-xs truncate">{desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Live Smart Reminders Section ───────────────────────────── */}
        <div className="mt-8 glass-card p-6 animate-fade-in">
          {/* Header & Stats bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                <Bell size={18} className="text-brand-400" />
                Live Smart Reminders
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Automated compliance, maintenance, and custom alerts</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                Due Today: {reminderStats.dueToday}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
                This Week: {reminderStats.dueThisWeek}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                Overdue: {reminderStats.overdue}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                Total Pending: {reminderStats.totalPending}
              </span>
              <Link to="/reminders" className="text-brand-400 hover:text-brand-300 ml-2 font-medium flex items-center gap-0.5">
                Manage <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* Cards / List */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell size={24} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No active pending reminders.</p>
              <p className="text-slate-500 text-xs mt-1">
                Add a vehicle or create custom reminders to track maintenance and document expiries.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reminders.map((r) => (
                <ReminderCard
                  key={r._id}
                  reminder={r}
                  onComplete={handleCompleteReminder}
                  onSnooze={handleSnoozeReminder}
                  onRestore={handleRestoreReminder}
                  onDelete={handleDeleteReminder}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
