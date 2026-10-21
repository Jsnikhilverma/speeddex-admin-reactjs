
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  AlertCircle,
  Loader2,
  UserCheck,
  Send,
  ShieldAlert,
} from 'lucide-react';

export const AssignLeadModal = ({
  isOpen,
  onClose,
  lead,
  onUpdated,
  salesUsers = [],
}) => {
  const { showToast } = useToast();
  const { isSuperAdmin, hasRole } = useAuth();

  const canManage =
    Boolean(isSuperAdmin) ||
    Boolean(hasRole?.('SUPER_ADMIN')) ||
    Boolean(hasRole?.('MANAGER'));

  const leadId = lead?._id || lead?.id || '';

  const initialAssignee = useMemo(() => {
    const assignee = lead?.assignedTo;

    if (typeof assignee === 'string') return assignee;

    return assignee?._id || assignee?.id || '';
  }, [lead]);

  const [assignedTo, setAssignedTo] = useState(initialAssignee);
  const [handoverNote, setHandoverNote] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setAssignedTo(initialAssignee);
    setHandoverNote('');
    setIsOverride(false);
    setOverrideReason('');
    setError('');
    setIsSubmitting(false);
  }, [isOpen, leadId, initialAssignee]);

  const currentAssigneeName = useMemo(() => {
    const assignee = lead?.assignedTo;

    if (!assignee) return 'Unassigned';

    if (typeof assignee === 'object') {
      return assignee.name || 'Current Assignee';
    }

    const matchingUser = salesUsers.find(
      (user) => String(user?._id || user?.id) === String(assignee)
    );

    return matchingUser?.name || 'Current Assignee';
  }, [lead, salesUsers]);

  const eligibleUsers = useMemo(() => {
    if (!Array.isArray(salesUsers)) return [];

    return salesUsers.filter(
      (user) => user && (user._id || user.id)
    );
  }, [salesUsers]);

  const isSameAssignee =
    Boolean(assignedTo) &&
    String(assignedTo) === String(initialAssignee);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;

    onClose?.();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    if (!leadId) {
      setError('Lead information is missing. Please close and reopen the modal.');
      return;
    }

    if (!canManage) {
      setError(
        'Access denied. Only Managers and Super Admins can reassign leads.'
      );
      return;
    }

    if (!assignedTo) {
      setError('Please select a sales representative.');
      return;
    }

    if (
      !eligibleUsers.some(
        (user) =>
          String(user._id || user.id) === String(assignedTo)
      )
    ) {
      setError(
        'The selected representative is not in the available user list. Refresh the list and try again.'
      );
      return;
    }

    if (isSameAssignee && !isOverride) {
      setError('Please select a different representative to reassign this lead.');
      return;
    }

    if (isOverride && !overrideReason.trim()) {
      setError(
        'An override justification is required when bypassing availability rules.'
      );
      return;
    }

    if (isOverride && overrideReason.trim().length < 5) {
      setError('Please provide a more detailed override justification.');
      return;
    }

    const normalizedNote = handoverNote.trim();
    const normalizedOverrideReason = overrideReason.trim();

    const payload = {
      assignedTo,
      reason: normalizedNote || undefined,
      handoverNote: normalizedNote || undefined,
      isOverride,
      overrideReason: isOverride
        ? normalizedOverrideReason
        : undefined,
    };

    try {
      setIsSubmitting(true);

      await leadApi.assignLead(leadId, payload);

      showToast(
        'Lead assignment updated successfully.',
        'success'
      );

      // Refresh the parent list after the API confirms success.
      if (typeof onUpdated === 'function') {
        await onUpdated();
      }

      onClose?.();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to assign lead. Please try again.';

      setError(message);

      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes('not currently eligible') ||
        normalizedMessage.includes('unavailable') ||
        normalizedMessage.includes('not eligible') ||
        normalizedMessage.includes('at capacity')
      ) {
        setIsOverride(true);
      }

      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !lead) return null;

  const leadNumber = lead.leadNumber || 'Lead';
  const clientName = lead.clientName || 'Unnamed Client';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/45 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-lead-title"
        className="my-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <UserCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="assign-lead-title"
                  className="text-base font-bold text-white"
                >
                  Reassign Sales Representative
                </h3>

                <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Manager Action
                </span>
              </div>

              <p className="mt-1 break-words text-xs text-slate-400">
                {leadNumber} · {clientName}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Currently assigned:{' '}
                <span className="font-medium text-slate-200">
                  {currentAssigneeName}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            aria-label="Close assignment modal"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto p-5 sm:p-6"
        >
          {!canManage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                You do not have permission to reassign leads.
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <div className="min-w-0 leading-relaxed">
                <p className="font-semibold">{error}</p>

                {(error.toLowerCase().includes('eligible') ||
                  error.toLowerCase().includes('unavailable') ||
                  error.toLowerCase().includes('capacity')) && (
                    <p className="mt-1 text-[11px] text-rose-300">
                      If you are authorized, enable the manager override
                      and provide a justification.
                    </p>
                  )}
              </div>
            </div>
          )}

          {/* Assignee */}
          <div>
            <label
              htmlFor="assign-lead-user"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Select Assignee <span className="text-amber-400">*</span>
            </label>

            <select
              id="assign-lead-user"
              value={assignedTo}
              onChange={(event) => {
                setAssignedTo(event.target.value);
                setError('');
              }}
              disabled={!canManage || isSubmitting}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">-- Choose Sales Rep / Manager --</option>

              {eligibleUsers.map((user) => {
                const userId = user._id || user.id;
                const role = String(user.role || '')
                  .replace(/_/g, ' ');

                return (
                  <option key={userId} value={userId}>
                    {user.name || 'Unnamed User'}
                    {role ? ` (${role})` : ''}
                    {user.email ? ` · ${user.email}` : ''}
                    {String(userId) === String(initialAssignee)
                      ? ' · Current'
                      : ''}
                  </option>
                );
              })}
            </select>

            {eligibleUsers.length === 0 && (
              <p className="mt-2 text-[11px] text-amber-400">
                No users are available in the supplied list.
              </p>
            )}

            {isSameAssignee && assignedTo && (
              <p className="mt-2 text-[11px] text-slate-400">
                This is already the current assignee. Select another
                representative to reassign the lead.
              </p>
            )}
          </div>

          {/* Handover note */}
          <div>
            <label
              htmlFor="assign-lead-note"
              className="mb-2 block text-xs font-semibold text-slate-300"
            >
              Handover Instructions / Priority Note{' '}
              <span className="font-normal text-slate-500">
                (Optional)
              </span>
            </label>

            <textarea
              id="assign-lead-note"
              rows={3}
              maxLength={1000}
              value={handoverNote}
              onChange={(event) => setHandoverNote(event.target.value)}
              disabled={!canManage || isSubmitting}
              placeholder="Add client preferences, next steps, priority, or important context..."
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-1 text-right text-[10px] text-slate-500">
              {handoverNote.length}/1000
            </p>
          </div>

          {/* Override */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={isOverride}
                onChange={(event) => {
                  setIsOverride(event.target.checked);
                  setError('');

                  if (!event.target.checked) {
                    setOverrideReason('');
                  }
                }}
                disabled={!canManage || isSubmitting}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20 disabled:cursor-not-allowed"
              />

              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Bypass Availability Rules
                  <span className="text-amber-400">
                    (Manager Override)
                  </span>
                </span>

                <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">
                  Use only when an authorized manager explicitly approves
                  assignment despite the representative's availability
                  or capacity restrictions.
                </span>
              </span>
            </label>

            {isOverride && (
              <div className="border-t border-slate-800 pt-3">
                <label
                  htmlFor="assign-lead-override-reason"
                  className="mb-2 block text-xs font-semibold text-amber-400"
                >
                  Override Justification{' '}
                  <span className="text-rose-400">*</span>
                </label>

                <textarea
                  id="assign-lead-override-reason"
                  rows={2}
                  maxLength={500}
                  value={overrideReason}
                  onChange={(event) => {
                    setOverrideReason(event.target.value);
                    setError('');
                  }}
                  disabled={!canManage || isSubmitting}
                  required
                  minLength={5}
                  placeholder="Explain why this assignment must bypass availability rules..."
                  className="w-full resize-y rounded-xl border border-amber-500/30 bg-slate-900 px-3.5 py-3 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-1 text-right text-[10px] text-slate-500">
                  {overrideReason.length}/500
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !canManage ||
                !assignedTo ||
                eligibleUsers.length === 0 ||
                (isSameAssignee && !isOverride)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Confirm Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignLeadModal;
