import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { transactionAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Transaction, TxType } from '../../types';
import { PERSONAL_CATEGORIES, BUSINESS_CATEGORIES } from '../../constants/categories';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface FormData { type: TxType; amount: number; category: string; description: string; date: string; }

const TransactionsPage: React.FC = () => {
  const { mode } = useAuthStore();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all'|'income'|'expense'>('all');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { date: new Date().toISOString().split('T')[0] }
  });

  const cats = mode === 'personal' ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;

  const load = async () => {
    setLoading(true);
    try {
      const res = await transactionAPI.getAll({ mode, type: filter === 'all' ? undefined : filter });
      const payload = res.data.data;
      setTransactions(Array.isArray(payload) ? payload : payload.transactions ?? []);
    } catch {
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [mode, filter]);

  const onSubmit = async (data: FormData) => {
    try {
      await transactionAPI.create({ ...data, mode });
      toast.success('Transaction added!');
      reset({ date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      load();
    } catch { toast.error('Failed to add transaction'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  const total = filtered.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{mode} account</p>
        </div>

        {/* Personal accounts: manual add. Business accounts: upload only. */}
        {mode === 'personal' ? (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
            {showForm ? '✕ Cancel' : '+ Add Transaction'}
          </button>
        ) : (
          <button onClick={() => navigate('/import/csv')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition">
            📊 Upload Excel / CSV
          </button>
        )}
      </div>

      {/* Manual add form — personal accounts only */}
      {mode === 'personal' && showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="col-span-full text-sm font-semibold text-white">New Transaction</h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Type</label>
            <select {...register('type', { required: true })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              <option value="income">📈 Income</option>
              <option value="expense">📉 Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Amount (₹)</label>
            <input type="number" placeholder="0" {...register('amount', { required: true, min: 1 })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50" />
            {errors.amount && <p className="text-xs text-red-400 mt-1">Amount is required</p>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Category</label>
            <select {...register('category', { required: true })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Date</label>
            <input type="date" {...register('date', { required: true })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="col-span-full">
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <input type="text" placeholder="What was this for?" {...register('description', { required: true })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
          </div>

          <div className="col-span-full flex justify-end">
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-6 py-2.5 rounded-lg text-sm transition">
              Save Transaction
            </button>
          </div>
        </form>
      )}

      {/* Business accounts: explainer instead of a form */}
      {mode === 'business' && transactions.length === 0 && !loading && (
        <div className="glass rounded-xl p-8 text-center border border-dashed border-white/10">
          <p className="text-3xl mb-3">📊</p>
          <p className="text-white font-semibold mb-1">No transactions yet</p>
          <p className="text-slate-500 text-sm mb-5">Business accounts import transactions from Excel/CSV — manual typing isn't available.</p>
          <button onClick={() => navigate('/import/csv')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-5 py-2 rounded-lg text-sm transition">
            Upload Excel / CSV
          </button>
        </div>
      )}

      {/* Filters + Total */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all','income','expense'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${filter === f ? 'bg-emerald-500 text-slate-900' : 'glass text-slate-400 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className={`text-sm font-mono font-semibold ${total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          Net: ₹{Math.abs(total).toLocaleString()} {total >= 0 ? '↑' : '↓'}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Type','Category','Description','Amount','Date',''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No transactions yet.</td></tr>
            ) : filtered.map(tx => (
              <tr key={tx.id} className="hover:bg-white/3 transition">
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {tx.type === 'income' ? '↑' : '↓'} {tx.type}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-300">{tx.category}</td>
                <td className="px-5 py-3.5 text-sm text-slate-400 max-w-xs truncate">{tx.description}</td>
                <td className={`px-5 py-3.5 text-sm font-mono font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleDelete(tx.id)} className="text-slate-600 hover:text-red-400 transition text-xs">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TransactionsPage;
