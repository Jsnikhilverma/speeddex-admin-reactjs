
import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  RefreshCcw,
  X,
  AlertCircle,
  Loader2,
  Check,
  UserRound,
  ShieldCheck,
  BriefcaseBusiness,
} from 'lucide-react';

const EMPLOYMENT_STATUSES = [
  {
    value: 'PROBATION',
    label: 'Probation',
    description: 'Employee is under evaluation.',
  },
  {
    value: 'CONFIRMED',
    label: 'Confirmed',
    description: 'Permanent or confirmed employee.',
  },
  {
    value: 'CONTRACT',
    label: 'Contract',
    description: 'Employee hired for a contract or project.',
  },
  {
    value: 'INTERN',
    label: 'Intern',
    description: 'Internship or apprenticeship.',
  },
  {
    value: 'NOTICE_PERIOD',
    label: 'Notice Period',
    description: 'Employee is serving an exit notice.',
  },
  {
    value: 'RESIGNED',
    label: 'Resigned',
    description: 'Employee has resigned.',
  },
  {
    value: 'TERMINATED',
    label: 'Terminated',
    description: 'Employment has been terminated.',
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    description: 'Historical employee record.',
  },
];

const STATUS_STYLES = {
  PROBATION: 'bg-amber-50 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CONTRACT: 'bg-blue-50 text-blue-800 border-blue-200',
  INTERN: 'bg-violet-50 text-violet-800 border-violet-200',
  NOTICE_PERIOD: 'bg-orange-50 text-orange-800 border-orange-200',
  RESIGNED: 'bg-rose-50 text-rose-800 border-rose-200',
  TERMINATED: 'bg-rose-50 text-rose-800 border-rose-200',
  ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
};

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  return (
    employee.fullName ||
    [employee.name?.firstName, employee.name?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Employee'
  );
};

const getStatusLabel = (status) =>
  EMPLOYMENT_STATUSES.find((item) => item.value === status)?.label ||
  status ||
  'Not specified';

export const StatusChangeModal = ({
  isOpen,
  onClose,
  employee,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const [status, setStatus] = useState('CONFIRMED');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentStatus = employee?.employmentStatus || 'PROBATION';

  const hasStatusChanged = status !== currentStatus;

  useEffect(() => {
    if (isOpen && employee) {
      setStatus(employee.employmentStatus || 'CONFIRMED');
      setReason('');
      setRemarks('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, employee?._id, employee?.employmentStatus]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        setError('');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !employee) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setError('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    if (!hasStatusChanged) {
      setError('Please select a status different from the current status.');
      return;
    }

    if (!reason.trim()) {
      setError('A reason is mandatory for employment status changes.');
      return;
    }

    if (reason.trim().length < 5) {
      setError(
        'Please provide a more detailed reason (at least 5 characters).'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await employeeApi.changeStatus(employee._id, {
        status,
        reason: reason.trim(),
        remarks: remarks.trim(),
      });

      showToast(
        `Employment status updated to ${status} for ${getEmployeeName(employee)}.`,
        'success'
      );

      if (typeof onUpdated === 'function') {
        await onUpdated();
      }

      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update employment status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

  const labelClass =
    'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-700';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/45 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        className="relative my-auto flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-black/20"
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-200 bg-white px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <RefreshCcw className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
                    HR Management
                  </span>

                  <span className="text-[10px] font-medium text-gray-500">
                    Employee Lifecycle
                  </span>
                </div>

                <h2
                  id="status-modal-title"
                  className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl"
                >
                  Change Employment Status
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Update the employee's employment status.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close modal"
              className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Employee summary */}
          <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 sm:p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-gray-950">
              {getEmployeeName(employee).charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">
                {getEmployeeName(employee)}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
                <span className="font-mono text-gray-700">
                  {employee.employeeId || 'Employee ID unavailable'}
                </span>

                {employee.designation && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1">
                      <BriefcaseBusiness className="h-3 w-3" />
                      {employee.designation}
                    </span>
                  </>
                )}
              </div>
            </div>

            <UserRound className="hidden h-5 w-5 shrink-0 text-gray-400 sm:block" />
          </div>
        </div>

        {/* Scrollable form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50/70 p-5 sm:p-7">
            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                <div className="flex-1">
                  <p className="font-semibold">Unable to update status</p>
                  <p className="mt-1 text-xs leading-5 text-rose-700">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError('')}
                  className="rounded-md p-1 text-rose-500 transition hover:bg-rose-100 hover:text-rose-800"
                  aria-label="Dismiss error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Current status */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-800">
                  Current Employment Status
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Existing status
                  </p>

                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-bold ${STATUS_STYLES[currentStatus] || STATUS_STYLES.ARCHIVED
                      }`}
                  >
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
                    {getStatusLabel(currentStatus)}
                  </span>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Selected status
                  </p>

                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-bold ${STATUS_STYLES[status] || STATUS_STYLES.ARCHIVED
                      }`}
                  >
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
                    {getStatusLabel(status)}
                  </span>
                </div>
              </div>
            </section>

            {/* New status */}
            <section>
              <label htmlFor="employment-status" className={labelClass}>
                New Employment Status{' '}
                <span className="text-amber-600">*</span>
              </label>

              <select
                id="employment-status"
                name="status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setError('');
                }}
                required
                disabled={isSubmitting}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="" disabled>
                  Select employment status
                </option>

                {EMPLOYMENT_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              {!hasStatusChanged && (
                <p className="mt-2 text-[11px] text-amber-700">
                  Choose a different status to proceed with the update.
                </p>
              )}
            </section>

            {/* Reason */}
            <section>
              <label htmlFor="status-reason" className={labelClass}>
                Reason for Change{' '}
                <span className="text-amber-600">*</span>
              </label>

              <textarea
                id="status-reason"
                name="reason"
                rows={4}
                required
                minLength={5}
                maxLength={1000}
                placeholder="Explain why this employment status is changing..."
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                className={`${inputClass} resize-y leading-6`}
              />

              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-[10px] text-gray-500">
                  Required for the employee status audit trail.
                </p>

                <span
                  className={`text-[10px] font-mono ${reason.length >= 1000
                    ? 'text-amber-700'
                    : 'text-gray-500'
                    }`}
                >
                  {reason.length}/1000
                </span>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2.5 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="hidden items-center gap-1.5 text-[10px] text-gray-500 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              HR status management
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !hasStatusChanged}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-gray-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Status...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    Confirm Status Change
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
