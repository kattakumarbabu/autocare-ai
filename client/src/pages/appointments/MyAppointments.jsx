import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import {
  Calendar, Clock, Wrench, User, MapPin, DollarSign, Plus,
  Search, Eye, Loader2, CheckCircle2, AlertCircle, XCircle, QrCode,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const TABS = ['All', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const getStatusBadge = (st) => {
  if (st === 'Completed')   return { label: 'Completed', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  if (st === 'In Progress') return { label: 'In Progress', cls: 'bg-brand-500/10 text-brand-300 border-brand-500/20' };
  if (st === 'Confirmed')   return { label: 'Confirmed', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (st === 'Cancelled')   return { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
  return { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
};

const MyAppointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);

  const activeTab = searchParams.get('status') || 'All';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = activeTab === 'All' ? '' : activeTab;
      const { data } = await appointmentApi.getAll({ status: statusParam });
      setAppointments(data.data.appointments);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await appointmentApi.cancel(id);
      toast.success('Appointment cancelled');
      fetchData();
    } catch {
      toast.error('Cancel failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">My Service Appointments</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage maintenance schedules, live service status, check-in QR codes, and mechanic assignments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/appointments/mechanic-dashboard" className="btn-ghost text-xs py-2.5 px-4">
              Mechanic Queue
            </Link>
            <Link to="/appointments/book" className="btn-primary text-xs py-2.5 px-4" id="book-appt-btn">
              <Plus size={15} /> Book Appointment
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none animate-slide-up">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (tab === 'All') next.delete('status');
                else next.set('status', tab);
                setSearchParams(next);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Appointments Cards List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-8">
            <Calendar size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white text-lg mb-2">No Appointments</h3>
            <p className="text-slate-400 text-sm mb-6">
              Book a service appointment with certified mechanics for routine maintenance or repairs.
            </p>
            <Link to="/appointments/book" className="btn-primary text-sm">
              <Plus size={15} /> Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {appointments.map((appt) => {
              const badge = getStatusBadge(appt.status);
              const { vehicle, mechanic, serviceCenter } = appt;

              return (
                <div key={appt._id} className="glass-card p-5 flex flex-col justify-between group hover:border-brand-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {appt.serviceType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-base mb-1 truncate">
                      {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model}` : 'Vehicle Service'}
                    </h3>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mb-3">
                      {vehicle?.registrationNumber || 'Unassigned'}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-brand-400" /> {fmtDate(appt.appointmentDate)} at {appt.appointmentTime}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" /> {mechanic ? mechanic.name : 'Assigned Specialist'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <Link
                      to={`/appointments/${appt._id}`}
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <Eye size={13} /> View QR Pass & Status
                    </Link>

                    {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                      <button
                        onClick={() => handleCancel(appt._id)}
                        className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
