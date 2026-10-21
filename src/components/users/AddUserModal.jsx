import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { userApi } from '../../api/userApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS } from '../../utils/permissions';
import { Sparkles, Eye, EyeOff, ShieldAlert, Check } from 'lucide-react';

export const AddUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState(ROLES.SALES);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customPermissions, setCustomPermissions] = useState(() => ROLE_PERMISSIONS[ROLES.SALES] || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Speeddex@';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleTogglePermission = (permId) => {
    setCustomPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return showToast('Please enter full name', 'warning');
    if (!email.trim()) return showToast('Please enter email address', 'warning');
    if (!phone.trim()) return showToast('Please enter 10-digit Indian mobile number', 'warning');
    if (!password || password.length < 8) {
      return showToast('Password must be at least 8 characters with upper, lower, number, and symbol', 'warning');
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        password,
        customPermissions,
      };

      const res = await userApi.createUser(payload);
      showToast(`User ${name} created successfully!`, 'success');
      if (onUserCreated) onUserCreated(res.data.user);
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setRole(ROLES.SALES);
      setPassword('');
      setCustomPermissions([]);
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Team Member"
      subtitle="Register an employee account for Speeddex Construction"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@speeddexconstruction.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          {/* Mobile Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Indian Mobile (10 Digits) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-medium">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Assigned Role *
            </label>
            <select
              value={role}
              onChange={(e) => {
                const newRole = e.target.value;
                setRole(newRole);
                setCustomPermissions(ROLE_PERMISSIONS[newRole] || []);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 text-sm"
            >
              <option value={ROLES.SALES}>Sales & Site Inquiries</option>
              <option value={ROLES.HR}>Human Resources (HR)</option>
              <option value={ROLES.MANAGER}>Project / Site Manager</option>
              {isSuperAdmin && (
                <option value={ROLES.SUPER_ADMIN}>Super Administrator</option>
              )}
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Temporary Password *
            </label>
            <button
              type="button"
              onClick={generatePassword}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-generate
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars with uppercase, number & symbol"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Custom Permissions Grant */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Assigned Permissions ({customPermissions.length} selected)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCustomPermissions(ALL_PERMISSIONS.map((p) => p.id))}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setCustomPermissions(ROLE_PERMISSIONS[role] || [])}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Role Defaults
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setCustomPermissions([])}
                className="text-[11px] text-slate-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {ALL_PERMISSIONS.map((perm) => {
              const isChecked = customPermissions.includes(perm.id);
              return (
                <div
                  key={perm.id}
                  onClick={() => handleTogglePermission(perm.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                    isChecked
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-amber-500 border-amber-500 text-slate-950'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{perm.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {isSubmitting ? 'Registering...' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
