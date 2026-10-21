
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { leadApi } from '../api/leadApi';
import { userApi } from '../api/userApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/permissions';

import { CreateLeadModal } from '../components/leads/CreateLeadModal';
import { ChangeLeadStatusModal } from '../components/leads/ChangeLeadStatusModal';
import { AssignLeadModal } from '../components/leads/AssignLeadModal';
import { LeadTimelineModal } from '../components/leads/LeadTimelineModal';
import { CreateProposalModal } from '../components/proposals/CreateProposalModal';
import { LeadDistributionModal } from '../components/leads/LeadDistributionModal';
import { QualifyLeadModal } from '../components/leads/QualifyLeadModal';
import { SiteVisitModal } from '../components/leads/SiteVisitModal';
import { CloseDealModal } from '../components/leads/CloseDealModal';
import { PaymentTrackingModal } from '../components/leads/PaymentTrackingModal';
import { ProjectHandoverModal } from '../components/leads/ProjectHandoverModal';

import {
  Target,
  Plus,
  Search,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Clock,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
  CheckCircle2,
  Compass,
  Globe,
  RotateCw,
  HardHat,
  Trophy,
  CreditCard,
  ChevronDown,
  Activity,
} from 'lucide-react';

const STATUS_CONFIG = {
  NEW: {
    label: 'New Inquiry',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  },
  CONTACTED: {
    label: 'Contacted',
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  NOT_CONNECTED: {
    label: 'Not Connected',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  QUALIFIED: {
    label: 'Qualified',
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  REQUIREMENT_GATHERING: {
    label: 'Requirement Gathering',
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  SITE_VISIT_SCHEDULED: {
    label: 'Site Visit Scheduled',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  SITE_VISIT_COMPLETED: {
    label: 'Site Visit Completed',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  SITE_VISIT_DONE: {
    label: 'Site Visit Completed',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  PROPOSAL_IN_PROGRESS: {
    label: 'Costing / BOQ',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  ESTIMATION_IN_PROGRESS: {
    label: 'Costing / BOQ',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  PROPOSAL_SENT: {
    label: 'Quote Submitted',
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  PROPOSAL_SUBMITTED: {
    label: 'Quote Submitted',
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  NEGOTIATION: {
    label: 'Negotiation',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  CONVERTED: {
    label: 'Won (Awarded)',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  WON: {
    label: 'Won (Awarded)',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  LOST: {
    label: 'Lost / Dropped',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  ON_HOLD: {
    label: 'On Hold',
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'bg-slate-700/10 text-slate-500 border-slate-700/20',
  },
  FAKE_LEAD: {
    label: 'Fake Lead',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  SPAM: {
    label: 'Spam / Invalid',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
};

const PROPOSAL_STATUSES = [
  'PROPOSAL_IN_PROGRESS',
  'ESTIMATION_IN_PROGRESS',
  'PROPOSAL_SENT',
  'PROPOSAL_SUBMITTED',
  'NEGOTIATION',
  'CONVERTED',
  'WON',
];

const WON_STATUSES = ['CONVERTED', 'WON'];

const PROJECT_TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial Shed' },
  { value: 'RENOVATION', label: 'Renovation' },
  { value: 'INTERIOR', label: 'Turnkey Interior' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'OTHER', label: 'Other' },
];

const formatInr = (amount) => {
  if (amount === undefined || amount === null || amount === '') {
    return '—';
  }

  const number = Number(amount);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(number);
};

const formatDate = (date) => {
  if (!date) return '—';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const isFollowUpOverdue = (dateStr) => {
  if (!dateStr) return false;

  const target = new Date(dateStr);

  if (Number.isNaN(target.getTime())) return false;

  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return target < today;
};

const getLeadName = (lead) =>
  lead?.clientName || lead?.name || 'Unnamed Client';

const getLeadIdentifier = (lead) =>
  lead?.leadNumber || lead?.clientName || lead?._id;

const getLeadLocation = (lead) => {
  if (typeof lead?.siteAddress === 'string') {
    return lead.siteAddress;
  }

  return (
    lead?.siteAddress?.street ||
    lead?.siteAddress?.city ||
    lead?.city ||
    'Location not provided'
  );
};

const ActionMenuItem = ({
  title,
  description,
  onClick,
  disabled = false,
  danger = false,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation();

      const details = event.currentTarget.closest('details');

      if (details) details.open = false;

      onClick?.();
    }}
    className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-800/80 last:border-b-0
      disabled:opacity-40 disabled:cursor-not-allowed text-black
      ${danger
        ? 'hover:bg-rose-500/10'
        : 'hover:bg-slate-200'
      }`}
  >
    <span
      className={`block text-xs font-semibold  ${danger ? 'text-red' : 'text-slate-800'
        }`}
    >
      {title}
    </span>

    {/* <span className="block text-[11px] text-black leading-relaxed mt-1 whitespace-normal">
      {description}
    </span> */}
  </button>
);


const LeadActionsDropdown = ({
  lead,
  canAssignLeads,
  onTimeline,
  onQualify,
  onSiteVisit,
  onProposal,
  onCloseDeal,
  onPayments,
  onHandover,
  onAssign,
  onStatus,
  onNavigateTab,
}) => {
  const dropdownRef = useRef(null);

  const isWon = WON_STATUSES.includes(lead.status);
  const hasProposal = PROPOSAL_STATUSES.includes(lead.status);

  const isTerminal = [
    'LOST',
    'ARCHIVED',
    'SPAM',
    'FAKE_LEAD',
  ].includes(lead.status);

  // Close the dropdown whenever the user clicks outside it.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const dropdown = dropdownRef.current;

      if (dropdown && !dropdown.contains(event.target)) {
        dropdown.open = false;
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, []);

  return (
    <details
      ref={dropdownRef}
      className="relative inline-block text-left"
    >
      <summary
        className="list-none cursor-pointer select-none inline-flex items-center justify-center gap-2 min-w-[112px] px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-xs font-semibold hover:border-amber-500/60 hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 [&::-webkit-details-marker]:hidden"
        aria-label={`Actions for ${getLeadName(lead)}`}
      >
        Actions
        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
      </summary>

      <div className="absolute right-0 top-full mt-2 w-[290px] max-w-[calc(100vw-32px)] rounded-xl border border-slate-700 bg-slate-50 text-slate-950 shadow-2xl z-[9999] overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
          <p className="text-xs text-black font-bold">
            Lead Actions
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {getLeadIdentifier(lead)}
          </p>
        </div>

        <div className="max-h-[min(65vh,480px)] overflow-y-auto">
          <ActionMenuItem
            title="Lead Timeline & Follow-up"
            onClick={onTimeline}
          />

          <ActionMenuItem
            title="Qualify Lead"
            onClick={onQualify}
          />

          <ActionMenuItem
            title="Schedule / Manage Site Visit"
            onClick={onSiteVisit}
          />

          {!isTerminal && (
            <ActionMenuItem
              title={
                hasProposal
                  ? 'Manage BOQ / Proposal'
                  : 'Create BOQ / Proposal'
              }
              onClick={() => {
                if (hasProposal && onNavigateTab) {
                  onNavigateTab('proposals', {
                    search: getLeadIdentifier(lead),
                  });
                } else {
                  onProposal();
                }
              }}
              disabled={
                !hasProposal &&
                ['NEW', 'ASSIGNED', 'NOT_CONNECTED'].includes(
                  lead.status
                )
              }
            />
          )}

          <ActionMenuItem
            title="Close Deal (Won / Lost)"
            onClick={onCloseDeal}
            disabled={isWon || lead.status === 'LOST'}
          />

          {isWon && (
            <>
              <ActionMenuItem
                title="Payment Tracking"
                onClick={onPayments}
              />

              <ActionMenuItem
                title="Project Handover"
                onClick={onHandover}
              />
            </>
          )}

          {canAssignLeads && (
            <ActionMenuItem
              title="Assign / Reassign Salesperson"
              onClick={onAssign}
            />
          )}

          <ActionMenuItem
            title="Update Pipeline Status"
            onClick={onStatus}
          />
        </div>
      </div>
    </details>
  );
};


export const LeadsPage = ({ onNavigateTab, tabParams }) => {
  const { showToast } = useToast();
  const { user, hasRole, isSuperAdmin } = useAuth();

  const canAssignLeads =
    isSuperAdmin ||
    hasRole(ROLES.SUPER_ADMIN) ||
    hasRole(ROLES.MANAGER);

  const canUseDistribution =
    hasRole(ROLES.SUPER_ADMIN) ||
    hasRole(ROLES.MANAGER) ||
    hasRole(ROLES.ADMIN);

  // Data state
  const [leads, setLeads] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [salesUsers, setSalesUsers] = useState([]);
  const [alerts, setAlerts] = useState({
    overdue: [],
    today: [],
  });

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState(null);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState(null);
  const [selectedLeadForTimeline, setSelectedLeadForTimeline] = useState(null);
  const [selectedLeadForProposal, setSelectedLeadForProposal] = useState(null);
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  const [selectedLeadForQualify, setSelectedLeadForQualify] = useState(null);
  const [selectedLeadForSiteVisit, setSelectedLeadForSiteVisit] = useState(null);
  const [selectedLeadForCloseDeal, setSelectedLeadForCloseDeal] = useState(null);
  const [selectedLeadForPayments, setSelectedLeadForPayments] = useState(null);
  const [selectedLeadForHandover, setSelectedLeadForHandover] = useState(null);

  // Availability state
  const [isAvailable, setIsAvailable] = useState(
    user?.isAvailableForLeads ?? true
  );
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  useEffect(() => {
    if (user?.isAvailableForLeads !== undefined) {
      setIsAvailable(user.isAvailableForLeads);
    }
  }, [user]);

  const handleToggleMyAvailability = async () => {
    if (isTogglingAvailability) return;

    try {
      setIsTogglingAvailability(true);

      const nextState = !isAvailable;

      await leadApi.toggleAvailability({
        isAvailableForLeads: nextState,
      });

      setIsAvailable(nextState);

      showToast(
        nextState
          ? 'You are now available for incoming leads.'
          : 'You are now away. Incoming lead assignment is paused for you.',
        'success'
      );
    } catch (err) {
      showToast(
        err.response?.data?.message ||
        err.message ||
        'Failed to update lead availability.',
        'error'
      );
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const loadSalesUsers = useCallback(async () => {
    try {
      const res = await userApi.getUsers({ limit: 100 });

      const userList =
        res?.data?.users ||
        res?.users ||
        (Array.isArray(res?.data) ? res.data : []);

      setSalesUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error('Failed to load users for assignment:', err);
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await leadApi.getFollowUpAlerts();
      const alertData = res?.data || res;

      setAlerts({
        overdue: Array.isArray(alertData?.overdue)
          ? alertData.overdue
          : [],
        today: Array.isArray(alertData?.today)
          ? alertData.today
          : [],
      });
    } catch (err) {
      console.error('Failed to load follow-up alerts:', err);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (projectTypeFilter) params.projectType = projectTypeFilter;

      const res = await leadApi.getLeads(params);

      const leadList = Array.isArray(res?.data)
        ? res.data
        : res?.data?.leads || res?.leads || [];

      setLeads(Array.isArray(leadList) ? leadList : []);

      const pag =
        res?.meta?.pagination ||
        res?.data?.pagination ||
        res?.pagination;

      if (pag) {
        setPagination((prev) => ({
          ...prev,
          page: pag.page || params.page,
          limit: pag.limit || params.limit,
          total: pag.total ?? leadList.length,
          pages: pag.totalPages || pag.pages || 1,
        }));
      } else {
        setPagination((prev) => ({
          ...prev,
          total: leadList.length,
          pages: 1,
        }));
      }
    } catch (err) {
      showToast(
        err.response?.data?.message ||
        err.message ||
        'Failed to load leads.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    statusFilter,
    projectTypeFilter,
    showToast,
  ]);

  useEffect(() => {
    loadSalesUsers();
    loadAlerts();
  }, [loadSalesUsers, loadAlerts]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Support sidebar filters and quick actions.
  useEffect(() => {
    if (tabParams?.filter !== undefined) {
      setStatusFilter(
        tabParams.filter === 'FOLLOW_UP' ? '' : tabParams.filter
      );
      setPagination((prev) => ({ ...prev, page: 1 }));
    }

    if (tabParams?.autoOpenCreate) {
      setIsCreateModalOpen(true);
    }
  }, [tabParams]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    // loadLeads runs through the effect when page/search state changes.
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadLeads();
  };

  const handleRefresh = () => {
    loadLeads();
    loadAlerts();
  };

  const refreshAfterUpdate = () => {
    loadLeads();
    loadAlerts();
  };

  const inspectionCount = leads.filter((lead) =>
    [
      'SITE_VISIT_SCHEDULED',
      'SITE_VISIT_COMPLETED',
      'SITE_VISIT_DONE',
    ].includes(lead.status)
  ).length;

  const proposalCount = leads.filter((lead) =>
    [
      'PROPOSAL_IN_PROGRESS',
      'ESTIMATION_IN_PROGRESS',
      'PROPOSAL_SENT',
      'PROPOSAL_SUBMITTED',
      'NEGOTIATION',
    ].includes(lead.status)
  ).length;

  const wonCount = leads.filter((lead) =>
    WON_STATUSES.includes(lead.status)
  ).length;

  return (
    <div className="space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            Construction Leads & Inquiries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage client inquiries, site visits, quotations and deal closures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleMyAvailability}
            disabled={isTogglingAvailability}
            title={
              isAvailable
                ? 'Click to pause receiving lead assignments.'
                : 'Click to resume receiving lead assignments.'
            }
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 disabled:opacity-50 ${isAvailable
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
            />
            {isTogglingAvailability
              ? 'Updating...'
              : isAvailable
                ? 'Available for Leads'
                : 'Away (Paused)'}
          </button>

          {canUseDistribution && (
            <button
              type="button"
              onClick={() => setIsDistributionModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Auto-Distribution Engine
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh leads and follow-up alerts"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </button>
        </div>
      </div>

      {/* Overdue Follow-up Alert */}
      {alerts.overdue.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-rose-300">
                Action Required: {alerts.overdue.length} overdue follow-up(s)
              </p>
              <p className="text-[11px] text-rose-400/80 mt-1">
                Review missed callbacks and scheduled site visits.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold shrink-0">
            {alerts.overdue.length} Pending
          </span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Leads
            </span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {pagination.total}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Total matching records
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Site Inspections
            </span>
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">
            {inspectionCount}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Scheduled and completed on this page
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Under BOQ Quote
            </span>
            <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-black text-yellow-400">
            {proposalCount}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Costing and commercial review
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Awarded (Won)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {wonCount}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Won leads on this page
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full md:w-80"
        >
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client, phone, lead #..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Pipeline Stages</option>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={projectTypeFilter}
            onChange={(event) => {
              setProjectTypeFilter(event.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Project Types</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div className="overflow-x-auto overflow-y-visible rounded-2xl">
          <table className="w-full min-w-[1150px] text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Lead # / Source</th>
                <th className="py-3.5 px-4">Client & Contact</th>
                <th className="py-3.5 px-4">Project & Location</th>
                <th className="py-3.5 px-4">Budget / Area</th>
                <th className="py-3.5 px-4">Pipeline Status</th>
                <th className="py-3.5 px-4">Assigned Rep</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4 text-right z-99 ">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading construction inquiries...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-300">
                      No leads found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try another filter or create a new lead.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusConf = STATUS_CONFIG[lead.status] || {
                    label: String(lead.status || 'Unknown').replace(/_/g, ' '),
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                  };

                  const overdue = isFollowUpOverdue(lead.nextFollowUpDate);

                  return (
                    <tr
                      key={lead._id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Lead Number / Source */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedLeadForTimeline(lead)}
                            className="font-mono text-xs font-bold text-amber-400 hover:underline text-left"
                          >
                            {lead.leadNumber || 'View lead'}
                          </button>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {lead.isWebsiteLead && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Globe className="inline w-2.5 h-2.5 mr-1" />
                                Web
                              </span>
                            )}

                            <span className="text-[10px] text-slate-500 uppercase">
                              {(lead.leadSource || 'Unknown source').replace(/_/g, ' ')}
                            </span>
                          </div>

                          {lead.assignmentType === 'AUTOMATIC_ROUND_ROBIN' && (
                            <span className="text-[9px] text-cyan-400 font-semibold">
                              Auto-assigned
                            </span>
                          )}

                          {lead.assignmentType === 'UNASSIGNED_FALLBACK' && (
                            <span className="text-[9px] text-rose-400 font-semibold">
                              Assignment fallback
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-white">
                            {getLeadName(lead)}
                          </span>

                          {lead.company && (
                            <span className="text-[10px] text-slate-400">
                              {lead.company}
                            </span>
                          )}

                          <span className="text-slate-400 text-[11px]">
                            {lead.phone || 'No phone'}
                          </span>

                          {lead.email && (
                            <span className="text-slate-500 text-[10px] break-all">
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Project & Location */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-200 font-medium">
                            {(lead.projectType || 'Not specified').replace(/_/g, ' ')}
                          </span>

                          <span className="text-[11px] text-slate-400 flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span className="max-w-[170px] whitespace-normal break-words">
                              {getLeadLocation(lead)}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Budget / Area */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-white font-mono">
                            {formatInr(lead.acceptedAmount ?? lead.budget)}
                          </span>

                          <span className="text-[10px] text-slate-500">
                            {Number(lead.estimatedAreaSqFt) > 0
                              ? `${Number(lead.estimatedAreaSqFt).toLocaleString('en-IN')} sqft`
                              : 'Area TBD'}
                          </span>

                          {Number(lead.totalPaid) > 0 && (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                              Paid: {formatInr(lead.totalPaid)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border tracking-wide ${statusConf.color}`}
                          >
                            {statusConf.label}
                          </span>

                          {lead.qualification?.outcome && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${lead.qualification.outcome === 'QUALIFIED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : lead.qualification.outcome === 'NEEDS_NURTURING'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                            >
                              {lead.qualification.outcome.replace(/_/g, ' ')}
                            </span>
                          )}

                          {lead.handoverStatus === 'HANDED_OVER' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Handed Over
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Rep */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span className="text-slate-300 font-medium whitespace-normal max-w-[130px]">
                            {lead.assignedTo?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3 px-4">
                        {lead.nextFollowUpDate ? (
                          <div className="flex items-center gap-1.5">
                            <Clock
                              className={`w-3.5 h-3.5 ${overdue ? 'text-rose-400' : 'text-slate-500'
                                }`}
                            />
                            <span
                              className={`text-[11px] font-medium ${overdue
                                ? 'text-rose-400 font-semibold'
                                : 'text-slate-300'
                                }`}
                            >
                              {formatDate(lead.nextFollowUpDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">
                            Not scheduled
                          </span>
                        )}
                      </td>

                      {/* Text-based Actions Dropdown */}
                      <td className="py-3 px-4 text-right">
                        <LeadActionsDropdown
                          lead={lead}
                          canAssignLeads={canAssignLeads}
                          onTimeline={() => setSelectedLeadForTimeline(lead)}
                          onQualify={() => setSelectedLeadForQualify(lead)}
                          onSiteVisit={() => setSelectedLeadForSiteVisit(lead)}
                          onProposal={() => setSelectedLeadForProposal(lead)}
                          onCloseDeal={() => setSelectedLeadForCloseDeal(lead)}
                          onPayments={() => setSelectedLeadForPayments(lead)}
                          onHandover={() => setSelectedLeadForHandover(lead)}
                          onAssign={() => setSelectedLeadForAssign(lead)}
                          onStatus={() => setSelectedLeadForStatus(lead)}
                          onNavigateTab={onNavigateTab}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing{' '}
            {leads.length > 0
              ? (pagination.page - 1) * pagination.limit + 1
              : 0}{' '}
            to{' '}
            {Math.min(
              (pagination.page - 1) * pagination.limit + leads.length,
              pagination.total
            )}{' '}
            of {pagination.total} leads
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={isLoading || pagination.page <= 1}
              className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono px-2 text-slate-300">
              {pagination.page} / {Math.max(1, pagination.pages)}
            </span>

            <button
              type="button"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(
                    Math.max(1, prev.pages),
                    prev.page + 1
                  ),
                }))
              }
              disabled={isLoading || pagination.page >= pagination.pages}
              className="p-2 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Lead */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={refreshAfterUpdate}
        salesUsers={salesUsers}
      />

      {/* Update Status */}
      <ChangeLeadStatusModal
        isOpen={!!selectedLeadForStatus}
        lead={selectedLeadForStatus}
        onClose={() => setSelectedLeadForStatus(null)}
        onUpdated={refreshAfterUpdate}
      />

      {/* Assign Lead */}
      <AssignLeadModal
        isOpen={!!selectedLeadForAssign}
        lead={selectedLeadForAssign}
        onClose={() => setSelectedLeadForAssign(null)}
        salesUsers={salesUsers}
        onUpdated={refreshAfterUpdate}
      />

      {/* Timeline & Follow-up */}
      <LeadTimelineModal
        isOpen={!!selectedLeadForTimeline}
        lead={selectedLeadForTimeline}
        onClose={() => setSelectedLeadForTimeline(null)}
        onUpdated={refreshAfterUpdate}
      />

      {/* Create Proposal */}
      <CreateProposalModal
        isOpen={!!selectedLeadForProposal}
        lead={selectedLeadForProposal}
        onClose={() => setSelectedLeadForProposal(null)}
        onCreated={() => {
          showToast('Proposal created successfully!', 'success');
          refreshAfterUpdate();

          if (onNavigateTab) {
            onNavigateTab('proposals');
          }
        }}
      />

      {/* Automatic Lead Distribution */}
      <LeadDistributionModal
        isOpen={isDistributionModalOpen}
        onClose={() => setIsDistributionModalOpen(false)}
        salesUsers={salesUsers}
        onRefreshLeads={refreshAfterUpdate}
      />

      {/* Qualify Lead */}
      <QualifyLeadModal
        isOpen={!!selectedLeadForQualify}
        lead={selectedLeadForQualify}
        onClose={() => setSelectedLeadForQualify(null)}
        onUpdated={refreshAfterUpdate}
      />

      {/* Site Visit */}
      <SiteVisitModal
        isOpen={!!selectedLeadForSiteVisit}
        lead={selectedLeadForSiteVisit}
        users={salesUsers}
        onClose={() => setSelectedLeadForSiteVisit(null)}
        onUpdated={refreshAfterUpdate}
      />

      {/* Close Deal */}
      <CloseDealModal
        isOpen={!!selectedLeadForCloseDeal}
        lead={selectedLeadForCloseDeal}
        onClose={() => setSelectedLeadForCloseDeal(null)}
        onUpdated={refreshAfterUpdate}
      />

      {/* Payment Tracking */}
      <PaymentTrackingModal
        isOpen={!!selectedLeadForPayments}
        lead={selectedLeadForPayments}
        onClose={() => setSelectedLeadForPayments(null)}
        onUpdated={refreshAfterUpdate}
      />

      {/* Project Handover */}
      <ProjectHandoverModal
        isOpen={!!selectedLeadForHandover}
        lead={selectedLeadForHandover}
        users={salesUsers}
        onClose={() => setSelectedLeadForHandover(null)}
        onUpdated={refreshAfterUpdate}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
