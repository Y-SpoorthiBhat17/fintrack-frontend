import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../../services/api';

interface FormData { email: string; }

const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(data);
      setSent(true);
      // No email service is configured yet, so the reset link is returned
      // directly here so the flow works end-to-end today. Once a real
      // email provider is wired up server-side, this link can be removed
      // and the user will just check their inbox instead.
      setResetUrl(res.data.data?.resetUrl ?? null);
    } catch { /* handled by interceptor */ } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-900 font-bold text-base">F</div>
          <span className="text-white font-semibold text-xl tracking-tight">FinTrack Pro</span>
        </div>

        <div className="glass rounded-2xl p-7">
          <h1 className="text-lg font-bold text-white mb-1">Reset your password</h1>
          <p className="text-sm text-slate-500 mb-6">Enter your account email and we'll generate a reset link.</p>

          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`input-field ${errors.email ? 'border-red-500/50' : ''}`}
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm text-emerald-400">
                  ✓ If an account with that email exists, a reset link has been generated.
                </p>
              </div>

              {resetUrl && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-xs text-yellow-400 font-medium">
                    📧 No email service is configured yet — here's your reset link directly:
                  </p>
                  <Link to={resetUrl.replace(window.location.origin, '')} className="block text-xs text-emerald-400 hover:text-emerald-300 break-all underline">
                    {resetUrl}
                  </Link>
                  <p className="text-xs text-slate-500">This link expires in 1 hour.</p>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-5">
            Remembered it?{' '}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
