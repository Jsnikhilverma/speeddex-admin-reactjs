import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';
import { RoleBadge, ActiveBadge } from '../components/common/StatusBadge';
import { formatISTDate, formatIndianPhone } from '../utils/formatters';
import {
  UserCheck,
  Lock,
  Key,
  Shield,
  Phone,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password requirements check
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[@$!%*?&#]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      return showToast('Please enter your current password', 'warning');
    }
    if (!isPasswordValid) {
      return showToast('New password does not meet all complexity requirements', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return showToast('New password and confirmation do not match', 'warning');
    }

    try {
      setIsSubmitting(true);
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      showToast(
        'Password changed successfully! Backend security requires you to re-authenticate with your new password.',
        'success',
        6000
      );

      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto logout to enforce re-login
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      showToast(err.message || 'Failed to change password. Verify current password.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>

        <h1 className="text-3xl font-black text-white tracking-tight font-['Outfit']">
          Profile
        </h1>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-3xl shadow-xl shadow-amber-500/20 mb-4 font-['Outfit']">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {user?.name}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{user?.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <RoleBadge role={user?.role} />
                <ActiveBadge isActive={user?.isActive} />
              </div>
            </div>

            <div className="pt-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Mobile Phone:
                </span>
                <span className="font-mono text-slate-800 font-semibold">
                  {formatIndianPhone(user?.phone)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Member Since:
                </span>
                <span className="font-mono text-slate-800">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })
                    : "-"}
                </span>
              </div>
              {/* 
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  Record ID:
                </span>
                <span className="font-mono text-slate-400 text-[10px] truncate max-w-[120px]">
                  {user?._id}
                </span>
              </div> */}
            </div>
          </div>

          {/* Granted Permissions Card */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-500" />
              Active Privileges
            </h4>
            {user?.role === 'SUPER_ADMIN' ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
                <span className="font-bold">Super Administrator:</span> You possess unrestricted master access across all Speeddex Construction endpoints and CRM functions.
              </div>
            ) : user?.customPermissions && user.customPermissions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {user.customPermissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-950 text-amber-400 border border-slate-800"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Operating with standard {user?.role} operational permissions.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Change Password Card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-800 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">
                  Change Login Password
                </h3>
                <p className="text-xs text-slate-400">
                  Rotate your current authentication secret to preserve system security
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength checklist */}
                <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>One uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>One lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>One number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>One special character (@$!%*?&#)</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !isPasswordValid || newPassword !== confirmPassword}
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isSubmitting ? 'Updating Password...' : 'Update Password & Re-login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
