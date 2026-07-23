import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import ImageUpload from '../../components/vehicles/ImageUpload';
import {
  ArrowLeft, Save, Wrench, Calendar, Plus, X, Loader2, AlertCircle,
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

const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const EditService = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [service, setService] = useState(null);
  const [form,    setForm]    = useState(null);
  const [partInput, setPartInput] = useState('');
  const [parts,     setParts]     = useState([]);
  const [invoice,   setInvoice]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(true);
  const [fetchErr,  setFetchErr]  = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serviceApi.getById(id);
        const s = data.data.service;
        setService(s);
        setForm({
          serviceType:     s.serviceType     || 'General Service',
          serviceCenter:   s.serviceCenter   || '',
          mechanicName:    s.mechanicName    || '',
          serviceDate:     toDateInput(s.serviceDate),
          odometer:        s.odometer        ?? '',
          cost:            s.cost            ?? '',
          nextServiceDate: toDateInput(s.nextServiceDate),
          notes:           s.notes           || '',
          currentInvoice:  s.invoiceImage    || null,
        });
        setParts(s.partsChanged || []);
      } catch (err) {
        setFetchErr(err.response?.data?.message || 'Service record not found');
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const set = (key) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: val }));
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
    setLoading(true);
    try {
      const payload = {
        ...form,
        partsChanged: parts,
      };
      if (invoice) payload.invoiceImage = invoice;
      delete payload.currentInvoice;

      await serviceApi.update(id, payload);
      toast.success('Service record updated');
      navigate(`/services/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update service record');
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
        <Link to="/vehicles" className="btn-primary text-sm">Back to Garage</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link
            to={`/services/${id}`}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Edit Service Record</h1>
            <p className="text-slate-400 text-sm">Update service entry and details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          {/* Service Information */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-brand-400" /> Service Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Service Type *</label>
                <select
                  value={form.serviceType}
                  onChange={set('serviceType')}
                  className="input-field appearance-none cursor-pointer"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-surface-900">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Service Date *</label>
                <input
                  type="date"
                  value={form.serviceDate}
                  onChange={set('serviceDate')}
                  className="input-field [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="form-label">Service Center / Garage</label>
                <input
                  type="text"
                  value={form.serviceCenter}
                  onChange={set('serviceCenter')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Mechanic Name</label>
                <input
                  type="text"
                  value={form.mechanicName}
                  onChange={set('mechanicName')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Odometer Reading (km)</label>
                <input
                  type="number"
                  value={form.odometer}
                  onChange={set('odometer')}
                  min={0}
                  className="input-field"
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
                  className="input-field"
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
                placeholder="e.g. Engine Oil Filter"
                className="input-field flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPart(e); } }}
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="btn-primary px-4 py-2 text-sm flex-shrink-0"
              >
                <Plus size={15} /> Add
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

          {/* Next Service Date */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-brand-400" /> Scheduled Next Service
            </h2>
            <input
              type="date"
              value={form.nextServiceDate}
              onChange={set('nextServiceDate')}
              className="input-field [color-scheme:dark]"
            />
          </div>

          {/* Invoice Attachment */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4">Invoice / Receipt Photo</h2>
            <ImageUpload
              currentImage={invoice ? null : form.currentInvoice}
              onChange={setInvoice}
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
              className="input-field resize-none w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pb-4">
            <Link to={`/services/${id}`} className="btn-ghost flex-1 justify-center py-3">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-3"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditService;
