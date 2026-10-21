import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi';
import { RoleBadge, ActiveBadge } from '../common/StatusBadge';
import { formatIndianPhone, formatTimeAgo, formatISTDate } from '../../utils/formatters';
import { ROLES } from '../../utils/permissions';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  Eye,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  UserX,
  Phone,
  Mail,
} from 'lucide-react';

export const UserTable = ({
  users = [],
  pagination = {},
  isLoading = false,
  onPageChange,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  filters = {},
  onOpenAddModal,
  onOpenEditRoleModal,
  onOpenDetailsModal,
  onRefresh,
}) => {
  const { user: currentUser, isSuperAdmin, hasRole, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const canManageRoles = isSuperAdmin || hasPermission('USERS_MANAGE_ROLES') || hasRole(ROLES.SUPER_ADMIN, ROLES.HR, ROLES.MANAGER);
  const canManageStatus = isSuperAdmin || hasPermission('USERS_MANAGE_STATUS') || hasRole(ROLES.SUPER_ADMIN, ROLES.HR, ROLES.MANAGER);
  const canDeleteUsers = isSuperAdmin || hasPermission('USERS_DELETE');

  const handleToggleStatus = async (targetUser) => {
    if (targetUser._id === currentUser?._id) {
      return showToast('Security violation: You cannot deactivate your own account', 'error');
    }

    try {
      setActionLoadingId(targetUser._id);
      const newStatus = !targetUser.isActive;
      await authApi.updateUserStatus(targetUser._id, { isActive: newStatus });
      showToast(
        `User ${targetUser.name} has been ${newStatus ? 'activated' : 'deactivated'}`,
        'success'
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser._id === currentUser?._id) {
      return showToast('You cannot delete your own account', 'error');
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${targetUser.name} (${targetUser.email}) from Speeddex Construction? This soft-deletes the record and revokes all login sessions.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(targetUser._id);
      await userApi.deleteUser(targetUser._id);
      showToast(`User ${targetUser.name} removed successfully`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, email or phone..."
            value={filters.search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={filters.role || 'ALL'}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Roles</option>
            <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
            <option value={ROLES.MANAGER}>Manager</option>
            <option value={ROLES.HR}>HR</option>
            <option value={ROLES.SALES}>Sales</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Add User Button */}
          {hasRole(ROLES.SUPER_ADMIN, ROLES.HR) && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">Team Member</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading employee database...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="w-8 h-8 text-slate-600" />
                      <span className="font-semibold text-slate-300">No users found</span>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Try clearing your filters or create a new team member using the "Add Member" button.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrent = item._id === currentUser?._id;
                  const isBusy = actionLoadingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/60 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow font-['Outfit']">
                            {item.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono block">
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatIndianPhone(item.phone)}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <RoleBadge role={item.role} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <ActiveBadge isActive={item.isActive} />
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs text-slate-400 font-mono">
                        {item.lastLoginAt ? (
                          <span title={formatISTDate(item.lastLoginAt)}>
                            {formatTimeAgo(item.lastLoginAt)}
                          </span>
                        ) : (
                          <span className="text-slate-600">Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => onOpenDetailsModal(item)}
                            title="View Profile Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Role (Super Admin only, not self) */}
                          {canManageRoles && (
                            <button
                              disabled={isCurrent}
                              onClick={() => onOpenEditRoleModal(item)}
                              title={isCurrent ? 'Cannot alter own role' : 'Edit Role & Permissions'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle Active Status */}
                          {canManageStatus && (
                            <button
                              disabled={isCurrent || isBusy}
                              onClick={() => handleToggleStatus(item)}
                              title={
                                isCurrent
                                  ? 'Cannot deactivate own account'
                                  : item.isActive
                                  ? 'Deactivate Account'
                                  : 'Activate Account'
                              }
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                                item.isActive
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Super Admin only, not self) */}
                          {canDeleteUsers && !isCurrent && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleDeleteUser(item)}
                              title="Delete Member"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <span>
              Showing Page <span className="font-bold text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-white">{pagination.totalPages}</span> (
              {pagination.total} employees total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
