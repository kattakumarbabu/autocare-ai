import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import ImageUpload from '../../components/vehicles/ImageUpload';
import { ArrowLeft, Save, Car, Shield, Wrench, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VEHICLE_TYPES = ['Car', 'Bike', 'Scooter', 'Truck'];
const FUEL_TYPES    = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'Semi-Automatic'];
const currentYear   = new Date().getFullYear();

const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const validate = (form) => {
  const e = {};
  if (!form.vehicleType)               e.vehicleType         = 'Vehicle type is required';
  if (!form.brand.trim())              e.brand               = 'Brand is required';
  if (!form.model.trim())              e.model               = 'Model is required';
  if (!form.year || form.year < 1900 || form.year > currentYear + 1)
                                       e.year                = 'Invalid year';
  if (!form.registrationNumber.trim()) e.registrationNumber  = 'Registration number is required';
  if (form.odometer !== '' && Number(form.odometer) < 0)
                                       e.odometer            = 'Odometer cannot be negative';
  return e;
};

const Field = ({ label, error, children }) => (
  <div>
    {label && <label className="form-label">{label}</label>}
    {children}
    {error && <p className="field-error">{error}</p>}
  </div>
);

const EditVehicle = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [form,    setForm]    = useState(null);
  const [image,   setImage]   = useState(null);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching,setFetching]= useState(true);
  const [fetchErr,setFetchErr]= useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getById(id);
        const v = data.data.vehicle;
        setForm({
          vehicleType:           v.vehicleType           || 'Car',
          brand:                 v.brand                 || '',
          model:                 v.model                 || '',
          variant:               v.variant               || '',
          year:                  v.year                  || currentYear,
          registrationNumber:    v.registrationNumber    || '',
          color:                 v.color                 || '',
          fuelType:              v.fuelType              || 'Petrol',
          transmission:          v.transmission          || 'Manual',
          odometer:              v.odometer              ?? '',
          purchaseDate:          toDateInput(v.purchaseDate),
          insuranceExpiry:       toDateInput(v.insuranceExpiry),
          pucExpiry:             toDateInput(v.pucExpiry),
          warrantyExpiry:        toDateInput(v.warrantyExpiry),
          lastServiceDate:       toDateInput(v.lastServiceDate),
          nextServiceDate:       toDateInput(v.nextServiceDate),
          serviceIntervalKm:     v.serviceIntervalKm     ?? '',
          serviceIntervalMonths: v.serviceIntervalMonths ?? '',
          notes:                 v.notes                 || '',
          currentImage:          v.image                 || null,
        });
      } catch (err) {
        setFetchErr(err.response?.data?.message || 'Vehicle not found');
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

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
      const payload = { ...form };
      if (image) payload.image = image;
      delete payload.currentImage;

      await vehicleApi.update(id, payload);
      toast.success('Vehicle updated successfully');
      navigate(`/vehicles/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update vehicle');
      if (err.response?.data?.errors) {
        const fieldErrs = {};
        err.response.data.errors.forEach(({ path, msg: m }) => { fieldErrs[path] = m; });
        setErrors(fieldErrs);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        <p className="text-sm">Loading vehicle data…</p>
      </div>
    </div>
  );

  if (fetchErr) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <p className="text-red-400 font-medium mb-4">{fetchErr}</p>
        <Link to="/vehicles" className="btn-primary text-sm">Back to Garage</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to={`/vehicles/${id}`} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Edit Vehicle</h1>
            <p className="text-slate-400 text-sm">
              {form.year} {form.brand} {form.model}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          {/* Image */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Car size={16} className="text-brand-400" /> Vehicle Photo
            </h2>
            <ImageUpload
              currentImage={image ? null : form.currentImage}
              onChange={setImage}
              error={errors.image}
            />
          </div>

          {/* Basic Identity */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Vehicle Type *" error={errors.vehicleType}>
                <select value={form.vehicleType} onChange={set('vehicleType')} className="input-field appearance-none cursor-pointer">
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-surface-900">{t}</option>
                  ))}
                </select>
              </Field>

              <Field label="Registration Number *" error={errors.registrationNumber}>
                <input type="text" value={form.registrationNumber} onChange={set('registrationNumber')}
                  className={`input-field uppercase ${errors.registrationNumber ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Brand *" error={errors.brand}>
                <input type="text" value={form.brand} onChange={set('brand')}
                  className={`input-field ${errors.brand ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Model *" error={errors.model}>
                <input type="text" value={form.model} onChange={set('model')}
                  className={`input-field ${errors.model ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Variant">
                <input type="text" value={form.variant} onChange={set('variant')} className="input-field" />
              </Field>

              <Field label="Year *" error={errors.year}>
                <input type="number" value={form.year} onChange={set('year')}
                  min={1900} max={currentYear + 1} className={`input-field ${errors.year ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Color">
                <input type="text" value={form.color} onChange={set('color')} className="input-field" />
              </Field>
            </div>
          </div>

          {/* Specifications */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Specifications & Odometer</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Fuel Type">
                <select value={form.fuelType} onChange={set('fuelType')} className="input-field appearance-none cursor-pointer">
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f} className="bg-surface-900">{f}</option>
                  ))}
                </select>
              </Field>

              <Field label="Transmission">
                <select value={form.transmission} onChange={set('transmission')} className="input-field appearance-none cursor-pointer">
                  {TRANSMISSIONS.map((tr) => (
                    <option key={tr} value={tr} className="bg-surface-900">{tr}</option>
                  ))}
                </select>
              </Field>

              <Field label="Odometer Reading (km)" error={errors.odometer}>
                <input type="number" value={form.odometer} onChange={set('odometer')} min={0}
                  className={`input-field ${errors.odometer ? 'border-red-500/50' : ''}`} />
              </Field>

              <Field label="Purchase Date">
                <input type="date" value={form.purchaseDate} onChange={set('purchaseDate')}
                  className="input-field [color-scheme:dark]" />
              </Field>
            </div>
          </div>

          {/* Expiries */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-brand-400" /> Documents & Expiries
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Insurance Expiry">
                <input type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="PUC Expiry">
                <input type="date" value={form.pucExpiry} onChange={set('pucExpiry')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="Warranty Expiry">
                <input type="date" value={form.warrantyExpiry} onChange={set('warrantyExpiry')}
                  className="input-field [color-scheme:dark]" />
              </Field>
            </div>
          </div>

          {/* Maintenance */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-brand-400" /> Service & Maintenance Schedule
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Last Service Date">
                <input type="date" value={form.lastServiceDate} onChange={set('lastServiceDate')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="Next Service Date">
                <input type="date" value={form.nextServiceDate} onChange={set('nextServiceDate')}
                  className="input-field [color-scheme:dark]" />
              </Field>

              <Field label="Service Interval (km)">
                <input type="number" value={form.serviceIntervalKm} onChange={set('serviceIntervalKm')} min={0} className="input-field" />
              </Field>

              <Field label="Service Interval (Months)">
                <input type="number" value={form.serviceIntervalMonths} onChange={set('serviceIntervalMonths')} min={0} className="input-field" />
              </Field>
            </div>
          </div>

          {/* Notes */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-400" /> Additional Notes
            </h2>
            <textarea value={form.notes} onChange={set('notes')} rows={3} maxLength={500}
              className="input-field resize-none w-full" />
            <p className="text-right text-xs text-slate-600 mt-1">{form.notes.length}/500</p>
          </div>

          <div className="flex gap-3 pb-4">
            <Link to={`/vehicles/${id}`} className="btn-ghost flex-1 justify-center py-3">Cancel</Link>
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

export default EditVehicle;
