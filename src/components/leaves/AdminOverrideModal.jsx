
import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldAlert,
  X,
  Check,
  AlertTriangle,
  LoaderCircle,
  RotateCcw,
} from 'lucide-react';

const TARGET_STATUSES = [
  {
    value: 'APPROVED',
    label: 'Force Approve',
    description: 'Approve the leave application.',
  },
  {
    value: 'REJECTED_BY_HR',
    label: 'Force Reject',
    description: 'Reject the leave application.',
  },
  {
    value: 'CANCELLED',
    label: 'Cancel Application',
    description: 'Cancel the leave application.',
  },
  {
    value: 'PENDING_HR',
    label: 'Reset to Pending HR',
    description: 'Return the application to HR review.',
  },
];

const getErrorMessage = (error) => {
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return 'Unable to override the leave application. Please try again.';
};

export const AdminOverrideModal = ({
  isOpen,
  onClose,
  leave,
  onOverride,
}) => {
  const [targetStatus, setTargetStatus] = useState('APPROVED');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submittingRef = useRef(false);
  const reasonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTargetStatus('APPROVED');
    setReason('');
    setError('');
    setIsSubmitting(false);
    submittingRef.current = false;
  }, [isOpen, leave?._id]);

  if (!isOpen || !leave) {
    return null;
  }

  const currentStatus = String(leave.status || 'UNKNOWN')
    .replace(/_/g, ' ');

  const isReasonValid = reason.trim().length >= 5;
  const isSameStatus = targetStatus === leave.status;

  const handleClose = () => {
    if (submittingRef.current) {
      return;
    }

    setError('');
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const trimmedReason = reason.trim();

    if (trimmedReason.length < 5) {
      setError('Please enter an administrative reason of at least 5 characters.');
      reasonRef.current?.focus();
      return;
    }

    if (trimmedReason.length > 1000) {
      setError('The reason cannot exceed 1000 characters.');
      reasonRef.current?.focus();
      return;
    }

    if (!leave?._id) {
      setError('Leave application ID is missing. Please refresh and try again.');
      return;
    }

    if (typeof onOverride !== 'function') {
      setError('Override action is unavailable. Please contact your administrator.');
      return;
    }

    if (isSameStatus) {
      setError('The selected target status is already the current status.');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setError('');

      await onOverride(leave._id, {
        targetStatus,
        reason: trimmedReason,
      });

      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-override-title"
        aria-describedby="admin-override-description"
        className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="admin-override-title"
                className="text-lg font-bold text-white"
              >
                Super Admin Override
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Administrative leave status override
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close override dialog"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Security Warning */}
          <div
            id="admin-override-description"
            className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300">
                Administrative action
              </p>

              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                Current application status:{' '}
                <span className="font-bold text-amber-200">
                  {currentStatus}
                </span>
                . Ensure the new status is correct and the reason is
                documented.
              </p>
            </div>
          </div>

          {/* Target Status */}
          <div>
            <label
              htmlFor="override-target-status"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Desired Target Status <span className="text-rose-400">*</span>
            </label>

            <div className="relative">
              <select
                id="override-target-status"
                value={targetStatus}
                onChange={(event) => {
                  setTargetStatus(event.target.value);
                  setError('');
                }}
                disabled={isSubmitting}
                required
                className="w-full appearance-none rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 pr-10 text-sm text-white outline-none transition-colors focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {TARGET_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label} ({status.value})
                  </option>
                ))}
              </select>

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <RotateCcw className="h-4 w-4" />
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {
                TARGET_STATUSES.find(
                  (status) => status.value === targetStatus
                )?.description
              }
            </p>

            {isSameStatus && (
              <p className="mt-2 text-xs text-amber-400">
                This is already the current status. Select a different status
                to continue.
              </p>
            )}
          </div>

          {/* Mandatory Reason */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label
                htmlFor="override-reason"
                className="text-xs font-semibold text-slate-300"
              >
                Administrative Reason{' '}
                <span className="text-rose-400">*</span>
              </label>

              <span
                className={`text-[11px] ${reason.length > 1000
                    ? 'text-rose-400'
                    : 'text-slate-500'
                  }`}
              >
                {reason.length}/1000
              </span>
            </div>

            <textarea
              ref={reasonRef}
              id="override-reason"
              rows={4}
              required
              minLength={5}
              maxLength={1000}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError('');
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              placeholder="Explain why this administrative override is required..."
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-1.5 text-[11px] text-slate-500">
              Minimum 5 characters. This reason should be saved in the
              server-side audit history.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />

              <p className="text-xs leading-relaxed text-rose-300">
                {error}
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-3 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !isReasonValid ||
                reason.length > 1000 ||
                isSameStatus
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:py-2.5"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Execute Override</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOverrideModal;
