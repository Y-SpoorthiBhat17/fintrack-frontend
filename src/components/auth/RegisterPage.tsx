import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Mode } from '../../types';

type CompanyAction = 'create' | 'join';

interface RegisterForm {
  name: string;       // personal: full name · business: your name (login owner)
  email: string;      // personal: email · business: your work email
  password: string;
  mode: Mode;
  companyAction: CompanyAction;
  company: string;    // company name, only used when creating
  inviteCode: string; // only used when joining
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  // After creating a brand-new company we show its invite code once, before
  // sending the person into the app — this is the only time it's surfaced
  // automatically, so it doesn't get missed.
  const [createdInvite, setCreatedInvite] = useState<{ code: string; company: string } | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { mode: 'personal', companyAction: 'create' },
  });

  const mode = watch('mode');
  const companyAction = watch('companyAction');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const payload =
        mode === 'business'
          ? {
              name: data.name, email: data.email, password: data.password, mode,
              companyAction: data.companyAction,
              company: data.companyAction === 'create' ? data.company : undefined,
              inviteCode: data.companyAction === 'join' ? data.inviteCode : undefined,
            }
          : { name: data.name, email: data.email, password: data.password, mode };

      const res = await authAPI.register(payload);
      const { user, token, inviteCode } = res.data.data;

      if (inviteCode) {
        // Brand-new company — show the code before continuing.
        setCreatedInvite({ code: inviteCode, company: user.company });
        login(user, token);
        return;
      }

      login(user, token);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch { /* handled */ } finally { setLoading(false); }
  };

  if (createdInvite) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-base">F</div>
            <span className="text-white font-semibold text-xl tracking-tight">FinTrack Pro</span>
          </div>

          <div className="glass rounded-2xl p-7 text-center">
            <p className="text-3xl mb-3">🎉</p>
            <h1 className="text-lg font-bold text-white mb-1">{createdInvite.company} is set up!</h1>
            <p className="text-sm text-slate-500 mb-5">
              Share this invite code with teammates so they can join and see the same company data.
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-2">
              <p className="text-2xl font-mono font-bold text-emerald-400 tracking-wider">{createdInvite.code}</p>
            </div>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(createdInvite.code); toast.success('Copied!'); }}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition mb-6"
            >
              📋 Copy code
            </button>

            <p className="text-xs text-slate-600 mb-5">
              You can always find this again later from your account settings.
            </p>

            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-2.5">
              Continue to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-base">F</div>
          <span className="text-white font-semibold text-xl tracking-tight">FinTrack Pro</span>
        </div>

        <div className="glass rounded-2xl p-7">
          <h1 className="text-lg font-bold text-white mb-1">Create account</h1>
          <p className="text-sm text-slate-500 mb-6">Personal or business — you choose</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Mode Toggle */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Account type</label>
              <div className="flex glass rounded-lg p-1 gap-1">
                {(['personal', 'business'] as const).map(m => (
                  <label key={m} className={`flex-1 py-2 rounded-md text-xs font-medium text-center cursor-pointer transition capitalize
                    ${mode === m ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
                    <input type="radio" value={m} {...register('mode')} className="sr-only" />
                    {m === 'personal' ? '👤 Personal' : '🏢 Business'}
                  </label>
                ))}
              </div>
            </div>

            {/* Business: create new company vs join existing via invite code */}
            {mode === 'business' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Company</label>
                <div className="flex glass rounded-lg p-1 gap-1">
                  {([
                    { v: 'create' as CompanyAction, label: 'Create new company' },
                    { v: 'join' as CompanyAction, label: 'Join with invite code' },
                  ]).map(opt => (
                    <label key={opt.v} className={`flex-1 py-2 rounded-md text-xs font-medium text-center cursor-pointer transition
                      ${companyAction === opt.v ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
                      <input type="radio" value={opt.v} {...register('companyAction')} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  {companyAction === 'create'
                    ? "You'll get an invite code afterward to bring teammates in."
                    : 'Ask whoever set up your company for their invite code.'}
                </p>
              </div>
            )}

            {/* Your name (always) */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                {mode === 'business' ? 'Your name' : 'Full name'}
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className={`input-field ${errors.name ? 'border-red-500/50' : ''}`}
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            {/* Company name — only when creating */}
            {mode === 'business' && companyAction === 'create' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Company name</label>
                <input
                  type="text"
                  placeholder="Acme Pvt Ltd"
                  className={`input-field ${errors.company ? 'border-red-500/50' : ''}`}
                  {...register('company', { required: 'Company name is required' })}
                />
                {errors.company && <p className="text-xs text-red-400 mt-1">{errors.company.message}</p>}
              </div>
            )}

            {/* Invite code — only when joining */}
            {mode === 'business' && companyAction === 'join' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Invite code</label>
                <input
                  type="text"
                  placeholder="e.g. AB3DEFG9"
                  className={`input-field uppercase ${errors.inviteCode ? 'border-red-500/50' : ''}`}
                  {...register('inviteCode', { required: 'Invite code is required' })}
                />
                {errors.inviteCode && <p className="text-xs text-red-400 mt-1">{errors.inviteCode.message}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                {mode === 'business' ? 'Your work email' : 'Email'}
              </label>
              <input
                type="email"
                placeholder={mode === 'business' ? 'you@yourcompany.com' : 'you@example.com'}
                className={`input-field ${errors.email ? 'border-red-500/50' : ''}`}
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              {mode === 'business' && (
                <p className="text-xs text-slate-600 mt-1">
                  Each teammate uses their own email and password to log in — your company's data stays shared regardless.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                className={`input-field ${errors.password ? 'border-red-500/50' : ''}`}
                {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
              />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Creating...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Have an account?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
