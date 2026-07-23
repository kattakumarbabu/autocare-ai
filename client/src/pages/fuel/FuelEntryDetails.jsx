import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fuelApi } from '../../api/fuelApi';
import {
  ArrowLeft, Edit3, Trash2, Fuel, Calendar, Gauge, DollarSign,
  CreditCard, MapPin, Loader2, AlertCircle, TrendingUp, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

const InfoTile = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-xl border border-white/5">
    <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-brand-400" />
    </div>
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value || '—'}</p>
    </div>
  </div>
);

const FuelEntryDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [log,      setLog]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await fuelApi.getById(id);
        setLog(data.data.fuelLog);
      } catch (err) {
        setError(err.response?.data?.message || 'Fuel entry not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this fuel log entry?')) return;
    setDeleting(true);
    try {
      await fuelApi.remove(id);
      toast.success('Fuel entry deleted');
      navigate('/fuel');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  if (error || !log) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/fuel" className="btn-primary text-sm">Back to Fuel Tracker</Link>
      </div>
    </div>
  );

  const {
    vehicle, date, odometer, fuelQuantity, fuelCost, fuelPricePerLiter,
    fuelStation, paymentMethod, fullTank, notes, calculatedMileage, costPerKm, distanceDriven,
  } = log;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/fuel" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl text-white truncate">
              Refueling Entry ({fmt(date)})
            </h1>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mt-0.5">
              {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/fuel/${id}/edit`} className="btn-ghost py-2 px-4 text-sm">
              <Edit3 size={14} /> Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Highlighted Efficiency Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 animate-slide-up">
          <div className="glass-card p-5 text-center">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Calculated Mileage</p>
            <p className="font-display font-extrabold text-3xl text-emerald-400">
              {calculatedMileage ? `${calculatedMileage} km/L` : '—'}
            </p>
            {fullTank && <span className="text-[10px] text-emerald-400/80 font-medium mt-1 inline-block">✓ Full Tank Refill</span>}
          </div>

          <div className="glass-card p-5 text-center">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Cost per km</p>
            <p className="font-display font-extrabold text-3xl text-amber-400">
              {costPerKm ? `$${costPerKm}` : '—'}
            </p>
            {distanceDriven > 0 && <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">Driven: {distanceDriven} km</span>}
          </div>

          <div className="glass-card p-5 text-center col-span-2 sm:col-span-1">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Fuel Cost</p>
            <p className="font-display font-extrabold text-3xl text-white">
              ${Number(fuelCost).toFixed(2)}
            </p>
            <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">{fuelQuantity} Liters @ ${fuelPricePerLiter}/L</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <h2 className="font-semibold text-white mb-4">Refueling Breakdown</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoTile icon={Calendar}   label="Date"            value={fmt(date)} />
            <InfoTile icon={Gauge}      label="Odometer"        value={`${Number(odometer).toLocaleString()} km`} />
            <InfoTile icon={Fuel}       label="Fuel Added"      value={`${fuelQuantity} Liters`} />
            <InfoTile icon={DollarSign} label="Price per Liter" value={`$${fuelPricePerLiter}`} />
            <InfoTile icon={MapPin}     label="Fuel Station"    value={fuelStation || 'Not specified'} />
            <InfoTile icon={CreditCard} label="Payment Method"  value={paymentMethod} />
          </div>

          {notes && (
            <div className="pt-4 border-t border-white/5">
              <h3 className="font-semibold text-white text-xs mb-1">Notes</h3>
              <p className="text-slate-300 text-sm">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FuelEntryDetails;
