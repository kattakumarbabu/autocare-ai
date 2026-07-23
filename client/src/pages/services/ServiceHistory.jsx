import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { serviceApi } from '../../api/serviceApi';
import { vehicleApi } from '../../api/vehicleApi';
import {
  Wrench, Plus, Search, SlidersHorizontal, ArrowUpDown,
  Calendar, DollarSign, Gauge, MapPin, UserCheck, Download,
  FileText, Loader2, ChevronRight, AlertCircle, ArrowLeft, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  'All',
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

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ServiceTimelineCard = ({ service }) => {
  const {
    _id, serviceType, serviceCenter, mechanicName, serviceDate,
    odometer, cost, partsChanged = [], nextServiceDate, invoiceImage, notes,
  } = service;

  return (
    <div className="relative pl-8 pb-8 group last:pb-0">
      {/* Timeline Bullet Line */}
      <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-white/10 group-last:hidden" />
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center text-brand-400">
        <Wrench size={12} />
      </div>

      {/* Card Content */}
      <div className="glass-card p-5 hover:border-brand-500/30 transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-base">{serviceType}</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium">
                {fmtDate(serviceDate)}
              </span>
            </div>
            {serviceCenter && (
              <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                <MapPin size={11} className="text-brand-400" /> {serviceCenter}
                {mechanicName && <span>• Mechanic: {mechanicName}</span>}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-lg font-bold text-emerald-400">
              ${Number(cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            {odometer > 0 && (
              <p className="text-slate-500 text-xs flex items-center gap-1 sm:justify-end">
                <Gauge size={11} /> {Number(odometer).toLocaleString()} km
              </p>
            )}
          </div>
        </div>

        {/* Parts list */}
        {partsChanged.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {partsChanged.map((part, idx) => (
              <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                ✓ {part}
              </span>
            ))}
          </div>
        )}

        {notes && (
          <p className="text-slate-400 text-xs italic mb-4 line-clamp-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
            "{notes}"
          </p>
        )}

        {/* Footer Actions & Invoice link */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {nextServiceDate && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar size={11} className="text-brand-400" /> Next: {fmtDate(nextServiceDate)}
              </span>
            )}
            {invoiceImage && (
              <a
                href={invoiceImage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                <Download size={11} /> Invoice
              </a>
            )}
          </div>
          <Link
            to={`/services/${_id}`}
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
          >
            View Details <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const ServiceHistory = () => {
  const { vehicleId }      = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicle,    setVehicle]    = useState(null);
  const [services,   setServices]   = useState([]);
  const [stats,      setStats]      = useState({ totalCost: 0, totalCount: 0, avgCost: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const search      = searchParams.get('search')      || '';
  const serviceType = searchParams.get('serviceType') || 'All';
  const sort        = searchParams.get('sort')        || '-serviceDate';
  const page        = parseInt(searchParams.get('page') || '1', 10);

  // Load Vehicle header info
  useEffect(() => {
    (async () => {
      try {
        const { data } = await vehicleApi.getById(vehicleId);
        setVehicle(data.data.vehicle);
      } catch (err) {
        setError('Vehicle not found');
      }
    })();
  }, [vehicleId]);

  // Load Services timeline
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await serviceApi.getByVehicle(vehicleId, {
        search,
        serviceType,
        sort,
        page,
        limit: 20,
      });
      setServices(data.data.services);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load service records');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, search, serviceType, sort, page]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <Link to={`/vehicles/${vehicleId}`} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-3xl text-white">Service History</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {vehicle ? `${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})` : 'Vehicle Services'}
              </p>
            </div>
          </div>
          <Link
            to={`/vehicles/${vehicleId}/services/add`}
            className="btn-primary"
            id="add-service-record-btn"
          >
            <Plus size={18} /> Log Service Record
          </Link>
        </div>

        {/* Cost Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-4">
            <p className="text-slate-400 text-xs font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              ${stats.totalCost.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-xs font-medium">Total Services</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-xs font-medium">Avg. Cost / Service</p>
            <p className="text-2xl font-bold text-brand-400 mt-1">
              ${stats.avgCost.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-slate-400 text-xs font-medium">Next Due Date</p>
            <p className="text-base font-bold text-orange-400 mt-1 truncate">
              {vehicle?.nextServiceDate ? fmtDate(vehicle.nextServiceDate) : 'Not Scheduled'}
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filter, Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-slide-up">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search center, mechanic, parts, notes…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
              id="service-search-input"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={serviceType}
              onChange={(e) => setParam('serviceType', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[160px]"
              id="service-type-filter"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t} className="bg-surface-900">{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[150px]"
              id="service-sort-select"
            >
              <option value="-serviceDate" className="bg-surface-900">Newest Date</option>
              <option value="serviceDate" className="bg-surface-900">Oldest Date</option>
              <option value="-cost" className="bg-surface-900">Highest Cost</option>
              <option value="cost" className="bg-surface-900">Lowest Cost</option>
            </select>
          </div>
        </div>

        {/* Timeline Body */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="glass-card p-8 text-center max-w-sm">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Error</p>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
            </div>
          </div>
        ) : services.length === 0 ? (
          /* Empty Timeline State */
          <div className="glass-card p-12 text-center max-w-md mx-auto my-12 animate-fade-in">
            <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench size={28} className="text-brand-400" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2">No Service History</h3>
            <p className="text-slate-400 text-sm mb-6">
              {search || serviceType !== 'All'
                ? 'No service entries match your search filters.'
                : 'Keep your vehicle in top condition by logging maintenance and repair records.'}
            </p>
            {!search && serviceType === 'All' && (
              <Link to={`/vehicles/${vehicleId}/services/add`} className="btn-primary">
                <Plus size={16} /> Log First Service
              </Link>
            )}
          </div>
        ) : (
          /* Timeline Cards */
          <div className="pt-2 animate-fade-in">
            {services.map((s) => (
              <ServiceTimelineCard key={s._id} service={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceHistory;
