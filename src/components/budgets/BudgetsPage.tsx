import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { budgetAPI, transactionAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Budget } from '../../types';
import { PERSONAL_CATEGORIES, BUSINESS_CATEGORIES } from '../../constants/categories';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface FormData { category: string; limit: number; }

const BudgetsPage: React.FC = () => {
  const { mode } = useAuthStore();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [realCats, setRealCats] = useState<string[]>([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  const fallbackCats = mode === 'personal' ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;
  // Budgets are set against expense categories. Once any transactions exist
  // (manual or imported via CSV/Excel), the dropdown reflects the actual
  // categories in your data instead of a generic hardcoded list — so a
  // category like "Service Income" or "Consulting" from an imported CSV
  // shows up correctly instead of being invisible to budgeting.
  const normalizeCategory = (cat: string) => {
  if (!cat) return 'Others';

  const value = cat.trim().toLowerCase();

  if (
    value === 'other' ||
    value === 'others' ||
    value === 'unknown' ||
    value === 'misc'
  ) {
    return 'Others';
  }

  return cat.trim();
};

const sourceCats =
  realCats.length > 0
    ? realCats
    : fallbackCats;

const cats = [
  ...new Set(
    sourceCats
      .map(normalizeCategory)
      .filter(
        cat =>
          ![
            'Salary',
            'Freelance',
            'Investment',
            'Revenue',
            'Income',
            'Service Income',
            'Sales'
          ].includes(cat)
      )
  ),
];

if (!cats.includes('Others')) {
  cats.push('Others');
}

if (!cats.includes('Others')) {
  cats.push('Others');
}

  const today = new Date();
  // A budget belongs to a specific month — but defaulting to today's
  // calendar month is wrong for an account whose data is historical (e.g. a
  // CSV import covering Jan–May while "today" is in June). Default to the
  // month of the most recent transaction instead, and let the person change
  // it with the picker below.
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [initialized, setInitialized] = useState(false);

  // Spent amounts are auto-synced server-side on every fetch — no button needed.
  const load = async (m: number, y: number) => {
    setLoading(true);
    try {
      const [budgetRes, catRes] = await Promise.all([
        budgetAPI.getAll({ mode, month: m, year: y }),
        transactionAPI.getCategories(),
      ]);
      setBudgets(budgetRes.data.data ?? []);
      setRealCats(catRes.data.data?.expense ?? []);
    } catch {
      setBudgets([]);
      toast.error('Could not load budgets');
    } finally { setLoading(false); }
  };

  // On first load (or when switching personal/business), find the most
  // recent transaction and jump the picker to that month — so a fresh CSV
  // import is immediately visible instead of showing an empty "today".
  useEffect(() => {
    (async () => {
      let m = today.getMonth() + 1;
      let y = today.getFullYear();
      try {
        const res = await transactionAPI.getAll({ mode, limit: 1, page: 1 });
        const latest = res.data.data?.transactions?.[0];
        if (latest?.date) {
          const d = new Date(latest.date);
          m = d.getMonth() + 1;
          y = d.getFullYear();
        }
      } catch { /* fall back to current month */ }
      setMonth(m);
      setYear(y);
      setInitialized(true);
      load(m, y);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Subsequent month/year changes from the picker
  useEffect(() => {
    if (initialized) load(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const monthName = MONTH_NAMES[month - 1];

  const onSubmit = async (data: FormData) => {
    try {
      await budgetAPI.create({ ...data, mode, month, year });
      toast.success('Budget set!');
      reset();
      setShowForm(false);
      load(month, year);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to set budget');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetAPI.delete(id);
      toast.success('Budget removed');
      load(month, year);
    } catch { toast.error('Failed to delete'); }
  };

  const getStatus = (b: Budget) => {
    const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
    if (pct >= 100) return { color: 'text-red-400', bar: 'bg-red-500', label: '🚨 Exceeded' };
    if (pct >= 80)  return { color: 'text-yellow-400', bar: 'bg-yellow-500', label: '⚠️ Warning' };
    if (pct >= 50)  return { color: 'text-blue-400', bar: 'bg-blue-500', label: '📊 On track' };
    return { color: 'text-emerald-400', bar: 'bg-emerald-500', label: '✅ Good' };
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent  = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct  = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Budgets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{monthName} {year} — {mode} mode</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Month/year picker — defaults to the month of your most recent
              transaction, but you can browse any month here. */}
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="glass rounded-lg px-3 py-2 text-xs text-slate-300 bg-transparent border-none focus:outline-none"
          >
            {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="glass rounded-lg px-3 py-2 text-xs text-slate-300 bg-transparent border-none focus:outline-none"
          >
            {Array.from({ length: 6 }, (_, i) => today.getFullYear() - 4 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(!showForm)}
            className="btn-primary px-4 py-2">
            {showForm ? '✕ Cancel' : '+ Set Budget'}
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      {budgets.length > 0 && (
        <div className="glass rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Overall Budget Usage</span>
            <span className={`font-mono font-semibold ${overallPct >= 100 ? 'text-red-400' : overallPct >= 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {overallPct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${overallPct >= 100 ? 'bg-red-500' : overallPct >= 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-1">
            {[
              { label: 'Total Budget', value: `₹${totalBudget.toLocaleString('en-IN')}`, color: 'text-white' },
              { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-red-400' },
              { label: 'Remaining', value: `₹${Math.max(0, totalBudget - totalSpent).toLocaleString('en-IN')}`, color: totalBudget >= totalSpent ? 'text-emerald-400' : 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set Budget Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit, () => {
            // react-hook-form blocks the actual submit when validation fails
            // (e.g. limit left empty) — without this, that looked like
            // nothing happened at all when you clicked Save.
            toast.error('Please fill in both fields before saving.');
          })}
          className="glass rounded-xl p-5 flex gap-4 items-end flex-wrap border border-emerald-500/20"
        >
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
            <select {...register('category', { required: true })} className="input-field">
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-400 mt-1">Pick a category</p>}
            {realCats.length === 0 && (
              <p className="text-xs text-slate-600 mt-1">No transactions yet — showing default categories. Real categories will appear here after you add transactions or import a CSV.</p>
            )}
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-slate-400 mb-1.5">Monthly Limit (₹)</label>
            <input type="number" placeholder="15000" min="1"
              {...register('limit', { required: true, min: 1, valueAsNumber: true })}
              className="input-field font-mono" />
            {errors.limit && <p className="text-xs text-red-400 mt-1">Enter an amount greater than 0</p>}
          </div>
          <button type="submit" className="btn-primary px-6 py-2.5">Save Budget</button>
        </form>
      )}

      {/* Empty state */}
      {!loading && budgets.length === 0 && (
        <div className="glass rounded-xl p-10 text-center border border-dashed border-white/10">
          <p className="text-3xl mb-3">◎</p>
          <p className="text-white font-semibold mb-1">No budgets set for {monthName}</p>
          <p className="text-slate-500 text-sm mb-4">Set a budget per category — spent amounts track automatically from your transactions</p>
          <button onClick={() => setShowForm(true)} className="btn-primary px-5 py-2">+ Set First Budget</button>
        </div>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading
          ? <p className="text-slate-500 text-sm col-span-2 text-center py-10">Loading...</p>
          : budgets.map(b => {
            const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0;
            const status = getStatus(b);
            return (
              <div key={b.id} className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white text-sm">{b.category}</h3>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    <button onClick={() => handleDelete(b.id)} className="text-slate-600 hover:text-red-400 transition text-xs">✕</button>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>Spent: <span className="text-white font-semibold">₹{b.spent.toLocaleString('en-IN')}</span></span>
                  <span>Limit: <span className="text-white">₹{b.limit.toLocaleString('en-IN')}</span></span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">{pct.toFixed(0)}% used</span>
                  <span className={`text-xs font-mono ${b.limit - b.spent >= 0 ? 'text-slate-400' : 'text-red-400'}`}>
                    {b.limit - b.spent >= 0
                      ? `₹${(b.limit - b.spent).toLocaleString('en-IN')} left`
                      : `₹${(b.spent - b.limit).toLocaleString('en-IN')} over`}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Info note */}
      {budgets.length > 0 && (
        <p className="text-xs text-slate-600 text-center">
          💡 Budget spent amounts update automatically from your transactions — manual entries and CSV/Excel imports. No action needed.
        </p>
      )}
    </div>
  );
};
export default BudgetsPage;
