import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { expenseApi } from '../../api/expenseApi';
import {
  ArrowLeft, Edit3, Trash2, Calendar, DollarSign, Tag, CreditCard,
  FileText, Image, Loader2, AlertCircle, Maximize2, X,
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

const ExpenseDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [expense,    setExpense]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [deleting,   setDeleting]   = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await expenseApi.getById(id);
        setExpense(data.data.expense);
      } catch (err) {
        setError(err.response?.data?.message || 'Expense record not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this expense record?')) return;
    setDeleting(true);
    try {
      await expenseApi.remove(id);
      toast.success('Expense record deleted');
      navigate('/expenses');
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

  if (error || !expense) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/expenses" className="btn-primary text-sm">Back to Expenses</Link>
      </div>
    </div>
  );

  const {
    title, category, amount, expenseDate, vehicle, paymentMethod,
    description, receiptImage, tags,
  } = expense;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/expenses" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {category}
              </span>
              <span className="text-xs text-slate-400">• {fmt(expenseDate)}</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-white truncate mt-1">{title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/expenses/${id}/edit`} className="btn-ghost py-2 px-4 text-sm">
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

        {/* Amount Banner */}
        <div className="glass-card p-6 mb-6 text-center animate-slide-up">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Expense Amount</p>
          <p className="font-display font-extrabold text-4xl text-emerald-400">${Number(amount).toFixed(2)}</p>
          {vehicle && (
            <p className="text-slate-400 text-xs font-medium mt-2">
              Vehicle: {vehicle.year} {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber})
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="glass-card p-6 space-y-5 animate-fade-in">
          <h2 className="font-semibold text-white">Expense Details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoTile icon={Calendar}   label="Date"            value={fmt(expenseDate)} />
            <InfoTile icon={CreditCard} label="Payment Method"  value={paymentMethod} />
            <InfoTile icon={Tag}        label="Category"        value={category} />
            <InfoTile icon={FileText}   label="Vehicle"         value={vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unassigned'} />
          </div>

          {tags && tags.length > 0 && (
            <div className="pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Tags:</span>
              {tags.map((t) => (
                <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {description && (
            <div className="pt-3 border-t border-white/5">
              <h3 className="font-semibold text-white text-xs mb-1">Description / Notes</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
            </div>
          )}
        </div>

        {/* Receipt Image Preview */}
        {receiptImage && (
          <div className="glass-card p-6 mt-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Image size={18} className="text-brand-400" /> Receipt Image
              </h2>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
              >
                <Maximize2 size={12} /> Full Screen
              </button>
            </div>
            <div
              onClick={() => setShowModal(true)}
              className="max-h-80 rounded-2xl overflow-hidden border border-white/10 cursor-pointer bg-surface-900 group relative"
            >
              <img src={receiptImage} alt="Receipt" className="w-full h-full object-contain max-h-80 group-hover:opacity-90 transition-opacity" />
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
            <img src={receiptImage} alt="Receipt Fullscreen" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseDetails;
