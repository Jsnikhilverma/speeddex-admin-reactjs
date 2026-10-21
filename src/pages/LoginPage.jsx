import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HardHat, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage = ({ onNavigateToForgot }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoFill = () => {
    setEmail('admin@speeddexconstruction.com');
    setPassword('Admin@Speeddex2026!');
    showToast('Super Admin demo credentials auto-filled', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return showToast('Please enter both email and password', 'warning');
    }

    try {
      setIsLoading(true);
      await login(email, password);
      showToast('Welcome to Speeddex Construction Admin Portal', 'success');
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden text-slate-900">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-8 z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-500 text-white shadow-xl shadow-blue-500/25 mb-4">
            <HardHat className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
            SPEEDDEX
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-0.5">
            Construction CRM + HRMS Portal
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Indore, Madhya Pradesh • Enterprise Admin Access
          </p>
        </div>

        {/* Demo Fast-fill banner */}
        <div className="mb-6 p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-700">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Pre-seed Super Admin account</span>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-sm"
          >
            Auto-fill
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@speeddexconstruction.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              {onNavigateToForgot && (
                <button
                  type="button"
                  onClick={onNavigateToForgot}
                  className="text-xs text-blue-600 hover:text-blue-500 font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In To Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured with JWT Dual-token Rotation & RBAC Matrix</span>
        </div>
      </div>
    </div>
  );
};
