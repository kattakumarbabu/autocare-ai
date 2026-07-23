import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { appointmentApi } from '../../api/appointmentApi';
import { vehicleApi }     from '../../api/vehicleApi';
import { serviceCenterApi } from '../../api/serviceCenterApi';
import {
  ArrowLeft, Calendar, Clock, Wrench, User, MapPin, DollarSign,
  Save, Loader2, CheckCircle2, Star, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  'Full Periodic Maintenance',
  'Oil Change & Inspection',
  'Brake Pad & Rotor Replacement',
  'AC Refill & Climate Check',
  'Engine Tune-Up & Diagnostic',
  'Tire Rotation & Wheel Alignment',
];

const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
];

const BookAppointment = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicles,       setVehicles]       = useState([]);
  const [centers,        setCenters]        = useState([]);
  const [mechanics,      setMechanics]      = useState([]);
  const [fetching,       setFetching]       = useState(true);

  const [selectedVeh,    setSelectedVeh]    = useState(searchParams.get('vehicleId') || '');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedMech,   setSelectedMech]   = useState(searchParams.get('mechanicId') || '');
  const [serviceType,    setServiceType]    = useState(SERVICE_TYPES[0]);
  const [apptDate,       setApptDate]       = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot,       setTimeSlot]       = useState(TIME_SLOTS[0]);
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [vRes, cRes, mRes] = await Promise.all([
          vehicleApi.getAll({ limit: 100 }),
          serviceCenterApi.search(),
          appointmentApi.getMechanics(),
        ]);
        const vList = vRes.data.data.vehicles;
        setVehicles(vList);
        if (vList.length > 0 && !selectedVeh) setSelectedVeh(vList[0]._id);
        setCenters(cRes.data.data.serviceCenters);
        setMechanics(mRes.data.data.mechanics);
      } catch {
        toast.error('Failed to load booking resources');
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVeh) {
      toast.error('Please select a vehicle');
      return;
    }

    setLoading(true);
    try {
      await appointmentApi.create({
        vehicleId: selectedVeh,
        serviceCenterId: selectedCenter || null,
        mechanicId: selectedMech || null,
        appointmentDate: apptDate,
        appointmentTime: timeSlot,
        serviceType,
        notes,
      });

      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/appointments" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Book Service Appointment</h1>
            <p className="text-slate-400 text-sm">Schedule certified maintenance with top mechanics</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">

          {/* Step 1: Select Vehicle & Service Type */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-brand-400" /> Vehicle & Service Package
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Select Vehicle *</label>
                <select
                  value={selectedVeh}
                  onChange={(e) => setSelectedVeh(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="appt-veh-select"
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id} className="bg-surface-900">
                      {v.year} {v.brand} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Service Package *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="appt-service-select"
                >
                  {SERVICE_TYPES.map((st) => (
                    <option key={st} value={st} className="bg-surface-900">{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Select Service Center & Mechanic */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-brand-400" /> Service Station & Mechanic
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Service Center (Optional)</label>
                <select
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="appt-center-select"
                >
                  <option value="" className="bg-surface-900">Nearest Certified Hub</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id} className="bg-surface-900">{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Select Preferred Mechanic</label>
                <select
                  value={selectedMech}
                  onChange={(e) => setSelectedMech(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="appt-mech-select"
                >
                  <option value="" className="bg-surface-900">Auto-Assign Best Specialist</option>
                  {mechanics.map((m) => (
                    <option key={m._id} value={m._id} className="bg-surface-900">
                      {m.name} ({m.specialization}) — ★ {m.ratings}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Date & Time Slot Selection */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" /> Date & Time Slot
            </h2>

            <div className="mb-5">
              <label className="form-label">Select Appointment Date *</label>
              <input
                type="date"
                value={apptDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setApptDate(e.target.value)}
                className="input-field [color-scheme:dark]"
                id="appt-date-input"
              />
            </div>

            <div>
              <label className="form-label">Select Available Time Slot *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = timeSlot === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setTimeSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-gradient text-white border-brand-400 shadow-glow'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Clock size={13} /> {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="form-label">Additional Instructions / Symptoms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Mention specific noises, issues, or requests..."
                className="input-field resize-none w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pb-4">
            <Link to="/appointments" className="btn-ghost flex-1 justify-center py-3">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3" id="confirm-appt-btn">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Booking…' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
