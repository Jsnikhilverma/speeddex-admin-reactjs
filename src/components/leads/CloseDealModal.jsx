
import React, { useEffect, useState } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Trophy,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

const LOSS_REASONS = [
  { id: 'BUDGET_MISMATCH', label: 'Budget Mismatch (Client budget lower than civil specs)' },
  { id: 'COMPETITOR_SELECTED', label: 'Competitor Selected (Client chose another contractor)' },
  { id: 'PROJECT_POSTPONED', label: 'Project Postponed (Client delaying start indefinitely)' },
  { id: 'CLIENT_UNRESPONSIVE', label: 'Client Unresponsive (Exhausted follow-up attempts)' },
  { id: 'SCOPE_MISMATCH', label: 'Scope Mismatch (Outside Speeddex capabilities or terms)' },
  { id: 'LOCATION_OUT_OF_SERVICE', label: 'Location Out of Service Region' },
  { id: 'OTHER', label: 'Other Reason' },
];

const INITIAL_CHECKLIST = {
  quotationApproved: false,
  paymentTermsAgreed: false,
  contractSigned: false,
  internalApproval: false,
};

const MIN_REMARKS_LENGTH = 5;

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  'Failed to close deal. Please try again.';

const toDateInputValue = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toLocalDateISO = (dateString) => {
  if (!dateString) return undefined;

  // Avoid interpreting a date-only value as UTC midnight.
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date.toISOString();
};

