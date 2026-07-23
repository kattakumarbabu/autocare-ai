import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fuelApi } from '../../api/fuelApi';
import { vehicleApi } from '../../api/vehicleApi';
import {
  Fuel, Plus, Search, SlidersHorizontal, Calendar, Gauge, DollarSign,
  TrendingUp, Download, Printer, FileSpreadsheet, Loader2, ChevronRight,
  Edit3, Trash2, Eye, Award, ArrowDownRight, ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const FuelTrackerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles,    setVehicles]    = useState([]);
  const [stats,       setStats]       = useState({
    avgMileage: 0,
    bestMileage: 0,
    lowestMileage: 0,
    avgCostPerKm: 0,
    monthlyFuelConsumption: 0,
    monthlyFuelExpenses: 0,
    totalLogs: 0,
    monthlyTrends: [],
  });
  const [fuelLogs,    setFuelLogs]    = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, pages: 1 });
  const [loading,     setLoading]     = useState(true);

  const search    = searchParams.get('search')    || '';
  const vehicleId = searchParams.get('vehicleId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate   = searchParams.get('endDate')   || '';
  const page      = parseInt(searchParams.get('page') || '1', 10);

  // Load vehicles
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

  // Fetch fuel logs & stats
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fuelApi.getStats(vehicleId),
        fuelApi.getAll({ search, vehicleId, startDate, endDate, page, limit: 15 }),
      ]);
      setStats(statsRes.data.data);
      setFuelLogs(logsRes.data.data.fuelLogs);
      setPagination(logsRes.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load fuel data');
    } finally {
      setLoading(false);
    }
  }, [search, vehicleId, startDate, endDate, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fuel entry?')) return;
    try {
      await fuelApi.remove(id);
      toast.success('Fuel entry deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  // ── CSV Export Handler ──
  const handleExportCSV = () => {
    if (fuelLogs.length === 0) {
      toast.error('No fuel log data available to export');
      return;
    }
    const headers = ['Date', 'Vehicle', 'Registration', 'Odometer (km)', 'Quantity (L)', 'Cost ($)', 'Price/L ($)', 'Mileage (km/L)', 'Station', 'Payment Method'];
    const rows = fuelLogs.map((l) => [
      fmtDate(l.date),
      l.vehicle ? `${l.vehicle.brand} ${l.vehicle.model}` : 'Vehicle',
      l.vehicle?.registrationNumber || '',
      l.odometer || '',
      l.fuelQuantity || '',
      l.fuelCost || '',
      l.fuelPricePerLiter || '',
      l.calculatedMileage || 'N/A',
      `"${l.fuelStation || ''}"`,
      l.paymentMethod || 'Card',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AutoCare-Fuel-Logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fuel logs exported to CSV!');
  };

  // ── PDF Export / Print Handler ──
  const handleExportPDF = () => {
    if (fuelLogs.length === 0) {
      toast.error('No fuel log data available to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AutoCare AI — Fuel & Mileage Report</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #1e293b; }
            h1 { color: #0284c7; margin-bottom: 4px; }
            p { font-size: 13px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .stat-box { display: flex; gap: 16px; margin-bottom: 16px; }
            .card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; flex: 1; text-align: center; }
            .val { font-size: 18px; font-weight: bold; color: #0f172a; }
          </style>
        </head>
        <body>
          <h1>AutoCare AI — Fuel & Mileage Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} for User Vehicles</p>
          <div class="stat-box">
            <div class="card"><div>Avg Mileage</div><div class="val">${stats.avgMileage} km/L</div></div>
            <div class="card"><div>Monthly Spent</div><div class="val">$${stats.monthlyFuelExpenses}</div></div>
            <div class="card"><div>Monthly Fuel</div><div class="val">${stats.monthlyFuelConsumption} L</div></div>
            <div class="card"><div>Avg Cost/km</div><div class="val">$${stats.avgCostPerKm}/km</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Vehicle</th><th>Odometer</th><th>Fuel (L)</th><th>Cost ($)</th><th>Price/L</th><th>Mileage (km/L)</th><th>Station</th>
              </tr>
            </thead>
            <tbody>
              ${fuelLogs.map((l) => `
                <tr>
                  <td>${fmtDate(l.date)}</td>
                  <td>${l.vehicle ? `${l.vehicle.brand} ${l.vehicle.model}` : 'Vehicle'} (${l.vehicle?.registrationNumber || ''})</td>
                  <td>${l.odometer.toLocaleString()} km</td>
                  <td>${l.fuelQuantity} L</td>
                  <td>$${l.fuelCost}</td>
                  <td>$${l.fuelPricePerLiter}</td>
                  <td>${l.calculatedMileage ? `${l.calculatedMileage} km/L` : '—'}</td>
                  <td>${l.fuelStation || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Fuel & Mileage Tracker</h1>
            <p className="text-slate-400 text-sm mt-1">
              Log fill-ups, track fuel economy (km/L), analyze monthly expenses, and view trends
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5"
              title="Export to CSV"
            >
              <FileSpreadsheet size={14} /> Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-ghost py-2 px-3 text-xs flex items-center gap-1.5"
              title="Export / Print PDF Report"
            >
              <Printer size={14} /> Print PDF
            </button>
            <Link to="/fuel/add" className="btn-primary py-2 px-4 text-xs" id="add-fuel-entry-btn">
              <Plus size={16} /> Log Fuel Fill-Up
            </Link>
          </div>
        </div>

        {/* Automated Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Average Mileage</span>
              <Fuel size={16} className="text-emerald-400" />
            </div>
            <p className="font-display font-bold text-2xl text-emerald-400">
              {stats.avgMileage ? `${stats.avgMileage} km/L` : '—'}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Best: {stats.bestMileage ? `${stats.bestMileage} km/L` : '—'}
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Spent This Month</span>
              <DollarSign size={16} className="text-brand-400" />
            </div>
            <p className="font-display font-bold text-2xl text-white">
              ${stats.monthlyFuelExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Consumption: {stats.monthlyFuelConsumption} Liters
            </p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Cost per Kilometer</span>
              <Gauge size={16} className="text-amber-400" />
            </div>
            <p className="font-display font-bold text-2xl text-amber-400">
              {stats.avgCostPerKm ? `$${stats.avgCostPerKm}/km` : '—'}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">Based on recent fill-ups</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Total Refuel Logs</span>
              <Award size={16} className="text-purple-400" />
            </div>
            <p className="font-display font-bold text-2xl text-white">
              {stats.totalLogs}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">Entries logged</p>
          </div>
        </div>

        {/* Monthly Fuel Cost & Mileage Trends Visualization */}
        {stats.monthlyTrends.length > 0 && (
          <div className="glass-card p-6 mb-8 animate-fade-in">
            <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" /> 6-Month Fuel Cost & Mileage Trends
            </h3>
            <div className="grid grid-cols-6 gap-3 items-end h-40 pt-4 border-b border-white/5 pb-4">
              {stats.monthlyTrends.map((t) => {
                const maxCost = Math.max(...stats.monthlyTrends.map((m) => m.cost), 1);
                const heightPct = Math.min(100, Math.max(10, (t.cost / maxCost) * 100));

                return (
                  <div key={t.month} className="flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      ${t.cost}
                    </div>
                    <div
                      className="w-full bg-brand-gradient rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-xs font-medium text-slate-400">{t.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search fuel station or notes…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
              id="fuel-search-input"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={vehicleId}
              onChange={(e) => setParam('vehicleId', e.target.value)}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer min-w-[180px]"
              id="fuel-vehicle-filter"
            >
              <option value="" className="bg-surface-900">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id} className="bg-surface-900">
                  {v.brand} {v.model} ({v.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setParam('startDate', e.target.value)}
            className="input-field [color-scheme:dark]"
            title="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setParam('endDate', e.target.value)}
            className="input-field [color-scheme:dark]"
            title="End Date"
          />
        </div>

        {/* Fuel Log Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : fuelLogs.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-8">
            <Fuel size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white text-lg mb-2">No Fuel Logs Found</h3>
            <p className="text-slate-400 text-sm mb-6">
              Log your refueling fill-ups to start tracking fuel efficiency and monthly costs.
            </p>
            <Link to="/fuel/add" className="btn-primary text-sm">
              <Plus size={16} /> Log First Fill-Up
            </Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Odometer</th>
                    <th className="py-3.5 px-4">Fuel (L)</th>
                    <th className="py-3.5 px-4">Cost ($)</th>
                    <th className="py-3.5 px-4">Price / L</th>
                    <th className="py-3.5 px-4">Mileage</th>
                    <th className="py-3.5 px-4">Station</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fuelLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                        {fmtDate(log.date)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">
                        {log.vehicle ? `${log.vehicle.brand} ${log.vehicle.model}` : 'Vehicle'}
                        <span className="block text-[11px] text-slate-500 font-mono uppercase">
                          {log.vehicle?.registrationNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {Number(log.odometer).toLocaleString()} km
                      </td>
                      <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                        {log.fuelQuantity} L
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                        ${Number(log.fuelCost).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        ${log.fuelPricePerLiter || (log.fuelCost / log.fuelQuantity).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.calculatedMileage ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {log.calculatedMileage} km/L
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap max-w-[140px] truncate">
                        {log.fuelStation || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/fuel/${log._id}`}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            to={`/fuel/${log._id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Entry"
                          >
                            <Edit3 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(log._id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelTrackerPage;
