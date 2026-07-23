import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { vehicleApi } from '../../api/vehicleApi';
import ImageUpload from '../../components/vehicles/ImageUpload';
import {
  ArrowLeft, Save, Wrench, Calendar, DollarSign,
  UserCheck, MapPin, Gauge, FileText, Plus, X, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  'General Service',
  'Oil Change',
  'Brake Repair',
  'Tire Replacement',
  'Battery Replacement',
  'Engine Repair',
  'Transmission Repair',
  'AC Service',
  'Body Work',
  'Inspection',
  'Other',
];

const AddService = () => {
  const { vehicleId }      = useParams();
  const [searchParams]     = useSearchParams();
  const targetVehicleId    = vehicleId || searchParams.get('vehicleId');
  const navigate           = useNavigate();

  const [vehicles,     setVehicles]     = useState([]);
  const [selectedVeh,  setSelectedVeh]  = useState(targetVehicleId || '');
  const [fetchingVehs, setFetchingVehs] = useState(true);

  const [form, setForm] = useState({
    serviceType:     'General Service',
    serviceCenter:   '',
    mechanicName:    '',
    serviceDate:     new Date().toISOString().split('T')[0],
    odometer:        '',
    cost:            '',
    nextServiceDate: '',
    notes:           '',
  });

  const [partInput, setPartInput] = useState('');
  const [parts,     setParts]     = useState([]);
  const [invoice,   setInvoice]   = useState(null);
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);

  // Load user vehicles for selector if vehicleId wasn't passed in path
  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getAll({ limit: 100 });
        const list = data.data.vehicles;
        setVehicles(list);
        if (!selectedVeh && list.length > 0) {
          setSelectedVeh(list[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load vehicles');
      } finally {
        setFetchingVehs(false);
      }
    })();
  }, []);

  const set = (key) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleAddPart = (e) => {
    e.preventDefault();
    if (!partInput.trim()) return;
    if (!parts.includes(partInput.trim())) {
      setParts((prev) => [...prev, partInput.trim()]);
    }
    setPartInput('');
  };

  const handleRemovePart = (index) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVeh) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!form.serviceType) {
      setErrors((prev) => ({ ...prev, serviceType: 'Service type is required' }));
      return;
    }

    setLoading(true);
    try {
      await serviceApi.create({
        vehicleId: selectedVeh,
        ...form,
        partsChanged: parts,
        invoiceImage: invoice,
      });
      toast.success('Service record logged successfully!');
      navigate(`/vehicles/${selectedVeh}/services`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log service record');
      if (err.response?.data?.errors) {
        const fieldErrs = {};
        err.response.data.errors.forEach(({ path, msg }) => { fieldErrs[path] = msg; });
        setErrors(fieldErrs);
      }
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
          <Link
            to={selectedVeh ? `/vehicles/${selectedVeh}/services` : '/vehicles'}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Log Service Record</h1>
            <p className="text-slate-400 text-sm">Add maintenance or repair entry to service history</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          {/* Vehicle Selection */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Vehicle Selection</h2>
            <div>
              <label className="form-label">Target Vehicle *</label>
              <select
                value={selectedVeh}
                onChange={(e) => setSelectedVeh(e.target.value)}
                className="input-field appearance-none cursor-pointer w-full"
                id="service-vehicle-select"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-surface-900">
                    {v.year} {v.brand} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Details */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-brand-400" /> Service Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="form-label">Service Type *</label>
                <select
                  value={form.serviceType}
                  onChange={set('serviceType')}
                  className="input-field appearance-none cursor-pointer"
                  id="service-type"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-surface-900">{t}</option>
                  ))}
                </select>
                {errors.serviceType && <p className="field-error">{errors.serviceType}</p>}
              </div>

              <div>
                <label className="form-label">Service Date *</label>
                <input
                  type="date"
                  value={form.serviceDate}
                  onChange={set('serviceDate')}
                  className="input-field [color-scheme:dark]"
                  id="service-date"
                />
              </div>

              <div>
                <label className="form-label">Service Center / Garage</label>
                <input
                  type="text"
                  value={form.serviceCenter}
                  onChange={set('serviceCenter')}
                  placeholder="e.g. Authorized Service Hub"
                  className="input-field"
                  id="service-center"
                />
              </div>

              <div>
                <label className="form-label">Mechanic / Adviser Name</label>
                <input
                  type="text"
                  value={form.mechanicName}
                  onChange={set('mechanicName')}
                  placeholder="e.g. John Doe"
                  className="input-field"
                  id="service-mechanic"
                />
              </div>

              <div>
                <label className="form-label">Odometer Reading (km)</label>
                <input
                  type="number"
                  value={form.odometer}
                  onChange={set('odometer')}
                  min={0}
                  placeholder="e.g. 45000"
                  className="input-field"
                  id="service-odometer"
                />
              </div>

              <div>
                <label className="form-label">Total Cost ($)</label>
                <input
                  type="number"
                  value={form.cost}
                  onChange={set('cost')}
                  min={0}
                  step="0.01"
                  placeholder="e.g. 150.00"
                  className="input-field"
                  id="service-cost"
                />
              </div>
            </div>
          </div>

          {/* Parts Changed */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Parts & Components Changed</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={partInput}
                onChange={(e) => setPartInput(e.target.value)}
                placeholder="e.g. Engine Oil Filter, Brake Pads"
                className="input-field flex-1"
                id="service-part-input"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPart(e); } }}
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="btn-primary px-4 py-2 text-sm flex-shrink-0"
              >
                <Plus size={15} /> Add Part
              </button>
            </div>

            {parts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {parts.map((part, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-medium"
                  >
                    {part}
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Next Service & Reminders */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" /> Scheduled Next Service
            </h2>
            <div>
              <label className="form-label">Next Service Date (Auto Reminder)</label>
              <input
                type="date"
                value={form.nextServiceDate}
                onChange={set('nextServiceDate')}
                className="input-field [color-scheme:dark]"
                id="service-next-date"
              />
              <p className="text-slate-500 text-xs mt-1">
                Setting this will automatically update vehicle reminders and calculate health score.
              </p>
            </div>
          </div>

          {/* Invoice Attachment */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Invoice / Receipt Upload</h2>
            <ImageUpload
              currentImage={null}
              onChange={setInvoice}
              error={errors.invoiceImage}
            />
          </div>

          {/* Notes */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3">Service Notes</h2>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              maxLength={1000}
              placeholder="Additional comments or recommendations from mechanic..."
              className="input-field resize-none w-full"
              id="service-notes"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4">
            <Link
              to={selectedVeh ? `/vehicles/${selectedVeh}/services` : '/vehicles'}
              className="btn-ghost flex-1 justify-center py-3"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3"
              id="submit-service-btn"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? 'Saving Record…' : 'Save Service Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddService;
