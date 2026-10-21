import React, { useState } from 'react';
import { projectApi } from '../../api/projectApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  UserPlus,
  HardHat,
  Calendar,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager (Overall Site Lead)' },
  { value: 'SITE_ENGINEER', label: 'Site Engineer (Civil / Quality / Execution)' },
  { value: 'SITE_SUPERVISOR', label: 'Site Supervisor (Workforce / Shifts)' },
  { value: 'STORE_KEEPER', label: 'Store Keeper (Materials & Inventory)' },
  { value: 'ACCOUNTS', label: 'Site Accountant (Local Imprest & Petty Cash)' },
];

export const AssignTeamModal = ({
  isOpen,
  onClose,
  projectId,
  projectCode,
  projectName,
  sites = [],
  employees = [],
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState('SITE_ENGINEER');
  const [assignedSiteId, setAssignedSiteId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      showToast('Please select an employee to deploy', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        employee: employeeId,
        designation: role,
        role,
        site: assignedSiteId || undefined,
        assignedSite: assignedSiteId || undefined,
        startDate,
        expectedEndDate: expectedEndDate || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await projectApi.assignTeamMember(projectId, payload);
      showToast(res.message || 'Team member assigned successfully to project roster', 'success');
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign team member';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-amber-500/10 text-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] tracking-wide">
                Deploy Site Personnel
              </h2>
              <p className="text-xs text-slate-400">
                {projectCode ? (
                  <span className="font-mono text-amber-400 font-semibold mr-1.5">
                    [{projectCode}]
                  </span>
                ) : null}
                {projectName}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Employee */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Select Employee *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.employeeId} - {emp.fullName || `${emp.name?.firstName} ${emp.name?.lastName}`} ({emp.designation})
                </option>
              ))}
            </select>
          </div>

          {/* Role Designation */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Project / Site Designation *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              required
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scope / Site */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Assigned Site Scope (Optional)
            </label>
            <select
              value={assignedSiteId}
              onChange={(e) => setAssignedSiteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Entire Project (All Sites) --</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.siteCode} - {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Deployment Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Expected Release (Optional)
              </label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Deployment Instructions / Scope Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lead morning toolbox talks, verify concrete cube testing, maintain inventory log..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
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
                <>Deploying...</>
              ) : (
                <>
                  <span>Deploy Member</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
