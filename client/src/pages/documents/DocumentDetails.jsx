import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentApi } from '../../api/documentApi';
import {
  ArrowLeft, Edit3, Trash2, Calendar, FileText, Download,
  Loader2, AlertCircle, Maximize2, Shield, Bell, Tag, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—');

const DocumentDetails = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [doc,      setDoc]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await documentApi.getById(id);
        setDoc(data.data.document);
      } catch (err) {
        setError(err.response?.data?.message || 'Document not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this document from vault?')) return;
    setDeleting(true);
    try {
      await documentApi.remove(id);
      toast.success('Document deleted');
      navigate('/documents');
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

  if (error || !doc) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Not Found</p>
        <p className="text-slate-400 text-sm mb-5">{error}</p>
        <Link to="/documents" className="btn-primary text-sm">Back to Vault</Link>
      </div>
    </div>
  );

  const {
    title, documentType, vehicle, issueDate, expiryDate,
    description, fileUrl, fileType, tags,
  } = doc;

  const isPdf = fileType?.includes('pdf') || fileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <Link to="/documents" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {documentType}
              </span>
              {expiryDate && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar size={12} /> Expires: {fmt(expiryDate)}
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl text-white truncate mt-1">{title}</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="btn-primary py-2 px-4 text-xs"
            >
              <Download size={14} /> Download
            </a>
            <Link to={`/documents/${id}/edit`} className="btn-ghost py-2 px-3 text-xs">
              <Edit3 size={14} /> Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Embedded Document Previewer */}
        <div className="glass-card p-4 mb-6 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Eye size={14} className="text-brand-400" /> Live Document Viewer
            </span>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
              Open Full Screen <Maximize2 size={12} />
            </a>
          </div>

          <div className="w-full h-[520px] rounded-xl overflow-hidden border border-white/10 bg-surface-900">
            {isPdf ? (
              <iframe src={fileUrl} className="w-full h-full border-0" title="PDF Viewer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img src={fileUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Details & Tags */}
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <h2 className="font-semibold text-white">Document Information</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-slate-500 mb-1">Associated Vehicle</p>
              <p className="text-white font-medium text-sm">
                {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : 'Unassigned'}
              </p>
            </div>

            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-slate-500 mb-1">Validity & Expiry</p>
              <p className="text-white font-medium text-sm">
                Issued: {fmt(issueDate)} • Expires: {fmt(expiryDate)}
              </p>
            </div>
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
              <p className="text-xs text-slate-500 mb-1">Notes / Description</p>
              <p className="text-slate-300 text-sm">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
