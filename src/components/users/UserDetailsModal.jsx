import React from 'react';
import { Modal } from '../common/Modal';
import { RoleBadge, ActiveBadge } from '../common/StatusBadge';
import { formatISTDate, formatIndianPhone, formatTimeAgo } from '../../utils/formatters';
import { Mail, Phone, Calendar, Globe, Key, ShieldCheck, User } from 'lucide-react';

export const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Account Overview"
      subtitle={`Speeddex Construction Record ID: ${user._id}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 pt-2">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-amber-500/20 font-['Outfit']">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white leading-tight font-['Outfit']">
              {user.name}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <RoleBadge role={user.role} />
              <ActiveBadge isActive={user.isActive} />
            </div>
          </div>
        </div>

        {/* Contact & Identity Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">Email Address</span>
              <span className="text-white font-mono break-all font-semibold">
                {user.email}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">Indian Mobile Phone</span>
              <span className="text-white font-mono font-semibold">
                {formatIndianPhone(user.phone)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">Account Created (IST)</span>
              <span className="text-white font-mono">
                {formatISTDate(user.createdAt)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Globe className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">Last Authenticated IP</span>
              <span className="text-white font-mono">
                {user.lastLoginIp || 'No logins recorded yet'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">Last Login</span>
              <span className="text-white font-mono">
                {user.lastLoginAt ? `${formatTimeAgo(user.lastLoginAt)} (${formatISTDate(user.lastLoginAt)})` : 'Never'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-medium">Password Updated</span>
              <span className="text-white font-mono">
                {user.passwordChangedAt ? formatISTDate(user.passwordChangedAt) : 'Initial password'}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Permissions List */}
        <div>
          <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Granted Custom Permissions ({user.customPermissions?.length || 0})
          </h5>
          {user.customPermissions && user.customPermissions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-32 overflow-y-auto">
              {user.customPermissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20"
                >
                  {perm}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
              No custom permissions granted beyond base role permissions.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Overview
          </button>
        </div>
      </div>
    </Modal>
  );
};
