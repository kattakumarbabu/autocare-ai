import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import ImageUpload from '../../components/vehicles/ImageUpload';
import { ArrowLeft, Save, Car, Calendar, Shield, Gauge, FileText, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter', 'Truck'];
const FUEL_TYPES    = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'Semi-Automatic'];
const currentYear   = new Date().getFullYear();

const INITIAL = {
  vehicleType:           'Car',
  brand:                 '',
  model:                 '',
  variant:               '',
  year:                  currentYear,
  registrationNumber:    '',
  color:                 '',
  fuelType:              'Petrol',
  transmission:          'Manual',
  odometer:              '',
  purchaseDate:          '',
  insuranceExpiry:       '',
  pucExpiry:             '',
  warrantyExpiry:        '',
  lastServiceDate:       '',
  nextServiceDate:       '',
  serviceIntervalKm:     '',
  serviceIntervalMonths: '',
  notes:                 '',
};

const validate = (form) => {
  const e = {};
  if (!form.vehicleType)               e.vehicleType         = 'Vehicle type is required';
  if (!form.brand.trim())              e.brand               = 'Brand is required';
  if (!form.model.trim())              e.model               = 'Model is required';
  if (!form.year || form.year < 1900 || form.year > currentYear + 1)
                                       e.year                = `Year must be between 1900 and ${currentYear + 1}`;
  if (!form.registrationNumber.trim()) e.registrationNumber  = 'Registration number is required';
  if (form.odometer !== '' && Number(form.odometer) < 0)
                                       e.odometer            = 'Odometer cannot be negative';
  if (form.serviceIntervalKm !== '' && Number(form.serviceIntervalKm) < 0)
                                       e.serviceIntervalKm   = 'Service interval km cannot be negative';
  if (form.serviceIntervalMonths !== '' && Number(form.serviceIntervalMonths) < 0)
                                       e.serviceIntervalMonths = 'Service interval months cannot be negative';
  return e;
};

const Field = ({ label, error, children }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
    {error && <p className="field-error">{error}</p>}
  </div>
);

