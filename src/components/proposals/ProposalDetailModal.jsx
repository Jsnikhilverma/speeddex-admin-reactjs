import React, { useState, useEffect } from 'react';
import { proposalApi } from '../../api/proposalApi';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  IndianRupee,
  CheckCircle2,
  Award,
  GitBranch,
  Send,
  Eye,
  MessageSquare,
  FileCheck2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Printer,
  Pencil,
} from 'lucide-react';
import { PrintableProposalModal } from './PrintableProposalModal';

export const ProposalDetailModal = ({
  isOpen,
  onClose,
  proposalId,
  onUpdated,
  onOpenRevisionModal,
  onOpenAcceptModal,
  onOpenEditModal,
}) => {
  const { showToast } = useToast();

  const [proposal, setProposal] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Revision request modal state
  const [isRevisionRequestOpen, setIsRevisionRequestOpen] = useState(false);
  const [clientFeedback, setClientFeedback] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && proposalId) {
      loadProposal();
    }
  }, [isOpen, proposalId]);

  const loadProposal = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await proposalApi.getProposalById(proposalId);
      const data = res?.data || res;
      if (data) {
        setProposal(data);
        setSelectedVersion(data.currentVersion || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load proposal details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      setIsUpdatingStatus(true);
      await proposalApi.updateStatus(proposal._id, { status });
      showToast(`Proposal status updated to ${status}`, 'success');
      loadProposal();
      onUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRecordRevisionRequest = async (e) => {
    e.preventDefault();
    if (!clientFeedback.trim()) {
      showToast('Please enter client feedback remarks', 'error');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await proposalApi.recordRevisionRequest(proposal._id, {
        requestedChanges: clientFeedback.trim(),
      });
      showToast('Client revision request recorded!', 'success');
      setIsRevisionRequestOpen(false);
      setClientFeedback('');
      loadProposal();
      onUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record revision request', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const formatInr = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  // Determine which data to render for the selected version
  let activeVersionData = proposal;
  if (proposal?.versions && proposal.versions.length > 0) {
    const matched = proposal.versions.find((v) => v.version === selectedVersion);
    if (matched) {
      activeVersionData = matched;
    } else {
      activeVersionData = proposal.versions[proposal.versions.length - 1];
    }
  }

  const versionsList = [];
  if (proposal) {
    const maxVer = proposal.currentVersion || proposal.versions?.length || 1;
    for (let i = 1; i <= maxVer; i++) {
      versionsList.push(i);
    }
  }

  const lineItems = activeVersionData?.lineItems || proposal?.lineItems || [];
  const milestones =
    activeVersionData?.paymentSchedule ||
    proposal?.paymentSchedule ||
    activeVersionData?.milestones ||
    [];
  const subtotal = Number(activeVersionData?.subTotal ?? activeVersionData?.subtotal ?? 0);
  const taxTotal = Number(activeVersionData?.taxTotal ?? activeVersionData?.taxAmount ?? 0);
  const grandTotal = Number(activeVersionData?.grandTotal ?? subtotal + taxTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {proposal?.proposalNumber || 'PROPOSAL'}
                </span>
                <span className="text-base font-bold text-white font-['Outfit']">
                  {proposal?.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: {proposal?.lead?.clientName || proposal?.leadId?.clientName || 'Speeddex Client'} • {proposal?.lead?.city || proposal?.leadId?.city || 'Indore'} • Lead #{proposal?.lead?.leadNumber || proposal?.leadId?.leadNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {proposal && (
              <button
                onClick={() => setIsPrintModalOpen(true)}
                title="Print Official Proposal Quotation for Client"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Proposal</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <p className="text-xs">Loading proposal BOQ and version details...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Version Switcher Strip */}
            <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs font-semibold">Version History:</span>
                <div className="flex items-center gap-1.5">
                  {versionsList.map((ver) => (
                    <button
                      key={ver}
                      onClick={() => setSelectedVersion(ver)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedVersion === ver
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      v{ver} {ver === proposal.currentVersion ? '(Active)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Lifecycle Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border uppercase ${
                    proposal.status === 'ACCEPTED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : proposal.status === 'REVISION_REQUESTED'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      : proposal.status === 'SENT'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {proposal.status?.replace(/_/g, ' ')}
                </span>

                {/* Edit Proposal Button (In place) */}
                {proposal.status !== 'ACCEPTED' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEditModal?.(proposal);
                    }}
                    title="Edit Active Proposal (Update Rates / Quantities in place)"
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Proposal</span>
                  </button>
                )}

                {/* Quick Transition buttons */}
                {proposal.status === 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus('SENT')}
                    disabled={isUpdatingStatus}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send to Client</span>
                  </button>
                )}

                {proposal.status === 'SENT' && (
                  <button
                    onClick={() => handleUpdateStatus('VIEWED')}
                    disabled={isUpdatingStatus}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Mark Viewed</span>
                  </button>
                )}

                {proposal.status !== 'ACCEPTED' && (
                  <>
                    <button
                      onClick={() => setIsRevisionRequestOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Request Revision</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenRevisionModal?.(proposal);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-500 text-slate-950 hover:bg-purple-400 text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <GitBranch className="w-3 h-3" />
                      <span>New Revision v{proposal.currentVersion + 1}</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAcceptModal?.(proposal);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold flex items-center gap-1 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Award Contract</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  title="Print Proposal Quotation"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Awarded Banner if Accepted */}
              {proposal.status === 'ACCEPTED' && proposal.acceptanceDetails && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-300 text-sm">
                        Contract Officially Awarded & Executed!
                      </p>
                      <p className="text-emerald-400/80 text-[11px]">
                        Accepted Version: v{proposal.acceptedVersion || proposal.acceptanceDetails.versionNumber} • Signed:{' '}
                        {new Date(proposal.acceptedAt || proposal.acceptanceDetails.signingDate || Date.now()).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Final Contract Value</span>
                    <span className="font-mono text-base font-black text-emerald-400">
                      {formatInr(proposal.acceptedAmount || proposal.acceptanceDetails.finalContractValue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Version Metadata info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Viewing Version</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">v{selectedVersion}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Validity</span>
                  <span className="text-slate-300 font-medium">
                    {activeVersionData?.validUntil || proposal.validUntil
                      ? new Date(activeVersionData?.validUntil || proposal.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '30 Days'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Created By</span>
                  <span className="text-slate-300 font-medium truncate block">
                    {proposal.createdBy?.name || 'Speeddex Estimations'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Grand Total (INR)</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatInr(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Scope of Work */}
              {(activeVersionData?.scopeOfWork || proposal?.scopeOfWork) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Scope of Work
                  </h4>
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {activeVersionData?.scopeOfWork || proposal?.scopeOfWork}
                  </p>
                </div>
              )}

              {/* BOQ Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Itemized Bill of Quantities (BOQ) - Version v{selectedVersion}</span>
                </h4>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">Description / Specification</th>
                        <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
                        <th className="py-2.5 px-3 w-28">Unit</th>
                        <th className="py-2.5 px-3 w-32 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 w-36 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {lineItems.map((item, idx) => {
                        const rate = Number(item.unitRate !== undefined ? item.unitRate : item.unitPrice || 0);
                        const amt = Number(item.amount !== undefined ? item.amount : item.totalAmount || item.quantity * rate);
                        return (
                          <tr key={idx} className="hover:bg-slate-800/20">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{item.itemNumber || idx + 1}</td>
                            <td className="py-2.5 px-3 text-slate-200">
                              <div>
                                <span className="font-medium text-white">{item.description}</span>
                                {item.remarks && (
                                  <span className="block text-[11px] text-slate-500 mt-0.5">{item.remarks}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">{item.quantity}</td>
                            <td className="py-2.5 px-3 uppercase text-[11px] text-slate-400 font-medium">{item.unit}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">{formatInr(rate)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                              {formatInr(amt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-80 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="font-mono text-white">{formatInr(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>
                        GST Taxes (
                        {activeVersionData?.taxes?.map((t) => `${t.taxRate}%`).join(', ') ||
                          (lineItems[0]?.taxRate ? `${lineItems[0].taxRate}%` : '18%')}
                        ):
                      </span>
                      <span className="font-mono text-amber-400">
                        {formatInr(taxTotal)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                      <span className="text-white">Grand Total:</span>
                      <span className="font-mono text-amber-400">{formatInr(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestones Payment Tranches */}
              {milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Payment Milestone Schedule</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {milestones.map((m, idx) => {
                      const estAmt = Math.round(
                        ((grandTotal * (Number(m.percentage) / 100)) + Number.EPSILON) * 100
                      ) / 100;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block">
                              {idx + 1}. {m.milestoneName || m.milestone}
                            </span>
                            {m.description && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">{m.description}</span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-amber-400 block">{m.percentage}%</span>
                            <span className="font-mono text-[11px] text-slate-400 block">{formatInr(m.amount || estAmt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              {(activeVersionData?.termsAndConditions || proposal?.termsAndConditions) && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Commercial Terms & Conditions
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 whitespace-pre-line leading-relaxed font-mono">
                    {Array.isArray(activeVersionData?.termsAndConditions || proposal?.termsAndConditions)
                      ? (activeVersionData?.termsAndConditions || proposal?.termsAndConditions).join('\n')
                      : activeVersionData?.termsAndConditions || proposal?.termsAndConditions}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Revision Request Dialog overlay */}
        {isRevisionRequestOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
              <h4 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Record Client Revision Request</span>
              </h4>
              <p className="text-xs text-slate-400">
                Log the client feedback or negotiation points that necessitate a new BOQ rate revision.
              </p>
              <textarea
                rows={3}
                required
                value={clientFeedback}
                onChange={(e) => setClientFeedback(e.target.value)}
                placeholder="e.g. Client requested 5% discount on labour rates or change in flooring specifications..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionRequestOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecordRevisionRequest}
                  disabled={isUpdatingStatus || !clientFeedback.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 text-slate-950 hover:bg-purple-400 disabled:opacity-50 cursor-pointer"
                >
                  Confirm Revision Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Quotation Modal */}
        <PrintableProposalModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          proposal={proposal}
        />
      </div>
    </div>
  );
};
