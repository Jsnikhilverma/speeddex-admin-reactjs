import React, { useState, useEffect } from 'react';
import { proposalApi } from '../../api/proposalApi';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  X,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  GitBranch,
  Layers,
  Calendar,
  Calculator,
  MessageSquare,
  Percent,
} from 'lucide-react';

const UNIT_OPTIONS = [
  { id: 'sqft', label: 'Sq.Ft (Square Feet)' },
  { id: 'rft', label: 'R.Ft (Running Feet)' },
  { id: 'cum', label: 'Cu.M (Cubic Meter)' },
  { id: 'sqm', label: 'Sq.M (Square Meter)' },
  { id: 'brass', label: 'Brass (100 cu.ft)' },
  { id: 'metric_ton', label: 'MT (Metric Ton)' },
  { id: 'nos', label: 'Nos (Units/Count)' },
  { id: 'lump_sum', label: 'Lump Sum (LS)' },
];

const DEFAULT_MILESTONES = [
  { milestoneName: 'Mobilization & Advance on Signing', percentage: 10, description: 'Design signoff, site survey & material mobilization' },
  { milestoneName: 'Excavation & Plinth Beam Completion', percentage: 25, description: 'Column footing, backfilling, anti-termite & plinth beam casting' },
  { milestoneName: 'RCC Superstructure Slab Casting', percentage: 25, description: 'Columns, beams and concrete roof slab casting' },
  { milestoneName: 'Brickwork, Plastering & Conduit Lines', percentage: 20, description: 'Red brick masonry, internal/external plaster, plumbing & electrical pipes' },
  { milestoneName: 'Finishing, Flooring, Painting & Handover', percentage: 20, description: 'Vitrified tiles, emulsion painting, door fixtures & final possession' },
];

