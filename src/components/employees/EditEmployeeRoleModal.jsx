
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  ROLES,
  ROLE_LABELS,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '../../utils/permissions';
import {
  Shield,
  ShieldAlert,
  Check,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  Search,
  CheckCheck,
  RotateCcw,
  Power,
  Info,
  X,
  AlertCircle,
  Fingerprint,
  Settings2,
} from 'lucide-react';

// Security and System categories will not be displayed in Custom Permissions.
const HIDDEN_PERMISSION_CATEGORIES = new Set(['security', 'system']);

const VISIBLE_PERMISSIONS = ALL_PERMISSIONS.filter((permission) => {
  const category = String(permission.category || 'Other')
    .trim()
    .toLowerCase();

  return !HIDDEN_PERMISSION_CATEGORIES.has(category);
});

const VISIBLE_PERMISSION_IDS = VISIBLE_PERMISSIONS.map(
  (permission) => permission.id
);

const getVisiblePermissions = (permissions = []) =>
  permissions.filter((permissionId) =>
    VISIBLE_PERMISSION_IDS.includes(permissionId)
  );

export const EditEmployeeRoleModal = ({
  isOpen,
  onClose,
  employee,
  onRoleUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState(ROLES.SALES);
  const [customPermissions, setCustomPermissions] = useState([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [error, setError] = useState('');

  const linkedUser = employee?.user || null;

  const isSelf =
    Boolean(linkedUser?._id) &&
    Boolean(currentUser?._id) &&
    String(linkedUser._id) === String(currentUser._id);

  const employeeName =
    employee?.fullName ||
    [employee?.name?.firstName, employee?.name?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Employee';

  const employeeEmail =
    linkedUser?.email ||
    employee?.contactDetails?.email ||
    'No email available';

  // Initialize the assigned role and account settings.
  useEffect(() => {
    if (!isOpen || !employee) return;

    const user = employee.user || {};
    const assignedRole = user.role || ROLES.SALES;
    const savedPermissions = user.customPermissions;

    setRole(assignedRole);

    // Preserve existing permissions, including hidden category IDs,
    // so hiding categories does not silently remove existing grants.
    setCustomPermissions(
      Array.isArray(savedPermissions) && savedPermissions.length > 0
        ? [...new Set(savedPermissions)]
        : [...(ROLE_PERMISSIONS[assignedRole] || [])]
    );

    setIsActive(
      user.isActive !== undefined ? user.isActive : true
    );

    setPassword('');
    setShowPassword(false);
    setPermissionSearch('');
    setError('');
  }, [
    isOpen,
    employee?._id,
    employee?.user?.role,
    employee?.user?.isActive,
  ]);

  // Only visible permissions are included in search and category groups.
  const permissionCategories = useMemo(() => {
    const categories = {};

    VISIBLE_PERMISSIONS.forEach((permission) => {
      const category = permission.category || 'Other';

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push(permission);
    });

    return Object.entries(categories)
      .map(([category, permissions]) => {
        const search = permissionSearch.trim().toLowerCase();

        return {
          category,
          permissions: permissions.filter((permission) => {
            if (!search) return true;

            return (
              permission.name?.toLowerCase().includes(search) ||
              permission.id?.toLowerCase().includes(search) ||
              category.toLowerCase().includes(search)
            );
          }),
        };
      })
      .filter((group) => group.permissions.length > 0);
  }, [permissionSearch]);

  if (!employee || !isOpen) return null;

  const selectedRolePermissions = ROLE_PERMISSIONS[role] || [];

  const selectedPermissionCount = VISIBLE_PERMISSIONS.filter(
    (permission) => customPermissions.includes(permission.id)
  ).length;

  const totalPermissionCount = VISIBLE_PERMISSIONS.length;

  const handleTogglePermission = (permissionId) => {
    setCustomPermissions((previous) =>
      previous.includes(permissionId)
        ? previous.filter((id) => id !== permissionId)
        : [...previous, permissionId]
    );
  };

  // Select all visible permissions without deleting hidden-category grants.
  const handleSelectAll = () => {
    setCustomPermissions((previous) => [
      ...new Set([
        ...previous,
        ...VISIBLE_PERMISSION_IDS,
      ]),
    ]);
  };

  const handleClearAll = () => {
    setCustomPermissions([]);
  };

  // Reset visible permissions to the assigned role's defaults.
  // Existing hidden-category grants are preserved.
  const handleResetDefaults = () => {
    setCustomPermissions((previous) => {
      const hiddenPermissionIds = previous.filter(
        (permissionId) => !VISIBLE_PERMISSION_IDS.includes(permissionId)
      );

      const defaultVisiblePermissions = getVisiblePermissions(
        selectedRolePermissions
      );

      return [
        ...new Set([
          ...hiddenPermissionIds,
          ...defaultVisiblePermissions,
        ]),
      ];
    });
  };

  const generateRandomPassword = () => {
    const characters =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';

    let generatedPassword = 'Spd@';

    if (
      typeof window !== 'undefined' &&
      window.crypto &&
      typeof window.crypto.getRandomValues === 'function'
    ) {
      const randomValues = new Uint32Array(12);
      window.crypto.getRandomValues(randomValues);

      for (let index = 0; index < 12; index += 1) {
        generatedPassword +=
          characters[randomValues[index] % characters.length];
      }
    } else {
      for (let index = 0; index < 12; index += 1) {
        generatedPassword += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
    }

    setPassword(generatedPassword);
    setShowPassword(true);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    // Role selection is intentionally read-only in this modal.
    if (isSelf && role !== linkedUser?.role) {
      showToast(
        'Security rule: You cannot modify your own role.',
        'error'
      );
      return;
    }

    if (password.trim() && password.trim().length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        role,
        customPermissions,
        isActive,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await employeeApi.managePortalAccess(
        employee._id,
        payload
      );

      showToast(
        `Role and permissions updated for ${employeeName}.`,
        'success'
      );

      if (typeof onClose === 'function') {
        onClose();
      }

      if (typeof onRoleUpdated === 'function') {
        onRoleUpdated(response?.data?.employee);
      }
    } catch (err) {
      const message =
        err?.message ||
        'Failed to update employee role and permissions.';

      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

  const selectedRoleMeta = ROLE_LABELS[role] || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => { } : onClose}
      title="Role & Access Management"
      subtitle={`${employeeName} • ${employee.employeeId || 'Employee'}`}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Employee portal account */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-bold text-gray-900">
                    {employeeName}
                  </h3>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${linkedUser
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                  >
                    {linkedUser ? 'Portal linked' : 'Not linked'}
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-gray-600">
                  {employeeEmail}
                </p>

                <p className="mt-1 text-[10px] text-gray-500">
                  ID: {employee.employeeId || employee._id}
                </p>
              </div>
            </div>

            <label
              className={`flex shrink-0 items-center gap-3 rounded-xl border p-3 transition-colors ${isActive
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-rose-200 bg-rose-50'
                } ${isSubmitting
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer'
                }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
                  }`}
              >
                <Power className="h-4 w-4" />
              </span>

              <span>
                <span className="block text-xs font-bold text-gray-900">
                  {isActive ? 'Account Active' : 'Account Disabled'}
                </span>
                <span className="mt-0.5 block text-[10px] text-gray-600">
                  Portal access status
                </span>
              </span>

              <input
                type="checkbox"
                checked={isActive}
                disabled={isSubmitting}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 bg-white text-amber-600 focus:ring-amber-500"
              />
            </label>
          </div>

          {!linkedUser && (
            <div className="flex items-start gap-2.5 border-t border-gray-200 bg-amber-50 px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-[11px] leading-5 text-gray-700">
                This employee has no linked portal user. Saving will attempt
                to provision portal access through your existing backend
                endpoint.
              </p>
            </div>
          )}
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

            <p className="min-w-0 flex-1 break-words text-xs leading-5 text-rose-800">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError('')}
              className="rounded-md p-1 text-rose-600 transition-colors hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Security information */}


        {/* Assigned role: show only the employee's existing role */}
        <section>
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Fingerprint className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Base Role Assignment
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Currently assigned role for this employee.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
              <Shield className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Assigned role
              </p>
              <p className="mt-1 break-words text-sm font-extrabold text-gray-900">
                {selectedRoleMeta.title || role}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-gray-600">
                {role}
              </p>
            </div>

            <span className="shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-700">
              {selectedRolePermissions.length} default permissions
            </span>
          </div>
        </section>

        {/* Password management */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <Key className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {linkedUser
                    ? 'Reset Login Password'
                    : 'Initial Portal Password'}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {linkedUser
                    ? 'Optional · Leave blank to keep the existing password.'
                    : 'Set a password if required by your account setup flow.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={generateRandomPassword}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Generate password
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder={
                linkedUser
                  ? 'Leave blank to retain existing password'
                  : 'Enter initial password (minimum 8 characters)'
              }
              minLength={password ? 8 : undefined}
              disabled={isSubmitting}
              className={`${inputClass} pr-11`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              disabled={isSubmitting}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {password && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
              <p className="text-[11px] leading-5 text-gray-700">
                A new password will be sent in the API request when you save.
                Share credentials securely and avoid storing them in notes or
                screenshots.
              </p>
            </div>
          )}
        </section>

        {/* Custom permissions: Security and System are excluded */}
        <section>
          <div className="mb-3 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Settings2 className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Custom Permissions
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Configure available module and action-level access.
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                <CheckCheck className="h-3.5 w-3.5" />
                {selectedPermissionCount} / {totalPermissionCount} selected
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{
                  width: `${totalPermissionCount > 0
                    ? Math.min(
                      100,
                      (selectedPermissionCount / totalPermissionCount) *
                      100
                    )
                    : 0
                    }%`,
                }}
              />
            </div>
          </div>

          {/* Permission search */}
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              value={permissionSearch}
              onChange={(event) => setPermissionSearch(event.target.value)}
              placeholder="Search permissions or categories..."
              disabled={isSubmitting}
              className={`${inputClass} pl-10`}
            />

            {permissionSearch && (
              <button
                type="button"
                onClick={() => setPermissionSearch('')}
                aria-label="Clear permission search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Permission controls */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-[10px] font-bold text-gray-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
            >
              Select all
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[10px] font-bold text-sky-800 transition-colors hover:bg-sky-100 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              Reset role defaults
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={isSubmitting}
              className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-[10px] font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-[340px] space-y-4 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/70 p-3 sm:p-4">
            {permissionCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="h-6 w-6 text-gray-400" />

                <p className="mt-3 text-sm font-semibold text-gray-800">
                  No permissions found
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Try another search term.
                </p>

                <button
                  type="button"
                  onClick={() => setPermissionSearch('')}
                  className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  Clear search
                </button>
              </div>
            ) : (
              permissionCategories.map(({ category, permissions }) => {
                const selectedInCategory = permissions.filter((permission) =>
                  customPermissions.includes(permission.id)
                ).length;

                return (
                  <div key={category}>
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <h4 className="flex min-w-0 items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-gray-600">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span className="truncate">{category}</span>
                      </h4>

                      <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
                        {selectedInCategory}/{permissions.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {permissions.map((permission) => {
                        const checked = customPermissions.includes(
                          permission.id
                        );

                        return (
                          <label
                            key={permission.id}
                            className={`flex min-w-0 items-start gap-2.5 rounded-xl border p-3 transition-colors ${checked
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                              } ${isSubmitting
                                ? 'cursor-not-allowed opacity-60'
                                : 'cursor-pointer'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isSubmitting}
                              onChange={() =>
                                handleTogglePermission(permission.id)
                              }
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 bg-white text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
                            />

                            <span className="min-w-0 flex-1">
                              <span
                                className={`block break-words text-xs font-semibold ${checked
                                  ? 'text-amber-900'
                                  : 'text-gray-800'
                                  }`}
                              >
                                {permission.name || permission.id}
                              </span>

                              <span className="mt-1 block break-all font-mono text-[9px] leading-4 text-gray-500">
                                {permission.id}
                              </span>
                            </span>

                            {checked && (
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Security and System categories are hidden from this screen.
            Backend authorization must independently validate all permissions.
          </p>
        </section>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" />
            <span>Portal access configuration</span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  Save role & permissions
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
