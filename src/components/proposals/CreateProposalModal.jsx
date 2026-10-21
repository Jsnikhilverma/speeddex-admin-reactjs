import React, { useState, useEffect } from 'react';
import { proposalApi } from '../../api/proposalApi';
import { leadApi } from '../../api/leadApi';
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

const CONNECTED_STATUSES = [
  'CONTACTED',
  'QUALIFIED',
  'REQUIREMENT_GATHERING',
  'SITE_VISIT_SCHEDULED',
  'SITE_VISIT_COMPLETED',
  'SITE_VISIT_DONE',
  'PROPOSAL_IN_PROGRESS',
  'ESTIMATION_IN_PROGRESS',
  'PROPOSAL_SENT',
  'PROPOSAL_SUBMITTED',
  'NEGOTIATION',
  'CONVERTED',
  'WON',
];
const isLeadConnected = (status) => CONNECTED_STATUSES.includes(status);

export const CreateProposalModal = ({ isOpen, onClose, lead, onCreated }) => {
  const { showToast } = useToast();

  const [availableLeads, setAvailableLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(lead?._id || '');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [taxRate, setTaxRate] = useState(18); // 18% standard construction GST
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Water and temporary electricity connection to be provided at site by client.\n2. Steel and cement brand variations will be charged as per actual market rates on casting date.\n3. Extra work outside approved architectural drawings will be billed separately at standard BOQ rates.\n4. Standard Speeddex 10-Year Structural Guarantee applies on RCC framework.'
  );

  // Line items state
  const [lineItems, setLineItems] = useState([
    {
      itemNumber: 1,
      description: 'Site Excavation & Foundation RCC Footing with M25 Grade Ready Mix Concrete',
      quantity: 1,
      unit: 'lump_sum',
      unitRate: 150000,
      amount: 150000,
      remarks: 'Depth as per structural engineer recommendation',
    },
    {
      itemNumber: 2,
      description: 'RCC Superstructure Frame Construction (Columns, Beams, Slabs with Fe550D TMT)',
      quantity: 2500,
      unit: 'sqft',
      unitRate: 1650,
      amount: 4125000,
      remarks: 'Turnkey structural work as per IS code 456',
    },
  ]);

  // Milestones state
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isPassedLeadConnected = !lead || isLeadConnected(lead.status);

  useEffect(() => {
    if (lead?._id) {
      setSelectedLeadId(lead._id);
      setTitle(`Construction & BOQ Proposal for ${lead.clientName} (${lead.projectType?.replace(/_/g, ' ') || 'Site'})`);
    } else if (isOpen) {
      loadLeadsList();
    }
  }, [isOpen, lead]);

  const loadLeadsList = async () => {
    try {
      const res = await leadApi.getLeads({ limit: 100 });
      const list = Array.isArray(res?.data) ? res.data : res?.data?.leads || res?.leads || [];
      const connected = list.filter((l) => isLeadConnected(l.status));
      setAvailableLeads(connected);
    } catch (err) {
      console.error('Failed to load leads list for proposal', err);
    }
  };

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
        milestoneName: '',
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

    if (!isPassedLeadConnected) {
      setError('Cannot create proposal: Lead must be connected with the customer (Contacted / Qualified) first.');
      return;
    }

    if (!selectedLeadId) {
      setError('Please select an active connected construction lead');
      return;
    }

    if (!title.trim()) {
      setError('Proposal title is required');
      return;
    }

    if (lineItems.length === 0 || subtotal <= 0) {
      setError('Please add at least one valid BOQ line item with amount > 0');
      return;
    }

    if (totalMilestonePercentage !== 100) {
      setError(`Payment milestones percentage must sum to exactly 100% (currently ${totalMilestonePercentage}%)`);
      return;
    }

    try {
      setIsSubmitting(true);

      const parsedValidUntil = validUntil
        ? new Date(validUntil).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        lead: selectedLeadId,
        leadId: selectedLeadId,
        title: title.trim(),
        validUntil: parsedValidUntil,
        scopeOfWork:
          scopeOfWork.trim().length >= 10
            ? scopeOfWork.trim()
            : `Turnkey civil construction and BOQ execution for ${title.trim()} as per approved structural drawings.`,
        lineItems: lineItems.map((item, idx) => ({
          itemNumber: idx + 1,
          category: 'General Civil',
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
        paymentSchedule: milestones.map((m) => {
          const pct = Number(m.percentage) || 0;
          return {
            milestone: m.milestoneName.trim() || 'Milestone Stage',
            percentage: pct,
            amount: Math.round(((grandTotal * pct) / 100 + Number.EPSILON) * 100) / 100,
            description: m.description?.trim() || undefined,
          };
        }),
        milestones: milestones.map((m) => {
          const pct = Number(m.percentage) || 0;
          return {
            milestone: m.milestoneName.trim() || 'Milestone Stage',
            milestoneName: m.milestoneName.trim() || 'Milestone Stage',
            percentage: pct,
            amount: Math.round(((grandTotal * pct) / 100 + Number.EPSILON) * 100) / 100,
            description: m.description?.trim() || undefined,
          };
        }),
        termsAndConditions: termsAndConditions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await proposalApi.createProposal(payload);
      showToast('Proposal v1 created successfully!', 'success');
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create proposal';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  NEW ESTIMATE
                </span>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Generate BOQ & Construction Proposal
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Version 1 (v1) • Line-item rates, GST calculation & milestone schedule
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
          {!isPassedLeadConnected && lead && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold block">Lead Not Connected Yet</span>
                <span>
                  Lead {lead.leadNumber} is currently in <strong>{lead.status}</strong> status. Company policy requires contacting and connecting with the client before creating an official BOQ proposal. Please update lead status to Contacted / Qualified first.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Lead & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Associated Lead <span className="text-amber-400">*</span>
              </label>
              {lead ? (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
                  <span className="font-bold text-amber-400">{lead.leadNumber}</span> • {lead.clientName}
                </div>
              ) : (
                <select
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    const chosen = availableLeads.find((l) => l._id === e.target.value);
                    if (chosen) {
                      setTitle(`Construction Proposal for ${chosen.clientName} (${chosen.projectType?.replace(/_/g, ' ')})`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Select Active Lead --</option>
                  {availableLeads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.leadNumber} - {l.clientName} ({l.city})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proposal Title <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Turnkey Civil Construction Proposal for 3BHK Villa"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Valid Until Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Scope of Work Summary
            </label>
            <textarea
              rows={2}
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              placeholder="Brief summary of architectural, structural, and finishing inclusions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Section 2: Bill of Quantities (BOQ) Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Bill of Quantities (BOQ) Line Items</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Itemized construction tasks, quantity surveying & unit rates
                </p>
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add BOQ Item</span>
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
                      <th className="py-2.5 px-3 w-32">Unit</th>
                      <th className="py-2.5 px-3 w-32">Rate (₹)</th>
                      <th className="py-2.5 px-3 w-36 text-right">Amount (₹)</th>
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
                            placeholder="e.g. RCC Column Footing"
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
                            className="text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
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

            {/* Price Breakdown Footer Bar */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">GST Tax Slab:</span>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={18}>18% GST (Standard Construction Services)</option>
                  <option value={12}>12% GST (Govt Infrastructure / Affordable Housing)</option>
                  <option value={5}>5% GST (Pure Labour Contract)</option>
                  <option value={0}>0% (Tax Exempt / SEZ)</option>
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
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Grand Total (INR)</span>
                  <span className="font-mono text-base font-black text-amber-400">{formatInr(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Milestone Payment Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Payment Schedule & Milestone Tranches</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Must equal 100% total allocation across work milestones
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
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tranche</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const estAmount = Math.round((grandTotal * (Number(m.percentage) / 100) + Number.EPSILON) * 100) / 100;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <span className="text-slate-500 font-mono text-xs w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      value={m.milestoneName}
                      onChange={(e) => handleMilestoneChange(idx, 'milestoneName', e.target.value)}
                      placeholder="e.g. Plinth Level Completion"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          value={m.percentage}
                          onChange={(e) => handleMilestoneChange(idx, 'percentage', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white text-right pr-6 focus:outline-none focus:border-amber-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-slate-500">%</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400 w-32 text-right">
                        {formatInr(estAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMilestone(idx)}
                        disabled={milestones.length <= 1}
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Terms and Conditions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Terms & Conditions
            </label>
            <textarea
              rows={3}
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalMilestonePercentage !== 100 || subtotal <= 0 || !isPassedLeadConnected}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Drafting Proposal v1...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Create Official Proposal (v1)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
