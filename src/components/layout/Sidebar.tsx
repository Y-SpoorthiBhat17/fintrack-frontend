import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { companyAPI } from '../../services/api';

const Sidebar: React.FC = () => {
  const { user, mode, logout } = useAuthStore();
  const [company, setCompany] = useState<{ name: string; invite_code: string; memberCount: number } | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (mode === 'business') {
      companyAPI.getMine().then(res => setCompany(res.data.data)).catch(() => setCompany(null));
    } else {
      setCompany(null);
    }
  }, [mode]);

  const nav = [
    { to: '/dashboard', icon: '▦', label: 'Dashboard' },
    { to: '/transactions', icon: '↕', label: 'Transactions' },
    { to: '/budgets', icon: '◎', label: 'Budgets' },
    { to: '/ai-insights', icon: '✦', label: 'AI Insights' },
    ...(mode === 'business'
      ? [
          { label: 'IMPORT', type: 'section' as const },
          { to: '/import/csv', icon: '📊', label: 'Excel / CSV' },
        ]
      : []),
  ];

  return (
    <aside className="w-60 h-screen bg-slate-950 border-r border-white/5 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-sm">F</div>
          <span className="font-semibold text-white text-lg tracking-tight">FinTrack Pro</span>
        </div>
      </div>

      {/* Account type — read-only. To use the other mode, log out and sign
          into the matching personal/business account; you can't switch
          modes on a single account. */}
      <div className="px-4 py-4 border-b border-white/5">
        <p className="text-xs text-slate-500 mb-2 px-2">Account type</p>
        <div className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium capitalize
          ${mode === 'business' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
          {mode === 'personal' ? '👤' : '🏢'} {mode}
        </div>

        {/* Company info — every login under this company sees the same
            shared transactions/budgets. Invite code can be revealed any
            time to bring in another teammate. */}
        {mode === 'business' && company && (
          <div className="mt-2 px-2">
            <p className="text-xs text-slate-400 truncate">🏢 {company.name}</p>
            <p className="text-xs text-slate-600">{company.memberCount} member{company.memberCount !== 1 ? 's' : ''}</p>
            {!showInvite ? (
              <button onClick={() => setShowInvite(true)} className="text-xs text-emerald-400 hover:text-emerald-300 transition mt-1">
                Show invite code
              </button>
            ) : (
              <div className="mt-1.5 flex items-center gap-1.5">
                <code className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{company.invite_code}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(company.invite_code); toast.success('Copied!'); }}
                  className="text-xs text-slate-500 hover:text-white transition"
                  title="Copy"
                >📋</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item, i) => {
          if ('type' in item && item.type === 'section') {
            return <p key={i} className="text-xs text-slate-600 font-medium px-3 pt-4 pb-1.5 uppercase tracking-widest">{item.label}</p>;
          }
          if (!('to' in item)) return null;
          return (
            <NavLink key={item.to} to={item.to!}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`
              }>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg glass">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-slate-500 hover:text-red-400 transition text-sm">⏻</button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
