
import React, { useEffect, useState } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

const ALL_STATUSES = [
  { id: 'NEW', label: 'New Inquiry', desc: 'Freshly registered lead' },
  { id: 'ASSIGNED', label: 'Assigned to Rep', desc: 'Allocated to sales engineer' },
  { id: 'CONTACTED', label: 'Connected / Contacted', desc: 'Initial call or meeting held' },
  { id: 'NOT_CONNECTED', label: 'Not Connected', desc: 'Call unanswered or unreachable' },
  { id: 'QUALIFIED', label: 'Qualified Lead', desc: 'Requirement and budget verified' },
  { id: 'SITE_VISIT_SCHEDULED', label: 'Site Visit Scheduled', desc: 'Site inspection date confirmed' },
  { id: 'SITE_VISIT_COMPLETED', label: 'Site Visit Completed', desc: 'Engineer inspected plot and ground conditions' },
  { id: 'PROPOSAL_IN_PROGRESS', label: 'Proposal In Progress', desc: 'Costing, BOQ and architectural estimation' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', desc: 'BOQ quote delivered to client' },
  { id: 'NEGOTIATION', label: 'Negotiation', desc: 'Rate, specifications and timeline discussions' },
  { id: 'CONVERTED', label: 'Deal Done (Awarded / Won)', desc: 'Contract awarded and work mobilized' },
  { id: 'LOST', label: 'Lost / Dropped', desc: 'Client chose competitor or cancelled' },
  { id: 'FAKE_LEAD', label: 'Fake Lead / Invalid Inquiry', desc: 'Spam, invalid number or fraudulent entry' },
  { id: 'ON_HOLD', label: 'On Hold', desc: 'Project temporarily paused' },
];

const LOSS_REASONS = [
  { id: 'COMPETITOR', label: 'Chose Competitor Contractor' },
  { id: 'OVER_BUDGET', label: 'Cost / BOQ Rate Exceeded Client Budget' },
  { id: 'DELAYED', label: 'Project Indefinitely Postponed' },
  { id: 'NOT_SERIOUS', label: 'Inquiry Not Serious / Market Research Only' },
  { id: 'LOCATION_OUT_OF_SERVICE', label: 'Site Outside Speeddex Service Region' },
  { id: 'QUALITY_CONCERNS', label: 'Specifications or Design Mismatch' },
  { id: 'OTHER', label: 'Other Reason' },
];

const MIN_REASON_LENGTH = 5;

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  'Failed to update lead status. Please try again.';

const getStatusLabel = (status) => {
  const match = ALL_STATUSES.find((item) => item.id === status);
  return match?.label || String(status || 'UNKNOWN').replace(/_/g, ' ');
};

export const ChangeLeadStatusModal = ({
  isOpen,
  onClose,
  lead,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const leadId = lead?._id || lead?.id || '';
  const currentStatus = lead?.status || 'NEW';

  const [newStatus, setNewStatus] = useState(currentStatus);
  const [remarks, setRemarks] = useState('');
  const [lossReason, setLossReason] = useState('COMPETITOR');
  const [lossRemarks, setLossRemarks] = useState('');
  const [fakeLeadReason, setFakeLeadReason] = useState('');
  const [executiveOverride, setExecutiveOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset the form whenever the modal opens or a different lead is selected.
  useEffect(() => {
    if (!isOpen || !leadId) return;

    setNewStatus(currentStatus);
    setRemarks('');
    setLossReason('COMPETITOR');
    setLossRemarks('');
    setFakeLeadReason('');
    setExecutiveOverride(false);
    setIsSubmitting(false);
    setError('');
  }, [isOpen, leadId, currentStatus]);

  const isTransitionToLost = newStatus === 'LOST';
  const isTransitionToFake = newStatus === 'FAKE_LEAD';
  const isTransitionToWon = ['CONVERTED', 'WON', 'DEAL_DONE'].includes(newStatus);
  const isSameStatus = newStatus === currentStatus;

  if (!isOpen || !lead) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setError('');
    onClose?.();
  };

  const handleStatusChange = (event) => {
    const status = event.target.value;

    setNewStatus(status);
    setError('');

    // Avoid accidentally carrying an executive confirmation to another status.
    if (!['CONVERTED', 'WON', 'DEAL_DONE'].includes(status)) {
      setExecutiveOverride(false);
    }

    // Clear special-case fields when leaving their respective statuses.
    if (status !== 'LOST') {
      setLossReason('COMPETITOR');
      setLossRemarks('');
    }

    if (status !== 'FAKE_LEAD') {
      setFakeLeadReason('');
    }
  };

  const validateForm = () => {
    if (!leadId) {
      return 'Lead ID is missing. Close the modal and try again.';
    }

    if (!newStatus) {
      return 'Please select a status.';
    }

    if (isSameStatus) {
      return 'Selected status is already the current status.';
    }

    if (isTransitionToLost && !lossReason) {
      return 'Please select a reason for losing this lead.';
    }

    if (
      isTransitionToLost &&
      lossRemarks.trim().length < MIN_REASON_LENGTH
    ) {
      return `Please provide specific loss remarks (at least ${MIN_REASON_LENGTH} characters).`;
    }

    if (
      isTransitionToFake &&
      fakeLeadReason.trim().length < MIN_REASON_LENGTH
    ) {
      return `Please provide a valid reason for classifying this lead as fake (at least ${MIN_REASON_LENGTH} characters).`;
    }

    if (isTransitionToWon && !executiveOverride) {
      return 'Please confirm the executive status override before marking this lead as won.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedRemarks = remarks.trim();

    const payload = {
      status: newStatus,
      reason: isTransitionToFake
        ? fakeLeadReason.trim()
        : isTransitionToLost
          ? lossRemarks.trim()
          : trimmedRemarks || `Status updated to ${newStatus}`,
      remarks: trimmedRemarks || undefined,
      executiveOverride: isTransitionToWon ? executiveOverride : false,
    };

    if (isTransitionToLost) {
      payload.lossReason = lossReason;
      payload.lossRemarks = lossRemarks.trim();
      payload.reason = lossRemarks.trim();
    }

    if (isTransitionToFake) {
      payload.fakeLeadReason = fakeLeadReason.trim();
    }

    setIsSubmitting(true);

    try {
      await leadApi.changeStatus(leadId, payload);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      setIsSubmitting(false);
      return;
    }

    // The status update succeeded; a refresh failure must not be reported
    // as if the status update itself had failed.
    showToast(
      `Lead status updated to ${getStatusLabel(newStatus)}`,
      'success'
    );

    setIsSubmitting(false);
    onClose?.();

    if (typeof onUpdated === 'function') {
      try {
        await onUpdated();
      } catch (refreshError) {
        showToast(
          'Status was updated, but the lead list could not refresh. Please refresh the page.',
          'error'
        );
      }
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-60';

  const labelClass =
    'block text-xs font-semibold text-slate-300 mb-2';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black-900/45 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-lead-status-title"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h3
                id="change-lead-status-title"
                className="text-base font-bold text-white"
              >
                Update Pipeline Status
              </h3>

              <p className="text-xs text-slate-400 mt-1 truncate">
                {lead.leadNumber || 'Lead'} • {lead.clientName || 'Unknown Client'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-4 sm:p-6 space-y-5 overflow-y-auto"
        >
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Current status */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-700/60 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Current Status
            </span>

            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 text-right">
              {getStatusLabel(currentStatus)}
            </span>
          </div>

          {/* New status */}
          <div>
            <label htmlFor="new-lead-status" className={labelClass}>
              Select New Stage <span className="text-amber-400">*</span>
            </label>

            <select
              id="new-lead-status"
              value={newStatus}
              onChange={handleStatusChange}
              disabled={isSubmitting}
              required
              className={inputClass}
            >
              {ALL_STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label} ({status.id})
                </option>
              ))}
            </select>

            {newStatus !== currentStatus && (
              <p className="text-[11px] text-slate-500 mt-2">
                {ALL_STATUSES.find((status) => status.id === newStatus)?.desc}
              </p>
            )}
          </div>

          {/* Executive confirmation */}
          {isTransitionToWon && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Deal Won / Contract Awarded</span>
              </div>

              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                Normally, a deal should be confirmed against an accepted
                proposal in the Proposals module. Manual status changes should
                follow your company's approval process.
              </p>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={executiveOverride}
                  onChange={(event) => {
                    setExecutiveOverride(event.target.checked);
                    setError('');
                  }}
                  disabled={isSubmitting}
                  required={isTransitionToWon}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                />

                <span className="text-white text-xs font-medium leading-relaxed">
                  I confirm this deal is approved to be marked as won.
                  <span className="text-emerald-400"> *</span>
                </span>
              </label>
            </div>
          )}

          {/* Lost lead details */}
          {isTransitionToLost && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Loss Reason Tracking</span>
              </div>

              <div>
                <label htmlFor="loss-reason" className={labelClass}>
                  Primary Reason for Loss <span className="text-rose-400">*</span>
                </label>

                <select
                  id="loss-reason"
                  value={lossReason}
                  onChange={(event) => setLossReason(event.target.value)}
                  disabled={isSubmitting}
                  required
                  className={`${inputClass} text-xs`}
                >
                  {LOSS_REASONS.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="loss-remarks" className={labelClass}>
                  Detailed Loss Remarks <span className="text-rose-400">*</span>
                </label>

                <textarea
                  id="loss-remarks"
                  rows={3}
                  value={lossRemarks}
                  onChange={(event) => {
                    setLossRemarks(event.target.value);
                    setError('');
                  }}
                  disabled={isSubmitting}
                  minLength={MIN_REASON_LENGTH}
                  maxLength={2000}
                  required
                  placeholder="Explain why the client dropped the project, including competitor feedback or budget issues..."
                  className={`${inputClass} resize-y text-xs`}
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Minimum {MIN_REASON_LENGTH} characters. This information helps
                  track lost opportunities.
                </p>
              </div>
            </div>
          )}

          {/* Fake lead details */}
          {isTransitionToFake && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Fake / Invalid Inquiry</span>
              </div>

              <p className="text-[11px] text-red-300/80 leading-relaxed">
                Provide a specific reason before classifying this lead as fake.
                Any follow-up cancellation or reminder changes must also be
                implemented by the backend.
              </p>

              <div>
                <label htmlFor="fake-lead-reason" className={labelClass}>
                  Reason for Classification <span className="text-red-400">*</span>
                </label>

                <textarea
                  id="fake-lead-reason"
                  rows={3}
                  value={fakeLeadReason}
                  onChange={(event) => {
                    setFakeLeadReason(event.target.value);
                    setError('');
                  }}
                  disabled={isSubmitting}
                  minLength={MIN_REASON_LENGTH}
                  maxLength={2000}
                  required
                  placeholder="e.g. Invalid contact number, fake identity, or unrelated promotional inquiry..."
                  className={`${inputClass} resize-y text-xs`}
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Minimum {MIN_REASON_LENGTH} characters.
                </p>
              </div>
            </div>
          )}

          {/* General remarks */}
          <div>
            <label htmlFor="status-remarks" className={labelClass}>
              Status Change Remarks <span className="text-slate-500">(Optional)</span>
            </label>

            <textarea
              id="status-remarks"
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              disabled={isSubmitting}
              maxLength={2000}
              placeholder="Add call notes, client feedback, next steps, or other useful details..."
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Footer */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isSameStatus}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Status...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Status Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeLeadStatusModal;
