import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const AIInsightsPage: React.FC = () => {
  const { mode } = useAuthStore();
  const [insights, setInsights] = useState<string>('');
  const [stats, setStats] = useState<{ income: number; expense: number; savings: number; savingsRate: string; transactionCount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const getInsights = async () => {
    setLoading(true);
    setError('');
    setInsights('');
    setStats(null);
    try {
      const res = await aiAPI.getInsights({ mode });
      setInsights(res.data.data.insights);
      setStats(res.data.data.stats);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to get AI insights';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">AI Spending Insights</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalised financial advice based on your real transactions</p>
      </div>

      {/* Card */}
      <div className="glass rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg flex-shrink-0">✦</div>
          <div>
            <h2 className="text-sm font-semibold text-white">FinTrack AI Advisor</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Reads your actual last 30 days of {mode} transactions from your database and sends them to OpenRouter AI for analysis.
              <span className="text-emerald-400"> 100% based on your real data.</span>
            </p>
          </div>
        </div>
        <button
          onClick={getInsights}
          disabled={loading}
          className="self-start bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin inline-block" /> Analysing your transactions...</>
            : '✦ Generate Insights'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="glass rounded-xl p-5 border border-red-500/20 bg-red-500/5">
          <p className="text-sm font-semibold text-red-400 mb-1">⚠️ Error</p>
          <p className="text-sm text-slate-400">{error}</p>
          {error.includes('OPENROUTER') && (
            <p className="text-xs text-slate-500 mt-2">
              Get a free API key at <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-emerald-400 underline">openrouter.ai</a> and add it to your backend <code className="bg-white/5 px-1 rounded">.env</code> as <code className="bg-white/5 px-1 rounded">OPENROUTER_API_KEY</code>
            </p>
          )}
        </div>
      )}

      {/* Real data stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Income (30d)', value: fmt(stats.income), color: 'text-emerald-400' },
            { label: 'Expense (30d)', value: fmt(stats.expense), color: 'text-red-400' },
            { label: 'Savings', value: fmt(stats.savings), color: 'text-blue-400' },
            { label: 'Transactions', value: String(stats.transactionCount), color: 'text-slate-300' },
          ].map(s => (
            <div key={s.label} className="glass rounded-lg p-3 text-center">
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Insights output */}
      {insights && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
            <span className="text-emerald-400">✦</span>
            <span className="text-xs text-slate-400">Generated from your real transaction data</span>
          </div>
          <div className="space-y-1">
            {insights.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-white mt-2 mb-2">{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-emerald-400 mt-4 mb-1">{line.replace('### ', '')}</h3>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-white text-sm my-1">{line.replace(/\*\*/g, '')}</p>;
              if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className="text-sm text-slate-300 my-1 pl-3 border-l-2 border-emerald-500/30">{line.replace(/^[-•] /, '• ')}</p>;
              if (line.match(/^\d+\./)) return <p key={i} className="text-sm text-slate-300 my-1.5">{line}</p>;
              if (line === '---') return <hr key={i} className="border-white/10 my-3" />;
              if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-xs text-slate-500 italic mt-3">{line.replace(/\*/g, '')}</p>;
              return line ? <p key={i} className="text-sm text-slate-300 my-0.5">{line}</p> : <div key={i} className="h-1.5" />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default AIInsightsPage;