const AddVehicle = () => {
  const navigate = useNavigate();
  const [form,    setForm]    = useState(INITIAL);
  const [image,   setImage]   = useState(null);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await vehicleApi.create({ ...form, image });
      toast.success('Vehicle added to your garage!');
      navigate('/vehicles');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add vehicle';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrs = {};
        err.response.data.errors.forEach(({ path, msg: m }) => { fieldErrs[path] = m; });
        setErrors(fieldErrs);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/vehicles" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Add Vehicle</h1>
            <p className="text-slate-400 text-sm">Register a new vehicle to your garage</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          {/* Image upload */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Car size={16} className="text-brand-400" /> Vehicle Photo
            </h2>
            <ImageUpload
              currentImage={null}
              onChange={setImage}
              error={errors.image}
            />
          </div>

          {/* Basic Identity */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">

              <Field label="Vehicle Type *" error={errors.vehicleType}>
                <select id="vehicle-type" value={form.vehicleType} onChange={set('vehicleType')} className="input-field appearance-none cursor-pointer">
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-surface-900">{t}</option>
                  ))}
                </select>
              </Field>

              <Field label="Registration Number *" error={errors.registrationNumber}>
                <input id="vehicle-reg" type="text" value={form.registrationNumber} onChange={set('registrationNumber')}
                  placeholder="e.g. TS09AB1234" className={`input-field uppercase ${errors.registrationNumber ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Brand *" error={errors.brand}>
                <input id="vehicle-brand" type="text" value={form.brand} onChange={set('brand')}
                  placeholder="e.g. Honda, Hyundai, BMW" className={`input-field ${errors.brand ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Model *" error={errors.model}>
                <input id="vehicle-model" type="text" value={form.model} onChange={set('model')}
                  placeholder="e.g. Civic, City, Creta" className={`input-field ${errors.model ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Variant" error={errors.variant}>
                <input id="vehicle-variant" type="text" value={form.variant} onChange={set('variant')}
                  placeholder="e.g. VX, ZX, SX(O)" className="input-field" />
              </Field>

              <Field label="Year *" error={errors.year}>
                <input id="vehicle-year" type="number" value={form.year} onChange={set('year')}
                  min={1900} max={currentYear + 1}
                  className={`input-field ${errors.year ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Color" error={errors.color}>
                <input id="vehicle-color" type="text" value={form.color} onChange={set('color')}
                  placeholder="e.g. Pearl White" className="input-field" />
              </Field>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Specifications & Odometer</h2>
            <div className="grid sm:grid-cols-2 gap-4">

              <Field label="Fuel Type" error={errors.fuelType}>
                <select id="vehicle-fuel" value={form.fuelType} onChange={set('fuelType')} className="input-field appearance-none cursor-pointer">
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f} className="bg-surface-900">{f}</option>
                  ))}
                </select>
              </Field>

              <Field label="Transmission" error={errors.transmission}>
                <select id="vehicle-transmission" value={form.transmission} onChange={set('transmission')} className="input-field appearance-none cursor-pointer">
                  {TRANSMISSIONS.map((tr) => (
                    <option key={tr} value={tr} className="bg-surface-900">{tr}</option>
                  ))}
                </select>
              </Field>

              <Field label="Odometer Reading (km)" error={errors.odometer}>
                <input id="vehicle-odometer" type="number" value={form.odometer} onChange={set('odometer')}
                  min={0} placeholder="e.g. 45000" className={`input-field ${errors.odometer ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Purchase Date" error={errors.purchaseDate}>
                <input id="vehicle-purchase-date" type="date" value={form.purchaseDate} onChange={set('purchaseDate')}
                  className="input-field [color-scheme:dark]" />
              </Field>
            </div>
          </div>

          {/* Documents & Expiries */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-brand-400" /> Documents & Expiries
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Insurance Expiry" error={errors.insuranceExpiry}>
                <input id="vehicle-insurance" type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="PUC Expiry" error={errors.pucExpiry}>
                <input id="vehicle-puc" type="date" value={form.pucExpiry} onChange={set('pucExpiry')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="Warranty Expiry" error={errors.warrantyExpiry}>
                <input id="vehicle-warranty" type="date" value={form.warrantyExpiry} onChange={set('warrantyExpiry')}
                  className="input-field [color-scheme:dark]" />
              </Field>
            </div>
          </div>

          {/* Maintenance & Intervals */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-brand-400" /> Service & Maintenance Schedule
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Last Service Date" error={errors.lastServiceDate}>
                <input id="vehicle-last-service" type="date" value={form.lastServiceDate} onChange={set('lastServiceDate')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="Next Service Date" error={errors.nextServiceDate}>
                <input id="vehicle-next-service" type="date" value={form.nextServiceDate} onChange={set('nextServiceDate')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="Service Interval (km)" error={errors.serviceIntervalKm}>
                <input id="vehicle-interval-km" type="number" value={form.serviceIntervalKm} onChange={set('serviceIntervalKm')}
                  min={0} placeholder="e.g. 10000" className="input-field" />
              </Field>

              <Field label="Service Interval (Months)" error={errors.serviceIntervalMonths}>
                <input id="vehicle-interval-months" type="number" value={form.serviceIntervalMonths} onChange={set('serviceIntervalMonths')}
                  min={0} placeholder="e.g. 12" className="input-field" />
              </Field>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-400" /> Additional Notes
            </h2>
            <Field label="" error={errors.notes}>
              <textarea
                id="vehicle-notes"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                maxLength={500}
                placeholder="Insurance policy numbers, preferred service center, custom specs..."
                className="input-field resize-none"
              />
              <p className="text-right text-xs text-slate-600 mt-1">{form.notes.length}/500</p>
            </Field>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pb-4">
            <Link to="/vehicles" className="btn-ghost flex-1 justify-center py-3">
              Cancel
            </Link>
            <button type="submit" id="add-vehicle-submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Adding…' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
