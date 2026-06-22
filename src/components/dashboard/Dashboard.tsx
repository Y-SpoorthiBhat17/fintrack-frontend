import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Summary, MonthlyData, CategoryData } from '../../types';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
const fmt = (n: number) => n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`;

const StatCard: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color='text-white' }) => (
  <div className="glass rounded-xl p-5 flex flex-col gap-1">
    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
    <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </div>
);

const Dashboard: React.FC = () => {
  const { mode } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, savings: 0, savingsRate: 0 });
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, m, c] = await Promise.all([
        transactionAPI.getSummary({ mode }),
        transactionAPI.getMonthly({ mode }),
        transactionAPI.getByCategory({ mode }),
      ]);
      setSummary(s.data.data);
      setMonthly(m.data.data);
      setCategories(c.data.data);
    } catch {
      setSummary({ totalIncome: 0, totalExpense: 0, savings: 0, savingsRate: 0 });
      setMonthly([]);
      setCategories([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [mode]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; color: string; value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-lg p-3 text-xs space-y-1">
        <p className="text-slate-400 font-medium">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-mono font-medium">{fmt(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  const isEmpty = summary.totalIncome === 0 && summary.totalExpense === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white capitalize">{mode} Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Financial summary for this month</p>
        </div>
        {mode === 'personal' ? (
          <button onClick={() => navigate('/transactions')} className="btn-primary px-4 py-2 flex items-center gap-2">
            + Add Transaction
          </button>
        ) : (
          <button onClick={() => navigate('/import/csv')} className="btn-primary px-4 py-2 flex items-center gap-2">
            📊 Upload Excel / CSV
          </button>
        )}
      </div>

      {/* Empty State */}
      {isEmpty && (
        <div className="glass rounded-xl p-10 text-center border border-dashed border-white/10">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-white font-semibold mb-1">No transactions yet</p>
          <p className="text-slate-500 text-sm mb-5">
            {mode === 'personal'
              ? 'Add your first transaction to see your dashboard come alive'
              : 'Upload an Excel or CSV file to see your dashboard come alive'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {mode === 'personal' ? (
              <button onClick={() => navigate('/transactions')} className="btn-primary px-5 py-2">
                ✏️ Add Transaction
              </button>
            ) : (
              <button onClick={() => navigate('/import/csv')} className="btn-primary px-5 py-2">
                📊 Upload Excel / CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {!isEmpty && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Income" value={fmt(summary.totalIncome)} color="text-emerald-400" />
            <StatCard label="Total Expense" value={fmt(summary.totalExpense)} color="text-red-400" />
            <StatCard label="Net Savings" value={fmt(summary.savings)} color="text-blue-400" />
            <StatCard label="Savings Rate" value={`${summary.savingsRate.toFixed(1)}%`}
              sub={summary.savingsRate >= 20 ? '✓ Healthy' : '↓ Improve'}
              color={summary.savingsRate >= 20 ? 'text-emerald-400' : 'text-yellow-400'} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Income vs Expense — 6 months</h2>
              {monthly.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Not enough data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Spending by Category</h2>
              {categories.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No expense data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={categories} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        dataKey="amount" nameKey="category" paddingAngle={3}>
                        {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {categories.slice(0,4).map((c, i) => (
                      <div key={c.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                          <span className="text-slate-400">{c.category}</span>
                        </div>
                        <span className="text-slate-300 font-mono">{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Monthly Savings Growth</h2>
              {monthly.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Not enough data</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="savings" name="Savings" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill:'#3b82f6', r:4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Income vs Expense (Bar)</h2>
              {monthly.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-600 text-sm">Not enough data</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;
