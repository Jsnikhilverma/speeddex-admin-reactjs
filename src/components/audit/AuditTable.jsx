import React from 'react';
import { formatISTDate, formatTimeAgo } from '../../utils/formatters';
import { RoleBadge } from '../common/StatusBadge';
import {
  ShieldAlert,
  Search,
  Clock,
  Globe,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
  UserCheck,
  UserX,
} from 'lucide-react';

export const AuditTable = ({
  logs = [],
  pagination = {},
  isLoading = false,
  onPageChange,
  filters = {},
  onSearchChange,
  onActionFilterChange,
}) => {
  const getActionBadge = (action) => {
    let color = 'bg-slate-800 text-slate-300 border-slate-700';
    let Icon = Shield;

    if (action.includes('CREATED') || action.includes('BOOTSTRAP')) {
      color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      Icon = UserCheck;
    } else if (action.includes('ROLE')) {
      color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      Icon = Shield;
    } else if (action.includes('STATUS')) {
      color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      Icon = ShieldAlert;
    } else if (action.includes('PASSWORD')) {
      color = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      Icon = Key;
    } else if (action.includes('DELETED')) {
      color = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      Icon = UserX;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor email or details..."
            value={filters.search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={filters.action || 'ALL'}
          onChange={(e) => onActionFilterChange(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500 w-full sm:w-auto"
        >
          <option value="ALL">All Security Actions</option>
          <option value="USER_CREATED">USER_CREATED</option>
          <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
          <option value="USER_STATUS_UPDATED">USER_STATUS_UPDATED</option>
          <option value="USER_DELETED">USER_DELETED</option>
          <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
          <option value="PASSWORD_RESET_REQUESTED">PASSWORD_RESET_REQUESTED</option>
          <option value="PASSWORD_RESET_COMPLETED">PASSWORD_RESET_COMPLETED</option>
          <option value="SUPER_ADMIN_BOOTSTRAP">SUPER_ADMIN_BOOTSTRAP</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Details & Entity</th>
                <th className="py-3.5 px-6 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Fetching security audit trail...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-600" />
                      <span className="font-semibold text-slate-300">No audit logs recorded</span>
                      <p className="text-xs text-slate-500">
                        Actions such as creating users, changing roles, or updating passwords will be logged here with cryptographic attribution.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-6">
                      <div className="text-xs text-white font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatISTDate(log.createdAt)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white text-xs">{log.actorEmail}</div>
                      <div className="mt-0.5">
                        <RoleBadge role={log.actorRole} />
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-xs text-slate-300 leading-snug break-words">
                        {log.details || '—'}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {log.entityType && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {log.entityType}: {log.entityId}
                          </span>
                        )}
                        {log.requestId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            trace: {log.requestId}
                          </span>
                        )}
                      </div>
                      {log.changes && (log.changes.before || log.changes.after) && (
                        <div className="mt-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-slate-300 space-y-1">
                          {log.changes.before && (
                            <div className="text-rose-400/90 truncate">
                              <span className="font-bold text-rose-500">before: </span>
                              {JSON.stringify(log.changes.before)}
                            </div>
                          )}
                          {log.changes.after && (
                            <div className="text-emerald-400/90 truncate">
                              <span className="font-bold text-emerald-500">after: </span>
                              {JSON.stringify(log.changes.after)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-3.5 px-6 text-right">
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {log.ipAddress || 'Internal'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
            <span>
              Page <span className="font-bold text-white">{pagination.page}</span> of{' '}
              <span className="font-bold text-white">{pagination.totalPages}</span> (
              {pagination.total} audit events)
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
