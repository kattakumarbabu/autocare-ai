import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { documentApi } from '../../api/documentApi';
import { vehicleApi }  from '../../api/vehicleApi';
import { ArrowLeft, Save, FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DOCUMENT_TYPES = ['RC', 'Insurance', 'PUC', 'Driving License', 'Warranty', 'Service Bill', 'Pollution Certificate', 'Other'];
const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const EditDocument = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [form,     setForm]     = useState(null);
  const [file,     setFile]     = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [docRes, vehRes] = await Promise.all([
          documentApi.getById(id),
          vehicleApi.getAll({ limit: 100 }),
        ]);

        const d = docRes.data.data.document;
        setVehicles(vehRes.data.data.vehicles);
        setForm({
          title:        d.title || '',
          documentType: d.documentType || 'Insurance',
          vehicleId:    d.vehicle?._id || d.vehicle || '',
          issueDate:    toDateInput(d.issueDate),
          expiryDate:   toDateInput(d.expiryDate),
          description:  d.description || '',
          tags:         Array.isArray(d.tags) ? d.tags.join(', ') : d.tags || '',
        });
      } catch (err) {
        setFetchErr(err.response?.data?.message || 'Document not found');
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('documentType', form.documentType);
      if (form.vehicleId) formData.append('vehicleId', form.vehicleId);
      if (form.issueDate) formData.append('issueDate', form.issueDate);
      if (form.expiryDate) formData.append('expiryDate', form.expiryDate);
      if (form.description) formData.append('description', form.description);
      if (form.tags) formData.append('tags', form.tags);
      if (file) formData.append('file', file);

      await documentApi.update(id, formData);
      toast.success('Document updated successfully');
      navigate('/documents');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
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
        <Link to="/documents" className="btn-primary text-sm">Back to Vault</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/documents" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Edit Document</h1>
            <p className="text-slate-400 text-sm">Update details or replace file asset</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" noValidate>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-brand-400" /> Document Details
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="form-label">Document Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="form-label">Document Type *</label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))}
                  className="input-field appearance-none cursor-pointer"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt} className="bg-surface-900">{dt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Associated Vehicle</label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm((p) => ({ ...p, vehicleId: e.target.value }))}
                  className="input-field appearance-none cursor-pointer"
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
                <label className="form-label">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))}
                  className="input-field [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="form-label">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  className="input-field [color-scheme:dark]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="form-label">Notes & Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                maxLength={500}
                className="input-field resize-none w-full"
              />
            </div>
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Upload size={16} className="text-brand-400" /> Replace File (Optional)
            </h2>
            <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-2xl cursor-pointer bg-white/2 hover:bg-white/5 transition-all">
              <Upload size={24} className="text-brand-400 mb-2" />
              <span className="text-sm font-medium text-white">
                {fileName ? fileName : 'Click to select replacement file'}
              </span>
              <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="flex gap-3 pb-4">
            <Link to="/documents" className="btn-ghost flex-1 justify-center py-3">Cancel</Link>
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

export default EditDocument;
