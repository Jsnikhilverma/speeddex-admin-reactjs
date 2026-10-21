import React, { useState } from 'react';
import { proposalApi } from '../../api/proposalApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Award,
  IndianRupee,
  Calendar,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

export const AcceptProposalModal = ({ isOpen, onClose, proposal, onAccepted }) => {
  const { showToast } = useToast();

  const [versionNumber, setVersionNumber] = useState(proposal?.currentVersion || 1);
  const [finalContractValue, setFinalContractValue] = useState(proposal?.grandTotal || '');
  const [signingDate, setSigningDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [executiveOverride, setExecutiveOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !proposal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!finalContractValue || Number(finalContractValue) <= 0) {
      setError('Please provide a valid signed final contract value');
      return;
    }

    try {
      setIsSubmitting(true);
      await proposalApi.acceptProposal(proposal._id, {
        version: Number(versionNumber),
        versionNumber: Number(versionNumber),
        finalContractValue: Number(finalContractValue),
        signingDate: new Date(signingDate).toISOString(),
        clientRemarks: notes.trim() || 'Contract accepted and signed',
        notes: notes.trim() || undefined,
        executiveOverride,
      });

      showToast(`Proposal accepted! Lead officially converted to WON!`, 'success');
      onAccepted?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to accept proposal';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatInr = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Award & Accept Proposal Contract
              </h3>
              <p className="text-xs text-slate-400">
                {proposal.proposalNumber} • {proposal.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Single-Award Rule Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Speeddex Single-Award Acceptance Policy</span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              Accepting this proposal locks the agreed BOQ rate, archives competing draft versions for this lead, and automatically upgrades lead pipeline stage to <strong>WON</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Accepted Version
              </label>
              <select
                value={versionNumber}
                onChange={(e) => setVersionNumber(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {Array.from({ length: proposal.currentVersion || 1 }, (_, i) => i + 1).map((v) => (
                  <option key={v} value={v}>
                    Version v{v} {v === proposal.currentVersion ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Signing Date
              </label>
              <input
                type="date"
                required
                value={signingDate}
                onChange={(e) => setSigningDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Final Agreed Contract Value (INR) <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={finalContractValue}
                onChange={(e) => setFinalContractValue(e.target.value)}
                placeholder="Final negotiated lump sum / rate contract value"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Quoted Proposal Value: {formatInr(proposal.grandTotal)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Executive / Signing Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Contract signed in person at client's Vijay Nagar residence. Cheque received for advance."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Executive Override if re-awarding */}
          <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={executiveOverride}
              onChange={(e) => setExecutiveOverride(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500"
            />
            <span>Executive Override (Force re-acceptance if another quote was accepted)</span>
          </label>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !finalContractValue}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Awarding Contract...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Award & Convert Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
