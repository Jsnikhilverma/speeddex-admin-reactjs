import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const LeaveTable = ({
  leaves = [],
  pagination = {},
  isLoading = false,
  onPageChange,
  onOpenTimeline,
  onOpenDecision,
  onOpenOverride,
  onWithdraw,
  currentUserId,
  userRole,
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Stage 1: Pending Manager</span>
          </span>
        );
      case 'PENDING_HR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Stage 2: Pending HR</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Approved</span>
          </span>
        );
      case 'REJECTED_BY_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Rejected by Manager</span>
          </span>
        );
      case 'REJECTED_BY_HR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>Rejected by HR</span>
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Withdrawn</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider font-mono">
              <th className="py-4 px-5">Employee / Worker</th>
              <th className="py-4 px-5">Leave Type</th>
              <th className="py-4 px-5">Duration & Dates</th>
              <th className="py-4 px-5">Reason</th>
              <th className="py-4 px-5">Approval Stage</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                  Loading leave applications...
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No leave applications found for this queue.
                </td>
              </tr>
            ) : (
              leaves.map((l) => {
                const emp = l.employee || {};
                const name = emp.name ? `${emp.name.firstName || ''} ${emp.name.lastName || ''}`.trim() : 'Worker';
                const isPendingManager = l.status === 'PENDING_MANAGER';
                const isPendingHR = l.status === 'PENDING_HR';
                const isPending = isPendingManager || isPendingHR;
                const isOwner = emp.user?.toString() === currentUserId || emp._id?.toString() === currentUserId;
                const isSuperAdmin = userRole === 'SUPER_ADMIN';
                const isManager = userRole === 'MANAGER';
                const isHR = userRole === 'HR';

                return (
                  <tr key={l._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Employee */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {name[0] || 'E'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{emp.employeeId || 'ID-PENDING'}</span>
                            {emp.department && (
                              <span className="text-amber-400">• {emp.department.name || emp.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80">
                        {l.leaveType}
                      </span>
                    </td>

                    {/* Duration & Dates */}
                    <td className="py-4 px-5 whitespace-nowrap font-mono">
                      <div className="text-white font-bold">
                        {l.totalDays} Day(s) <span className="text-slate-400 text-[11px] font-normal">({l.durationType})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {l.startDateStr} ➔ {l.endDateStr}
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-slate-300 truncate" title={l.reason}>
                        {l.reason}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {getStatusBadge(l.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Timeline / History */}
                        <button
                          onClick={() => onOpenTimeline(l)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View Decision Timeline & Audit"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Stage 1: Manager Review Button */}
                        {isPendingManager && (isManager || isSuperAdmin) && (
                          <button
                            onClick={() => onOpenDecision(l, 'MANAGER')}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Stage 1 Review</span>
                          </button>
                        )}

                        {/* Stage 2: HR Review Button */}
                        {isPendingHR && (isHR || isSuperAdmin) && (
                          <button
                            onClick={() => onOpenDecision(l, 'HR')}
                            className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-[11px] font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Stage 2 Approval</span>
                          </button>
                        )}

                        {/* Withdraw (for applicant on pending requests) */}
                        {isPending && onWithdraw && (
                          <button
                            onClick={() => onWithdraw(l)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all"
                            title="Withdraw your pending request"
                          >
                            Withdraw
                          </button>
                        )}

                        {/* Super Admin Override */}
                        {isSuperAdmin && onOpenOverride && (
                          <button
                            onClick={() => onOpenOverride(l)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Super Admin Override"
                          >
                            <ShieldAlert className="w-4 h-4" />
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} applications)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
