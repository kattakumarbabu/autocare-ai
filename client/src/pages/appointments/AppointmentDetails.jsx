import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import {
  ArrowLeft, Calendar, Clock, Wrench, User, MapPin, DollarSign,
  QrCode, Star, CheckCircle2, AlertCircle, Loader2, Edit3, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

const STATUS_STEPS = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

const AppointmentDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [appt,     setAppt]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [resched,  setResched]  = useState(false);
  const [newDate,  setNewDate]  = useState('');
  const [newTime,  setNewTime]  = useState('10:00 AM');

  // Review Form
  const [rating,   setRating]   = useState(5);
  const [review,   setReview]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await appointmentApi.getById(id);
        setAppt(data.data.appointment);
      } catch (err) {
        setError(err.response?.data?.message || 'Appointment not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this service appointment?')) return;
    try {
      await appointmentApi.cancel(id);
      toast.success('Appointment cancelled');
      navigate('/appointments');
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await appointmentApi.reschedule(id, { appointmentDate: newDate, appointmentTime: newTime });
      toast.success('Appointment rescheduled!');
      setResched(false);
      const { data } = await appointmentApi.getById(id);
      setAppt(data.data.appointment);
    } catch {
      toast.error('Reschedule failed');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentApi.submitReview(id, rating, review);
      toast.success('Rating & review submitted!');
      const { data } = await appointmentApi.getById(id);
      setAppt(data.data.appointment);
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  if (error || !appt) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/appointments" className="btn-primary text-sm">Back to Appointments</Link>
      </div>
    </div>
  );

  const {
    vehicle, serviceCenter, mechanic, appointmentDate, appointmentTime,
    serviceType, estimatedCost, status, qrCodeData, notes, rating: existingRating, review: existingReview,
  } = appt;

  const currentStepIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/appointments" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {serviceType}
              </span>
              <span className="text-xs font-bold text-emerald-400">${estimatedCost} Est.</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-white truncate mt-1">
              Appointment for {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}
            </h1>
          </div>

          {status !== 'Cancelled' && status !== 'Completed' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setResched(true)} className="btn-ghost py-2 px-3 text-xs">
                <Edit3 size={14} /> Reschedule
              </button>
              <button onClick={handleCancel} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                <XCircle size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Status Tracker Bar */}
        {status !== 'Cancelled' && (
          <div className="glass-card p-6 mb-8 animate-slide-up">
            <h2 className="font-semibold text-white mb-4 text-xs uppercase tracking-wider text-slate-400">
              Live Progress Tracker
            </h2>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-0" />
              {STATUS_STEPS.map((st, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={st} className="flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 shadow-glow'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-surface-800 text-slate-500 border border-white/10'
                    }`}>
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-brand-300 font-bold' : isPassed ? 'text-white' : 'text-slate-500'}`}>
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reschedule Modal / Form */}
        {resched && (
          <form onSubmit={handleReschedule} className="glass-card p-5 mb-8 animate-slide-up space-y-4 border border-brand-500/30">
            <h3 className="font-semibold text-white text-sm">Reschedule Appointment</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">New Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="input-field [color-scheme:dark]" />
              </div>
              <div>
                <label className="form-label">New Time Slot</label>
                <input type="text" value={newTime} onChange={(e) => setNewTime(e.target.value)} required className="input-field" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setResched(false)} className="btn-ghost text-xs py-2 px-4">Cancel</button>
              <button type="submit" className="btn-primary text-xs py-2 px-4">Confirm Reschedule</button>
            </div>
          </form>
        )}

        {/* QR Code & Information Section */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8 animate-fade-in">
          {/* QR Code Check-in Card */}
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center text-white mb-3 shadow-glow">
              <QrCode size={20} />
            </div>
            <h3 className="font-semibold text-white text-base mb-1">Check-in QR Pass</h3>
            <p className="text-slate-400 text-xs mb-4">Show at the service desk upon arrival</p>

            {/* QR Code Mock Graphic */}
            <div className="p-3 bg-white rounded-2xl border border-white/20 shadow-lg mb-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrCodeData || 'AUTOCARE')}`}
                alt="QR Pass"
                className="w-32 h-32"
              />
            </div>
            <span className="font-mono text-[11px] text-slate-400">{qrCodeData}</span>
          </div>

          {/* Schedule & Mechanic Card */}
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-3">
              <h3 className="font-semibold text-white text-sm">Schedule Details</h3>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Calendar size={14} className="text-brand-400" /> Date: <span className="text-white font-medium">{fmtDate(appointmentDate)}</span>
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Clock size={14} className="text-brand-400" /> Time Slot: <span className="text-white font-medium">{appointmentTime}</span>
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <DollarSign size={14} className="text-emerald-400" /> Est. Cost: <span className="text-white font-medium">${estimatedCost}</span>
              </p>
            </div>

            {mechanic && (
              <div className="glass-card p-5 flex items-center gap-4">
                <img src={mechanic.profileImage} alt={mechanic.name} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white text-sm">{mechanic.name}</h4>
                    <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <Star size={12} fill="currentColor" /> {mechanic.ratings}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">{mechanic.specialization}</p>
                  <p className="text-slate-500 text-[11px] mt-1">{mechanic.experience} years experience</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating & Review Section (if status === Completed) */}
        {status === 'Completed' && (
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
              <Star size={18} className="text-amber-400" /> Service Rating & Review
            </h3>

            {existingRating ? (
              <div className="p-4 bg-white/5 rounded-xl text-xs space-y-1">
                <p className="text-amber-400 font-bold flex items-center gap-1">
                  ★ {existingRating} / 5 Stars
                </p>
                <p className="text-slate-300">{existingReview || 'No text review provided.'}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Rating (1 to 5 Stars)</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input-field w-32">
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★</option>
                    <option value={3}>3 Stars ★★★</option>
                    <option value={2}>2 Stars ★★</option>
                    <option value={1}>1 Star ★</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Your Feedback & Review</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={3}
                    placeholder="Describe your service experience with the mechanic..."
                    className="input-field resize-none w-full"
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary text-xs py-2.5 px-5">
                  {submitting ? 'Submitting…' : 'Submit Rating'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentDetails;
