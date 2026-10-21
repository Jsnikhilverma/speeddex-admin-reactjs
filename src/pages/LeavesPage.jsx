import React, { useState, useEffect, useCallback } from 'react';
import { leaveApi } from '../api/leaveApi';
import { departmentApi } from '../api/departmentApi';
import { employeeApi } from '../api/employeeApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/permissions';
import { LeaveTable } from '../components/leaves/LeaveTable';
import { ApplyLeaveModal } from '../components/leaves/ApplyLeaveModal';
import { LeaveApprovalModal } from '../components/leaves/LeaveApprovalModal';
import { LeaveTimelineModal } from '../components/leaves/LeaveTimelineModal';
import { AdminOverrideModal } from '../components/leaves/AdminOverrideModal';
import { LifetimeLeaveSummaryView } from '../components/leaves/LifetimeLeaveSummaryView';
import { PageHeaderGuide } from '../components/common/PageHeaderGuide';
import {
  Calendar,
  Plus,
  Clock,
  ShieldCheck,
  Building2,
  Filter,
  RefreshCw,
  Inbox,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const LeavesPage = ({ tabParams }) => {
  const { user, isSuperAdmin, hasRole } = useAuth();
  const { showToast } = useToast();

  const canApprove = isSuperAdmin || hasRole(ROLES.HR, ROLES.MANAGER);
  const isHRorSuperAdmin = isSuperAdmin || hasRole(ROLES.HR);

  const [activeTab, setActiveTab] = useState(tabParams?.subTab || 'my'); // 'my' | 'pending' | 'all' | 'lifetime'
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [lifetimeSummary, setLifetimeSummary] = useState(null);
  const [pendingStats, setPendingStats] = useState({ managerPending: [], hrPending: [], totalPending: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [departments, setDepartments] = useState([]);

  // Modals
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionStage, setDecisionStage] = useState('MANAGER');
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: 'ALL',
    leaveType: 'ALL',
    department: '',
  });

  const [isLoading, setIsLoading] = useState(true);

  const [employees, setEmployees] = useState([]);

  // Load departments and workforce for application
  useEffect(() => {
    departmentApi
      .getDepartments({ limit: 100, isActive: true })
      .then((res) => setDepartments(res.data.departments || []))
      .catch(() => { });

    employeeApi
      .getEmployees({ limit: 100, status: 'ALL' })
      .then((res) => {
        const list = res.data?.employees || (Array.isArray(res.data) ? res.data : []);
        setEmployees(list);
      })
      .catch(() => { });
  }, []);

  // Fetch pending counter
  const fetchPendingQueue = useCallback(async () => {
    if (!canApprove) return;
    try {
      const res = await leaveApi.getPendingApprovals();
      setPendingStats(res.data);
      if (activeTab === 'pending') {
        const combined = [...(res.data.managerPending || []), ...(res.data.hrPending || [])];
        setPendingLeaves(combined);
      }
    } catch (err) {
      console.warn('Pending leave queue error:', err);
    }
  }, [canApprove, activeTab]);

  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);

        if (activeTab === 'my') {
          const res = await leaveApi.getMyLeaves({ page, limit: 15 });
          setMyLeaves(res.data.leaves || []);
          setPagination(res.data.pagination);
        } else if (activeTab === 'lifetime') {
          const res = await leaveApi.getMyLeaveSummary();
          setLifetimeSummary(res.data || null);
        } else if (activeTab === 'pending') {
          await fetchPendingQueue();
        } else if (activeTab === 'all') {
          const res = await leaveApi.getAllLeaves({
            page,
            limit: 20,
            status: filters.status !== 'ALL' ? filters.status : undefined,
            leaveType: filters.leaveType !== 'ALL' ? filters.leaveType : undefined,
            department: filters.department || undefined,
          });
          setAllLeaves(res.data.leaves || []);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        showToast(err.message || 'Failed to fetch leave applications', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, filters, showToast, fetchPendingQueue]
  );

  useEffect(() => {
    fetchPendingQueue();
  }, [fetchPendingQueue]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Handlers
  const handleApply = async (formData) => {
    try {
      const res = await leaveApi.applyLeave(formData);
      showToast(res.message || 'Leave application submitted successfully!', 'success');
      fetchData(1);
      fetchPendingQueue();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to apply for leave', 'error');
    }
  };

  const handleDecision = async (leaveId, decisionData) => {
    try {
      let res;
      if (decisionStage === 'MANAGER') {
        res = await leaveApi.managerDecision(leaveId, decisionData);
      } else {
        res = await leaveApi.hrDecision(leaveId, decisionData);
      }
      showToast(res.message || 'Decision recorded successfully', 'success');
      fetchData(pagination.page);
      fetchPendingQueue();
    } catch (err) {
      showToast(err.message || 'Failed to submit decision', 'error');
    }
  };

  const handleOverride = async (leaveId, overrideData) => {
    try {
      const res = await leaveApi.superAdminOverride(leaveId, overrideData);
      showToast(res.message || 'Administrative override executed', 'success');
      fetchData(pagination.page);
      fetchPendingQueue();
    } catch (err) {
      showToast(err.message || 'Failed to execute override', 'error');
    }
  };

  const handleWithdraw = async (leave) => {
    const reason = window.prompt(
      `Are you sure you want to withdraw your leave application for ${leave.startDateStr} to ${leave.endDateStr}?\nEnter optional reason:`,
      'Plans changed'
    );
    if (reason === null) return;

    try {
      const res = await leaveApi.withdrawLeave(leave._id, { reason });
      showToast(res.message || 'Leave application withdrawn', 'success');
      fetchData(pagination.page);
      fetchPendingQueue();
    } catch (err) {
      showToast(err.message || 'Failed to withdraw leave', 'error');
    }
  };

  const handleOpenDecisionModal = (leave, stage) => {
    setSelectedLeave(leave);
    setDecisionStage(stage);
    setIsDecisionOpen(true);
  };

  const handleOpenTimelineModal = (leave) => {
    setSelectedLeave(leave);
    setIsTimelineOpen(true);
  };

  const handleOpenOverrideModal = (leave) => {
    setSelectedLeave(leave);
    setIsOverrideOpen(true);
  };

  // Sync with Sidebar sub-links and Quick Actions
  useEffect(() => {
    if (tabParams?.subTab) {
      setActiveTab(tabParams.subTab);
    }
    if (tabParams?.autoOpenApply) {
      setIsApplyOpen(true);
    }
  }, [tabParams]);

  return (
    <div className="space-y-6">
      {/* Contextual User Experience Guide */}


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            {/* <Calendar className="w-4 h-4" /> */}
            {/* <span>Time Off & Shift Approvals</span> */}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
            Leave Management & 2-Stage Approvals
          </h1>
          {/* <p className="text-xs text-slate-400 mt-0.5">
            Submit leave requests, manage multi-tier approvals, and avoid overlapping scheduling conflicts
          </p> */}
        </div>

        <button
          onClick={() => setIsApplyOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>APPLY FOR LEAVE</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'my'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Applications</span>
          </button>

          {canApprove && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Approvals Queue</span>
              {pendingStats.totalPending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-bounce">
                  {pendingStats.totalPending}
                </span>
              )}
            </button>
          )}

          {isHRorSuperAdmin && (
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Leave Master</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('lifetime')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'lifetime'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Lifetime Summary & Reports</span>
          </button>
        </div>

        {/* Filters for Company Master Tab */}
        {activeTab === 'all' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_MANAGER">Stage 1: Pending Manager</option>
              <option value="PENDING_HR">Stage 2: Pending HR</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED_BY_MANAGER">Rejected by Manager</option>
              <option value="REJECTED_BY_HR">Rejected by HR</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <button
              onClick={() => fetchData(1)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title="Refresh Records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content based on tab */}
      {activeTab === 'my' && (
        <LeaveTable
          leaves={myLeaves}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={(p) => fetchData(p)}
          onOpenTimeline={handleOpenTimelineModal}
          onWithdraw={handleWithdraw}
          currentUserId={user?._id}
          userRole={user?.role}
        />
      )}

      {activeTab === 'pending' && (
        <LeaveTable
          leaves={pendingLeaves}
          pagination={{ page: 1, totalPages: 1, total: pendingLeaves.length }}
          isLoading={isLoading}
          onPageChange={() => { }}
          onOpenTimeline={handleOpenTimelineModal}
          onOpenDecision={handleOpenDecisionModal}
          onOpenOverride={handleOpenOverrideModal}
          currentUserId={user?._id}
          userRole={user?.role}
        />
      )}

      {activeTab === 'all' && (
        <LeaveTable
          leaves={allLeaves}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={(p) => fetchData(p)}
          onOpenTimeline={handleOpenTimelineModal}
          onOpenDecision={handleOpenDecisionModal}
          onOpenOverride={handleOpenOverrideModal}
          currentUserId={user?._id}
          userRole={user?.role}
        />
      )}

      {activeTab === 'lifetime' && (
        <LifetimeLeaveSummaryView
          summaryData={lifetimeSummary}
          isLoading={isLoading}
          onRefresh={() => fetchData(1)}
          onOpenTimeline={handleOpenTimelineModal}
        />
      )}

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onApply={handleApply}
        employees={employees}
        isPrivileged={canApprove}
      />

      <LeaveApprovalModal
        isOpen={isDecisionOpen}
        onClose={() => {
          setIsDecisionOpen(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
        stage={decisionStage}
        onDecision={handleDecision}
      />

      <LeaveTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => {
          setIsTimelineOpen(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
      />

      <AdminOverrideModal
        isOpen={isOverrideOpen}
        onClose={() => {
          setIsOverrideOpen(false);
          setSelectedLeave(null);
        }}
        leave={selectedLeave}
        onOverride={handleOverride}
      />
    </div>
  );
};
