import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { fuelApi } from '../../api/fuelApi';
import { vehicleApi } from '../../api/vehicleApi';
import { ArrowLeft, Save, Fuel, Calendar, Gauge, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['Card', 'Cash', 'UPI'];

const AddFuelEntry = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicles,     setVehicles]     = useState([]);
  const [selectedVeh,  setSelectedVeh]  = useState(searchParams.get('vehicleId') || '');
  const [fetchingVehs, setFetchingVehs] = useState(true);

  const [form, setForm] = useState({
    date:               new Date().toISOString().split('T')[0],
    odometer:           '',
    fuelQuantity:       '',
    fuelCost:           '',
    fuelPricePerLiter:  '',
    fuelStation:        '',
    paymentMethod:      'Card',
    fullTank:           true,
    notes:              '',
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getAll({ limit: 100 });
        const list = data.data.vehicles;
        setVehicles(list);
        if (!selectedVeh && list.length > 0) {
          setSelectedVeh(list[0]._id);
          // Set initial odometer from selected vehicle
          if (list[0].odometer) {
            setForm((prev) => ({ ...prev, odometer: list[0].odometer }));
          }
        }
      } catch (err) {
        toast.error('Failed to load vehicles');
      } finally {
        setFetchingVehs(false);
      }
    })();
  }, []);

  // Auto-calculate price per liter or cost
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
    if (!selectedVeh) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!form.odometer || Number(form.odometer) < 0) {
      setErrors((prev) => ({ ...prev, odometer: 'Valid odometer reading is required' }));
      return;
    }
    if (!form.fuelQuantity || Number(form.fuelQuantity) <= 0) {
      setErrors((prev) => ({ ...prev, fuelQuantity: 'Valid fuel quantity is required' }));
      return;
    }
    if (!form.fuelCost || Number(form.fuelCost) < 0) {
      setErrors((prev) => ({ ...prev, fuelCost: 'Valid fuel cost is required' }));
      return;
    }

    setLoading(true);
    try {
      await fuelApi.create({
        vehicleId: selectedVeh,
        ...form,
      });
      toast.success('Fuel entry logged successfully!');
      navigate('/fuel');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log fuel entry');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingVehs) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/fuel" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Log Fuel Fill-Up</h1>
            <p className="text-slate-400 text-sm">Add a new refueling entry to calculate mileage & cost</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          {/* Vehicle Selector */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Vehicle Selection</h2>
            <div>
              <label className="form-label">Target Vehicle *</label>
              <select
                value={selectedVeh}
                onChange={(e) => {
                  setSelectedVeh(e.target.value);
                  const v = vehicles.find((item) => item._id === e.target.value);
                  if (v && v.odometer) setField('odometer', v.odometer);
                }}
                className="input-field appearance-none cursor-pointer w-full"
                id="fuel-vehicle-select"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-surface-900">
                    {v.year} {v.brand} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fill-up Details */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Fuel size={16} className="text-brand-400" /> Refueling Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="form-label">Fill-up Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField('date', e.target.value)}
                  className="input-field [color-scheme:dark]"
                  id="fuel-date"
                />
              </div>

              <div>
                <label className="form-label">Odometer Reading (km) *</label>
                <input
                  type="number"
                  value={form.odometer}
                  onChange={(e) => setField('odometer', e.target.value)}
                  min={0}
                  placeholder="e.g. 45200"
                  className={`input-field ${errors.odometer ? 'border-red-500/50' : ''}`}
                  id="fuel-odometer"
                />
                {errors.odometer && <p className="field-error">{errors.odometer}</p>}
              </div>

              <div>
                <label className="form-label">Fuel Quantity (Liters) *</label>
                <input
                  type="number"
                  value={form.fuelQuantity}
                  onChange={(e) => setField('fuelQuantity', e.target.value)}
                  min={0.01}
                  step="0.01"
                  placeholder="e.g. 40.5"
                  className={`input-field ${errors.fuelQuantity ? 'border-red-500/50' : ''}`}
                  id="fuel-quantity"
                />
                {errors.fuelQuantity && <p className="field-error">{errors.fuelQuantity}</p>}
              </div>

              <div>
                <label className="form-label">Total Fuel Cost ($) *</label>
                <input
                  type="number"
                  value={form.fuelCost}
                  onChange={(e) => setField('fuelCost', e.target.value)}
                  min={0}
                  step="0.01"
                  placeholder="e.g. 95.00"
                  className={`input-field ${errors.fuelCost ? 'border-red-500/50' : ''}`}
                  id="fuel-cost"
                />
                {errors.fuelCost && <p className="field-error">{errors.fuelCost}</p>}
              </div>

              <div>
                <label className="form-label">Price per Liter ($)</label>
                <input
                  type="number"
                  value={form.fuelPricePerLiter}
                  onChange={(e) => setField('fuelPricePerLiter', e.target.value)}
                  min={0}
                  step="0.01"
                  placeholder="Auto-calculated"
                  className="input-field"
                  id="fuel-ppl"
                />
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setField('paymentMethod', e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="fuel-payment-method"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm} className="bg-surface-900">{pm}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Station & Full Tank */}
            <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
              <div>
                <label className="form-label">Fuel Station Name</label>
                <input
                  type="text"
                  value={form.fuelStation}
                  onChange={(e) => setField('fuelStation', e.target.value)}
                  placeholder="e.g. Shell Station, BP Highway"
                  className="input-field"
                  id="fuel-station"
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
                  Filled to Full Tank (enables exact km/L calculation)
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Notes & Comments</h2>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="City vs highway driving, fuel additive used, etc."
              className="input-field resize-none w-full"
              id="fuel-notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4">
            <Link to="/fuel" className="btn-ghost flex-1 justify-center py-3">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3"
              id="submit-fuel-btn"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? 'Saving Entry…' : 'Save Fuel Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFuelEntry;
