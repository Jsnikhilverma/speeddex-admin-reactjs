import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { authApi } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS } from '../../utils/permissions';
import { Shield, ShieldAlert, Check } from 'lucide-react';

export const EditRoleModal = ({ isOpen, onClose, user, onRoleUpdated }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState(ROLES.SALES);
  const [customPermissions, setCustomPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const assignedRole = user.role || ROLES.SALES;
      setRole(assignedRole);
      if (Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
        setCustomPermissions(user.customPermissions);
      } else {
        setCustomPermissions(ROLE_PERMISSIONS[assignedRole] || []);
      }
    }
  }, [user]);

  if (!user) return null;

  const isSelf = user._id === currentUser?._id;

  const handleTogglePermission = (permId) => {
    setCustomPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setCustomPermissions(ALL_PERMISSIONS.map((p) => p.id));
  };

  const handleClearAll = () => {
    setCustomPermissions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSelf) {
      return showToast('Security rule: You cannot modify your own role', 'error');
    }

    try {
      setIsSubmitting(true);
      const res = await authApi.updateUserRole(user._id, {
        role,
        customPermissions,
      });

      showToast(`Role & permissions updated for ${user.name}`, 'success');
      if (onRoleUpdated) onRoleUpdated(res.data.user);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by category
  const categories = {};
  ALL_PERMISSIONS.forEach((p) => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Role & Permissions"
      subtitle={`Manage organizational access for ${user.name} (${user.email})`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Security Alert */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Security Enforcement:</span> Modifying this user's
            role or permissions will immediately revoke all their active JWT refresh
            tokens. They will be required to log in again with new claims.
          </div>
        </div>

        {/* Role Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Base Role Assignment
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(ROLES).map((r) => {
              const isSelected = role === r;
              return (
                <button
                  type="button"
                  key={r}
                  disabled={isSelf}
                  onClick={() => {
                    setRole(r);
                    setCustomPermissions(ROLE_PERMISSIONS[r] || []);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  } ${isSelf ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xs font-mono block">{r}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Permissions Matrix */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Granular Custom Permissions ({customPermissions.length} active)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
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
                Reset Role Defaults
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            {Object.entries(categories).map(([category, perms]) => (
              <div key={category}>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  {category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map((p) => {
                    const isChecked = customPermissions.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleTogglePermission(p.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border text-xs ${
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
                        <span className="font-medium truncate">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isSelf}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Role & Permissions'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
