import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { vehicleApi } from '../../api/vehicleApi';
import VehicleCard from '../../components/vehicles/VehicleCard';
import DeleteModal from '../../components/vehicles/DeleteModal';
import {
  Plus, Search, SlidersHorizontal, ArrowUpDown,
  Car, Loader2, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPES  = ['All', 'Car', 'Bike', 'Scooter', 'Truck'];
const SORTS  = [
  { value: '-createdAt',      label: 'Newest First' },
  { value: 'nextServiceDate', label: 'Next Service ↑' },
  { value: '-nextServiceDate',label: 'Next Service ↓' },
  { value: 'insuranceExpiry', label: 'Insurance Expiry' },
  { value: 'brand',           label: 'Brand A–Z' },
  { value: '-year',           label: 'Year (Newest)' },
];

const MyVehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles,   setVehicles]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, hasNext: false, hasPrev: false });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [toDelete,   setToDelete]   = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const search      = searchParams.get('search')      || '';
  const vehicleType = searchParams.get('vehicleType') || 'All';
  const sort        = searchParams.get('sort')        || '-createdAt';
  const page        = parseInt(searchParams.get('page') || '1', 10);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await vehicleApi.getAll({ search, vehicleType, sort, page, limit: 9 });
      setVehicles(data.data.vehicles);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [search, vehicleType, sort, page]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await vehicleApi.remove(id);
      toast.success('Vehicle deleted');
      setToDelete(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = search || vehicleType !== 'All';

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">My Garage</h1>
            <p className="text-slate-400 text-sm mt-1">
              {loading ? '…' : `${pagination.total} vehicle${pagination.total !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <Link to="/vehicles/add" id="add-vehicle-btn" className="btn-primary">
            <Plus size={18} /> Add Vehicle
          </Link>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="vehicle-search"
              type="text"
              placeholder="Search by reg. number, brand or model…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              id="vehicle-type-filter"
              value={vehicleType}
              onChange={(e) => setParam('vehicleType', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[150px]"
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="bg-surface-900">{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              id="vehicle-sort"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[170px]"
            >
              {SORTS.map(({ value, label }) => (
                <option key={value} value={value} className="bg-surface-900">{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Type filter pills (visual shortcut) ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setParam('vehicleType', t)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                vehicleType === t
                  ? 'bg-brand-gradient text-white border-transparent shadow-glow'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:border-brand-500/40 hover:text-white'
              }`}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-500" />
              <p className="text-slate-400 text-sm">Loading your garage…</p>
            </div>
          </div>

        ) : error ? (
          <div className="flex items-center justify-center py-32">
            <div className="glass-card p-8 text-center max-w-sm">
              <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">Failed to load</p>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button onClick={fetchVehicles} className="btn-primary text-sm px-5 py-2">Retry</button>
            </div>
          </div>

        ) : vehicles.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Car size={36} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-white text-xl mb-2">
                {hasFilters ? 'No vehicles match your filters' : 'Your garage is empty'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                {hasFilters
                  ? 'Try adjusting your search or filter.'
                  : 'Add your first vehicle to start tracking maintenance, health, and documents.'}
              </p>
              {!hasFilters && (
                <Link to="/vehicles/add" className="btn-primary">
                  <Plus size={16} /> Add Your First Vehicle
                </Link>
              )}
            </div>
          </div>

        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8 animate-fade-in">
              {vehicles.map((v) => (
                <VehicleCard key={v._id} vehicle={v} onDelete={setToDelete} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setParam('page', page - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn-ghost py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setParam('page', p)}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                        p === page
                          ? 'bg-brand-gradient text-white shadow-glow'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setParam('page', page + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-ghost py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {toDelete && (
        <DeleteModal
          vehicle={toDelete}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default MyVehicles;
