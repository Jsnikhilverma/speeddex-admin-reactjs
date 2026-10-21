import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api/projectApi';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import { AddSiteModal } from './AddSiteModal';
import { AssignTeamModal } from './AssignTeamModal';
import { ChangeProjectStatusModal } from './ChangeProjectStatusModal';
import {
  X,
  HardHat,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ShieldAlert,
  Phone,
  Mail,
  UserCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  Compass,
  ArrowRight,
  UserMinus,
} from 'lucide-react';

const STATUS_CONFIG = {
  PLANNED: { label: 'Planned / Initialized', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  APPROVED: { label: 'Approved (Mobilization Ready)', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  IN_PROGRESS: { label: 'In Progress (Active Work)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ON_HOLD: { label: 'On Hold (Suspended)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  COMPLETED: { label: 'Completed (Handed Over)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled / Terminated', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

const PRIORITY_CONFIG = {
  LOW: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  MEDIUM: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  URGENT: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const ROLE_BADGES = {
  PROJECT_MANAGER: { label: 'Project Manager', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  SITE_ENGINEER: { label: 'Site Engineer', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SITE_SUPERVISOR: { label: 'Site Supervisor', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  STORE_KEEPER: { label: 'Store Keeper', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  ACCOUNTS: { label: 'Site Accounts', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export const ProjectDetailModal = ({
  isOpen,
  onClose,
  projectId,
  onProjectUpdated,
}) => {
  const { showToast } = useToast();
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sites' | 'team' | 'history'

  // Nested Modals
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [isAssignTeamOpen, setIsAssignTeamOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectDetails();
      loadEmployees();
    }
  }, [isOpen, projectId]);

  const loadProjectDetails = async () => {
    try {
      setIsLoading(true);
      const res = await projectApi.getProjectById(projectId);
      setProjectData(res.data);
    } catch (err) {
      console.error('Failed to load project details', err);
      showToast('Failed to load project details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await employeeApi.getEmployees({ limit: 100 });
      const list = Array.isArray(res?.data) ? res.data : res?.data?.employees || [];
      setEmployees(list);
    } catch (err) {
      console.error('Failed to load employees for project modal', err);
    }
  };

  const handleReleaseMember = async (assignmentId, memberName) => {
    const reason = window.prompt(`Enter release reason for ${memberName}:`, 'Project role completed');
    if (!reason) return;

    try {
      await projectApi.releaseTeamMember(projectId, assignmentId, { reason });
      showToast(`${memberName} released from project roster`, 'success');
      loadProjectDetails();
      onProjectUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to release member', 'error');
    }
  };

  const handleToggleSiteStatus = async (siteId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await projectApi.changeSiteStatus(projectId, siteId, {
        status: nextStatus,
        reason: `Status switched to ${nextStatus} via dashboard`,
      });
      showToast(`Site status changed to ${nextStatus}`, 'success');
      loadProjectDetails();
      onProjectUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update site status', 'error');
    }
  };

  if (!isOpen) return null;

  const project = projectData?.project || (projectData?._id ? projectData : null);
  const sites = projectData?.sites || project?.sites || [];
  const team = projectData?.teamAssignments || projectData?.team || project?.teamAssignments || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-amber-500/10 text-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur">
            {isLoading ? (
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-xl" />
                <div className="space-y-1">
                  <div className="w-48 h-4 bg-slate-800 rounded" />
                  <div className="w-24 h-3 bg-slate-800 rounded" />
                </div>
              </div>
            ) : project ? (
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <HardHat className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {project.projectCode || project.code}
                    </span>
                    <h2 className="text-lg font-bold font-['Outfit'] truncate text-white">
                      {project.name}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        STATUS_CONFIG[project.status]?.color || 'text-slate-300'
                      }`}
                    >
                      {STATUS_CONFIG[project.status]?.label || project.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        PRIORITY_CONFIG[project.priority] || 'text-slate-300'
                      }`}
                    >
                      {project.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{project.projectType} Construction</span>
                    <span>•</span>
                    <span>Client: <strong className="text-slate-200">{project.client?.name}</strong></span>
                    {project.client?.phone && <span>({project.client.phone})</span>}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2 shrink-0">
              {project && (
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Status</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/50 shrink-0 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
                activeTab === 'overview'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Project Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sites')}
              className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
                activeTab === 'sites'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Child Sites & Locations</span>
              <span className="px-1.5 py-0.2 bg-slate-800 rounded-full text-[10px] text-slate-300">
                {sites.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
                activeTab === 'team'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personnel Roster</span>
              <span className="px-1.5 py-0.2 bg-slate-800 rounded-full text-[10px] text-slate-300">
                {team.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition ${
                activeTab === 'history'
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Status History</span>
              <span className="px-1.5 py-0.2 bg-slate-800 rounded-full text-[10px] text-slate-300">
                {project?.statusHistory?.length || 0}
              </span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-2" />
                <p className="text-sm">Loading project profile and site operations...</p>
              </div>
            ) : !project ? (
              <div className="text-center py-20 text-slate-400">
                Project records could not be found or access is restricted.
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Top Stat Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-1">Contract Value</span>
                        <div className="text-lg font-bold font-mono text-emerald-400 flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          <span>
                            {project.contractAmount !== undefined
                              ? Number(project.contractAmount).toLocaleString('en-IN')
                              : 'Restricted'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Agreed Client Consideration</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-1">Approved Budget</span>
                        <div className="text-lg font-bold font-mono text-amber-400 flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          <span>
                            {project.approvedBudget !== undefined
                              ? Number(project.approvedBudget).toLocaleString('en-IN')
                              : 'Restricted'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Internal Cost Ceiling</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-1">Execution Timeline</span>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} -{' '}
                            {project.plannedCompletionDate
                              ? new Date(project.plannedCompletionDate).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Planned Construction Window</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block mb-1">Lead Project Manager</span>
                        <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {project.projectManager?.name?.firstName
                              ? `${project.projectManager.name.firstName} ${project.projectManager.name.lastName}`
                              : project.projectManager?.fullName || 'Not Assigned'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">Operations Custodian</span>
                      </div>
                    </div>

                    {/* Handover Baseline Snapshot (If Converted from CRM Lead) */}
                    {project.handoverSnapshot && (project.handoverSnapshot.sourceLeadId || project.handoverSnapshot.leadId || project.handoverSnapshot.leadNumber) && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            Pre-Construction Handover Baseline (CRM Snapshot)
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Source Lead Ref:</span>
                            <span className="text-slate-200 font-mono font-semibold">
                              {project.handoverSnapshot.leadNumber || 'CRM Lead'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Handover Timestamp:</span>
                            <span className="text-slate-300">
                              {project.handoverSnapshot.handoverTimestamp || project.handoverSnapshot.handoverDate
                                ? new Date(project.handoverSnapshot.handoverTimestamp || project.handoverSnapshot.handoverDate).toLocaleString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Awarded Scope:</span>
                            <span className="text-slate-300 truncate block">
                              {project.handoverSnapshot.scopeOfWork || project.handoverSnapshot.originalRequirements || 'Standard construction scope'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Accepted Proposal Value:</span>
                            <span className="text-emerald-400 font-bold font-mono">
                              ₹{(project.handoverSnapshot.contractAmount || project.handoverSnapshot.acceptedAmount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Client & Address Detail Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Client Card */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          Client Contract Entity
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Client Name:</span>
                            <span className="text-slate-200 font-semibold">{project.client?.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Phone:</span>
                              <span className="text-slate-200">{project.client?.phone}</span>
                            </div>
                            {project.client?.email && (
                              <div>
                                <span className="text-slate-500 block text-[11px]">Email:</span>
                                <span className="text-slate-200">{project.client.email}</span>
                              </div>
                            )}
                          </div>
                          {project.client?.company && (
                            <div>
                              <span className="text-slate-500 block text-[11px]">Company / Organization:</span>
                              <span className="text-slate-200">{project.client.company}</span>
                            </div>
                          )}
                          {project.client?.billingAddress && (
                            <div>
                              <span className="text-slate-500 block text-[11px]">Billing Address:</span>
                              <span className="text-slate-400">
                                {[
                                  project.client.billingAddress.street,
                                  project.client.billingAddress.city,
                                  project.client.billingAddress.state,
                                  project.client.billingAddress.pincode,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Primary Site Address & Scope */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          Primary Construction Site
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Physical Address:</span>
                            <span className="text-slate-300">
                              {[
                                project.siteAddress?.street,
                                project.siteAddress?.city,
                                project.siteAddress?.state,
                                project.siteAddress?.pincode,
                              ]
                                .filter(Boolean)
                                .join(', ') || 'Address not registered'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Scope of Work:</span>
                            <p className="text-slate-300 leading-relaxed">
                              {project.scopeOfWork || 'General civil construction, structural and MEP works'}
                            </p>
                          </div>
                          {project.notes && (
                            <div>
                              <span className="text-slate-500 block text-[11px]">Operations Remarks:</span>
                              <p className="text-slate-400 italic">{project.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CHILD SITES */}
                {activeTab === 'sites' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white font-['Outfit']">
                          Child Construction Sites & Zones
                        </h3>
                        <p className="text-xs text-slate-400">
                          Manage towers, basements, sub-phases, and mobilization points under this project
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddSiteOpen(true)}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Child Site</span>
                      </button>
                    </div>

                    {sites.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
                        <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-300">No Child Sites Created</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Create specific construction locations (e.g. Tower 1, Basement Excavation, Clubhouse) to track supervisors and safety guidelines.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddSiteOpen(true)}
                          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition inline-flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Create First Site</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sites.map((site) => (
                          <div
                            key={site._id}
                            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    {site.siteCode}
                                  </span>
                                  <h4 className="text-sm font-bold text-white mt-1">
                                    {site.siteName || site.name}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSiteStatus(site._id, site.status)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                                    site.status === 'ACTIVE'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                  }`}
                                  title="Click to toggle Active/Inactive"
                                >
                                  {site.status}
                                </button>
                              </div>

                              <div className="text-xs text-slate-400 space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">
                                    {[
                                      site.siteAddress?.street || site.address?.street,
                                      site.siteAddress?.city || site.address?.city,
                                      site.siteAddress?.pincode || site.address?.pincode,
                                    ]
                                      .filter(Boolean)
                                      .join(', ') || 'Address on file'}
                                  </span>
                                </div>

                                {(site.coordinates?.latitude || site.locationCoordinates?.latitude) ? (
                                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                                    <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>
                                      GPS: {(site.coordinates?.latitude || site.locationCoordinates?.latitude).toFixed(4)},{' '}
                                      {(site.coordinates?.longitude || site.locationCoordinates?.longitude).toFixed(4)}
                                    </span>
                                  </div>
                                ) : null}

                                <div className="flex items-center gap-1.5 pt-1">
                                  <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>
                                    Supervisor:{' '}
                                    <strong className="text-slate-300">
                                      {site.assignedSupervisor?.name?.firstName
                                        ? `${site.assignedSupervisor.name.firstName} ${site.assignedSupervisor.name.lastName}`
                                        : site.assignedSupervisor?.fullName || site.supervisor?.fullName || 'Unassigned'}
                                    </strong>
                                  </span>
                                </div>
                              </div>

                              {site.safetyInstructions && (
                                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-300 flex items-start gap-2">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                                  <span className="line-clamp-2">{site.safetyInstructions}</span>
                                </div>
                              )}
                            </div>

                            {site.emergencyContact?.name && (
                              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Emergency SOS:</span>
                                <span className="text-slate-300 font-semibold flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-rose-400" />
                                  {site.emergencyContact.name} ({site.emergencyContact.phone})
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: TEAM ROSTER */}
                {activeTab === 'team' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white font-['Outfit']">
                          Project Personnel & Site Assignments
                        </h3>
                        <p className="text-xs text-slate-400">
                          Staff deployments, site managers, site engineers, supervisors and store keepers
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAssignTeamOpen(true)}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Deploy Personnel</span>
                      </button>
                    </div>

                    {team.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
                        <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-semibold text-slate-300">No Active Team Assignments</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Deploy engineers, supervisors, and inventory controllers to this project.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAssignTeamOpen(true)}
                          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition inline-flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>Deploy First Member</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                            <tr>
                              <th className="py-3 px-4">Employee</th>
                              <th className="py-3 px-4">Project Designation</th>
                              <th className="py-3 px-4">Assigned Site Scope</th>
                              <th className="py-3 px-4">Deployed On</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {team.map((asg) => {
                              const emp = asg.employee;
                              const empName = emp?.name?.firstName
                                ? `${emp.name.firstName} ${emp.name.lastName}`
                                : emp?.fullName || 'Employee';
                              return (
                                <tr key={asg._id} className="hover:bg-slate-900/50 transition">
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-white">{empName}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {emp?.employeeId || 'ID'} • {emp?.designation || 'Staff'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                        ROLE_BADGES[asg.designation || asg.role]?.color || 'bg-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {ROLE_BADGES[asg.designation || asg.role]?.label || asg.designation || asg.role}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    {asg.site || asg.assignedSite ? (
                                      <span className="text-slate-300 font-medium">
                                        {asg.site?.siteName || asg.site?.siteCode || asg.assignedSite?.name || asg.assignedSite?.siteCode}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 italic">Entire Project</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4">
                                    {asg.assignedAt || asg.startDate ? new Date(asg.assignedAt || asg.startDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        asg.isActive !== false && (asg.isActive || asg.status === 'ACTIVE')
                                          ? 'bg-emerald-500/10 text-emerald-400'
                                          : 'bg-slate-800 text-slate-500'
                                      }`}
                                    >
                                      {asg.isActive !== undefined ? (asg.isActive ? 'ACTIVE' : 'RELEASED') : (asg.status || 'ACTIVE')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {(asg.isActive !== false && (asg.isActive || asg.status === 'ACTIVE')) && (
                                      <button
                                        type="button"
                                        onClick={() => handleReleaseMember(asg._id, empName)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                        title="Release personnel from project"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: STATUS HISTORY */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white font-['Outfit']">
                      Lifecycle Audit Trail
                    </h3>

                    {(!project.statusHistory || project.statusHistory.length === 0) ? (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                        No status transitions recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {project.statusHistory
                          .slice()
                          .reverse()
                          .map((hist, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-slate-400">
                                    {hist.fromStatus ? `${hist.fromStatus} → ` : 'Initial → '}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                      STATUS_CONFIG[hist.toStatus]?.color || 'text-slate-300'
                                    }`}
                                  >
                                    {STATUS_CONFIG[hist.toStatus]?.label || hist.toStatus}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300">{hist.reason}</p>
                              </div>
                              <div className="text-right text-[11px] text-slate-500 shrink-0">
                                <div>{new Date(hist.changedAt).toLocaleString()}</div>
                                <div className="text-[10px] text-slate-600">
                                  {hist.changedBy?.name || 'Authorized User'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Modals */}
      {project && (
        <>
          <AddSiteModal
            isOpen={isAddSiteOpen}
            onClose={() => setIsAddSiteOpen(false)}
            projectId={project._id}
            projectCode={project.code}
            projectName={project.name}
            employees={employees}
            onSuccess={() => {
              loadProjectDetails();
              onProjectUpdated?.();
            }}
          />

          <AssignTeamModal
            isOpen={isAssignTeamOpen}
            onClose={() => setIsAssignTeamOpen(false)}
            projectId={project._id}
            projectCode={project.code}
            projectName={project.name}
            sites={sites}
            employees={employees}
            onSuccess={() => {
              loadProjectDetails();
              onProjectUpdated?.();
            }}
          />

          <ChangeProjectStatusModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            project={project}
            onSuccess={() => {
              loadProjectDetails();
              onProjectUpdated?.();
            }}
          />
        </>
      )}
    </>
  );
};
