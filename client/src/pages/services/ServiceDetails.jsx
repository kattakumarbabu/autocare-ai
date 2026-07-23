import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import {
  ArrowLeft, Edit3, Trash2, Wrench, Calendar, DollarSign,
  UserCheck, MapPin, Gauge, FileText, Download, Eye,
  AlertTriangle, Loader2, AlertCircle, CheckCircle2, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3.5 bg-white/5 rounded-xl border border-white/5">
    <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-brand-400" />
    </div>
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium">{value || '—'}</p>
    </div>
  </div>
);

const ServiceDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [service,  setService]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serviceApi.getById(id);
        setService(data.data.service);
      } catch (err) {
        setError(err.response?.data?.message || 'Service record not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service record?')) return;
    setDeleting(true);
    try {
      await serviceApi.remove(id);
      toast.success('Service record deleted');
      if (service?.vehicle?._id) {
        navigate(`/vehicles/${service.vehicle._id}/services`);
      } else {
        navigate('/vehicles');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!service?.invoiceImage) return;
    const link = document.createElement('a');
    link.href = service.invoiceImage;
    link.target = '_blank';
    link.download = `Invoice-${service._id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        <p className="text-slate-400 text-sm">Loading service details…</p>
      </div>
    </div>
  );

  if (error || !service) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/vehicles" className="btn-primary text-sm">Back to Garage</Link>
      </div>
    </div>
  );

  const {
    vehicle, serviceType, serviceCenter, mechanicName, serviceDate,
    odometer, cost, partsChanged = [], nextServiceDate, invoiceImage, notes, createdAt,
  } = service;

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Breadcrumb & Action Bar */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link
            to={vehicle?._id ? `/vehicles/${vehicle._id}/services` : '/vehicles'}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl text-white truncate">
              {serviceType} Record
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/services/${id}/edit`} className="btn-ghost py-2 px-4 text-sm">
              <Edit3 size={14} /> Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6 animate-slide-up">

          {/* Left Column: Summary Card & Invoice */}
          <div className="space-y-4">
            {/* Cost Card */}
            <div className="glass-card p-5 text-center">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Service Cost</p>
              <p className="font-display font-extrabold text-4xl text-emerald-400 mb-2">
                ${Number(cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} /> Service Completed
              </span>
            </div>

            {/* Invoice Card */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center justify-between">
                <span>Invoice / Receipt</span>
                {invoiceImage && (
                  <button
                    onClick={handleDownloadInvoice}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    <Download size={12} /> Download
                  </button>
                )}
              </h3>

              {invoiceImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-white/10 h-48 bg-surface-900">
                  <img src={invoiceImage} alt="Service Invoice" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowImgModal(true)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <Eye size={13} /> View Full
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 rounded-xl border border-white/5">
                  <FileText size={24} className="text-slate-600 mb-2" />
                  <p className="text-slate-400 text-xs">No invoice image attached</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Breakdowns */}
          <div className="lg:col-span-2 space-y-4">

            {/* Overview */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-4">Service Information</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <InfoTile icon={Wrench}    label="Service Type"    value={serviceType} />
                <InfoTile icon={Calendar}  label="Service Date"    value={fmt(serviceDate)} />
                <InfoTile icon={MapPin}    label="Service Center"  value={serviceCenter} />
                <InfoTile icon={UserCheck} label="Mechanic Name"   value={mechanicName} />
                <InfoTile icon={Gauge}     label="Odometer"        value={odometer ? `${Number(odometer).toLocaleString()} km` : '—'} />
                <InfoTile icon={Calendar}  label="Next Service"    value={fmt(nextServiceDate)} />
              </div>
            </div>

            {/* Parts Changed */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-white mb-3">Parts & Components Changed ({partsChanged.length})</h2>
              {partsChanged.length === 0 ? (
                <p className="text-slate-500 text-xs">No specific parts logged for this service entry.</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {partsChanged.map((part, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-medium"
                    >
                      ✓ {part}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {notes && (
              <div className="glass-card p-5">
                <h2 className="font-semibold text-white mb-2">Service Notes</h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Full Screen Modal */}
      {showImgModal && invoiceImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowImgModal(false)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-surface-900 border border-white/10 rounded-2xl p-4 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowImgModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-black/50 p-2 rounded-full z-10"
            >
              ✕
            </button>
            <img src={invoiceImage} alt="Invoice Full View" className="max-h-[80vh] w-auto object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetails;
