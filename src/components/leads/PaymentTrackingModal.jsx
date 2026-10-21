import React, { useState, useEffect } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  IndianRupee,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const formatInr = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

const PAYMENT_METHODS = [
  { id: 'NEFT_RTGS', label: 'NEFT / RTGS' },
  { id: 'IMPS', label: 'IMPS' },
  { id: 'CHEQUE', label: 'Bank Cheque' },
  { id: 'UPI', label: 'UPI / QR' },
  { id: 'BANK_TRANSFER', label: 'Direct Bank Transfer' },
  { id: 'DEMAND_DRAFT', label: 'Demand Draft' },
  { id: 'CASH', label: 'Cash Receipt' },
  { id: 'OTHER', label: 'Other' },
];

export const PaymentTrackingModal = ({ isOpen, onClose, lead, onUpdated }) => {
  const { showToast } = useToast();

  const [ledgerData, setLedgerData] = useState({
    totalContractAmount: 0,
    advanceAmountDue: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    payments: [],
  });

  const [isLoadingLedger, setIsLoadingLedger] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New payment form
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'NEFT_RTGS',
    transactionReference: '',
    receiptUrl: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadLedger = async () => {
    if (!lead?._id) return;
    try {
      setIsLoadingLedger(true);
      const res = await leadApi.getPayments(lead._id);
      if (res?.data) {
        setLedgerData(res.data);
      }
    } catch (err) {
      console.error('Failed to load payments ledger', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    if (lead && isOpen) {
      loadLedger();
      setShowAddForm(false);
      setNewPayment({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'NEFT_RTGS',
        transactionReference: '',
        receiptUrl: '',
        notes: '',
      });
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(newPayment.amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please specify a valid payment amount greater than zero');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        amount: numAmount,
        paymentDate: new Date(newPayment.paymentDate),
        paymentMethod: newPayment.paymentMethod,
        transactionReference: newPayment.transactionReference.trim() || undefined,
        receiptUrl: newPayment.receiptUrl.trim() || undefined,
        notes: newPayment.notes.trim() || undefined,
      };

      await leadApi.recordPayment(lead._id, payload);
      showToast(`Payment of ${formatInr(numAmount)} recorded successfully`, 'success');
      setShowAddForm(false);
      await loadLedger();
      onUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record payment';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Construction Payment Tracking
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {lead.leadNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: <span className="text-slate-200 font-medium">{lead.clientName}</span> • Project: {lead.projectType}
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

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Contract Value</span>
            <div className="text-sm font-bold text-white font-mono mt-1">
              {formatInr(ledgerData.totalContractAmount)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Advance Due</span>
            <div className="text-sm font-bold text-amber-400 font-mono mt-1">
              {formatInr(ledgerData.advanceAmountDue)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Total Paid</span>
            <div className="text-sm font-bold text-emerald-300 font-mono mt-1">
              {formatInr(ledgerData.totalPaid)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40">
            <span className="text-[10px] text-rose-400 uppercase font-semibold">Balance Due</span>
            <div className="text-sm font-bold text-rose-300 font-mono mt-1">
              {formatInr(ledgerData.outstandingBalance)}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action to show Add Payment Form */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Recorded Payment Transactions ({ledgerData.payments?.length || 0})</span>
            </h3>

            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-md shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Payment</span>
              </button>
            )}
          </div>

          {/* ADD PAYMENT FORM */}
          {showAddForm && (
            <form onSubmit={handleRecordPayment} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-white">Record Client Payment</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount Received (₹ INR) *</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Method *</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Transaction Ref / UTR / Cheque #</label>
                  <input
                    type="text"
                    value={newPayment.transactionReference}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionReference: e.target.value })}
                    placeholder="e.g. UTR-HDFC20261015-098"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Receipt URL / Bank Confirmation Document</label>
                <input
                  type="url"
                  value={newPayment.receiptUrl}
                  onChange={(e) => setNewPayment({ ...newPayment, receiptUrl: e.target.value })}
                  placeholder="https://storage.speeddex.com/receipts/rec-01.pdf"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Remarks / Milestone</label>
                <input
                  type="text"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="e.g. 20% Mobilization advance received against milestone 1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Payment Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* PAYMENTS LEDGER TABLE */}
          {isLoadingLedger ? (
            <div className="py-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-500" />
              <span>Loading ledger transactions...</span>
            </div>
          ) : !ledgerData.payments || ledgerData.payments.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-400">No payment records logged yet</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Log the client's advance payment to track financial progress
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Ref / UTR</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ledgerData.payments.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-slate-300">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {formatInr(p.amount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {p.paymentMethod?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {p.transactionReference || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[160px] truncate" title={p.notes}>
                        {p.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.receiptUrl ? (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
