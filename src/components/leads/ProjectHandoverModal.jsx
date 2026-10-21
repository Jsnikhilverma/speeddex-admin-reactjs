import React, { useState, useEffect } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  HardHat,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Building2,
  UserCheck,
  FileText,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export const ProjectHandoverModal = ({ isOpen, onClose, lead, users = [], onUpdated, onNavigateTab }) => {
  const { showToast } = useToast();

  const isAlreadyHandedOver = lead?.handoverStatus === 'HANDED_OVER';

  const [formData, setFormData] = useState({
    name: '',
    projectManager: '',
    startDate: new Date().toISOString().split('T')[0],
    plannedCompletionDate: '',
    priority: 'HIGH',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdProject, setCreatedProject] = useState(null);

  useEffect(() => {
    if (lead) {
      const defaultName = `${lead.clientName} - ${lead.projectType?.replace(/_/g, ' ') || 'Civil Project'}`;
      // default planned completion date 180 days out
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 180);

      setFormData({
        name: defaultName,
        projectManager: lead.assignedTo?._id || '',
        startDate: new Date().toISOString().split('T')[0],
        plannedCompletionDate: futureDate.toISOString().split('T')[0],
        priority: 'HIGH',
        notes: '',
      });
      setCreatedProject(lead.handedOverProject || null);
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        projectManager: formData.projectManager || undefined,
        startDate: new Date(formData.startDate),
        plannedCompletionDate: formData.plannedCompletionDate ? new Date(formData.plannedCompletionDate) : undefined,
        priority: formData.priority,
        notes: formData.notes.trim() || undefined,
      };

      const res = await leadApi.handoverLeadProject(lead._id, payload);
      const proj = res?.data?.project;
      setCreatedProject(proj);

      if (res?.data?.alreadyHandedOver) {
        showToast(`Lead was already handed over to Project ${proj?.projectCode || ''}`, 'info');
      } else {
        showToast(`Project created successfully: ${proj?.projectCode || 'PRJ'}`, 'success');
      }

      onUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete project handover';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToProjects = () => {
    onClose();
    if (onNavigateTab) {
      onNavigateTab('projects');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Project Handover to Site Operations
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {lead.leadNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: <span className="text-slate-200 font-medium">{lead.clientName}</span> • Contract: ₹
                {Number(lead.acceptedAmount || lead.budget || 0).toLocaleString('en-IN')}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ALREADY HANDED OVER STATE */}
          {(isAlreadyHandedOver || createdProject) ? (
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-300 text-sm">Project Already Handed Over</h3>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    This deal has been transitioned to active site operations and construction management.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Project Code:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {createdProject?.projectCode || (typeof lead.handedOverProject === 'object' ? lead.handedOverProject?.projectCode : 'PRJ-ASSIGNED')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Project Name:</span>
                  <span className="font-semibold text-white">
                    {createdProject?.name || (typeof lead.handedOverProject === 'object' ? lead.handedOverProject?.name : formData.name)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Contract Amount:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{Number(lead.acceptedAmount || lead.budget || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Handover Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    HANDED OVER (IDEMPOTENT)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleGoToProjects}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                >
                  <span>View in Projects Module</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* HANDOVER FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
                <strong>Handover Protocol:</strong> Submitting this form creates an active execution record in the Projects module linked to this Lead, Client, and Quotation. Duplicate submissions are prevented.
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rameshwar Villa Turnkey Construction"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assign Project Manager</label>
                  <select
                    value={formData.projectManager}
                    onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Project Manager</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Execution Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent / Fast-Track</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mobilization / Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Planned Completion Date</label>
                  <input
                    type="date"
                    value={formData.plannedCompletionDate}
                    onChange={(e) => setFormData({ ...formData, plannedCompletionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sales Handover Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Key site constraints, soil report findings, client payment terms, approved architectural drawings reference"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

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
                      <span>Creating Project...</span>
                    </>
                  ) : (
                    <>
                      <HardHat className="w-4 h-4" />
                      <span>Execute Handover</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
