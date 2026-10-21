
import React, { useEffect } from 'react';
import {
  Clock,
  X,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  AlertCircle,
  Calendar,
  ShieldAlert,
  History,
  ArrowRight,
  LoaderCircle,
  FileText,
} from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnly = (value) => {
  if (!value) return '—';

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  if (typeof employee.name === 'string' && employee.name.trim()) {
    return employee.name.trim();
  }

  if (employee.name && typeof employee.name === 'object') {
    const name = [
      employee.name.firstName,
      employee.name.middleName,
      employee.name.lastName,
    ]
      .filter((part) => typeof part === 'string' && part.trim())
      .map((part) => part.trim())
      .join(' ');

    if (name) return name;
  }

  return employee.fullName || employee.firstName || 'Employee';
};

const getStatusConfig = (status) => {
  const configs = {
    PENDING_MANAGER: {
      label: 'Pending Manager',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    PENDING_HR: {
      label: 'Pending HR',
      className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    },
    APPROVED: {
      label: 'Approved',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
    REJECTED_BY_MANAGER: {
      label: 'Rejected by Manager',
      className: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    },
    REJECTED_BY_HR: {
      label: 'Rejected by HR',
      className: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    },
    WITHDRAWN: {
      label: 'Withdrawn',
      className: 'border-slate-700 bg-slate-800 text-slate-300',
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'border-slate-700 bg-slate-800 text-slate-300',
    },
  };

  return (
    configs[status] || {
      label: String(status || 'Unknown').replace(/_/g, ' '),
      className: 'border-slate-700 bg-slate-800 text-slate-300',
    }
  );
};

const getEventConfig = (step) => {
  const action = String(step?.action || '').toUpperCase();
  const stage = String(step?.stage || '').toUpperCase();

  const isOverride =
    stage.includes('SUPER_ADMIN') ||
    stage.includes('OVERRIDE') ||
    action.includes('OVERRIDE');

  const isRejected =
    action.includes('REJECT') ||
    String(step?.toStatus || '').includes('REJECT');

  const isApproved =
    action.includes('APPROVE') ||
    String(step?.toStatus || '') === 'APPROVED';

  if (isOverride) {
    return {
      label: 'Administrative Override',
      color: 'text-amber-400',
      dot: 'bg-amber-400',
      icon: ShieldAlert,
      border: 'border-amber-500/25',
    };
  }

  if (isRejected) {
    return {
      label: 'Rejection',
      color: 'text-rose-400',
      dot: 'bg-rose-500',
      icon: XCircle,
      border: 'border-rose-500/25',
    };
  }

  if (isApproved) {
    return {
      label: 'Approval',
      color: 'text-emerald-400',
      dot: 'bg-emerald-400',
      icon: CheckCircle2,
      border: 'border-emerald-500/25',
    };
  }

  return {
    label: 'Application Update',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    icon: History,
    border: 'border-slate-800',
  };
};

const getActorName = (step) => {
  if (typeof step?.performedBy === 'string') {
    return step.performedBy;
  }

  const actor =
    step?.performedBy ||
    step?.actor ||
    step?.user ||
    step?.decidedBy;

  if (typeof actor === 'string') return actor;

  if (actor && typeof actor === 'object') {
    if (typeof actor.name === 'string') return actor.name;

    if (actor.name && typeof actor.name === 'object') {
      const fullName = [
        actor.name.firstName,
        actor.name.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (fullName) return fullName;
    }

    return (
      actor.fullName ||
      actor.email ||
      actor.employeeId ||
      ''
    );
  }

  return '';
};

export const LeaveTimelineModal = ({
  isOpen,
  onClose,
  leave,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !leave) return null;

  const employee = leave.employee || {};
  const employeeName = getEmployeeName(employee);
  const initial = employeeName.charAt(0).toUpperCase() || 'E';

  const statusConfig = getStatusConfig(leave.status);

  const history = Array.isArray(leave.approvalHistory)
    ? leave.approvalHistory
    : [];

  // Oldest event first. Invalid/missing timestamps remain at the end.
  const sortedHistory = history
    .map((step, index) => ({
      ...step,
      _originalIndex: index,
      _sortTime: step?.timestamp
        ? new Date(step.timestamp).getTime()
        : NaN,
    }))
    .sort((a, b) => {
      const aValid = Number.isFinite(a._sortTime);
      const bValid = Number.isFinite(b._sortTime);

      if (aValid && bValid) {
        return a._sortTime - b._sortTime;
      }

      if (aValid) return -1;
      if (bValid) return 1;

      return a._originalIndex - b._originalIndex;
    });

  const startDate =
    leave.startDateStr || leave.startDate || leave.fromDate;

  const endDate =
    leave.endDateStr || leave.endDate || leave.toDate || startDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-timeline-title"
        className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <Clock className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="leave-timeline-title"
                className="text-lg font-bold text-white"
              >
                Leave Approval Audit Trail
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Chronological history of leave decisions and status changes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close audit trail"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Employee Overview */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sm font-bold text-amber-400">
                {initial}
              </div>

              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-white">
                  {employeeName}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {employee.employeeId || 'Employee ID unavailable'}
                  {employee.designation
                    ? ` · ${employee.designation}`
                    : ''}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {leave.leaveType || 'Leave'}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Current Status
              </span>

              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div>
                <span className="block text-[10px] text-slate-500">
                  Leave Period
                </span>

                <p className="mt-1 text-xs font-semibold text-slate-200">
                  {formatDateOnly(startDate)}
                  {String(startDate) !== String(endDate) && (
                    <> – {formatDateOnly(endDate)}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div>
                <span className="block text-[10px] text-slate-500">
                  Total Duration
                </span>

                <p className="mt-1 text-xs font-semibold text-amber-400">
                  {leave.totalDays ?? '—'} day(s)
                  {leave.durationType
                    ? ` · ${String(leave.durationType).replace(/_/g, ' ')}`
                    : ''}
                </p>
              </div>
            </div>
          </div>

          {leave.reason && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Application Reason
                </span>
              </div>

              <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-300">
                {leave.reason}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Chronological Events
            </h3>

            <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-slate-400">
              {sortedHistory.length} event(s)
            </span>
          </div>

          {sortedHistory.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-10 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <History className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-300">
                No audit events available
              </p>

              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                No approval history was returned for this application. This
                does not necessarily mean that no action has occurred.
              </p>
            </div>
          ) : (
            <div className="relative space-y-5 pl-7 before:absolute before:bottom-3 before:left-[7px] before:top-2 before:w-px before:bg-slate-800">
              {sortedHistory.map((step, index) => {
                const config = getEventConfig(step);
                const EventIcon = config.icon;
                const actorName = getActorName(step);

                const stage = String(step.stage || 'WORKFLOW')
                  .replace(/_/g, ' ');

                const action = String(step.action || 'UPDATED')
                  .replace(/_/g, ' ');

                const hasTransition =
                  Boolean(step.fromStatus) || Boolean(step.toStatus);

                return (
                  <div
                    key={step._id || `${step._originalIndex}-${step.timestamp || 'event'}`}
                    className="relative min-w-0"
                  >
                    {/* Timeline Marker */}
                    <span
                      className={`absolute -left-[27px] top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-900 ${config.dot}`}
                    />

                    <div
                      className={`space-y-3 rounded-2xl border bg-slate-950/60 p-3.5 sm:p-4 ${config.border}`}
                    >
                      {/* Event Heading */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <div className={`mt-0.5 shrink-0 ${config.color}`}>
                            <EventIcon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <p className="break-words text-xs font-bold text-white">
                              {action}
                            </p>

                            <p className={`mt-1 text-[10px] font-semibold ${config.color}`}>
                              {stage}
                              {' · '}
                              {config.label}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] leading-relaxed text-slate-500 sm:text-right">
                          {formatDate(step.timestamp || step.createdAt)}
                        </span>
                      </div>

                      {/* Actor */}
                      {actorName && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-slate-500">Action by:</span>
                          <span className="break-words font-semibold text-slate-300">
                            {actorName}
                          </span>
                        </div>
                      )}

                      {/* Status Transition */}
                      {hasTransition && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
                          <span className="text-[10px] text-slate-500">
                            Status:
                          </span>

                          <span className="break-words text-[10px] font-semibold text-slate-300">
                            {String(step.fromStatus || 'INITIAL')
                              .replace(/_/g, ' ')}
                          </span>

                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />

                          <span className="break-words text-[10px] font-bold text-amber-400">
                            {String(step.toStatus || 'UPDATED')
                              .replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}

                      {/* Remarks */}
                      {step.remarks && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Remarks
                          </p>

                          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300">
                            {step.remarks}
                          </p>
                        </div>
                      )}

                      {/* Reason */}
                      {step.reason && (
                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                          <div className="mb-1 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />

                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                              Reason
                            </p>
                          </div>

                          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-rose-200/90">
                            {step.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTimelineModal;
