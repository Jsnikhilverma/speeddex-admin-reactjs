import React from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  MoreVertical,
  Archive,
  ArrowRightLeft,
  RefreshCcw,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  RotateCcw,
  TrendingUp,
  Shield,
  Key,
  Receipt,
  CreditCard,
  Award,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/permissions';

export const EmployeeTable = ({
  employees = [],
  departments = [],
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  isLoading = false,
  filters = { search: '', department: '', status: 'ALL', includeArchived: false },
  onPageChange,
  onSearchChange,
  onDepartmentFilterChange,
  onStatusFilterChange,
  onIncludeArchivedChange,
  onOpenCreateModal,
  onOpenEditRoleModal,
  onOpenDetailsModal,
  onOpenSalaryModal,
  onOpenSalarySlipModal,
  onOpenBankModal,
  onOpenStatusModal,
  onOpenTransferModal,
  onArchiveEmployee,
  onRestoreEmployee,
  onDeleteEmployee,
  onRefresh,
}) => {
  const { hasRole, isSuperAdmin, hasPermission, hasAnyPermission } = useAuth();
  const canManageHR = isSuperAdmin || hasPermission('EMPLOYEES_MANAGE') || hasRole(ROLES.HR, ROLES.MANAGER);
  const canManageRolesAndEmployees = isSuperAdmin || hasAnyPermission('EMPLOYEES_MANAGE', 'USERS_MANAGE_ROLES') || hasRole(ROLES.HR, ROLES.MANAGER);

  // Workforce KPIs
  const totalCount = pagination.total || employees.length;
  const confirmedCount = employees.filter((e) => e.employmentStatus === 'CONFIRMED').length;
  const probationCount = employees.filter((e) => e.employmentStatus === 'PROBATION').length;
  const unassignedDeptCount = employees.filter((e) => !e.department).length;

  return (
    <div className="space-y-6">
      {/* Workforce KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Workforce</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-['Outfit']">{totalCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Speeddex Staff Records</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Confirmed Staff</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-['Outfit']">{confirmedCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Permanent Team Members</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Under Probation</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-400 mt-2 font-['Outfit']">{probationCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Evaluations Pending</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Without Department</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2 font-['Outfit']">{unassignedDeptCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Optional Department Support</span>
        </div>
      </div>

      {/* Control Bar: Search & Filtering */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, EMP ID, designation, email, phone..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">All Departments</option>
            <option value="NONE">Unassigned (No Department)</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROBATION">Probation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="RESIGNED">Resigned</option>
          </select>

          <button
            onClick={onRefresh}
            title="Refresh employees"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {canManageHR && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all font-['Outfit'] tracking-wider shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Designation & Division</th>
                <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Contact</th>
                <th className="py-3.5 px-4 font-semibold">Portal Role & Access</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs font-semibold">Loading workforce records...</span>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No employees found</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Onboard workforce members with optional department assignments
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isArchived = emp.isArchived;

                  return (
                    <tr
                      key={emp._id}
                      className={`hover:bg-slate-800/40 transition-colors ${isArchived ? 'opacity-60 bg-slate-950/20' : ''
                        }`}
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 font-['Outfit']">
                            {emp.name?.firstName?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block leading-tight font-['Outfit']">
                              {emp.fullName || `${emp.name?.firstName} ${emp.name?.lastName}`}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-400/90 tracking-wider">
                              {emp.employeeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Department */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200 block text-xs">
                          {emp.designation}
                        </span>
                        {emp.department ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{emp.department.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-mono italic mt-0.5">
                            No Department
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="text-slate-300 block text-xs truncate">
                          {emp.contactDetails?.email}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 block">
                          {emp.contactDetails?.phone}
                        </span>
                      </td>

                      {/* Portal Role & Login Badge */}
                      <td className="py-3.5 px-4">
                        {emp.user ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                ROLE_LABELS[emp.user.role]?.color ||
                                'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ROLE_LABELS[emp.user.role]?.dot || 'bg-slate-400'
                                }`}
                              />
                              {emp.user.role}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {emp.user.isActive ? (
                                <span className="text-emerald-400 font-medium">Login Active</span>
                              ) : (
                                <span className="text-rose-400 font-medium">Suspended</span>
                              )}
                              {emp.user.customPermissions?.length > 0 && (
                                <span className="text-slate-500 font-mono ml-1">
                                  (+{emp.user.customPermissions.length} perms)
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-500 bg-slate-950/60 border border-slate-800">
                            No Portal Login
                          </span>
                        )}
                      </td>

                      {/* Employment Status Badge */}
                      <td className="py-3.5 px-4">
                        {isArchived ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            Archived
                          </span>
                        ) : emp.employmentStatus === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {emp.employmentStatus}
                          </span>
                        )}
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile & Full Tabs */}
                          <button
                            onClick={() => onOpenDetailsModal(emp, 'overview')}
                            title="View details, overview & documents"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Role & Permissions (Super Admin, HR, Manager) */}
                          {canManageRolesAndEmployees && !isArchived && (
                            <button
                              onClick={() => onOpenEditRoleModal && onOpenEditRoleModal(emp)}
                              title="Edit Role & Permissions"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}

                          {/* Salary Structure & Increment Versioning */}
                          {canManageHR && !isArchived && (
                            <button
                              onClick={() =>
                                onOpenSalaryModal
                                  ? onOpenSalaryModal(emp)
                                  : onOpenDetailsModal(emp, 'salary')
                              }
                              title="Salary compensation, initial setup & increments"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                          )}

                          {/* Generate & Print Salary Slip */}
                          {canManageHR && (
                            <button
                              onClick={() => onOpenSalarySlipModal && onOpenSalarySlipModal(emp)}
                              title="Generate & Print Salary Slip (Select any month)"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          {/* Bank & Statutory Details */}
                          {canManageHR && !isArchived && (
                            <button
                              onClick={() => onOpenBankModal && onOpenBankModal(emp)}
                              title="Add / Update Bank & Statutory Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {canManageHR && !isArchived && (
                            <>
                              {/* Change Status */}
                              <button
                                onClick={() => onOpenStatusModal(emp)}
                                title="Change status"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>

                              {/* Promote */}
                              <button
                                onClick={() => onOpenDetailsModal(emp, 'promotions')}
                                title="Promote employee & career history"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                              >
                                <Award className="w-4 h-4" />
                              </button>

                              {/* Official HR Documents & Letters */}
                              <button
                                onClick={() => onOpenDetailsModal(emp, 'documents')}
                                title="Generate official HR letters & documents"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              {/* Transfer */}
                              <button
                                onClick={() => onOpenTransferModal(emp)}
                                title="Transfer department / designation"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              {/* Archive */}
                              <button
                                onClick={() => onArchiveEmployee(emp)}
                                title="Archive employee safely"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {canManageHR && isArchived && (
                            <button
                              onClick={() => onRestoreEmployee(emp)}
                              title="Restore archived employee"
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button
                              onClick={() => onDeleteEmployee(emp)}
                              title="Delete employee (Blocked if referenced by payroll/attendance/audit)"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <span>
              Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong> (Total {pagination.total}{' '}
              workforce)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors font-semibold"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 transition-colors font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
