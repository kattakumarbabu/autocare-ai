import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reminderApi } from '../../api/reminderApi';
import ReminderCard from '../../components/reminders/ReminderCard';
import ReminderCalendar from '../../components/reminders/ReminderCalendar';
import CreateReminderModal from '../../components/reminders/CreateReminderModal';
import {
  Bell, Plus, Search, SlidersHorizontal, ArrowUpDown,
  Calendar, CheckCircle2, AlertTriangle, Clock, Loader2,
  AlertCircle, LayoutGrid, Calendar as CalendarIcon, Sparkles, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES      = ['All', 'Service', 'Insurance', 'PUC', 'Warranty', 'Custom'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

const RemindersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab,   setActiveTab]   = useState('upcoming'); // 'upcoming' | 'overdue' | 'completed' | 'calendar'
  const [stats,       setStats]       = useState({ dueToday: 0, dueThisWeek: 0, overdue: 0, totalPending: 0 });
  const [reminders,   setReminders]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const search       = searchParams.get('search')       || '';
  const reminderType = searchParams.get('reminderType') || 'All';
  const priority     = searchParams.get('priority')     || 'All';

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await reminderApi.getStats();
      setStats(data.data);
    } catch {
      // Silently handle stat failure
    }
  }, []);

  // Load reminders
  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let statusFilter = 'Pending';
      if (activeTab === 'overdue')   statusFilter = 'Overdue';
      if (activeTab === 'completed') statusFilter = 'Completed';
      if (activeTab === 'calendar')  statusFilter = 'All';

      const { data } = await reminderApi.getAll({
        search,
        reminderType,
        priority,
        status: statusFilter,
        limit: activeTab === 'calendar' ? 100 : 50,
      });

      setReminders(data.data.reminders);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, reminderType, priority]);

  useEffect(() => {
    fetchStats();
    fetchReminders();
  }, [fetchStats, fetchReminders]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  // Handlers
  const handleComplete = async (id) => {
    try {
      await reminderApi.complete(id);
      toast.success('Reminder completed!');
      fetchStats();
      fetchReminders();
    } catch (err) {
      toast.error('Failed to complete reminder');
    }
  };

  const handleSnooze = async (id, days) => {
    try {
      await reminderApi.snooze(id, days);
      toast.success(`Snoozed for ${days} day(s)`);
      fetchStats();
      fetchReminders();
    } catch (err) {
      toast.error('Failed to snooze reminder');
    }
  };

  const handleRestore = async (id) => {
    try {
      await reminderApi.restore(id);
      toast.success('Reminder restored');
      fetchStats();
      fetchReminders();
    } catch (err) {
      toast.error('Failed to restore reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await reminderApi.remove(id);
      toast.success('Reminder deleted');
      fetchStats();
      fetchReminders();
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Smart Reminders</h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated maintenance, compliance expiries, and custom alerts
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            id="create-reminder-btn"
          >
            <Plus size={18} /> Create Reminder
          </button>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-5">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mb-3">
              <Clock size={18} className="text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.dueToday}</p>
            <p className="text-slate-400 text-xs">Due Today</p>
          </div>

          <div className="glass-card p-5">
            <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center mb-3">
              <Calendar size={18} className="text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.dueThisWeek}</p>
            <p className="text-slate-400 text-xs">Due This Week</p>
          </div>

          <div className="glass-card p-5">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400 mb-0.5">{stats.overdue}</p>
            <p className="text-slate-400 text-xs">Overdue Alerts</p>
          </div>

          <div className="glass-card p-5">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-3">
              <Bell size={18} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.totalPending}</p>
            <p className="text-slate-400 text-xs">Total Active Pending</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6 border-b border-white/5 pb-4">
          <div className="flex gap-2">
            {[
              { id: 'upcoming',  label: 'Upcoming Reminders', count: stats.totalPending },
              { id: 'overdue',   label: 'Overdue',            count: stats.overdue, badge: 'red' },
              { id: 'completed', label: 'Completed' },
              { id: 'calendar',  label: 'Calendar View',      icon: CalendarIcon },
            ].map(({ id, label, count, badge, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-brand-gradient text-white shadow-glow'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {Icon && <Icon size={14} />}
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`text-[10px] px-2 py-0.2 rounded-full ${
                    badge === 'red' ? 'bg-red-500 text-white font-bold' : 'bg-white/20 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reminders by title or notes…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
              id="reminder-search-input"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={reminderType}
              onChange={(e) => setParam('reminderType', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[150px]"
              id="reminder-type-filter"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-surface-900">{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={priority}
              onChange={(e) => setParam('priority', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[140px]"
              id="reminder-priority-filter"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-surface-900">{p === 'All' ? 'All Priorities' : `${p} Priority`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'calendar' ? (
          <ReminderCalendar
            reminders={reminders}
            onComplete={handleComplete}
            onSnooze={handleSnooze}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-28">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="glass-card p-8 text-center max-w-sm">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Failed to load</p>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button onClick={fetchReminders} className="btn-primary text-sm px-4 py-2">Retry</button>
            </div>
          </div>
        ) : reminders.length === 0 ? (
          /* Empty State */
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 animate-fade-in">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-brand-400" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">No Reminders Found</h3>
            <p className="text-slate-400 text-sm mb-6">
              {activeTab === 'overdue'
                ? 'Great news! You have no overdue reminders.'
                : activeTab === 'completed'
                ? 'No completed reminders logged yet.'
                : 'Create a smart reminder or register a vehicle to automate service and compliance alerts.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-sm"
            >
              <Plus size={16} /> Create Custom Reminder
            </button>
          </div>
        ) : (
          /* Reminders Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
            {reminders.map((r) => (
              <ReminderCard
                key={r._id}
                reminder={r}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CreateReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchReminders();
        }}
      />
    </div>
  );
};

export default RemindersPage;
