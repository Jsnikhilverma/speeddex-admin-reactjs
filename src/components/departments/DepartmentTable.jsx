import React from 'react';
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Users,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ArchiveRestore,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/permissions';

export const DepartmentTable = ({
  departments = [],
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  isLoading = false,
  filters = { search: '', isActive: undefined, includeArchived: false },
  onPageChange,
  onSearchChange,
  onFilterChange,
  onOpenCreateModal,
  onOpenEditModal,
  onArchiveDepartment,
  onRestoreDepartment,
  onDeleteDepartment,
  onRefresh,
}) => {
  const { hasRole, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || hasRole(ROLES.HR);

  // Department KPIs
  const totalCount = pagination.total || departments.length;
  const activeCount = departments.filter((d) => d.isActive && !d.isArchived).length;
  const archivedCount = departments.filter((d) => d.isArchived).length;
  const totalWorkforce = departments.reduce(
    (sum, d) => sum + (d.activeEmployeeCount || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Units</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-['Outfit']">{totalCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Organizational Divisions</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Divisions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-['Outfit']">{activeCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Accepting Staff Allocations</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Archived</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-300 mt-2 font-['Outfit']">{archivedCount}</p>
          <span className="text-[11px] text-slate-500 font-medium">Preserved Safely</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Assigned Workforce</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-400 mt-2 font-['Outfit']">{totalWorkforce}</p>
          <span className="text-[11px] text-slate-500 font-medium">Employees Mapped</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Action Button */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search departments by name, code or description..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => onFilterChange({ includeArchived: false, isActive: undefined })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                !filters.includeArchived && filters.isActive === undefined
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => onFilterChange({ includeArchived: true, isActive: undefined })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filters.includeArchived
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Include Archived
            </button>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh list"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all font-['Outfit'] tracking-wider shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Table / List View */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Department & Code</th>
                <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Description</th>
                <th className="py-3.5 px-4 font-semibold">Staff Assigned</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs font-semibold">Loading departments...</span>
                    </div>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No departments found</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Create departments to categorize your site teams and engineers
                    </p>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => {
                  const isArchived = dept.isArchived;

                  return (
                    <tr
                      key={dept._id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isArchived ? 'opacity-60 bg-slate-950/20' : ''
                      }`}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 font-['Outfit']">
                            {dept.code?.slice(0, 2) || dept.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block leading-tight font-['Outfit']">
                              {dept.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-400/90 tracking-wider">
                              {dept.code || 'NO-CODE'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 hidden md:table-cell max-w-xs">
                        <p className="text-slate-400 text-xs truncate">
                          {dept.description || 'No description provided'}
                        </p>
                      </td>

                      {/* Active Workforce */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Users className="w-3 h-3" />
                          <span>{dept.activeEmployeeCount || 0} active</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            Archived
                          </span>
                        ) : dept.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && (
                            <>
                              {!isArchived ? (
                                <>
                                  <button
                                    onClick={() => onOpenEditModal(dept)}
                                    title="Edit department"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => onArchiveDepartment(dept)}
                                    title="Archive department safely"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => onRestoreDepartment(dept)}
                                  title="Restore archived department"
                                  className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              {isSuperAdmin && (
                                <button
                                  onClick={() => onDeleteDepartment(dept)}
                                  title="Permanently delete (Only unreferenced)"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
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
              departments)
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
