import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { documentApi } from '../../api/documentApi';
import { vehicleApi }  from '../../api/vehicleApi';
import {
  FileText, Upload, Search, SlidersHorizontal, Calendar, Download,
  Eye, Edit3, Trash2, LayoutGrid, List, Shield, AlertTriangle,
  CheckCircle2, Clock, Loader2, Maximize2, X, Plus, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

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

const getExpiryBadge = (expiryDate) => {
  if (!expiryDate) return { label: 'No Expiry', cls: 'bg-white/10 text-slate-400 border-white/10' };
  const diff = new Date(expiryDate).getTime() - Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 0) return { label: 'Expired', cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (diff <= 30 * day) return { label: 'Expiring Soon', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  return { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
};

const DocumentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles,    setVehicles]    = useState([]);
  const [stats,       setStats]       = useState({ totalDocuments: 0, expiringSoonCount: 0, recentUploads: [] });
  const [documents,   setDocuments]   = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, pages: 1 });
  const [viewMode,    setViewMode]    = useState('grid'); // 'grid' | 'list'
  const [loading,     setLoading]     = useState(true);

  // Lightbox preview state
  const [previewDoc,  setPreviewDoc]  = useState(null);

  const search       = searchParams.get('search')       || '';
  const documentType = searchParams.get('documentType') || '';
  const vehicleId    = searchParams.get('vehicleId')    || '';
  const page         = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getAll({ limit: 100 });
        setVehicles(data.data.vehicles);
      } catch {
        // Silently handle
      }
    })();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, docsRes] = await Promise.all([
        documentApi.getStats(vehicleId),
        documentApi.getAll({ search, documentType, vehicleId, page, limit: 16 }),
      ]);
      setStats(statsRes.data.data);
      setDocuments(docsRes.data.data.documents);
      setPagination(docsRes.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [search, documentType, vehicleId, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete document from vault?')) return;
    try {
      await documentApi.remove(id);
      toast.success('Document deleted');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Digital Document Vault</h1>
            <p className="text-slate-400 text-sm mt-1">
              Secure cloud repository for vehicle RCs, insurance policies, PUC, and receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface-900 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>

            <Link to="/documents/upload" className="btn-primary text-xs py-2.5 px-4" id="upload-doc-btn">
              <Upload size={15} /> Upload Document
            </Link>
          </div>
        </div>

        {/* Stat Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Total Vault Documents</span>
              <FileText size={16} className="text-brand-400" />
            </div>
            <p className="font-display font-bold text-2xl text-white">{stats.totalDocuments}</p>
            <p className="text-slate-500 text-[11px] mt-1">Securely stored</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Expiring Soon (30 Days)</span>
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <p className="font-display font-bold text-2xl text-amber-400">{stats.expiringSoonCount}</p>
            <p className="text-slate-500 text-[11px] mt-1">Requires renewal attention</p>
          </div>

          <div className="glass-card p-5 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Recently Uploaded</span>
              <Clock size={16} className="text-emerald-400" />
            </div>
            <p className="font-display font-bold text-2xl text-emerald-400">
              {stats.recentUploads.length}
            </p>
            <p className="text-slate-500 text-[11px] mt-1 truncate">
              Latest: {stats.recentUploads[0]?.title || 'No recent files'}
            </p>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search document title, description, or tags…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
              id="doc-search-input"
            />
          </div>

          <select
            value={documentType}
            onChange={(e) => setParam('documentType', e.target.value)}
            className="input-field appearance-none cursor-pointer min-w-[170px]"
            id="doc-type-filter"
          >
            <option value="" className="bg-surface-900">All Document Types</option>
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt} value={dt} className="bg-surface-900">{dt}</option>
            ))}
          </select>

          <select
            value={vehicleId}
            onChange={(e) => setParam('vehicleId', e.target.value)}
            className="input-field appearance-none cursor-pointer min-w-[170px]"
            id="doc-vehicle-filter"
          >
            <option value="" className="bg-surface-900">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id} className="bg-surface-900">
                {v.brand} {v.model} ({v.registrationNumber})
              </option>
            ))}
          </select>
        </div>

        {/* Documents Grid or List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-8">
            <FileText size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white text-lg mb-2">No Vault Documents</h3>
            <p className="text-slate-400 text-sm mb-6">
              Upload RCs, insurance certificates, and service papers to keep your vehicle vault organized.
            </p>
            <Link to="/documents/upload" className="btn-primary text-sm">
              <Upload size={15} /> Upload First Document
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {documents.map((doc) => {
              const badge = getExpiryBadge(doc.expiryDate);
              const isPdf = doc.fileType?.includes('pdf') || doc.fileUrl?.toLowerCase().endsWith('.pdf');

              return (
                <div key={doc._id} className="glass-card p-5 flex flex-col justify-between group hover:border-brand-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {doc.documentType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-base mb-1 truncate group-hover:text-brand-300 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-slate-400 text-xs mb-3 truncate">
                      {doc.vehicle ? `${doc.vehicle.brand} ${doc.vehicle.model}` : 'Unassigned'}
                    </p>

                    {doc.expiryDate && (
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 mb-4">
                        <Calendar size={12} /> Expires: {fmtDate(doc.expiryDate)}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <Eye size={13} /> Preview
                    </button>
                    <div className="flex items-center gap-1">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <Link
                        to={`/documents/${doc._id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => {
                    const badge = getExpiryBadge(doc.expiryDate);
                    return (
                      <tr key={doc._id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                          {doc.title}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                            {doc.documentType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {doc.vehicle ? `${doc.vehicle.brand} ${doc.vehicle.model}` : 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {fmtDate(doc.expiryDate)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors"
                              title="Preview Document"
                            >
                              <Eye size={15} />
                            </button>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Download File"
                            >
                              <Download size={15} />
                            </a>
                            <Link
                              to={`/documents/${doc._id}/edit`}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                              title="Edit Entry"
                            >
                              <Edit3 size={15} />
                            </Link>
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lightbox / Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-950">
                <div>
                  <h3 className="font-semibold text-white text-base">{previewDoc.title}</h3>
                  <p className="text-slate-400 text-xs">{previewDoc.documentType} • {fmtDate(previewDoc.expiryDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    <Download size={13} /> Download
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 bg-surface-950 overflow-auto min-h-[450px] flex items-center justify-center">
                {previewDoc.fileType?.includes('pdf') || previewDoc.fileUrl?.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewDoc.fileUrl} className="w-full h-[550px] rounded-xl border-0" title="PDF Preview" />
                ) : (
                  <img src={previewDoc.fileUrl} alt="Preview" className="max-w-full max-h-[550px] object-contain rounded-xl" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