export const CreateRevisionModal = ({ isOpen, onClose, proposal, onCreated }) => {
  const { showToast } = useToast();

  const [changesSummary, setChangesSummary] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [lineItems, setLineItems] = useState([]);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [termsAndConditions, setTermsAndConditions] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (proposal && isOpen) {
      // Find latest revision or proposal version
      const latestRev =
        proposal.versions && proposal.versions.length > 0
          ? proposal.versions[proposal.versions.length - 1]
          : proposal.revisions && proposal.revisions.length > 0
          ? proposal.revisions[proposal.revisions.length - 1]
          : proposal;

      setTitle(proposal.title || '');
      setValidUntil(
        latestRev.validUntil || proposal.validUntil
          ? new Date(latestRev.validUntil || proposal.validUntil).toISOString().slice(0, 10)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      );
      setScopeOfWork(latestRev.scopeOfWork || proposal.scopeOfWork || '');

      const existingTax =
        latestRev.lineItems?.[0]?.taxRate ??
        latestRev.taxes?.[0]?.taxRate ??
        18;
      setTaxRate(Number(existingTax) || 18);

      // Clone line items accurately
      const rawItems = latestRev.lineItems || proposal.lineItems || [];
      const items = rawItems.map((it, idx) => ({
        itemNumber: idx + 1,
        category: it.category || 'General Civil',
        description: it.description || '',
        quantity: it.quantity || 1,
        unit: it.unit || 'sqft',
        unitRate: it.unitPrice !== undefined ? it.unitPrice : it.unitRate || 0,
        amount:
          it.totalAmount !== undefined
            ? it.totalAmount
            : it.amount !== undefined
            ? it.amount
            : (it.quantity || 1) * (it.unitPrice || it.unitRate || 0),
        remarks: it.remarks || '',
      }));
      setLineItems(
        items.length > 0
          ? items
          : [{ itemNumber: 1, category: 'General Civil', description: '', quantity: 1, unit: 'sqft', unitRate: 0, amount: 0, remarks: '' }]
      );

      // Clone milestones accurately
      const rawMilestones =
        latestRev.paymentSchedule ||
        proposal.paymentSchedule ||
        latestRev.milestones ||
        proposal.milestones ||
        [];
      const mls = rawMilestones.map((m) => ({
        milestoneName: m.milestone || m.milestoneName || 'Milestone Stage',
        percentage: m.percentage || 0,
        description: m.description || '',
      }));
      setMilestones(mls.length > 0 ? mls : DEFAULT_MILESTONES);

      // Clone terms
      let terms = latestRev.termsAndConditions || proposal.termsAndConditions || '';
      if (Array.isArray(terms)) {
        terms = terms.join('\n');
      }
      setTermsAndConditions(terms);

      setChangesSummary('');
      setError('');
    }
  }, [proposal, isOpen]);

  if (!isOpen || !proposal) return null;

  const currentVer = proposal.currentVersion || 1;
  const nextVer = currentVer + 1;

  // Calculations
  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const taxAmount = Math.round((subtotal * (taxRate / 100) + Number.EPSILON) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount + Number.EPSILON) * 100) / 100;
  const totalMilestonePercentage = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);

  const handleLineItemChange = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unitRate') {
        const qty = Number(field === 'quantity' ? value : target.quantity) || 0;
        const rate = Number(field === 'unitRate' ? value : target.unitRate) || 0;
        target.amount = Math.round((qty * rate + Number.EPSILON) * 100) / 100;
      }

      updated[index] = target;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        itemNumber: prev.length + 1,
        category: 'General Civil',
        description: '',
        quantity: 1,
        unit: 'sqft',
        unitRate: 0,
        amount: 0,
        remarks: '',
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, itemNumber: idx + 1 }))
    );
  };

  const handleMilestoneChange = (index, field, value) => {
    setMilestones((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        milestoneName: `Stage ${prev.length + 1} Payment`,
        percentage: 0,
        description: '',
      },
    ]);
  };

  const removeMilestone = (index) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const formatInr = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!changesSummary.trim()) {
      setError('Please provide a summary of changes explaining this revision');
      return;
    }

    if (lineItems.length === 0 || subtotal <= 0) {
      setError('Please include at least one valid line item with positive amount');
      return;
    }

    if (totalMilestonePercentage !== 100) {
      setError(`Payment milestones percentage must sum to 100% (currently ${totalMilestonePercentage}%)`);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        revisionReason: changesSummary.trim(),
        changesSummary: changesSummary.trim(),
        title: title.trim() || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        scopeOfWork:
          scopeOfWork.trim().length >= 10
            ? scopeOfWork.trim()
            : `Turnkey civil construction revision v${nextVer} for ${title.trim()} as per approved structural drawings.`,
        lineItems: lineItems.map((item, idx) => ({
          itemNumber: idx + 1,
          category: item.category || 'General Civil',
          description: item.description.trim() || `BOQ Item ${idx + 1}`,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'sq.ft',
          unitPrice: Number(item.unitRate) || 0,
          unitRate: Number(item.unitRate) || 0,
          taxRate: Number(taxRate) || 18,
          discount: 0,
          remarks: item.remarks?.trim() || undefined,
        })),
        taxes: [
          {
            taxType: 'GST',
            taxRate: Number(taxRate) || 0,
          },
        ],
        paymentSchedule: milestones.map((m) => ({
          milestone: m.milestoneName.trim() || 'Milestone Stage',
          percentage: Number(m.percentage) || 0,
          description: m.description?.trim() || undefined,
        })),
        milestones: milestones.map((m) => ({
          milestone: m.milestoneName.trim() || 'Milestone Stage',
          milestoneName: m.milestoneName.trim() || 'Milestone Stage',
          percentage: Number(m.percentage) || 0,
          description: m.description?.trim() || undefined,
        })),
        termsAndConditions: termsAndConditions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await proposalApi.createRevision(proposal._id, payload);
      showToast(`Proposal revision v${nextVer} generated successfully!`, 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create revision';
      const details = err.response?.data?.errors
        ? err.response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
        : '';
      const fullError = details ? `${msg} (${details})` : msg;
      setError(fullError);
      showToast(fullError, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  REVISION v{nextVer}
                </span>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Generate New Proposal Revision (v{nextVer})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {proposal.proposalNumber} • Upgrading from v{currentVer} • Preserves prior version audit trail
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Revision Changelog Reason Banner */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
            <label className="block text-xs font-bold text-purple-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Summary of Changes & Client Feedback (Required) *</span>
            </label>
            <input
              type="text"
              required
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              placeholder="e.g. Revised finishing specifications to Italian marble and adjusted slab height per architect meeting."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Proposal Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Extended Validity Date</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scope of Work</label>
            <textarea
              rows={2}
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder="Scope of work..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>

          {/* Line items table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Adjust BOQ Line Items (v{nextVer})</span>
                </h4>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[240px]">Description</th>
                      <th className="py-2.5 px-3 w-24">Qty</th>
                      <th className="py-2.5 px-3 w-28">Unit</th>
                      <th className="py-2.5 px-3 w-28">Rate (₹)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={item.unitRate}
                            onChange={(e) => handleLineItemChange(idx, 'unitRate', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-purple-400">
                          {formatInr(item.amount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            disabled={lineItems.length <= 1}
                            className="text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Breakdown Footer */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">GST:</span>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={18}>18% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={5}>5% GST</option>
                  <option value={0}>0% Tax Free</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Subtotal</span>
                  <span className="font-mono font-semibold text-white">{formatInr(subtotal)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">GST</span>
                  <span className="font-mono font-semibold text-purple-400">{formatInr(taxAmount)}</span>
                </div>
                <div className="pl-2 border-l border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Revision Total</span>
                  <span className="font-mono text-base font-black text-purple-400">{formatInr(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Milestone Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Revision Payment Milestones</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Percentages must sum to exactly 100%
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                    totalMilestonePercentage === 100
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  Total: {totalMilestonePercentage}%
                </span>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tranche</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const milestoneAmount = Math.round(((grandTotal * (Number(m.percentage) || 0)) / 100 + Number.EPSILON) * 100) / 100;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="sm:col-span-1 text-slate-500 font-mono text-center">#{idx + 1}</div>
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        required
                        value={m.milestoneName}
                        onChange={(e) => handleMilestoneChange(idx, 'milestoneName', e.target.value)}
                        placeholder="Milestone stage title"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={m.percentage}
                          onChange={(e) => handleMilestoneChange(idx, 'percentage', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-2 pr-6 py-1.5 text-xs text-white text-right focus:outline-none focus:border-purple-500 font-mono"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2 text-right font-mono font-semibold text-slate-300">
                      {formatInr(milestoneAmount)}
                    </div>
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        disabled={milestones.length <= 1}
                        className="text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terms and conditions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Commercial Terms & Conditions (One per line)</label>
            <textarea
              rows={3}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              placeholder="Payment terms...&#10;Validity..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-mono"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !changesSummary.trim() || subtotal <= 0 || totalMilestonePercentage !== 100}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-purple-500 text-slate-950 hover:bg-purple-400 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting v{nextVer}...</span>
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  <span>Publish Revision v{nextVer}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
