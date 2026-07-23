import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fuelApi } from '../../api/fuelApi';
import { vehicleApi } from '../../api/vehicleApi';
import { ArrowLeft, Save, Fuel, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['Card', 'Cash', 'UPI'];
const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const EditFuelEntry = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [logRes, vehRes] = await Promise.all([
          fuelApi.getById(id),
          vehicleApi.getAll({ limit: 100 }),
        ]);

        const l = logRes.data.data.fuelLog;
        setVehicles(vehRes.data.data.vehicles);
        setForm({
          vehicleId:         l.vehicle?._id || l.vehicle || '',
          date:              toDateInput(l.date),
          odometer:          l.odometer          ?? '',
          fuelQuantity:      l.fuelQuantity      ?? '',
          fuelCost:          l.fuelCost          ?? '',
          fuelPricePerLiter: l.fuelPricePerLiter ?? '',
          fuelStation:       l.fuelStation       || '',
          paymentMethod:     l.paymentMethod     || 'Card',
          fullTank:          l.fullTank          !== undefined ? l.fullTank : true,
          notes:             l.notes             || '',
        });
      } catch (err) {
        setFetchErr(err.response?.data?.message || 'Fuel entry not found');
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const setField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'fuelCost' || key === 'fuelQuantity') {
        const cost = parseFloat(key === 'fuelCost' ? value : prev.fuelCost);
        const qty  = parseFloat(key === 'fuelQuantity' ? value : prev.fuelQuantity);
        if (cost > 0 && qty > 0) {
          next.fuelPricePerLiter = (cost / qty).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fuelApi.update(id, form);
      toast.success('Fuel entry updated successfully');
      navigate('/fuel');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fuel entry');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  if (fetchErr) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-4">{fetchErr}</p>
        <Link to="/fuel" className="btn-primary text-sm">Back to Fuel Tracker</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/fuel" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Edit Fuel Fill-Up</h1>
            <p className="text-slate-400 text-sm">Update entry details and calculations</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Vehicle Selection</h2>
            <select
              value={form.vehicleId}
              onChange={(e) => setField('vehicleId', e.target.value)}
              className="input-field appearance-none cursor-pointer w-full"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id} className="bg-surface-900">
                  {v.year} {v.brand} {v.model} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Fuel size={16} className="text-brand-400" /> Refueling Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Fill-up Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                  className="input-field [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="form-label">Odometer Reading (km) *</label>
                <input
                  type="number"
                  value={form.odometer}
                  onChange={(e) => setField('odometer', e.target.value)}
                  min={0}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Fuel Quantity (Liters) *</label>
                <input
                  type="number"
                  value={form.fuelQuantity}
                  onChange={(e) => setField('fuelQuantity', e.target.value)}
                  min={0.01}
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Total Fuel Cost ($) *</label>
                <input
                  type="number"
                  value={form.fuelCost}
                  onChange={(e) => setField('fuelCost', e.target.value)}
                  min={0}
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Price per Liter ($)</label>
                <input
                  type="number"
                  value={form.fuelPricePerLiter}
                  onChange={(e) => setField('fuelPricePerLiter', e.target.value)}
                  min={0}
                  step="0.01"
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setField('paymentMethod', e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm} className="bg-surface-900">{pm}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div>
                <label className="form-label">Fuel Station Name</label>
                <input
                  type="text"
                  value={form.fuelStation}
                  onChange={(e) => setField('fuelStation', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-white font-medium">
                  <input
                    type="checkbox"
                    checked={form.fullTank}
                    onChange={(e) => setField('fullTank', e.target.checked)}
                    className="accent-brand-500 rounded w-4 h-4"
                  />
                  Filled to Full Tank
                </label>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Notes</h2>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              maxLength={500}
              className="input-field resize-none w-full"
            />
          </div>

          <div className="flex gap-3 pb-4">
            <Link to="/fuel" className="btn-ghost flex-1 justify-center py-3">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFuelEntry;
