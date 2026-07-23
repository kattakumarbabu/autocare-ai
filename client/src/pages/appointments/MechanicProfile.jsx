import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import {
  ArrowLeft, Star, Phone, Mail, Award, CheckCircle2,
  Calendar, Wrench, ShieldCheck, Loader2, AlertCircle, Plus,
} from 'lucide-react';

const MechanicProfile = () => {
  const { id }     = useParams();
  const [mechanic, setMechanic] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await appointmentApi.getMechanicById(id);
        setMechanic(data.data.mechanic);
      } catch (err) {
        setError(err.response?.data?.message || 'Mechanic not found');
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

  if (error || !mechanic) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/appointments" className="btn-primary text-sm">Back to Appointments</Link>
      </div>
    </div>
  );

  const { name, specialization, experience, phone, email, profileImage, ratings, availability } = mechanic;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/appointments" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Certified Mechanic Profile</h1>
            <p className="text-slate-400 text-sm">Specialist biography and booking</p>
          </div>
        </div>

        <div className="glass-card p-8 animate-slide-up space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <img src={profileImage} alt={name} className="w-24 h-24 rounded-3xl object-cover border-2 border-brand-500/30 shadow-glow" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  availability ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {availability ? '✓ Available for Booking' : 'Busy / On Shift'}
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star size={13} fill="currentColor" /> {ratings} / 5.0
                </span>
              </div>

              <h2 className="font-display font-bold text-2xl text-white mt-1">{name}</h2>
              <p className="text-brand-300 text-sm font-semibold mt-0.5">{specialization}</p>
              <p className="text-slate-400 text-xs mt-2 flex items-center justify-center sm:justify-start gap-1">
                <Award size={14} className="text-brand-400" /> {experience} Years Certified Master Technician Experience
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 grid sm:grid-cols-2 gap-4 text-xs">
            {phone && (
              <a href={`tel:${phone}`} className="p-3 bg-white/5 rounded-xl text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                <Phone size={16} className="text-brand-400" /> {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="p-3 bg-white/5 rounded-xl text-slate-300 hover:text-white flex items-center gap-3 transition-colors">
                <Mail size={16} className="text-brand-400" /> {email}
              </a>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Link to={`/appointments/book?mechanicId=${mechanic._id}`} className="btn-primary py-3 px-6 text-sm">
              <Plus size={16} /> Book Appointment with {name.split(' ')[0]}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicProfile;
