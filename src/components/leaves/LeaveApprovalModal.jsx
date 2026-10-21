
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  X,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Check,
  LoaderCircle,
} from 'lucide-react';

const MAX_REASON_LENGTH = 1000;
const MAX_REMARKS_LENGTH = 1000;

const getErrorMessage = (error) => {
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return 'Unable to submit the leave decision. Please try again.';
};

const formatDate = (value) => {
  if (!value) return 'Not specified';

  // Preserve date-only strings without timezone shifting.
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

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
    const fullName = [
      employee.name.firstName,
      employee.name.middleName,
      employee.name.lastName,
    ]
      .filter((part) => typeof part === 'string' && part.trim())
      .map((part) => part.trim())
      .join(' ');

    if (fullName) return fullName;
  }

  return employee.firstName || employee.fullName || 'Employee';
};

export const LeaveApprovalModal = ({
  isOpen,
  onClose,
  leave,
  stage = 'MANAGER',
  onDecision,
}) => {
  const [decision, setDecision] = useState('APPROVE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submittingRef = useRef(false);
  const rejectionReasonRef = useRef(null);

  const isHRStage = stage === 'HR';

  useEffect(() => {
    if (!isOpen) return;

    setDecision('APPROVE');
    setRejectionReason('');
    setRemarks('');
    setError('');
    setIsSubmitting(false);
    submittingRef.current = false;
  }, [isOpen, leave?._id, stage]);

  if (!isOpen || !leave) {
    return null;
  }

  const employee = leave.employee || {};
  const employeeName = getEmployeeName(employee);
  const employeeInitial = employeeName.charAt(0).toUpperCase() || 'E';

  const startDate =
    leave.startDateStr || leave.startDate || leave.fromDate;

  const endDate =
    leave.endDateStr || leave.endDate || leave.toDate || startDate;

  const leaveType = leave.leaveType || 'LEAVE';
  const durationType = leave.durationType || 'FULL_DAY';
  const currentStatus = String(leave.status || 'PENDING')
    .replace(/_/g, ' ');

  const isRejecting = decision === 'REJECT';
  const trimmedRejectionReason = rejectionReason.trim();
  const trimmedRemarks = remarks.trim();

  const isReasonValid =
    !isRejecting ||
    (
      trimmedRejectionReason.length >= 5 &&
      trimmedRejectionReason.length <= MAX_REASON_LENGTH
    );

  const isRemarksValid = trimmedRemarks.length <= MAX_REMARKS_LENGTH;

  const handleClose = () => {
    if (submittingRef.current) return;
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    if (!leave?._id) {
      setError('Leave application ID is missing. Please refresh and try again.');
      return;
    }

    if (typeof onDecision !== 'function') {
      setError('The approval action is unavailable. Please contact your administrator.');
      return;
    }

    if (isRejecting && trimmedRejectionReason.length < 5) {
      setError('Please provide a rejection reason of at least 5 characters.');
      rejectionReasonRef.current?.focus();
      return;
    }

    if (trimmedRejectionReason.length > MAX_REASON_LENGTH) {
      setError('The rejection reason cannot exceed 1000 characters.');
      rejectionReasonRef.current?.focus();
      return;
    }

    if (!isRemarksValid) {
      setError('Remarks cannot exceed 1000 characters.');
      return;
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      setError('');

      const payload = {
        action: decision,
        remarks: trimmedRemarks,
      };

      // Only send a rejection reason when rejecting.
      if (isRejecting) {
        payload.reason = trimmedRejectionReason;
      }

      await onDecision(leave._id, payload);

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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-approval-title"
        className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="leave-approval-title"
                className="text-lg font-bold text-white"
              >
                {isHRStage
                  ? 'Stage 2: HR Final Approval'
                  : 'Stage 1: Manager Review'}
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Review the application and record your decision.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close leave approval dialog"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Applicant Summary */}
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-amber-400">
                {employeeInitial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {employeeName}
                </p>

                <p className="mt-1 break-words font-mono text-[10px] text-slate-400">
                  {employee.employeeId || 'Employee ID unavailable'}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {employee.designation || 'Staff'}
                  {employee.department?.name
                    ? ` · ${employee.department.name}`
                    : ''}
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-400">
              {leaveType}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-800/80 pt-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div className="min-w-0">
                <span className="block text-[10px] text-slate-500">
                  Leave Period
                </span>

                <p className="mt-1 text-xs font-semibold leading-relaxed text-white">
                  {formatDate(startDate)}
                  {String(startDate) !== String(endDate) && (
                    <> – {formatDate(endDate)}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div className="min-w-0">
                <span className="block text-[10px] text-slate-500">
                  Duration
                </span>

                <p className="mt-1 text-xs font-semibold text-amber-400">
                  {leave.totalDays ?? '—'} day(s)
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  {String(durationType).replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                Application Reason
              </span>

              <span className="rounded-md bg-white px-2 py-1 text-[10px] text-amber-600">
                {currentStatus}
              </span>
            </div>

            <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-300">
              {leave.reason || 'No application reason provided.'}
            </p>
          </div>

          {/* Manager Decision: HR Stage */}
          {isHRStage && leave.managerDecision?.decidedAt && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />

                <span className="text-xs font-bold text-emerald-400">
                  Approved by Reporting Manager
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300">
                {leave.managerDecision.remarks ||
                  'No manager remarks provided.'}
              </p>

              {leave.managerDecision.decidedAt && (
                <p className="mt-1.5 text-[10px] text-slate-500">
                  {formatDate(leave.managerDecision.decidedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Decision Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <fieldset disabled={isSubmitting}>
            <legend className="mb-2 block text-xs font-semibold text-slate-300">
              Select Your Decision
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={decision === 'APPROVE'}
                onClick={() => {
                  setDecision('APPROVE');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-xs font-bold transition-all ${decision === 'APPROVE'
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Request
              </button>

              <button
                type="button"
                aria-pressed={decision === 'REJECT'}
                onClick={() => {
                  setDecision('REJECT');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3.5 text-xs font-bold transition-all ${decision === 'REJECT'
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </button>
            </div>
          </fieldset>

          {/* Rejection Reason */}
          {isRejecting && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="leave-rejection-reason"
                  className="text-xs font-semibold text-rose-400"
                >
                  Rejection Justification{' '}
                  <span className="text-rose-400">*</span>
                </label>

                <span className="text-[10px] text-slate-500">
                  {rejectionReason.length}/{MAX_REASON_LENGTH}
                </span>
              </div>

              <textarea
                ref={rejectionReasonRef}
                id="leave-rejection-reason"
                rows={4}
                required
                minLength={5}
                maxLength={MAX_REASON_LENGTH}
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (error) setError('');
                }}
                placeholder="Explain why this leave request is being rejected..."
                aria-invalid={Boolean(
                  isRejecting && trimmedRejectionReason.length < 5
                )}
                disabled={isSubmitting}
                className="w-full resize-y rounded-xl border border-rose-500/30 bg-slate-950 px-3.5 py-3 text-xs leading-relaxed text-white outline-none transition-colors placeholder:text-slate-500 focus:border-rose-500 disabled:opacity-60"
              />

              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                A minimum of 5 characters is required. The backend should
                save this reason in the approval history.
              </p>
            </div>
          )}

          {/* Approval Remarks */}
          {!isRejecting && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor="leave-approval-remarks"
                  className="text-xs font-semibold text-slate-300"
                >
                  Approval Remarks / Handover Notes
                  <span className="ml-1 font-normal text-slate-500">
                    (Optional)
                  </span>
                </label>

                <span className="text-[10px] text-slate-500">
                  {remarks.length}/{MAX_REMARKS_LENGTH}
                </span>
              </div>

              <textarea
                id="leave-approval-remarks"
                rows={3}
                maxLength={MAX_REMARKS_LENGTH}
                value={remarks}
                onChange={(event) => {
                  setRemarks(event.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                placeholder="e.g. Approved. Duty assigned to the site supervisor."
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-xs leading-relaxed text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-500/50 disabled:opacity-60"
              />
            </div>
          )}

          {/* Error */}
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

          {/* Footer */}
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
                !isRemarksValid
              }
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:py-2.5 ${decision === 'APPROVE'
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 hover:bg-emerald-400'
                : 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-400'
                }`}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Submitting Decision...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>
                    {decision === 'APPROVE'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveApprovalModal;
