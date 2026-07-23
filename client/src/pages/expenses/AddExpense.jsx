import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { expenseApi } from '../../api/expenseApi';
import { vehicleApi } from '../../api/vehicleApi';
import { ArrowLeft, Save, DollarSign, Calendar, Upload, FileText, Loader2, Image, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Fuel', 'Service', 'Insurance', 'PUC', 'Repair', 'Accessories', 'Parking', 'Toll', 'Fine', 'Other'];
const PAYMENT_METHODS = ['Card', 'Cash', 'UPI', 'NetBanking', 'Other'];

const AddExpense = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicles,     setVehicles]     = useState([]);
  const [selectedVeh,  setSelectedVeh]  = useState(searchParams.get('vehicleId') || '');
  const [fetchingVehs, setFetchingVehs] = useState(true);

  const [form, setForm] = useState({
    title:         '',
    category:      'Service',
    amount:        '',
    expenseDate:   new Date().toISOString().split('T')[0],
    paymentMethod: 'Card',
    description:   '',
    tags:          '',
  });

  const [receiptFile, setReceiptFile]   = useState(null);
  const [filePreview, setFilePreview]   = useState('');
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getAll({ limit: 100 });
        setVehicles(data.data.vehicles);
      } catch {
        toast.error('Failed to load vehicles');
      } finally {
        setFetchingVehs(false);
      }
    })();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setReceiptFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Title is required' }));
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setErrors((prev) => ({ ...prev, amount: 'Valid expense amount is required' }));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('category', form.category);
      formData.append('amount', form.amount);
      formData.append('expenseDate', form.expenseDate);
      formData.append('paymentMethod', form.paymentMethod);
      if (selectedVeh) formData.append('vehicleId', selectedVeh);
      if (form.description) formData.append('description', form.description);
      if (form.tags) formData.append('tags', form.tags);
      if (receiptFile) formData.append('receiptImage', receiptFile);

      await expenseApi.create(formData);
      toast.success('Expense recorded successfully!');
      navigate('/expenses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
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

        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/expenses" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Record Expense</h1>
            <p className="text-slate-400 text-sm">Add a new expense item and upload receipt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-brand-400" /> General Expense Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Expense Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual Maintenance Service, Highway Toll"
                  className={`input-field ${errors.title ? 'border-red-500/50' : ''}`}
                  id="expense-title-input"
                />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>

              <div>
                <label className="form-label">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="input-field appearance-none cursor-pointer"
                  id="expense-category-select"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-surface-900">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Amount ($) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  min={0.01}
                  step="0.01"
                  placeholder="e.g. 150.00"
                  className={`input-field ${errors.amount ? 'border-red-500/50' : ''}`}
                  id="expense-amount-input"
                />
                {errors.amount && <p className="field-error">{errors.amount}</p>}
              </div>

              <div>
                <label className="form-label">Expense Date *</label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))}
                  className="input-field [color-scheme:dark]"
                  id="expense-date-input"
                />
              </div>

              <div>
                <label className="form-label">Associated Vehicle (Optional)</label>
                <select
                  value={selectedVeh}
                  onChange={(e) => setSelectedVeh(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="expense-vehicle-select"
                >
                  <option value="" className="bg-surface-900">None / General</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id} className="bg-surface-900">
                      {v.year} {v.brand} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  className="input-field appearance-none cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm} className="bg-surface-900">{pm}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="e.g. oil, maintenance, tax"
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="form-label">Description / Notes</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                maxLength={500}
                placeholder="Additional notes about service center or warranty details..."
                className="input-field resize-none w-full"
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Upload size={16} className="text-brand-400" /> Receipt Image / Document (Optional)
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="flex-1 w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-2xl cursor-pointer bg-white/2 hover:bg-white/5 transition-all">
                <Upload size={24} className="text-brand-400 mb-2" />
                <span className="text-sm font-medium text-white">Click to upload receipt image</span>
                <span className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP up to 5MB</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {filePreview && (
                <div className="w-28 h-28 relative rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-surface-800">
                  <img src={filePreview} alt="Receipt preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4">
            <Link to="/expenses" className="btn-ghost flex-1 justify-center py-3">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3" id="submit-expense-btn">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Saving…' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
