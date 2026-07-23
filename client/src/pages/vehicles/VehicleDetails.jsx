import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import DeleteModal from '../../components/vehicles/DeleteModal';
import { healthMeta } from '../../components/vehicles/VehicleCard';
import {
  ArrowLeft, Edit3, Trash2, Car, Bike, Truck,
  Shield, Calendar, Gauge, Fuel, Palette, FileText,
  Clock, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Wrench, Settings, ChevronRight, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_ICONS = { Car: Car, Bike: Bike, Scooter: Bike, Truck: Truck };

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

const daysLeft = (d) => {
  if (!d) return null;
  return Math.round((new Date(d) - Date.now()) / (24 * 60 * 60 * 1000));
};

const InfoRow = ({ icon: Icon, label, value, subtext, status }) => (
  <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-xl border border-white/5">
    <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-brand-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium truncate">{value || '—'}</p>
      {subtext && <p className={`text-xs mt-0.5 ${status === 'danger' ? 'text-red-400' : status === 'warning' ? 'text-orange-400' : 'text-slate-400'}`}>{subtext}</p>}
    </div>
  </div>
);

const DocExpiryCard = ({ label, date }) => {
  const days = daysLeft(date);
  if (!date) {
    return (
      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-slate-500 text-sm font-medium mt-1">Not Set</p>
      </div>
    );
  }
  const expired = days < 0;
  const soon    = days >= 0 && days <= 30;

  return (
    <div className={`p-3 rounded-xl border transition-all ${
      expired ? 'bg-red-500/10 border-red-500/20' : soon ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/5 border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-400 text-xs">{label}</span>
        {expired ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">EXPIRED</span>
        ) : soon ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">DUE SOON</span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">VALID</span>
        )}
      </div>
      <p className="text-white text-sm font-semibold">{fmt(date)}</p>
      <p className={`text-xs mt-1 ${expired ? 'text-red-400' : soon ? 'text-orange-400' : 'text-slate-400'}`}>
        {expired ? `Expired ${Math.abs(days)} days ago` : `${days} days remaining`}
      </p>
    </div>
  );
};

const VehicleDetails = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [vehicle,  setVehicle]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getById(id);
        setVehicle(data.data.vehicle);
      } catch (err) {
        setError(err.response?.data?.message || 'Vehicle not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async (vehicleId) => {
    setDeleting(true);
    try {
      await vehicleApi.remove(vehicleId);
      toast.success('Vehicle deleted');
      navigate('/vehicles');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        <p className="text-slate-400 text-sm">Loading vehicle…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/vehicles" className="btn-primary text-sm">Back to Garage</Link>
      </div>
    </div>
  );

  const {
    vehicleType, brand, model, variant, year, registrationNumber, color,
    fuelType, transmission, odometer, purchaseDate,
    insuranceExpiry, pucExpiry, warrantyExpiry,
    lastServiceDate, nextServiceDate, serviceIntervalKm, serviceIntervalMonths,
    healthScore = 100, image, notes, createdAt,
  } = vehicle;

  const TypeIcon = TYPE_ICONS[vehicleType] || Car;
  const hc       = healthMeta(healthScore);

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header / Breadcrumb */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/vehicles" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl text-white truncate">
              {year} {brand} {model} {variant && <span className="text-slate-400 font-normal">{variant}</span>}
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-0.5">
              {registrationNumber}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/vehicles/${id}/services`} className="btn-primary py-2 px-3.5 text-xs">
              <Wrench size={14} /> Service History
            </Link>
            <Link to={`/vehicles/${id}/edit`} className="btn-ghost py-2 px-3 text-sm">
              <Edit3 size={14} /> Edit
            </Link>
            <button
              onClick={() => setToDelete(vehicle)}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 animate-slide-up">

          {/* Left Column (Image & Health & Service Quick Action) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Vehicle Card Image */}
            <div className="glass-card overflow-hidden">
              <div className="relative h-56 bg-gradient-to-br from-surface-800 to-surface-900">
                {image ? (
                  <img src={image} alt={`${year} ${brand} ${model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon size={64} className="text-slate-700" />
                  </div>
                )}
                <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/10 flex items-center gap-1.5">
                  <TypeIcon size={12} /> {vehicleType}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between border-t border-white/5">
                <span className="text-slate-400 text-xs">Registered</span>
                <span className="text-white text-xs font-mono">{fmt(createdAt)}</span>
              </div>
            </div>

            {/* Dynamic Health Score */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                  <Shield size={15} className="text-brand-400" /> Vehicle Health Score
                </p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${hc.badge}`}>
                  {hc.label}
                </span>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <p className={`font-display font-extrabold text-5xl ${hc.text}`}>{healthScore}</p>
                <p className="text-slate-500 text-lg mb-1">/ 100</p>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${hc.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs">
                Score is automatically calculated based on vehicle document expiries and service schedule.
              </p>
            </div>

            {/* Quick Action to Log Service */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white text-sm mb-2">Log Service Entry</h3>
              <p className="text-slate-400 text-xs mb-4">Record new repairs, oil changes, or routine maintenance.</p>
              <Link to={`/vehicles/${id}/services/add`} className="btn-primary w-full justify-center py-2.5 text-xs">
                <Plus size={14} /> Add Service Record
              </Link>
            </div>
          </div>

          {/* Right Column (Details, Docs, Service Timeline Card) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Specifications */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-4">Specifications & Overview</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoRow icon={Gauge}    label="Odometer"     value={odometer !== undefined && odometer !== null ? `${Number(odometer).toLocaleString()} km` : '—'} />
                <InfoRow icon={Fuel}     label="Fuel Type"    value={fuelType} />
                <InfoRow icon={Settings} label="Transmission" value={transmission} />
                <InfoRow icon={Palette}  label="Color"        value={color} />
                <InfoRow icon={Calendar} label="Purchase Date" value={fmt(purchaseDate)} />
                <InfoRow icon={Car}      label="Variant"      value={variant} />
              </div>
            </div>

            {/* Document Expiries */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Shield size={16} className="text-brand-400" /> Compliance & Documents
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <DocExpiryCard label="Insurance" date={insuranceExpiry} />
                <DocExpiryCard label="PUC Certificate" date={pucExpiry} />
                <DocExpiryCard label="Warranty" date={warrantyExpiry} />
              </div>
            </div>

            {/* Service & Maintenance Banner */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Wrench size={16} className="text-brand-400" /> Maintenance & Service
                </h2>
                <Link to={`/vehicles/${id}/services`} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium">
                  View Timeline <ChevronRight size={13} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <InfoRow icon={Calendar} label="Last Service" value={fmt(lastServiceDate)} />
                <InfoRow icon={Calendar} label="Next Service" value={fmt(nextServiceDate)} />
              </div>

              {(serviceIntervalKm || serviceIntervalMonths) && (
                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between text-xs text-slate-400">
                  <span>Service Interval:</span>
                  <span className="font-medium text-white">
                    {serviceIntervalKm ? `${serviceIntervalKm} km` : ''}
                    {serviceIntervalKm && serviceIntervalMonths ? ' / ' : ''}
                    {serviceIntervalMonths ? `${serviceIntervalMonths} Months` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {notes && (
              <div className="glass-card p-5">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={15} className="text-brand-400" /> Notes
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toDelete && (
        <DeleteModal
          vehicle={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default VehicleDetails;