export const CloseDealModal = ({
  isOpen,
  onClose,
  lead,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const leadId = lead?._id || lead?.id || '';
  const currentStatus = lead?.status || '';

  const [outcome, setOutcome] = useState('WON');

  const [agreedAmount, setAgreedAmount] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [checklist, setChecklist] = useState({ ...INITIAL_CHECKLIST });
  const [wonNotes, setWonNotes] = useState('');

  const [lossReason, setLossReason] = useState('COMPETITOR_SELECTED');
  const [lossNotes, setLossNotes] = useState('');
  const [nurtureFollowUpDate, setNurtureFollowUpDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isWon = outcome === 'WON';
  const isAlreadySubmitting = isSubmitting;

  useEffect(() => {
    if (!isOpen || !leadId) return;

    setOutcome(currentStatus === 'LOST' ? 'LOST' : 'WON');

    const amount = lead?.acceptedAmount ?? lead?.budget ?? '';
    setAgreedAmount(amount === null || amount === undefined ? '' : String(amount));

    setExpectedStartDate(toDateInputValue(lead?.expectedStartDate));
    setChecklist({ ...INITIAL_CHECKLIST });
    setWonNotes('');

    setLossReason('COMPETITOR_SELECTED');
    setLossNotes('');
    setNurtureFollowUpDate('');
    setError('');
    setIsSubmitting(false);
  }, [isOpen, leadId, currentStatus, lead?.acceptedAmount, lead?.budget, lead?.expectedStartDate]);

  if (!isOpen || !lead) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setError('');
    onClose?.();
  };

  const handleOutcomeChange = (nextOutcome) => {
    if (isSubmitting) return;
    setOutcome(nextOutcome);
    setError('');
  };

  const handleChecklistChange = (field, checked) => {
    setChecklist((previous) => ({
      ...previous,
      [field]: checked,
    }));
    setError('');
  };

  const validateForm = () => {
    if (!leadId) {
      return 'Lead ID is missing. Please close and reopen this modal.';
    }

    if (outcome === 'WON') {
      const amountText = agreedAmount.trim();

      if (!amountText) {
        return 'Please enter the final agreed contract amount.';
      }

      const amount = Number(amountText);

      if (!Number.isFinite(amount) || amount <= 0) {
        return 'Please enter a valid contract amount greater than zero.';
      }

      if (amount > Number.MAX_SAFE_INTEGER) {
        return 'The contract amount is too large. Please verify the amount.';
      }

      if (expectedStartDate && !toLocalDateISO(expectedStartDate)) {
        return 'Please select a valid project start date.';
      }

      const requiredChecks = [
        ['quotationApproved', 'Client-approved quotation / BOQ'],
        ['paymentTermsAgreed', 'Agreed payment terms'],
        ['contractSigned', 'Signed contract / work order'],
        ['internalApproval', 'Internal management approval'],
      ];

      const incompleteChecks = requiredChecks
        .filter(([field]) => !checklist[field])
        .map(([, label]) => label);

      if (incompleteChecks.length > 0) {
        return `Please verify the closure checklist before marking the deal WON: ${incompleteChecks.join(', ')}.`;
      }

      return '';
    }

    if (!lossReason) {
      return 'Please select a reason for losing this deal.';
    }

    if (lossNotes.trim().length < MIN_REMARKS_LENGTH) {
      return `Please enter specific loss remarks (at least ${MIN_REMARKS_LENGTH} characters).`;
    }

    if (nurtureFollowUpDate && !toLocalDateISO(nurtureFollowUpDate)) {
      return 'Please select a valid nurturing follow-up date.';
    }

    if (
      nurtureFollowUpDate &&
      expectedStartDate &&
      nurtureFollowUpDate < expectedStartDate
    ) {
      return 'The nurturing follow-up date cannot be earlier than the expected project start date.';
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

    const payload =
      outcome === 'WON'
        ? {
          outcome: 'WON',
          agreedAmount: Number(agreedAmount),
          expectedStartDate: toLocalDateISO(expectedStartDate),
          checklist: { ...checklist },
          notes: wonNotes.trim() || undefined,
        }
        : {
          outcome: 'LOST',
          lossReason,
          lossNotes: lossNotes.trim(),
          nurtureFollowUpDate: toLocalDateISO(nurtureFollowUpDate),
        };

    setIsSubmitting(true);

    try {
      await leadApi.closeDeal(leadId, payload);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      setIsSubmitting(false);
      return;
    }

    const successMessage =
      outcome === 'WON'
        ? `Deal WON! Agreed value ₹${Number(agreedAmount).toLocaleString('en-IN')}`
        : 'Deal marked as Lost with audit reason';

    showToast(successMessage, 'success');

    setIsSubmitting(false);
    onClose?.();

    if (typeof onUpdated === 'function') {
      try {
        await onUpdated();
      } catch {
        showToast(
          'Deal was closed, but the list could not refresh. Please refresh the page.',
          'error'
        );
      }
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60';

  const labelClass = 'block text-slate-300 font-medium mb-1.5';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="close-deal-title"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-xl border shrink-0 ${isWon
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
            >
              {isWon ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <h2 id="close-deal-title" className="text-base font-bold text-white">
                Close Deal: {isWon ? 'Deal Won' : 'Deal Lost'}
              </h2>

              <p className="text-xs text-slate-400 mt-1 truncate">
                {lead.leadNumber || 'Lead'} · {lead.clientName || 'Unknown Client'}
              </p>

              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Project: {lead.projectType || 'Not specified'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close deal modal"
            className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outcome tabs */}
        <div className="p-3 sm:p-4 bg-slate-950/40 border-b border-slate-800 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOutcomeChange('WON')}
            disabled={isSubmitting}
            aria-pressed={isWon}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isWon
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}
          >
            <Trophy className="w-4 h-4" />
            Mark Deal WON
          </button>

          <button
            type="button"
            onClick={() => handleOutcomeChange('LOST')}
            disabled={isSubmitting}
            aria-pressed={!isWon}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${!isWon
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}
          >
            <XCircle className="w-4 h-4" />
            Mark Deal LOST
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* WON form */}
          {isWon && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="agreed-amount" className={labelClass}>
                    Final Agreed Amount (₹ INR) *
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-mono">
                      ₹
                    </span>

                    <input
                      id="agreed-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={agreedAmount}
                      onChange={(event) => {
                        setAgreedAmount(event.target.value);
                        setError('');
                      }}
                      disabled={isSubmitting}
                      placeholder="e.g. 4500000"
                      className={`${inputClass} pl-7 font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="expected-start-date" className={labelClass}>
                    Expected Project Start Date
                  </label>

                  <input
                    id="expected-start-date"
                    type="date"
                    value={expectedStartDate}
                    onChange={(event) => {
                      setExpectedStartDate(event.target.value);
                      setError('');
                    }}
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Commercial & Governance Checklist
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Verify all items before closing the deal as won.
                </p>

                {[
                  ['quotationApproved', 'Final quotation / BOQ approved by client'],
                  ['paymentTermsAgreed', 'Milestone payment terms and advance agreed'],
                  ['contractSigned', 'Contract / Work Order / PO signed by client'],
                  ['internalApproval', 'Management commercial sign-off obtained'],
                ].map(([field, label]) => (
                  <label
                    key={field}
                    className="flex items-start gap-2.5 cursor-pointer text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checklist[field])}
                      onChange={(event) =>
                        handleChecklistChange(field, event.target.checked)
                      }
                      disabled={isSubmitting}
                      className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="leading-relaxed">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label htmlFor="won-notes" className={labelClass}>
                  Deal Closure Notes (Optional)
                </label>

                <textarea
                  id="won-notes"
                  rows={3}
                  maxLength={2000}
                  placeholder="Add agreed scope, advance payment expectations, mobilization details, or other closure notes..."
                  value={wonNotes}
                  onChange={(event) => setWonNotes(event.target.value)}
                  disabled={isSubmitting}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
                <strong>Important:</strong> Closing a deal should follow your
                company's approval process. Project creation and payment logging
                must be handled by the backend or the relevant modules.
              </div>
            </div>
          )}

          {/* LOST form */}
          {!isWon && (
            <div className="space-y-4">
              <div>
                <label htmlFor="loss-reason" className={labelClass}>
                  Loss Reason *
                </label>

                <select
                  id="loss-reason"
                  value={lossReason}
                  onChange={(event) => {
                    setLossReason(event.target.value);
                    setError('');
                  }}
                  disabled={isSubmitting}
                  className={`${inputClass} focus:border-rose-500`}
                >
                  {LOSS_REASONS.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="loss-notes" className={labelClass}>
                  Specific Loss Remarks / Feedback *
                </label>

                <textarea
                  id="loss-notes"
                  rows={4}
                  minLength={MIN_REMARKS_LENGTH}
                  maxLength={2000}
                  placeholder="Explain why the deal was lost, including client feedback, competitor pricing, budget constraints, or project delays..."
                  value={lossNotes}
                  onChange={(event) => {
                    setLossNotes(event.target.value);
                    setError('');
                  }}
                  disabled={isSubmitting}
                  className={`${inputClass} resize-y focus:border-rose-500`}
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Minimum {MIN_REMARKS_LENGTH} characters.
                </p>
              </div>

              <div>
                <label htmlFor="nurture-date" className={labelClass}>
                  Future Nurturing Date (Optional)
                </label>

                <input
                  id="nurture-date"
                  type="date"
                  value={nurtureFollowUpDate}
                  onChange={(event) => {
                    setNurtureFollowUpDate(event.target.value);
                    setError('');
                  }}
                  disabled={isSubmitting}
                  className={`${inputClass} focus:border-blue-500`}
                />

                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Set a future date if the client may restart the project later.
                  The backend must create the actual reminder or follow-up.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isAlreadySubmitting}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isWon
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Closing Deal...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Deal {isWon ? 'WON' : 'LOST'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseDealModal;
