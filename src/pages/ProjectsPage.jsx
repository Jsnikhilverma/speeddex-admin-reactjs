import React, { useState, useEffect } from 'react';
import { projectApi } from '../api/projectApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/permissions';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal';
import { ChangeProjectStatusModal } from '../components/projects/ChangeProjectStatusModal';
import { PageHeaderGuide } from '../components/common/PageHeaderGuide';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  IndianRupee,
  MapPin,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  Archive,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: '', label: 'All Projects' },
  { id: 'PLANNED', label: 'Planned' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'ON_HOLD', label: 'On Hold' },
  { id: 'COMPLETED', label: 'Completed' },
];

const STATUS_CONFIG = {
  PLANNED: { label: 'Planned', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  APPROVED: { label: 'Approved', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ON_HOLD: { label: 'On Hold', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  COMPLETED: { label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

const PRIORITY_BADGES = {
  LOW: 'bg-slate-800 text-slate-400',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  URGENT: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export const ProjectsPage = ({ onNavigateTab, tabParams }) => {
  const { showToast } = useToast();
  const { user, hasRole } = useAuth();

  // State
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectIdForDetail, setSelectedProjectIdForDetail] = useState(null);
  const [selectedProjectForStatus, setSelectedProjectForStatus] = useState(null);

  useEffect(() => {
    loadProjects();
  }, [pagination.page, statusFilter, projectTypeFilter]);

  // Sync with Sidebar sub-links and Quick Actions
  useEffect(() => {
    if (tabParams?.filter !== undefined) {
      setStatusFilter(tabParams.filter);
    }
    if (tabParams?.autoOpenCreate) {
      setIsCreateModalOpen(true);
    }
  }, [tabParams]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (projectTypeFilter) params.projectType = projectTypeFilter;

      const res = await projectApi.getProjects(params);
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.projects || res.projects || []);
      const pag = res.pagination || res.meta?.pagination || res.data?.pagination || {
        page: pagination.page,
        limit: pagination.limit,
        total: list.length,
        pages: Math.ceil(list.length / pagination.limit) || 1,
      };

      setProjects(list);
      setPagination(pag);
    } catch (err) {
      console.error('Failed to load projects', err);
      showToast('Failed to load projects: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadProjects();
  };

  const handleArchive = async (project) => {
    const code = project.projectCode || project.code;
    if (!window.confirm(`Are you sure you want to archive project [${code}] ${project.name}?`)) {
      return;
    }
    const reason = window.prompt('Enter reason for archiving project:', 'Project archived by administrator');
    if (!reason) return;

    try {
      await projectApi.archiveProject(project._id, { reason });
      showToast('Project archived successfully', 'success');
      loadProjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to archive project', 'error');
    }
  };

  // Metrics computation
  const totalProjects = pagination.total || projects.length;
  const inProgressCount = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const plannedCount = projects.filter((p) => p.status === 'PLANNED' || p.status === 'APPROVED').length;
  const totalValue = projects.reduce((acc, p) => acc + (Number(p.contractAmount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Contextual User Experience Guide */}


      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <HardHat className="w-5 h-5 stroke-[2.5]" />
            </div> */}
            <div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-white tracking-wide">
                Projects & Site Operations
              </h1>
              {/* <p className="text-xs text-slate-400">
                Manage construction projects, converted CRM lead handovers, child sites & site personnel rosters
              </p> */}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadProjects}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {(hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.MANAGER)) && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Projects
            </span>
            <span className="text-2xl font-bold font-['Outfit'] text-white mt-1 block">
              {totalProjects}
            </span>
            <span className="text-[10px] text-slate-500">All registered contracts</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Execution
            </span>
            <span className="text-2xl font-bold font-['Outfit'] text-amber-400 mt-1 block">
              {inProgressCount}
            </span>
            <span className="text-[10px] text-slate-500">Live civil site operations</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardHat className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pre-Construction
            </span>
            <span className="text-2xl font-bold font-['Outfit'] text-teal-400 mt-1 block">
              {plannedCount}
            </span>
            <span className="text-[10px] text-slate-500">Planning & Mobilization</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Current Contract Value
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center">
              <IndianRupee className="w-4 h-4" />
              <span>{totalValue.toLocaleString('en-IN')}</span>
            </span>
            <span className="text-[10px] text-slate-500">Active portfolio volume</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code (PRJ-...), project name, client..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          {/* Project Type Filter */}
          <div className="flex items-center gap-2">
            <select
              value={projectTypeFilter}
              onChange={(e) => {
                setProjectTypeFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Project Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="RENOVATION">Renovation</option>
              <option value="INTERIOR">Interior</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStatusFilter(f.id);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${statusFilter === f.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table / List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
            <p className="text-sm">Fetching construction project records...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <HardHat className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No construction projects match your search criteria. Initialize a new project or handover a converted lead.
            </p>
            {(hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.MANAGER)) && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Initialize Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Project Code & Name</th>
                  <th className="py-3.5 px-4 font-semibold">Client & City</th>
                  <th className="py-3.5 px-4 font-semibold">Timeline</th>
                  <th className="py-3.5 px-4 font-semibold">Contract & Budget</th>
                  <th className="py-3.5 px-4 font-semibold">Project Lead</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {projects.map((project) => {
                  const client = project.client || {};
                  const pm = project.projectManager;
                  const pmName = pm?.name?.firstName
                    ? `${pm.name.firstName} ${pm.name.lastName}`
                    : pm?.fullName || 'Unassigned';

                  return (
                    <tr
                      key={project._id}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => setSelectedProjectIdForDetail(project._id)}
                    >
                      {/* Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {project.projectCode || project.code}
                          </span>
                          {(project.handoverSnapshot?.sourceLeadId || project.handoverSnapshot?.leadId || project.originalLead) && (
                            <span
                              className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20"
                              title="Handover from Converted CRM Lead"
                            >
                              CRM
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white text-sm mt-1 group-hover:text-amber-400 transition">
                          {project.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {project.projectType} • Priority: {project.priority}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{client.name || 'Private Client'}</div>
                        <div className="text-[11px] text-slate-400">{client.phone}</div>
                        <div className="text-[10px] text-slate-500">
                          {project.siteAddress?.city || client.billingAddress?.city || 'Indore'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Target:{' '}
                          {project.plannedCompletionDate
                            ? new Date(project.plannedCompletionDate).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="py-3.5 px-4">
                        {project.contractAmount !== undefined ? (
                          <>
                            <div className="font-bold font-mono text-emerald-400 text-xs">
                              ₹{Number(project.contractAmount).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Budget: ₹{Number(project.approvedBudget || 0).toLocaleString('en-IN')}
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Restricted</span>
                        )}
                      </td>

                      {/* PM */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-medium truncate max-w-[120px]">{pmName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_CONFIG[project.status]?.color || 'text-slate-300'
                            }`}
                        >
                          {STATUS_CONFIG[project.status]?.label || project.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectIdForDetail(project._id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="View Full Profile, Sites & Team"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.MANAGER)) && (
                            <button
                              type="button"
                              onClick={() => setSelectedProjectForStatus(project)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                              title="Update Lifecycle Status"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          {hasRole(ROLES.SUPER_ADMIN) && (
                            <button
                              type="button"
                              onClick={() => handleArchive(project)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                              title="Archive Project"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadProjects();
        }}
      />

      <ProjectDetailModal
        isOpen={!!selectedProjectIdForDetail}
        onClose={() => setSelectedProjectIdForDetail(null)}
        projectId={selectedProjectIdForDetail}
        onProjectUpdated={() => {
          loadProjects();
        }}
      />

      <ChangeProjectStatusModal
        isOpen={!!selectedProjectForStatus}
        onClose={() => setSelectedProjectForStatus(null)}
        project={selectedProjectForStatus}
        onSuccess={() => {
          loadProjects();
        }}
      />
    </div>
  );
};
