import { useState, useEffect, useCallback } from 'react';
import { appointmentApi } from '../../api/appointmentApi';
import {
  Wrench, CheckCircle2, Clock, Play, AlertCircle, Loader2, User, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const MechanicDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentApi.getMechanicDashboard();
      setAppointments(data.data.assignedAppointments);
    } catch {
      toast.error('Failed to load mechanic queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await appointmentApi.updateStatus(id, nextStatus);
      toast.success(`Appointment status updated to ${nextStatus}`);
      fetchData();
    } catch {
      toast.error('Status update failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Mechanic Service Queue</h1>
            <p className="text-slate-400 text-sm mt-1">
              Active assigned vehicle services, check-in validation, and job status management
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto">
            <Wrench size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white text-lg mb-1">Queue Empty</h3>
            <p className="text-slate-400 text-sm">No active assigned appointments pending in your queue.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {appointments.map((appt) => {
              const { vehicle, user: apptUser } = appt;

              return (
                <div key={appt._id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {appt.serviceType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        appt.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-base">
                      {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : 'Vehicle Service'}
                    </h3>

                    <p className="text-slate-400 text-xs">
                      Customer: <span className="text-white font-medium">{apptUser?.name || 'Customer'}</span> • {fmtDate(appt.appointmentDate)} at {appt.appointmentTime}
                    </p>
                  </div>

                  {/* Status Change Triggers */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {appt.status === 'Confirmed' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'In Progress')}
                        className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                      >
                        <Play size={13} /> Start Service
                      </button>
                    )}
                    {appt.status === 'In Progress' && (
                      <button
                        onClick={() => handleStatusChange(appt._id, 'Completed')}
                        className="btn-primary py-2 px-4 text-xs bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} /> Mark Completed
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

export default MechanicDashboard;
