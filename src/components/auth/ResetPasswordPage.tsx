import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';

interface FormData { newPassword: string; confirmPassword: string; }

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const newPassword = watch('newPassword');

  const onSubmit = async (data: FormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, token, newPassword: data.newPassword });
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch { /* handled by interceptor */ } finally { setLoading(false); }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm glass rounded-2xl p-7 text-center">
          <p className="text-white font-semibold mb-2">Invalid reset link</p>
          <p className="text-sm text-slate-500 mb-5">This link is missing required information. Please request a new one.</p>
          <Link to="/forgot-password" className="btn-primary inline-block px-5 py-2">Request new link</Link>
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
          <h1 className="text-lg font-bold text-white mb-1">Set a new password</h1>
          <p className="text-sm text-slate-500 mb-6">For {email}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">New password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                className={`input-field ${errors.newPassword ? 'border-red-500/50' : ''}`}
                {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
              />
              {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm new password</label>
              <input
                type="password"
                placeholder="Re-enter password"
                className={`input-field ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
                {...register('confirmPassword', {
                  required: 'Required',
                  validate: (v) => v === newPassword || "Passwords don't match",
                })}
              />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : 'Reset password'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
