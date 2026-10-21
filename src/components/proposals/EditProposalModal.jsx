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
  IndianRupee,
  Layers,
  Calendar,
  FileText,
  Percent,
  CheckCircle2,
  Calculator,
  Pencil,
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

export const EditProposalModal = ({ isOpen, onClose, proposal, onUpdated }) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [lineItems, setLineItems] = useState([]);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (proposal && isOpen) {
      // Find active version
      const activeVer =
        proposal.versions && proposal.versions.length > 0
          ? proposal.versions[proposal.versions.length - 1]
          : proposal;

      setTitle(proposal.title || '');
      setValidUntil(
        activeVer.validUntil || proposal.validUntil
          ? new Date(activeVer.validUntil || proposal.validUntil).toISOString().slice(0, 10)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      );
      setScopeOfWork(activeVer.scopeOfWork || proposal.scopeOfWork || '');
      setNotes(activeVer.notes || proposal.notes || '');

      // Tax rate
      const tax =
        activeVer.lineItems?.[0]?.taxRate ??
        activeVer.taxes?.[0]?.taxRate ??
        18;
      setTaxRate(Number(tax) || 18);

      // Clone line items
      const rawItems = activeVer.lineItems || proposal.lineItems || [];
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

      // Clone milestones
      const rawMilestones =
        activeVer.paymentSchedule ||
        proposal.paymentSchedule ||
        activeVer.milestones ||
        proposal.milestones ||
        [];
      const mls = rawMilestones.map((m) => ({
        milestoneName: m.milestone || m.milestoneName || 'Milestone Stage',
        percentage: m.percentage || 0,
        description: m.description || '',
      }));
      setMilestones(mls.length > 0 ? mls : DEFAULT_MILESTONES);

      // Terms
      let terms = activeVer.termsAndConditions || proposal.termsAndConditions || '';
      if (Array.isArray(terms)) {
        terms = terms.join('\n');
      }
      setTermsAndConditions(terms);

      setError('');
    }
  }, [proposal, isOpen]);

  if (!isOpen || !proposal) return null;

  // Real-time calculations
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

    if (!title.trim()) {
      setError('Please provide a proposal title');
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
        title: title.trim(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        scopeOfWork:
          scopeOfWork.trim().length >= 10
            ? scopeOfWork.trim()
            : `Turnkey civil construction & estimation for ${title.trim()} as per approved structural drawings.`,
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
        termsAndConditions: termsAndConditions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: notes.trim(),
      };

      await proposalApi.updateProposal(proposal._id, payload);
      showToast(`Proposal ${proposal.proposalNumber} updated successfully!`, 'success');
      onUpdated?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update proposal';
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

  const clientName = proposal.lead?.clientName || proposal.leadId?.clientName || 'Valued Client';
  const leadNumber = proposal.lead?.leadNumber || proposal.leadId?.leadNumber || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {proposal.proposalNumber}
                </span>
                <span className="font-mono text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  v{proposal.currentVersion || 1}
                </span>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Edit Proposal & BOQ Rate Card
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: {clientName} {leadNumber && `• Lead #${leadNumber}`} • Update rates, quantities & milestone terms in place
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Proposal Title & Validity Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Proposal Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Turnkey Civil Construction Proposal - Tower A"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quotation Validity Date *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scope of Work & Technical Specifications</label>
            <textarea
              rows={3}
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder="Detail structural framing, concrete grade (e.g. M25), steel grade (Fe550D TMT), masonry specs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Line items table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Itemized Bill of Quantities (BOQ)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update quantities, market rates, and units as negotiated with client
                </p>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
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
                      <th className="py-2.5 px-3 min-w-[240px]">Description & Specifications</th>
                      <th className="py-2.5 px-3 w-24">Qty</th>
                      <th className="py-2.5 px-3 w-28">Unit</th>
                      <th className="py-2.5 px-3 w-28">Unit Rate (₹)</th>
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
                            placeholder="Description"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-amber-400">
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
                <span className="text-xs font-semibold text-slate-400">Applicable GST:</span>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={18}>18% GST (Standard Civil Construction)</option>
                  <option value={12}>12% GST (Affordable Housing)</option>
                  <option value={5}>5% GST (Composite Works)</option>
                  <option value={0}>0% Tax Free</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Subtotal</span>
                  <span className="font-mono font-semibold text-white">{formatInr(subtotal)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">GST ({taxRate}%)</span>
                  <span className="font-mono font-semibold text-amber-400">{formatInr(taxAmount)}</span>
                </div>
                <div className="pl-2 border-l border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Grand Total</span>
                  <span className="font-mono text-base font-black text-amber-400">{formatInr(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Milestone Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Payment Milestone Tranches</span>
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
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
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
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-2 pr-6 py-1.5 text-xs text-white text-right focus:outline-none focus:border-amber-500 font-mono"
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

          {/* Terms and Conditions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Commercial Terms & Conditions (One per line)</label>
            <textarea
              rows={3}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              placeholder="Payment terms: As per agreed milestone schedule.&#10;Validity: 30 days from proposal date.&#10;All rates include statutory taxes as specified."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
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
              disabled={isSubmitting || subtotal <= 0 || totalMilestonePercentage !== 100}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Proposal Updates</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
