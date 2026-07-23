import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { documentApi } from '../../api/documentApi';
import { vehicleApi }  from '../../api/vehicleApi';
import { ArrowLeft, Save, FileText, Calendar, Upload, Loader2, Image, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const DOCUMENT_TYPES = [
  'RC',
  'Insurance',
  'PUC',
  'Driving License',
  'Warranty',
  'Service Bill',
  'Pollution Certificate',
  'Other',
];

const UploadDocument = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [vehicles,     setVehicles]     = useState([]);
  const [selectedVeh,  setSelectedVeh]  = useState(searchParams.get('vehicleId') || '');
  const [fetchingVehs, setFetchingVehs] = useState(true);

  const [form, setForm] = useState({
    title:        '',
    documentType: 'Insurance',
    issueDate:    '',
    expiryDate:   '',
    description:  '',
    tags:         '',
  });

  const [file, setFile]                 = useState(null);
  const [filePreview, setFilePreview]   = useState('');
  const [isPdf, setIsPdf]               = useState(false);
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
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
      const isPdfFile = selectedFile.type.includes('pdf') || selectedFile.name.toLowerCase().endsWith('.pdf');
      setIsPdf(isPdfFile);
      if (!isPdfFile) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Document title is required' }));
      return;
    }
    if (!file) {
      setErrors((prev) => ({ ...prev, file: 'File upload (PDF or Image) is required' }));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('documentType', form.documentType);
      if (selectedVeh) formData.append('vehicleId', selectedVeh);
      if (form.issueDate) formData.append('issueDate', form.issueDate);
      if (form.expiryDate) formData.append('expiryDate', form.expiryDate);
      if (form.description) formData.append('description', form.description);
      if (form.tags) formData.append('tags', form.tags);
      formData.append('file', file);

      await documentApi.create(formData);
      toast.success('Document uploaded & saved!');
      navigate('/documents');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
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
          <Link to="/documents" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Upload Document</h1>
            <p className="text-slate-400 text-sm">Add RC, Insurance, PUC, or Service papers to your secure vault</p>
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
                  placeholder="e.g. Vehicle Registration (RC), Policy Certificate"
                  className={`input-field ${errors.title ? 'border-red-500/50' : ''}`}
                  id="doc-title-input"
                />
                {errors.title && <p className="field-error">{errors.title}</p>}
              </div>

              <div>
                <label className="form-label">Document Type *</label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))}
                  className="input-field appearance-none cursor-pointer"
                  id="doc-type-select"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt} value={dt} className="bg-surface-900">{dt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Associated Vehicle (Optional)</label>
                <select
                  value={selectedVeh}
                  onChange={(e) => setSelectedVeh(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                  id="doc-vehicle-select"
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
                <label className="form-label">Expiry Date (Auto-generates reminder)</label>
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
                  placeholder="e.g. 2026, insurance, policy"
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
                placeholder="Policy number, claim contacts, or notes..."
                className="input-field resize-none w-full"
              />
            </div>
          </div>

          {/* File Picker */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Upload size={16} className="text-brand-400" /> Upload File (PDF or Image) *
            </h2>

            <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 hover:border-brand-500/50 rounded-2xl cursor-pointer bg-white/2 hover:bg-white/5 transition-all">
              <Upload size={28} className="text-brand-400 mb-2" />
              <span className="text-sm font-medium text-white">
                {file ? file.name : 'Click to browse PDF or Image file'}
              </span>
              <span className="text-xs text-slate-500 mt-1">PDF, PNG, JPG, WEBP up to 10MB</span>
              <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="hidden" />
            </label>
            {errors.file && <p className="field-error mt-2">{errors.file}</p>}

            {!isPdf && filePreview && (
              <div className="mt-4 w-32 h-32 rounded-xl overflow-hidden border border-white/10 bg-surface-800">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pb-4">
            <Link to="/documents" className="btn-ghost flex-1 justify-center py-3">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3" id="submit-doc-btn">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              {loading ? 'Uploading…' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocument;
