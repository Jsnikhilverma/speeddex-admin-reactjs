import React from 'react';
import {
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Building2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AttendanceTable = ({
  records = [],
  pagination = {},
  isLoading = false,
  onPageChange,
  onCloseForgottenSession,
  canManage = false,
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Present</span>
          </span>
        );
      case 'HALF_DAY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Half Day</span>
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>On Leave</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{status || 'Absent'}</span>
          </span>
        );
    }
  };

  const formatMins = (mins = 0) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m}m`;
    return `${hrs}h ${m}m`;
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider font-mono">
              <th className="py-4 px-5">Date (IST)</th>
              <th className="py-4 px-5">Employee / Worker</th>
              <th className="py-4 px-5">First In / Last Out</th>
              <th className="py-4 px-5">Net Work Duration</th>
              <th className="py-4 px-5">Breaks Taken</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                  Loading attendance records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No attendance records found for this selection.
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                const emp = rec.employee || {};
                const name = emp.name ? `${emp.name.firstName || ''} ${emp.name.lastName || ''}`.trim() : 'Worker';
                const hasStaleSession = rec.sessions?.some(
                  (s) => s.status === 'ACTIVE' || s.status === 'ON_BREAK'
                );

                return (
                  <tr key={rec._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-4 px-5 whitespace-nowrap font-mono text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{rec.dateStr}</span>
                      </div>
                    </td>

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

                    {/* Punch Timings */}
                    <td className="py-4 px-5 whitespace-nowrap font-mono text-slate-300">
                      <div>
                        In:{' '}
                        <strong className="text-white">
                          {rec.firstCheckIn
                            ? new Date(rec.firstCheckIn).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--:--'}
                        </strong>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Out:{' '}
                        <strong className="text-slate-300">
                          {rec.lastCheckOut
                            ? new Date(rec.lastCheckOut).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : hasStaleSession
                            ? 'In Progress...'
                            : '--:--'}
                        </strong>
                      </div>
                    </td>

                    {/* Net Work Hours */}
                    <td className="py-4 px-5 whitespace-nowrap font-mono">
                      <span className="font-bold text-emerald-400 text-xs">
                        {formatMins(rec.totalWorkMinutes)}
                      </span>
                    </td>

                    {/* Breaks */}
                    <td className="py-4 px-5 whitespace-nowrap text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-blue-400" />
                        <span>{formatMins(rec.totalBreakMinutes)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {getStatusBadge(rec.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      {canManage && hasStaleSession && (
                        <button
                          onClick={() => {
                            const openSession = rec.sessions?.find(
                              (s) => s.status === 'ACTIVE' || s.status === 'ON_BREAK'
                            );
                            if (openSession) onCloseForgottenSession(openSession._id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Close Session</span>
                        </button>
                      )}
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
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
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
