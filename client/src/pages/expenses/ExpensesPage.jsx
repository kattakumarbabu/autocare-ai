import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { expenseApi } from '../../api/expenseApi';
import { vehicleApi } from '../../api/vehicleApi';
import {
  DollarSign, Plus, Search, SlidersHorizontal, Calendar, TrendingUp,
  PieChart, BarChart3, Receipt, Download, Printer, FileSpreadsheet,
  Loader2, ChevronRight, Edit3, Trash2, Eye, Image as ImageIcon,
  AlertTriangle, ShieldCheck, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const CATEGORIES = ['Fuel', 'Service', 'Insurance', 'PUC', 'Repair', 'Accessories', 'Parking', 'Toll', 'Fine', 'Other'];

const ExpensesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles,    setVehicles]    = useState([]);
  const [analytics,   setAnalytics]   = useState({
    totalExpenses: 0,
    thisMonthExpenses: 0,
    thisYearExpenses: 0,
    avgMonthlyExpense: 0,
    highestExpense: 0,
    lowestExpense: 0,
    topCategory: 'None',
    monthlyBudget: 500,
    budgetStatus: 'Normal',
    categoryBreakdown: [],
    vehicleBreakdown: [],
    monthlyTrends: [],
    totalCount: 0,
  });
  const [expenses,    setExpenses]    = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, pages: 1 });
  const [loading,     setLoading]     = useState(true);

  const search    = searchParams.get('search')    || '';
  const category  = searchParams.get('category')  || '';
  const vehicleId = searchParams.get('vehicleId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate   = searchParams.get('endDate')   || '';
  const page      = parseInt(searchParams.get('page') || '1', 10);

  // Fetch vehicles list
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

  // Fetch analytics & expense list
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, listRes] = await Promise.all([
        expenseApi.getAnalytics(vehicleId),
        expenseApi.getAll({ search, category, vehicleId, startDate, endDate, page, limit: 15 }),
      ]);
      setAnalytics(analyticsRes.data.data);
      setExpenses(listRes.data.data.expenses);
      setPagination(listRes.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load expense data');
    } finally {
      setLoading(false);
    }
  }, [search, category, vehicleId, startDate, endDate, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await expenseApi.remove(id);
      toast.success('Expense entry deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  // ── CSV Export Handler ──
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error('No expense records available to export');
      return;
    }
    const headers = ['Date', 'Title', 'Category', 'Amount ($)', 'Vehicle', 'Payment Method', 'Description'];
    const rows = expenses.map((e) => [
      fmtDate(e.expenseDate),
      `"${e.title}"`,
      e.category,
      e.amount,
      e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : 'Unassigned',
      e.paymentMethod || 'Card',
      `"${e.description || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AutoCare-Expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Expense records exported to CSV!');
  };

  // ── PDF Export / Print Handler ──
  const handleExportPDF = () => {
    if (expenses.length === 0) {
      toast.error('No expense records available to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AutoCare AI — Expense Analytics Report</title>
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
          <h1>AutoCare AI — Expense Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()} for User Expenses</p>
          <div class="stat-box">
            <div class="card"><div>Total Expenses</div><div class="val">$${analytics.totalExpenses}</div></div>
            <div class="card"><div>This Month</div><div class="val">$${analytics.thisMonthExpenses}</div></div>
            <div class="card"><div>Avg Monthly</div><div class="val">$${analytics.avgMonthlyExpense}</div></div>
            <div class="card"><div>Top Category</div><div class="val">${analytics.topCategory}</div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Title</th><th>Category</th><th>Amount ($)</th><th>Vehicle</th><th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map((e) => `
                <tr>
                  <td>${fmtDate(e.expenseDate)}</td>
                  <td>${e.title}</td>
                  <td>${e.category}</td>
                  <td>$${Number(e.amount).toFixed(2)}</td>
                  <td>${e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : 'Unassigned'}</td>
                  <td>${e.paymentMethod || 'Card'}</td>
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

  // Budget Percentage Calculation
  const budgetPct = Math.min(100, Math.round((analytics.thisMonthExpenses / (analytics.monthlyBudget || 500)) * 100));

  return (
    <div className="min-h-screen bg-surface-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Expense Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">
              Track maintenance expenses, category breakdowns, monthly trends, and budget progress
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
            <Link to="/expenses/add" className="btn-primary py-2 px-4 text-xs" id="add-expense-btn">
              <Plus size={16} /> Record Expense
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Total Expenses</span>
              <DollarSign size={16} className="text-emerald-400" />
            </div>
            <p className="font-display font-bold text-2xl text-emerald-400">
              ${analytics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">Across all logged items</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Spent This Month</span>
              <Receipt size={16} className="text-brand-400" />
            </div>
            <p className="font-display font-bold text-2xl text-white">
              ${analytics.thisMonthExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">Year-to-date: ${analytics.thisYearExpenses}</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Average Monthly Expense</span>
              <BarChart3 size={16} className="text-amber-400" />
            </div>
            <p className="font-display font-bold text-2xl text-amber-400">
              ${analytics.avgMonthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">Highest item: ${analytics.highestExpense}</p>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-medium">Top Category</span>
              <Tag size={16} className="text-purple-400" />
            </div>
            <p className="font-display font-bold text-2xl text-white truncate">
              {analytics.topCategory}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">Highest expenditure area</p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="glass-card p-5 mb-8 animate-fade-in">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm">Monthly Spending Budget</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                analytics.budgetStatus === 'Exceeded'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : analytics.budgetStatus === 'Warning'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                Budget: {analytics.budgetStatus}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300">
              ${analytics.thisMonthExpenses} / ${analytics.monthlyBudget} ({budgetPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8 animate-slide-up">

          {/* Category Breakdown */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
              <PieChart size={18} className="text-brand-400" /> Category Breakdown
            </h3>
            {analytics.categoryBreakdown.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No expense categories logged yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.categoryBreakdown.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white font-medium">{item.category}</span>
                      <span className="text-slate-400 font-mono">${item.amount} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Spending Trend */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-white text-base mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" /> 6-Month Expense Trends
            </h3>
            {analytics.monthlyTrends.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center">No monthly trend data available.</p>
            ) : (
              <div className="grid grid-cols-6 gap-3 items-end h-40 pt-4">
                {analytics.monthlyTrends.map((t) => {
                  const maxAmount = Math.max(...analytics.monthlyTrends.map((m) => m.amount), 1);
                  const heightPct = Math.min(100, Math.max(10, (t.amount / maxAmount) * 100));

                  return (
                    <div key={t.month} className="flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                        ${t.amount}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-xs font-medium text-slate-400">{t.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Search & Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-slide-up">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, description, or tags…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="input-field pl-10 w-full"
              id="expense-search-input"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setParam('category', e.target.value)}
            className="input-field appearance-none cursor-pointer min-w-[160px]"
            id="expense-category-filter"
          >
            <option value="" className="bg-surface-900">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-surface-900">{c}</option>
            ))}
          </select>

          <select
            value={vehicleId}
            onChange={(e) => setParam('vehicleId', e.target.value)}
            className="input-field appearance-none cursor-pointer min-w-[160px]"
            id="expense-vehicle-filter"
          >
            <option value="" className="bg-surface-900">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id} className="bg-surface-900">
                {v.brand} {v.model} ({v.registrationNumber})
              </option>
            ))}
          </select>

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

        {/* Expense Log Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto my-8">
            <DollarSign size={36} className="text-slate-600 mx-auto mb-3" />
            <h3 className="font-semibold text-white text-lg mb-2">No Expense Records Found</h3>
            <p className="text-slate-400 text-sm mb-6">
              Record your first vehicle or service expense to start building analytics.
            </p>
            <Link to="/expenses/add" className="btn-primary text-sm">
              <Plus size={16} /> Record First Expense
            </Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Receipt</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white whitespace-nowrap">
                        {fmtDate(e.expenseDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                        {e.title}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 whitespace-nowrap">
                        ${Number(e.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {e.paymentMethod || 'Card'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {e.receiptImage ? (
                          <a
                            href={e.receiptImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                          >
                            <ImageIcon size={14} /> Receipt
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/expenses/${e._id}`}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </Link>
                          <Link
                            to={`/expenses/${e._id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Record"
                          >
                            <Edit3 size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(e._id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Record"
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

export default ExpensesPage;
