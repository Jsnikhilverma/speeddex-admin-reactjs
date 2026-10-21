import React, { useState, useEffect } from 'react';
import { leadApi } from '../../api/leadApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/permissions';
import {
  X,
  Share2,
  Settings,
  Users,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw,
  Globe,
  Sliders,
  UserCheck,
  UserX,
  Code2,
  Copy,
  Check,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';

export const LeadDistributionModal = ({ isOpen, onClose, onRefreshLeads, salesUsers = [] }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'config' | 'reassign' | 'websiteIntake'
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusData, setStatusData] = useState(null);

  // Config Form State
  const [configForm, setConfigForm] = useState({
    pairSize: 2,
    respectManualAvailability: true,
    excludeOnLeave: true,
    requireClockedIn: false,
    requireRecentLogin: false,
    recentLoginWindowHours: 24,
    maxActiveLeadsCap: 0,
    fallbackPolicy: 'UNASSIGNED_NOTIFY_MANAGERS',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Bulk Reassign State
  const [reassignForm, setReassignForm] = useState({
    unavailableUserId: '',
    targetUserId: '',
    autoDistribute: true,
    markUnavailable: true,
    reason: '',
  });
  const [isReassigning, setIsReassigning] = useState(false);

  // Website Lead Intake Test State
  const [testForm, setTestForm] = useState({
    clientName: 'Sunil Mehta (Test Inbound)',
    phone: '9826012345',
    email: 'sunil.mehta.test@example.com',
    company: 'Mehta Textiles',
    projectType: 'RESIDENTIAL',
    city: 'Indore',
    budget: 8500000,
    requirements: 'Modern 3-story bungalow construction at Bypass Road, Indore. 4500 sq ft.',
  });
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDistributionStatus();
    }
  }, [isOpen]);

  const loadDistributionStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await leadApi.getDistributionStatus();
      const data = res?.data || res;
      setStatusData(data);

      if (data?.config) {
        setConfigForm({
          pairSize: data.config.pairSize ?? 2,
          respectManualAvailability: data.config.respectManualAvailability ?? true,
          excludeOnLeave: data.config.excludeOnLeave ?? true,
          requireClockedIn: data.config.requireClockedIn ?? false,
          requireRecentLogin: data.config.requireRecentLogin ?? false,
          recentLoginWindowHours: data.config.recentLoginWindowHours ?? 24,
          maxActiveLeadsCap: data.config.maxActiveLeadsCap ?? 0,
          fallbackPolicy: data.config.fallbackPolicy || 'UNASSIGNED_NOTIFY_MANAGERS',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch distribution status';
      showToast(msg, 'error');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setIsSavingConfig(true);
      const res = await leadApi.updateDistributionConfig(configForm);
      showToast('Lead distribution configuration updated successfully', 'success');
      await loadDistributionStatus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update distribution rules';
      showToast(msg, 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleBulkReassign = async (e) => {
    e.preventDefault();
    if (!reassignForm.unavailableUserId) {
      showToast('Please select the unavailable sales representative', 'error');
      return;
    }
    if (!reassignForm.autoDistribute && !reassignForm.targetUserId) {
      showToast('Please select target representative or enable Auto-Distribute', 'error');
      return;
    }
    if (!reassignForm.reason.trim()) {
      showToast('Please provide a mandatory reassignment reason', 'error');
      return;
    }

    try {
      setIsReassigning(true);
      const payload = {
        unavailableUserId: reassignForm.unavailableUserId,
        targetUserId: reassignForm.autoDistribute ? undefined : reassignForm.targetUserId,
        autoDistribute: reassignForm.autoDistribute,
        markUnavailable: reassignForm.markUnavailable,
        reason: reassignForm.reason.trim(),
      };

      const res = await leadApi.reassignUnavailable(payload);
      const affected = res?.data?.reassignedCount ?? 0;
      showToast(`Successfully reassigned ${affected} pending lead(s)`, 'success');
      setReassignForm((prev) => ({ ...prev, reason: '', unavailableUserId: '', targetUserId: '' }));
      await loadDistributionStatus();
      onRefreshLeads?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Bulk reassignment failed';
      showToast(msg, 'error');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleTestWebsiteLead = async (e) => {
    e.preventDefault();
    try {
      setIsSubmittingTest(true);
      setTestResult(null);

      const payload = {
        ...testForm,
        budget: Number(testForm.budget),
      };

      const res = await leadApi.submitWebsiteLead(payload);
      const data = res?.data || res;
      setTestResult(data);
      showToast(`Website inquiry submitted! Ref: ${data.referenceNumber || data.leadNumber}`, 'success');
      await loadDistributionStatus();
      onRefreshLeads?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Website submission failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const handleCopySnippet = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToast('Code snippet copied to clipboard', 'info');
  };

  if (!isOpen) return null;

  const cursor = statusData?.cursor || {};
  const eligibleReps = statusData?.eligibleReps || { count: 0, employees: [] };
  const ineligibleReps = statusData?.ineligibleReps || { count: 0, employees: [] };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <RotateCw className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Automated Lead Distribution Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                  Paired Round-Robin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic 2-lead batch allocation with live sales availability & policy validation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadDistributionStatus}
              disabled={isLoadingStatus}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Engine State"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-3.5 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Distributed</span>
              <span className="text-sm font-black text-white font-mono">
                {cursor.totalDistributed ?? 0} Leads
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Batch Progress</span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {cursor.currentConsecutiveInPair ?? 0} / {cursor.pairSize ?? configForm.pairSize} in Pair
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Eligible Reps Pool</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {eligibleReps.count} Ready
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Excluded / Ineligible</span>
              <span className="text-sm font-black text-rose-400 font-mono">
                {ineligibleReps.count} Offline
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 shrink-0 bg-slate-900 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'overview'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rep Pool & Availability</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {eligibleReps.count} / {eligibleReps.count + ineligibleReps.count}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'config'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Distribution Rules & Policies</span>
          </button>

          <button
            onClick={() => setActiveTab('reassign')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'reassign'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Bulk Reassign Unavailable</span>
          </button>

          <button
            onClick={() => setActiveTab('websiteIntake')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'websiteIntake'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Website Inbound Testing & Docs</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingStatus && !statusData ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-500" />
              <p className="text-xs">Evaluating Sales Reps availability & cursor state...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & POOL */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Cursor Indicator */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Current Rotation Cursor
                      </span>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {cursor.lastAssignedUser ? (
                          <>
                            Last Batch Recipient:{' '}
                            <span className="text-cyan-400 font-bold">{cursor.lastAssignedUser.name}</span>{' '}
                            <span className="text-slate-400 text-xs">({cursor.lastAssignedUser.email})</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Rotation freshly initialized (Ready for first lead)</span>
                        )}
                      </p>
                      {cursor.lastAssignedAt && (
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Last assigned: {new Date(cursor.lastAssignedAt).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                      <span className="text-slate-400">Active Rule:</span>
                      <span className="font-semibold text-amber-400">
                        {configForm.pairSize} consecutive leads per salesperson
                      </span>
                    </div>
                  </div>

                  {/* Dual Grid: Eligible vs Ineligible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Eligible Reps */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            Eligible Sales Pool ({eligibleReps.count})
                          </h4>
                        </div>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Receiving Leads
                        </span>
                      </div>

                      {eligibleReps.employees.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                          <p className="font-medium text-slate-300">No Sales reps currently eligible!</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Incoming leads will route to UNASSIGNED fallback and alert managers.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {eligibleReps.employees.map((rep, idx) => (
                            <div
                              key={rep.id || idx}
                              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-semibold text-white text-xs block">{rep.name}</span>
                                <span className="text-[11px] text-slate-400">{rep.email}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active & Available
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ineligible Reps */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <UserX className="w-4 h-4 text-rose-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            Excluded / Ineligible ({ineligibleReps.count})
                          </h4>
                        </div>
                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          Skipped by Engine
                        </span>
                      </div>

                      {ineligibleReps.employees.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                          <p className="font-medium text-slate-300">All active sales reps are eligible</p>
                          <p className="text-[11px] text-slate-500 mt-1">Zero reps excluded by policy rules.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {ineligibleReps.employees.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start justify-between gap-3"
                            >
                              <div>
                                <span className="font-semibold text-white text-xs block">{item.name}</span>
                                <span className="text-[11px] text-slate-400 block">{item.email}</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.reasons.map((r, rIdx) => (
                                    <span
                                      key={rIdx}
                                      className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setReassignForm((prev) => ({
                                    ...prev,
                                    unavailableUserId: item.id,
                                    reason: `Reassigned due to unavailability: ${item.reasons.join(', ')}`,
                                  }));
                                  setActiveTab('reassign');
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 transition-colors shrink-0"
                              >
                                Reassign Leads
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONFIGURATION */}
              {activeTab === 'config' && (
                <form onSubmit={handleSaveConfig} className="max-w-2xl mx-auto space-y-5">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                    <div>
                      <p className="font-semibold">Deterministic Policy Controls</p>
                      <p className="mt-0.5 text-cyan-400/90 text-[11px]">
                        Changes take effect immediately for all subsequent website and auto-distributed leads.
                      </p>
                    </div>
                  </div>

                  {/* Pair Size */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-white block">
                          Pair Size (Consecutive Leads per Rep)
                        </label>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          How many consecutive leads a representative receives before rotating to the next.
                        </span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={configForm.pairSize}
                        onChange={(e) =>
                          setConfigForm((prev) => ({ ...prev, pairSize: Number(e.target.value) }))
                        }
                        className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Max Active Leads Cap */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-white block">
                          Max Active Leads Workload Cap
                        </label>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Max open/in-progress leads per rep before pausing new assignment (Set 0 for unlimited).
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={configForm.maxActiveLeadsCap}
                        onChange={(e) =>
                          setConfigForm((prev) => ({ ...prev, maxActiveLeadsCap: Number(e.target.value) }))
                        }
                        className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white text-center font-mono font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Availability Rules Toggles */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                      Eligibility Evaluation Rules
                    </h5>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm.respectManualAvailability}
                        onChange={(e) =>
                          setConfigForm((prev) => ({
                            ...prev,
                            respectManualAvailability: e.target.checked,
                          }))
                        }
                        className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          Respect Manual Availability Switch
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Skip representatives who toggle their status to "Unavailable / Away".
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-800/60">
                      <input
                        type="checkbox"
                        checked={configForm.excludeOnLeave}
                        onChange={(e) =>
                          setConfigForm((prev) => ({ ...prev, excludeOnLeave: e.target.checked }))
                        }
                        className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          Exclude On Approved Leave
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Automatically skip representatives with active approved leave covering today.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-800/60">
                      <input
                        type="checkbox"
                        checked={configForm.requireClockedIn}
                        onChange={(e) =>
                          setConfigForm((prev) => ({ ...prev, requireClockedIn: e.target.checked }))
                        }
                        className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">
                          Require Active Clock-In (HR Attendance Integration)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Only allocate leads to sales representatives who have actively punched in today.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Fallback Policy */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-white block">
                      Empty Pool Fallback Policy
                    </label>
                    <span className="text-[11px] text-slate-400 block">
                      What should happen when zero sales reps are eligible at the time of inquiry?
                    </span>
                    <select
                      value={configForm.fallbackPolicy}
                      onChange={(e) =>
                        setConfigForm((prev) => ({ ...prev, fallbackPolicy: e.target.value }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 mt-2"
                    >
                      <option value="UNASSIGNED_NOTIFY_MANAGERS">
                        Store as UNASSIGNED & Notify Managers / Super Admins (Default)
                      </option>
                      <option value="QUEUE_UNTIL_AVAILABLE">
                        Queue in Intake Buffer Until Rep Becomes Available
                      </option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {isSavingConfig ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Rules...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Save Distribution Configuration</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: BULK REASSIGNMENT */}
              {activeTab === 'reassign' && (
                <form onSubmit={handleBulkReassign} className="max-w-2xl mx-auto space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold">Reassign Pending Workload</p>
                      <p className="mt-0.5 text-amber-400/90 text-[11px]">
                        Seamlessly reassign all active leads from an absent or overloaded representative to other team members.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Unavailable Sales Representative <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={reassignForm.unavailableUserId}
                      onChange={(e) =>
                        setReassignForm((prev) => ({ ...prev, unavailableUserId: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Choose Representative --</option>
                      {salesUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role}) • {u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Distribution Strategy */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reassignType"
                        checked={reassignForm.autoDistribute}
                        onChange={() => setReassignForm((p) => ({ ...p, autoDistribute: true }))}
                        className="text-amber-500 bg-slate-900 border-slate-700"
                      />
                      <span className="text-xs font-semibold text-white">
                        Auto-Distribute evenly among all currently eligible representatives (Round-Robin)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reassignType"
                        checked={!reassignForm.autoDistribute}
                        onChange={() => setReassignForm((p) => ({ ...p, autoDistribute: false }))}
                        className="text-amber-500 bg-slate-900 border-slate-700"
                      />
                      <span className="text-xs font-semibold text-white">
                        Transfer all leads to a single designated representative
                      </span>
                    </label>

                    {!reassignForm.autoDistribute && (
                      <div className="pl-6 pt-2 animate-in fade-in">
                        <select
                          value={reassignForm.targetUserId}
                          onChange={(e) =>
                            setReassignForm((prev) => ({ ...prev, targetUserId: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Choose Target Representative --</option>
                          {salesUsers
                            .filter((u) => u._id !== reassignForm.unavailableUserId)
                            .map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name} ({u.role}) • {u.email}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Audited Reassignment Reason <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={reassignForm.reason}
                      onChange={(e) => setReassignForm((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g. Employee on 4-day medical leave; reallocating active pipeline"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={reassignForm.markUnavailable}
                      onChange={(e) =>
                        setReassignForm((prev) => ({ ...prev, markUnavailable: e.target.checked }))
                      }
                      className="rounded bg-slate-950 border-slate-700 text-amber-500"
                    />
                    <span>Mark representative as unavailable immediately to prevent new incoming leads</span>
                  </label>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={isReassigning || !reassignForm.unavailableUserId}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isReassigning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Reassigning Leads...</span>
                        </>
                      ) : (
                        <>
                          <RotateCw className="w-4 h-4" />
                          <span>Execute Bulk Reassignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: WEBSITE INTAKE TESTING & DOCS */}
              {activeTab === 'websiteIntake' && (
                <div className="space-y-6">
                  {/* Integration Snippet */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Public API Endpoint (Next.js / React Web Client)
                        </h4>
                      </div>
                      <button
                        onClick={() =>
                          handleCopySnippet(
                            `fetch('/api/v1/leads/website', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'X-Website-Secret': 'speeddex-public-web-secret-2026' },\n  body: JSON.stringify({\n    clientName: 'Client Name',\n    phone: '9826012345',\n    email: 'client@example.com',\n    projectType: 'RESIDENTIAL',\n    budget: 5000000,\n    city: 'Indore',\n    requirements: '3BHK villa construction'\n  })\n});`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy JavaScript'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      POST /api/v1/leads/website <br />
                      Header: X-Website-Secret: speeddex-public-web-secret-2026
                    </div>
                  </div>

                  {/* Interactive Inbound Test Form */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Simulate Inbound Website Lead Submission
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-4">
                      Submit a live mock website inquiry to verify rate limiting, spam filters, duplicate detection, and the paired round-robin rotation.
                    </p>

                    <form onSubmit={handleTestWebsiteLead} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Client Name
                        </label>
                        <input
                          type="text"
                          value={testForm.clientName}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, clientName: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Mobile (Indian 10-digit)
                        </label>
                        <input
                          type="text"
                          value={testForm.phone}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={testForm.email}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, email: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Project Type
                        </label>
                        <select
                          value={testForm.projectType}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, projectType: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="RESIDENTIAL">Residential</option>
                          <option value="COMMERCIAL">Commercial</option>
                          <option value="INDUSTRIAL">Industrial</option>
                          <option value="RENOVATION">Renovation</option>
                          <option value="INTERIOR">Turnkey Interior</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Budget (INR)
                        </label>
                        <input
                          type="number"
                          value={testForm.budget}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, budget: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={testForm.city}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, city: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Requirements
                        </label>
                        <textarea
                          rows={2}
                          value={testForm.requirements}
                          onChange={(e) =>
                            setTestForm((p) => ({ ...p, requirements: e.target.value }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between pt-2">
                        {testResult && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>
                              Created Ref:{' '}
                              <strong className="font-mono font-black">
                                {testResult.referenceNumber || testResult.leadNumber}
                              </strong>{' '}
                              • Status: {testResult.status}
                            </span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingTest}
                          className="ml-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                        >
                          {isSubmittingTest ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Submitting Inbound Lead...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Inbound Lead Test</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
