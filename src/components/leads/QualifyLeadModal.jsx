import React, { useState, useEffect } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Compass,
  FileCheck,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';

export const QualifyLeadModal = ({ isOpen, onClose, lead, onUpdated }) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    requirementClarity: 'MEDIUM',
    locationServiceability: 'YES',
    constructionAreaSqFt: '',
    estimatedBudget: '',
    expectedTimeline: 'WITHIN_1_MONTH',
    plotAvailable: 'YES',
    drawingOrBoqAvailable: 'NONE',
    decisionMakerIntent: 'DECISION_MAKER',
    outcome: 'QUALIFIED',
    disqualificationReason: '',
    nextFollowUpDate: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      const q = lead.qualification || {};
      setFormData({
        requirementClarity: q.requirementClarity || 'MEDIUM',
        locationServiceability: q.locationServiceability || 'YES',
        constructionAreaSqFt: q.constructionAreaSqFt || lead.estimatedAreaSqFt || '',
        estimatedBudget: q.estimatedBudget || lead.budget || '',
        expectedTimeline: q.expectedTimeline || 'WITHIN_1_MONTH',
        plotAvailable: q.plotAvailable || 'YES',
        drawingOrBoqAvailable: q.drawingOrBoqAvailable || 'NONE',
        decisionMakerIntent: q.decisionMakerIntent || 'DECISION_MAKER',
        outcome: q.outcome || 'QUALIFIED',
        disqualificationReason: q.disqualificationReason || '',
        nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '',
        notes: q.notes || '',
      });
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.outcome === 'DISQUALIFIED' && !formData.disqualificationReason.trim()) {
      setError('Please specify a disqualification reason');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        requirementClarity: formData.requirementClarity,
        locationServiceability: formData.locationServiceability,
        constructionAreaSqFt: formData.constructionAreaSqFt ? Number(formData.constructionAreaSqFt) : undefined,
        estimatedBudget: formData.estimatedBudget ? Number(formData.estimatedBudget) : undefined,
        expectedTimeline: formData.expectedTimeline,
        plotAvailable: formData.plotAvailable,
        drawingOrBoqAvailable: formData.drawingOrBoqAvailable,
        decisionMakerIntent: formData.decisionMakerIntent,
        outcome: formData.outcome,
        disqualificationReason: formData.outcome === 'DISQUALIFIED' ? formData.disqualificationReason : undefined,
        nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      await leadApi.qualifyLead(lead._id, payload);
      showToast(`Lead qualification saved: ${formData.outcome}`, 'success');
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to qualify lead';
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
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Qualify Construction Lead
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Outcome Radio Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Qualification Outcome *</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'QUALIFIED', label: 'Qualified', desc: 'Proceed to Site Visit / BOQ', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                { id: 'NEEDS_NURTURING', label: 'Needs Nurturing', desc: 'Follow-up at later date', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                { id: 'DISQUALIFIED', label: 'Disqualified', desc: 'Out of scope / dropped', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, outcome: opt.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${formData.outcome === opt.id
                      ? `${opt.color} ring-1 ring-inset ring-current font-bold`
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/50'
                    }`}
                >
                  <div className="text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Disqualification Reason (if Disqualified) */}
          {formData.outcome === 'DISQUALIFIED' && (
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
              <label className="block text-rose-300 font-medium">Disqualification Reason *</label>
              <select
                value={formData.disqualificationReason}
                onChange={(e) => setFormData({ ...formData, disqualificationReason: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                required
              >
                <option value="">Select Reason</option>
                <option value="OUT_OF_SERVICEABLE_AREA">Out of Serviceable Area</option>
                <option value="INSUFFICIENT_BUDGET">Insufficient Budget for Civil Specs</option>
                <option value="NO_PLOT_AVAILABLE">Plot / Land Not Owned or Finalized</option>
                <option value="PROJECT_CANCELLED">Project Indefinitely Cancelled</option>
                <option value="CLIENT_UNRESPONSIVE">Client Unresponsive</option>
                <option value="COMPETITOR_SELECTED">Competitor Contractor Selected</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>
          )}

          {/* Follow-up Date (if Needs Nurturing) */}
          {formData.outcome === 'NEEDS_NURTURING' && (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
              <label className="block text-amber-300 font-medium">Next Nurturing Follow-up Date</label>
              <input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Grid of Qualification Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Requirement Clarity</label>
              <select
                value={formData.requirementClarity}
                onChange={(e) => setFormData({ ...formData, requirementClarity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="HIGH">High (Clear Architectural Scope)</option>
                <option value="MEDIUM">Medium (General Idea, Needs Guidance)</option>
                <option value="LOW">Low (Vague / Unclear)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Location Serviceability</label>
              <select
                value={formData.locationServiceability}
                onChange={(e) => setFormData({ ...formData, locationServiceability: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="YES">Yes (Core Speeddex Service Region)</option>
                <option value="VERIFICATION_NEEDED">Verification Needed (Periphery)</option>
                <option value="OUT_OF_SERVICE_AREA">Out of Serviceable Area</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Plot / Site Availability</label>
              <select
                value={formData.plotAvailable}
                onChange={(e) => setFormData({ ...formData, plotAvailable: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="YES">Yes (Plot Ready for Construction)</option>
                <option value="UNDER_PURCHASE">Under Purchase / Registry Pending</option>
                <option value="NO_PLOT">No Plot / Searching for Land</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Expected Timeline</label>
              <select
                value={formData.expectedTimeline}
                onChange={(e) => setFormData({ ...formData, expectedTimeline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="IMMEDIATE">Immediate (Within 1-2 Weeks)</option>
                <option value="WITHIN_1_MONTH">Within 1 Month</option>
                <option value="WITHIN_3_MONTHS">Within 3 Months</option>
                <option value="EXPLORATORY">Exploratory / Future Project</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Drawings / BOQ Available</label>
              <select
                value={formData.drawingOrBoqAvailable}
                onChange={(e) => setFormData({ ...formData, drawingOrBoqAvailable: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="NONE">None (Needs Design & Architecture)</option>
                <option value="ROUGH_SKETCH">Rough Sketch / Floor Plan</option>
                <option value="ARCHITECTURAL_DRAWING">Architectural Drawings Available</option>
                <option value="FULL_ARCHITECTURAL_AND_STRUCTURAL">Complete Architectural & Structural BOQ</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Decision Maker / Intent</label>
              <select
                value={formData.decisionMakerIntent}
                onChange={(e) => setFormData({ ...formData, decisionMakerIntent: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="DECISION_MAKER">Primary Decision Maker (Owner/Investor)</option>
                <option value="INFLUENCER">Influencer / Family Member</option>
                <option value="AGENT_BROKER">Property Agent / Broker</option>
                <option value="MARKET_SURVEY">Market Rate Checking Only</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Construction Area (sq.ft)</label>
              <input
                type="number"
                placeholder="e.g. 3500"
                value={formData.constructionAreaSqFt}
                onChange={(e) => setFormData({ ...formData, constructionAreaSqFt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Estimated Budget (₹ INR)</label>
              <input
                type="number"
                placeholder="e.g. 5000000"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Qualification Notes</label>
            <textarea
              rows={2}
              placeholder="Key observations regarding client financial readiness, soil, plot dimensions, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Qualification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
