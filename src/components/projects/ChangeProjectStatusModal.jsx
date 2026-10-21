import React, { useState } from 'react';
import { projectApi } from '../../api/projectApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
} from 'lucide-react';

const ALLOWED_TRANSITIONS = {
  PLANNED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const STATUS_CONFIG = {
  PLANNED: { label: 'Planned / Initialized', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  APPROVED: { label: 'Approved (Mobilization Ready)', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  IN_PROGRESS: { label: 'In Progress (Active Work)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ON_HOLD: { label: 'On Hold (Suspended)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  COMPLETED: { label: 'Completed (Handed Over)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled / Terminated', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

export const ChangeProjectStatusModal = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStatus = project?.status || 'PLANNED';
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState(allowedNext[0] || '');
  const [reason, setReason] = useState('');

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      showToast('Please select a target status', 'error');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      showToast('Reason must be at least 5 characters long', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await projectApi.changeStatus(project._id, {
        status: selectedStatus,
        reason: reason.trim(),
      });
      showToast(res.message || 'Project status updated successfully', 'success');
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update project status';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-amber-500/10 text-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] tracking-wide">
                Change Project Status
              </h2>
              <p className="text-xs text-slate-400">
                <span className="font-mono text-amber-400 font-semibold mr-1.5">
                  [{project.code}]
                </span>
                {project.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400">Current Status:</span>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
              STATUS_CONFIG[currentStatus]?.color || 'text-slate-300'
            }`}
          >
            {STATUS_CONFIG[currentStatus]?.label || currentStatus}
          </span>
        </div>

        {allowedNext.length === 0 ? (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Terminal State Reached</p>
            <p className="text-xs text-slate-500">
              This project is in a terminal state ({currentStatus}) and cannot undergo further lifecycle status transitions.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* New Status Select */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Select New Status *
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              >
                {allowedNext.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIG[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>

            {/* Mandatory Reason */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Reason for Status Change (Audit Logged) *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Architect approved working drawings, site mobilization started, rain delay..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
                minLength={5}
              />
              <span className="text-[10px] text-slate-500">Minimum 5 characters required</span>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Updating...</>
                ) : (
                  <>
                    <span>Confirm Transition</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
