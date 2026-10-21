import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { useToast } from '../context/ToastContext';
import { HardHat, Mail, ArrowLeft, ArrowRight, KeyRound, Copy, Check } from 'lucide-react';

export const ForgotPasswordPage = ({ onNavigateToLogin, onNavigateToReset }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return showToast('Please enter your email', 'warning');

    try {
      setIsLoading(true);
      const res = await authApi.forgotPassword(email);
      showToast(res.message, 'success');
      if (res.data?.resetToken) {
        setGeneratedToken(res.data.resetToken);
      }
    } catch (err) {
      showToast(err.message || 'Error sending reset request', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      showToast('Reset token copied to clipboard!', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden text-slate-900">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-8 z-10">
        <button
          onClick={onNavigateToLogin}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shadow-md mb-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
            Password Recovery
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered Speeddex email to receive reset instructions
          </p>
        </div>

        {generatedToken ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 text-xs">
              <span className="text-blue-700 font-bold block mb-1">
                Development Reset Token Generated:
              </span>
              <p className="font-mono text-slate-800 break-all bg-white p-2 rounded border border-slate-200 mb-2">
                {generatedToken}
              </p>
              <button
                onClick={handleCopy}
                className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Token'}</span>
              </button>
            </div>

            <button
              onClick={() => onNavigateToReset(generatedToken)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>Proceed to Reset Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Work Email
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Generating Request...' : 'Send Recovery Token'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
