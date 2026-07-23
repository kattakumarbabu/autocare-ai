import { useState, useEffect } from 'react';
import { vehicleApi } from '../../api/vehicleApi';
import { reminderApi } from '../../api/reminderApi';
import { X, Bell, Save, Car, Calendar, Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES      = ['Service', 'Insurance', 'PUC', 'Warranty', 'Custom'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const RECURRING  = ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];

const CreateReminderModal = ({ isOpen, onClose, onSuccess, initialVehicleId = '' }) => {
  const [vehicles, setVehicles] = useState([]);
  const [form,     setForm]     = useState({
    title:             '',
    description:       '',
    reminderType:      'Custom',
    dueDate:           new Date().toISOString().split('T')[0],
    priority:          'Medium',
    vehicleId:         initialVehicleId || '',
    isRecurring:       false,
    recurringInterval: 'Monthly',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await vehicleApi.getAll({ limit: 100 });
        setVehicles(data.data.vehicles);
      } catch {
        // Silently fail
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key) => (e) => {
    const val = e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }
    if (!form.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    setLoading(true);
    try {
      await reminderApi.create(form);
      toast.success('Reminder created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-brand-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">Create Smart Reminder</h2>
              <p className="text-slate-400 text-xs mt-0.5">Schedule custom maintenance or compliance alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Reminder Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Annual Tire Rotation & Alignment"
              className="input-field w-full"
              id="reminder-title-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Reminder Type</label>
              <select
                value={form.reminderType}
                onChange={set('reminderType')}
                className="input-field appearance-none cursor-pointer"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="bg-surface-900">{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select
                value={form.priority}
                onChange={set('priority')}
                className="input-field appearance-none cursor-pointer"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-surface-900">{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={set('dueDate')}
                className="input-field [color-scheme:dark]"
                required
              />
            </div>

            <div>
              <label className="form-label">Associated Vehicle</label>
              <select
                value={form.vehicleId}
                onChange={set('vehicleId')}
                className="input-field appearance-none cursor-pointer"
              >
                <option value="" className="bg-surface-900">None (General)</option>
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id} className="bg-surface-900">
                    {v.year} {v.brand} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description / Details</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              maxLength={500}
              placeholder="Additional instructions or notes..."
              className="input-field resize-none w-full"
            />
          </div>

          {/* Recurring Option */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white font-medium">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={set('isRecurring')}
                className="accent-brand-500 rounded"
              />
              Make this a recurring reminder
            </label>

            {form.isRecurring && (
              <div>
                <label className="form-label text-[11px]">Repeat Frequency</label>
                <select
                  value={form.recurringInterval}
                  onChange={set('recurringInterval')}
                  className="input-field appearance-none cursor-pointer text-xs py-2"
                >
                  {RECURRING.map((r) => (
                    <option key={r} value={r} className="bg-surface-900">{r}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2.5 text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {loading ? 'Creating…' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReminderModal;
