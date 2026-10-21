import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import { healthApi } from '../api/healthApi';
import { attendanceApi } from '../api/attendanceApi';
import { leadApi } from '../api/leadApi';
import { useToast } from '../context/ToastContext';
import { MetricCard } from '../components/common/MetricCard';
import { RoleBadge } from '../components/common/StatusBadge';
import { ROLES } from '../utils/permissions';
import { formatTimeAgo, formatISTDate } from '../utils/formatters';
import {
  Users,
  ShieldCheck,
  Activity,
  HardHat,
  Plus,
  ArrowRight,
  Database,
  Building,
  CheckCircle2,
  Clock,
  Briefcase,
  FileSpreadsheet,
  CalendarCheck,
  DollarSign,
  FileText,
  Target,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Banknote,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  PhoneCall,
  UserCheck,
  Award,
  Sparkles,
  Phone,
  Play,
  Square,
  LogIn,
  LogOut,
} from 'lucide-react';

export const DashboardPage = ({ onNavigateTab, onOpenAddUser }) => {
  const { user, isSuperAdmin, hasRole } = useAuth();
  const { showToast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [activeRoleView, setActiveRoleView] = useState(user?.role || ROLES.SUPER_ADMIN);
  const [healthData, setHealthData] = useState(null);
  const [salesAttendance, setSalesAttendance] = useState(null);
  const [salesAlerts, setSalesAlerts] = useState({ dueToday: [], overdue: [], upcoming: [] });
  const [isShiftActionLoading, setIsShiftActionLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  const fetchDashboard = useCallback(async (roleToLoad) => {
    try {
      setIsLoading(true);
      let res;
      if (roleToLoad === ROLES.SUPER_ADMIN) {
        res = await dashboardApi.getSuperAdminDashboard();
      } else if (roleToLoad === ROLES.MANAGER) {
        res = await dashboardApi.getManagerDashboard();
      } else if (roleToLoad === ROLES.HR) {
        res = await dashboardApi.getHrDashboard();
      } else if (roleToLoad === ROLES.SALES) {
        const [salesDash, salesAtt, salesAlr] = await Promise.all([
          dashboardApi.getSalesDashboard(),
          attendanceApi.getMyToday().catch(() => null),
          leadApi.getFollowUpAlerts().catch(() => null),
        ]);
        res = salesDash;
        if (salesAtt?.data) setSalesAttendance(salesAtt.data);
        if (salesAlr?.data) setSalesAlerts(salesAlr.data);
      } else {
        res = await dashboardApi.getMyDashboard();
      }

      setDashboardData(res?.data || null);

      // Also get health ping
      const healthRes = await healthApi.getHealth().catch(() => null);
      if (healthRes) setHealthData(healthRes.data);
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartShift = async () => {
    try {
      setIsShiftActionLoading(true);
      await attendanceApi.checkIn();
      showToast('Shift started successfully! Welcome to work.', 'success');
      // Refresh shift status and follow-up reminders
      const [attRes, alertRes, dashRes] = await Promise.all([
        attendanceApi.getMyToday().catch(() => null),
        leadApi.getFollowUpAlerts().catch(() => null),
        dashboardApi.getSalesDashboard().catch(() => null),
      ]);
      if (attRes?.data) setSalesAttendance(attRes.data);
      if (alertRes?.data) setSalesAlerts(alertRes.data);
      if (dashRes?.data) setDashboardData(dashRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to start shift', 'error');
    } finally {
      setIsShiftActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!window.confirm('Are you sure you want to end your shift and clock out for today?')) return;
    try {
      setIsShiftActionLoading(true);
      await attendanceApi.checkOut();
      showToast('Shift completed successfully. Great job today!', 'success');
      const [attRes, dashRes] = await Promise.all([
        attendanceApi.getMyToday().catch(() => null),
        dashboardApi.getSalesDashboard().catch(() => null),
      ]);
      if (attRes?.data) setSalesAttendance(attRes.data);
      if (dashRes?.data) setDashboardData(dashRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to end shift', 'error');
    } finally {
      setIsShiftActionLoading(false);
    }
  };

  useEffect(() => {
    setActiveRoleView(user?.role || ROLES.SUPER_ADMIN);
    fetchDashboard(user?.role || ROLES.SUPER_ADMIN);
  }, [user, fetchDashboard]);

  const handleSwitchView = (role) => {
    setActiveRoleView(role);
    fetchDashboard(role);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-black border-2xl bg-white p-6 sm:p-8 text-white shadow-2xl shadow-blue-900/10">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>

            <h1 className="text-2xl sm:text-3xl font-bold  tracking-tight font-['Outfit']">
              Namaste, {user?.name || 'Administrator'}!
            </h1>
            {/* <p className="text-xs sm:text-sm text-blue-100 mt-1.5 max-w-xl">
              Live role-oriented command center for Construction CRM, site estimations, workforce attendance, and payroll governance.
            </p> */}
          </div>

          {/* <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <button
                onClick={onOpenAddUser}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs shadow-md flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Team Member</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('projects')}
              className="px-4 py-2.5 rounded-xl bg-blue-800 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition-all"
            >
              <HardHat className="w-4 h-4 text-blue-300" />
              <span>Projects & Sites</span>
            </button>

            <button
              onClick={() => onNavigateTab('reports')}
              className="px-4 py-2.5 rounded-xl bg-green-800 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-2 transition-all"
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Full Reports & CSV</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Quick Launch & Workflow Navigator Bar */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            title: 'Leads & Surveys',
            desc: 'Client Inquiries',
            tab: 'leads',
            icon: Target,
          },
          {
            title: 'BOQ Quotations',
            desc: 'Costing Estimates',
            tab: 'proposals',
            icon: FileSpreadsheet,
          },
          {
            title: 'Projects & Sites',
            desc: 'Ongoing Works',
            tab: 'projects',
            icon: HardHat,
          },
          {
            title: 'Staff & Team',
            desc: 'Workforce Profiles',
            tab: 'employees',
            icon: Users,
          },
          {
            title: 'Daily Attendance',
            desc: 'Biometric Clock',
            tab: 'attendance',
            icon: Clock,
          },
          {
            title: 'Payroll & Slips',
            desc: 'Salary Calculations',
            tab: 'payroll',
            icon: Banknote,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigateTab(item.tab)}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs transition-all duration-200 text-left hover:border-blue-500 hover:shadow-md flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div> */}

      {/* Role Switcher Toolbar (Only visible to Super Admin for multi-role lens) */}
      {isSuperAdmin && (
        <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-2">
            {/* <span className="text-xs font-bold text-slate-500 px-2 uppercase tracking-wider font-mono">
              Role Lens:
            </span> */}
            {[
              { role: ROLES.SUPER_ADMIN, label: 'Super Admin (Enterprise)' },
              { role: ROLES.MANAGER, label: 'Manager (Team)' },
              { role: ROLES.HR, label: 'HR & Personnel' },
              { role: ROLES.SALES, label: 'Sales (Personal)' },
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => handleSwitchView(r.role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeRoleView === r.role
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500'
                  : 'text-black-600 bg-slate-300 hover:text-white hover:bg-blue-600'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchDashboard(activeRoleView)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium tracking-wide">
            Loading {activeRoleView} dashboard telemetry...
          </span>
        </div>
      ) : !dashboardData ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          No dashboard data available for this role.
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. SUPER ADMIN DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {activeRoleView === ROLES.SUPER_ADMIN && (
            <div className="space-y-6">
              {/* Top Enterprise KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Inquiries & Funnel"
                  value={dashboardData.conversions?.totalLeads || 0}
                  subtitle={`${dashboardData.conversions?.wonCount || 0} won deals • ${dashboardData.conversions?.conversionRate || 0}% rate`}
                  icon={Target}
                  color="amber"
                  onClick={() => onNavigateTab('leads')}
                />

                <MetricCard
                  title="Total Won Revenue"
                  value={formatCurrency(dashboardData.conversions?.wonRevenue)}
                  subtitle="Contracted revenue in INR"
                  icon={DollarSign}
                  color="emerald"
                  trend="Won"
                  onClick={() => onNavigateTab('reports')}
                />

                <MetricCard
                  title="Proposal Pipeline Value"
                  value={formatCurrency(dashboardData.proposalPipeline?.pipelineValue)}
                  subtitle={`${dashboardData.proposalPipeline?.acceptedCount || 0} accepted of ${dashboardData.proposalPipeline?.totalCount || 0} quotes`}
                  icon={FileSpreadsheet}
                  color="blue"
                  onClick={() => onNavigateTab('proposals')}
                />

                <MetricCard
                  title="Active Workforce"
                  value={`${dashboardData.workforce?.activeEmployees || 0} / ${dashboardData.workforce?.totalEmployees || 0}`}
                  subtitle={`${dashboardData.attendanceSummary?.clockedInTotal || 0} clocked in today (IST)`}
                  icon={Users}
                  color="rose"
                  onClick={() => onNavigateTab('employees')}
                />
              </div>

              {/* 2-Column: Lead Funnel & Attendance Today */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Funnel Pipeline Breakdown (2 cols) */}
                <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-400" />
                        Company-Wide Lead Conversion Funnel
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Real-time status tracking from initial inquiry to final contract award
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateTab('leads')}
                      className="text-xs text-amber-400 hover:text-blue-800 cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <span>Manage Leads</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(dashboardData.leadFunnel || {}).map(([st, val]) => (
                      <div
                        key={st}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                          {st.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xl font-black text-white font-['Outfit'] mt-1 block">
                          {val?.count || 0}
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-mono block mt-0.5 truncate">
                          {formatCurrency(val?.totalBudget)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today Attendance & Shifts (1 col) */}
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        Today Attendance (IST)
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Total Clocked In:</span>
                        <span className="font-bold text-white font-mono">
                          {dashboardData.attendanceSummary?.clockedInTotal || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Currently Active:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {dashboardData.attendanceSummary?.currentlyActive || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">On Break:</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {dashboardData.attendanceSummary?.onBreak || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Completed Shift:</span>
                        <span className="font-bold text-blue-400 font-mono">
                          {dashboardData.attendanceSummary?.completedShift || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('attendance')}
                    className="w-full mt-4 py-2 rounded-xl bg-blue-800 hover:bg-slate-700 text-white hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Attendance Register</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 3-Column: Pending Leaves, Latest Payroll & Recent Audit Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-amber-400" />
                      Pending Leave Approvals
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {(dashboardData.pendingLeaves?.pendingManagerApproval || 0) +
                        (dashboardData.pendingLeaves?.pendingHrApproval || 0)}{' '}
                      pending
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Awaiting Manager Review:</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {dashboardData.pendingLeaves?.pendingManagerApproval || 0}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Awaiting HR Approval:</span>
                      <span className="font-bold text-blue-400 font-mono">
                        {dashboardData.pendingLeaves?.pendingHrApproval || 0}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Currently On Leave Today:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {dashboardData.pendingLeaves?.currentlyOnLeaveToday || 0}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('leaves')}
                    className="w-full py-2 rounded-xl bg-blue-800 hover:bg-slate-700 text-white hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Leave Workflow</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Latest Payroll Totals */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      Latest Finalized Payroll
                    </h3>
                    <span className="text-xs font-mono text-slate-400">
                      Cycle {dashboardData.payrollTotals?.month}/{dashboardData.payrollTotals?.year}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Gross Salary Total:</span>
                      <span className="font-bold text-white font-mono">
                        {formatCurrency(dashboardData.payrollTotals?.totalGross)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Statutory Deductions:</span>
                      <span className="font-bold text-rose-400 font-mono">
                        {formatCurrency(dashboardData.payrollTotals?.totalDeductions)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Net Disbursed Payout:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {formatCurrency(dashboardData.payrollTotals?.totalNetPayout)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('payroll')}
                    className="w-full py-2 rounded-xl bg-blue-800 hover:bg-slate-700 text-white hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Manage Payroll & Payslips</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Live Security & Audit Trail */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-rose-400" />
                      Live Security Audit Trail
                    </h3>
                    <span className="text-xs font-mono text-slate-400">Immutable</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {dashboardData.auditActivity?.slice(0, 4).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-400 truncate">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {formatTimeAgo(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 truncate">
                          {log.details || log.entityType}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onNavigateTab('audit')}
                    className="w-full py-2 rounded-xl bg-blue-800 hover:bg-slate-700 text-white hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Full Security Audit Logs</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. MANAGER DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {activeRoleView === ROLES.MANAGER && (
            <div className="space-y-6">
              {/* Top KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Team Active Leads"
                  value={dashboardData.teamSummary?.totalLeads || 0}
                  subtitle={`${dashboardData.teamSummary?.wonLeads || 0} won • ${dashboardData.teamSummary?.conversionRate || 0}% rate`}
                  icon={Target}
                  color="amber"
                  onClick={() => onNavigateTab('leads')}
                />

                <MetricCard
                  title="Follow-ups Due Today"
                  value={dashboardData.followUps?.dueToday || 0}
                  subtitle={`${dashboardData.followUps?.overdue || 0} overdue follow-up alerts`}
                  icon={PhoneCall}
                  color={dashboardData.followUps?.overdue > 0 ? 'rose' : 'emerald'}
                  trend={dashboardData.followUps?.overdue > 0 ? 'Action Req' : 'On Track'}
                  onClick={() => onNavigateTab('leads')}
                />

                <MetricCard
                  title="Team Members Present"
                  value={`${dashboardData.teamAttendanceToday?.clockedIn || 0} / ${dashboardData.teamAttendanceToday?.totalTeam || 0}`}
                  subtitle={`${dashboardData.teamAttendanceToday?.absent || 0} staff absent today`}
                  icon={UserCheck}
                  color="blue"
                  onClick={() => onNavigateTab('attendance')}
                />

                <MetricCard
                  title="Pending Manager Approvals"
                  value={dashboardData.pendingApprovals?.count || 0}
                  subtitle="Awaiting your sign-off"
                  icon={CalendarCheck}
                  color="rose"
                  onClick={() => onNavigateTab('leaves')}
                />
              </div>

              {/* Assignment Distribution Table & Approvals List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Distribution */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Team Lead Assignment & Workload
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.assignmentDistribution?.map((rep) => (
                      <div
                        key={rep.userId}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white block">{rep.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{rep.email}</span>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Assigned</span>
                            <span className="font-mono font-bold text-white">
                              {rep.totalAssigned}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-400 block">Won</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {rep.wonLeads}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Leaves Requiring Review */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-400" />
                    Leaves Awaiting Your Approval
                  </h3>
                  {dashboardData.pendingApprovals?.leaves?.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No pending approvals for your team at this moment.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dashboardData.pendingApprovals?.leaves?.map((l) => (
                        <div
                          key={l.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{l.employeeName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {l.leaveType}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {new Date(l.startDate).toLocaleDateString('en-IN')} to{' '}
                            {new Date(l.endDate).toLocaleDateString('en-IN')} • {l.reason}
                          </p>
                        </div>
                      ))}
                      <button
                        onClick={() => onNavigateTab('leaves')}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                      >
                        Review in Leave Management
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. HR DASHBOARD VIEW */}
          {/* ========================================================================= */}
          {activeRoleView === ROLES.HR && (
            <div className="space-y-6">
              {/* Top HR KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MetricCard
                  title="Total Workforce"
                  value={dashboardData.workforce?.total || 0}
                  subtitle={`${dashboardData.workforce?.active || 0} active • ${dashboardData.workforce?.probation || 0} probation`}
                  icon={Users}
                  color="amber"
                  onClick={() => onNavigateTab('employees')}
                />

                <MetricCard
                  title="Attendance Today"
                  value={`${dashboardData.attendanceToday?.clockedIn || 0} staff`}
                  subtitle={`${dashboardData.attendanceToday?.lateMarks || 0} late marks recorded`}
                  icon={Clock}
                  color="emerald"
                  onClick={() => onNavigateTab('attendance')}
                />

                <MetricCard
                  title="On Leave Today"
                  value={dashboardData.onLeaveToday?.count || 0}
                  subtitle="Approved leaves active"
                  icon={Calendar}
                  color="rose"
                  onClick={() => onNavigateTab('leaves')}
                />

                <MetricCard
                  title="Pending Leave Review"
                  value={dashboardData.pendingHrLeaves?.count || 0}
                  subtitle="Awaiting final HR action"
                  icon={CalendarCheck}
                  color="blue"
                  onClick={() => onNavigateTab('leaves')}
                />

                <MetricCard
                  title="Pending Bank Verify"
                  value={dashboardData.missingBankDetails?.count || 0}
                  subtitle="Unverified or missing info"
                  icon={AlertTriangle}
                  color="amber"
                  onClick={() => onNavigateTab('employees')}
                />

                <MetricCard
                  title="Payroll Cycles"
                  value={dashboardData.payrollSummaries?.length || 0}
                  subtitle="Monthly cycles on file"
                  icon={Banknote}
                  color="emerald"
                  onClick={() => onNavigateTab('payroll')}
                />
              </div>

              {/* Department Distribution & Salary Increment History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departments */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    Department Headcount Distribution
                  </h3>
                  <div className="space-y-2">
                    {dashboardData.departmentDistribution?.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <span className="font-semibold text-white">{d.name}</span>
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-bold border border-slate-800">
                          {d.count} employees
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Salary Increments */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Recent Salary Increments & Revisions
                  </h3>
                  <div className="space-y-2">
                    {(dashboardData.salaryIncrementHistory || []).slice(0, 5).map((si) => (
                      <div
                        key={si.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-white block">{si.employeeName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatCurrency(si.previousGross)} → {formatCurrency(si.newGross)}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          +{si.percentageHike}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Joinings & Work Anniversaries Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Joinings */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    Recent Joinings & New Hires
                  </h3>
                  {(dashboardData.recentJoinings || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No new joinings in last 45 days</p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.recentJoinings.map((emp) => (
                        <div
                          key={emp.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white block">{emp.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {emp.designation} • {emp.department}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(emp.joiningDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Anniversaries */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Work Anniversaries This Month
                  </h3>
                  {(dashboardData.workAnniversaries || []).length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No work anniversaries this calendar month</p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.workAnniversaries.map((anniv) => (
                        <div
                          key={anniv.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white block">{anniv.name}</span>
                            <span className="text-[10px] text-slate-500">{anniv.department}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {anniv.yearsCompleted} {anniv.yearsCompleted === 1 ? 'Year' : 'Years'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. SALES DASHBOARD VIEW (PRODUCTION WORKFLOW) */}
          {/* ========================================================================= */}
          {activeRoleView === ROLES.SALES && (
            <div className="space-y-6">
              {/* 1. SALES PERSON SHIFT MANAGEMENT WIDGET */}
              {/* <div className="p-5 rounded-2xl bg-white border border-slate-800 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-white font-['Outfit']">
                          Sales Shift Management
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase ${(salesAttendance?.currentStatus || dashboardData.myAttendance?.status) === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : (salesAttendance?.currentStatus || dashboardData.myAttendance?.status) === 'ON_BREAK'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : (salesAttendance?.currentStatus || dashboardData.myAttendance?.status) === 'COMPLETED'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                            }`}
                        >
                          {(salesAttendance?.currentStatus || dashboardData.myAttendance?.status || 'NOT_CLOCKED_IN').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          Check-in:{' '}
                          <strong className="text-slate-200">
                            {salesAttendance?.activeSession?.checkInTime
                              ? new Date(salesAttendance.activeSession.checkInTime).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                              : dashboardData.myAttendance?.checkInTime
                                ? new Date(dashboardData.myAttendance.checkInTime).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : 'Not Started'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Worked Today:{' '}
                          <strong className="text-amber-400 font-mono">
                            {salesAttendance?.totalWorkHoursToday !== undefined
                              ? salesAttendance.totalWorkHoursToday
                              : dashboardData.myAttendance?.workHours || 0}{' '}
                            hrs
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Timezone: <strong className="text-slate-300">Asia/Kolkata (IST)</strong>
                        </span>
                      </p>
                    </div>
                  </div>

             
                  <div className="flex items-center gap-2.5">
                    {!(salesAttendance?.currentStatus === 'ACTIVE' || dashboardData.myAttendance?.status === 'ACTIVE') ? (
                      <button
                        onClick={handleStartShift}
                        disabled={isShiftActionLoading}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {isShiftActionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>START SHIFT (CLOCK IN)</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleEndShift}
                        disabled={isShiftActionLoading}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50"
                      >
                        {isShiftActionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>END SHIFT (CLOCK OUT)</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigateTab('attendance')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="View complete shift and attendance records"
                    >
                      Shift History
                    </button>
                  </div>
                </div>
              </div> */}

              {/* 2. AUTOMATIC FOLLOW-UP ALERTS (SHIFT-START / LOGIN DUE BANNER) */}
              {((salesAlerts?.dueToday?.length || 0) > 0 || (salesAlerts?.overdue?.length || 0) > 0 || (dashboardData.followUps?.overdueCount || 0) > 0) && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2.5 text-amber-400">
                      <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-400" />
                      <div>
                        <h4 className="text-sm font-bold text-white font-['Outfit']">
                          Scheduled Client Follow-ups Due Attention
                        </h4>
                        <p className="text-xs text-amber-300/80">
                          {salesAlerts?.overdue?.length || dashboardData.followUps?.overdueCount || 0} Overdue •{' '}
                          {salesAlerts?.dueToday?.length || dashboardData.followUps?.dueTodayCount || 0} Due Today
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('leads')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all self-start sm:self-auto"
                    >
                      View All My Leads →
                    </button>
                  </div>

                  {/* Overdue Urgent Cards */}
                  {(salesAlerts?.overdue?.length > 0) && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Overdue Calls Requiring Immediate Action
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {salesAlerts.overdue.slice(0, 4).map((item) => (
                          <div
                            key={item.leadId || item.id}
                            className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/30 text-xs space-y-2 hover:border-rose-500 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {item.clientName}
                                </span>
                                {item.companyName && (
                                  <span className="text-slate-400 text-[11px]">{item.companyName}</span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Overdue: {new Date(item.nextFollowUpDate).toLocaleDateString('en-IN')}
                              </span>
                            </div>

                            {item.nextFollowUpObjective && (
                              <p className="text-[11px] text-amber-300/90 italic">
                                Objective: "{item.nextFollowUpObjective}"
                              </p>
                            )}

                            {item.lastConversationNotes && (
                              <p className="text-[11px] text-slate-400 truncate">
                                Last Note: {item.lastConversationNotes}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {item.phone || 'No phone'}
                              </span>
                              <button
                                onClick={() => onNavigateTab('leads', { search: item.leadNumber || item.clientName })}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold transition-colors"
                              >
                                Call & Open Lead
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Due Today Cards */}
                  {(salesAlerts?.dueToday?.length > 0) && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Due Today
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {salesAlerts.dueToday.slice(0, 4).map((item) => (
                          <div
                            key={item.leadId || item.id}
                            className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/30 text-xs space-y-2 hover:border-amber-500 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {item.clientName}
                                </span>
                                {item.companyName && (
                                  <span className="text-slate-400 text-[11px]">{item.companyName}</span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Due Today
                              </span>
                            </div>

                            {item.nextFollowUpObjective && (
                              <p className="text-[11px] text-amber-300/90 italic">
                                Objective: "{item.nextFollowUpObjective}"
                              </p>
                            )}

                            {item.lastConversationNotes && (
                              <p className="text-[11px] text-slate-400 truncate">
                                Last Note: {item.lastConversationNotes}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                              <span className="text-[11px] text-slate-400 font-mono">
                                {item.phone || 'No phone'}
                              </span>
                              <button
                                onClick={() => onNavigateTab('leads', { search: item.leadNumber || item.clientName })}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold transition-colors"
                              >
                                Call & Open Lead
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SALES QUICK ACTIONS TOOLBAR */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Quick Actions
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('leads', { autoOpenCreate: true })}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Lead</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('leads')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>View My Leads</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('leads')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                    <span>Today's Follow-ups</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('proposals', { autoOpenCreate: true })}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Create Proposal</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('proposals')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>My Proposals</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('leaves', { autoOpenApply: true })}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Apply for Leave</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('leaves', { subTab: 'lifetime' })}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Leave History</span>
                  </button>
                </div>
              </div>

              {/* 4. SALES KPIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="My Assigned Leads"
                  value={dashboardData.performance?.totalAssignedLeads || 0}
                  subtitle={`${dashboardData.performance?.wonDealsCount || 0} won deals (${dashboardData.performance?.winRate || 0}%)`}
                  icon={Target}
                  color="amber"
                  onClick={() => onNavigateTab('leads')}
                />

                <MetricCard
                  title="My Won Revenue"
                  value={formatCurrency(dashboardData.performance?.wonRevenue)}
                  subtitle="Total contracted sales"
                  icon={DollarSign}
                  color="emerald"
                  trend="Revenue"
                  onClick={() => onNavigateTab('reports')}
                />

                <MetricCard
                  title="Follow-ups Due Today"
                  value={salesAlerts?.dueToday?.length || dashboardData.followUps?.dueTodayCount || 0}
                  subtitle={`${salesAlerts?.overdue?.length || dashboardData.followUps?.overdueCount || 0} overdue calls`}
                  icon={PhoneCall}
                  color={(salesAlerts?.overdue?.length || dashboardData.followUps?.overdueCount) > 0 ? 'rose' : 'blue'}
                  onClick={() => onNavigateTab('leads')}
                />

                <MetricCard
                  title="Proposals Awarded"
                  value={dashboardData.proposals?.ACCEPTED?.count || dashboardData.proposalStatus?.ACCEPTED?.count || 0}
                  subtitle={`${dashboardData.proposals?.SENT?.count || 0} sent • ${dashboardData.proposals?.DRAFT?.count || 0} draft`}
                  icon={Award}
                  color="purple"
                  onClick={() => onNavigateTab('proposals')}
                />
              </div>

              {/* 5. PIPELINE STATUS BREAKDOWN */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  My Sales Pipeline & Lead Funnel Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">New</span>
                    <span className="text-lg font-black text-white">{dashboardData.leadsFunnel?.NEW?.count || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-sky-400 block">Connected</span>
                    <span className="text-lg font-black text-sky-400">{dashboardData.leadsFunnel?.CONTACTED?.count || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">Not Connected</span>
                    <span className="text-lg font-black text-rose-400">{dashboardData.leadsFunnel?.NOT_CONNECTED?.count || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block">Qualified</span>
                    <span className="text-lg font-black text-indigo-400">{dashboardData.leadsFunnel?.QUALIFIED?.count || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Won / Deal Done</span>
                    <span className="text-lg font-black text-emerald-400">{dashboardData.leadsFunnel?.CONVERTED?.count || dashboardData.leadsFunnel?.WON?.count || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-500 block">Lost</span>
                    <span className="text-lg font-black text-rose-500">{dashboardData.leadsFunnel?.LOST?.count || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-red-500 block">Fake Lead</span>
                    <span className="text-lg font-black text-red-500">{dashboardData.leadsFunnel?.FAKE_LEAD?.count || 0}</span>
                  </div>
                </div>
              </div>

              {/* 6. FOLLOW-UPS LISTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Client Follow-ups Due Today
                    </h3>
                    <span className="text-xs font-mono text-amber-400">
                      {dashboardData.followUps?.dueTodayList?.length || 0} due
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {dashboardData.followUps?.dueTodayList?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        All set! No follow-ups pending for today.
                      </p>
                    ) : (
                      dashboardData.followUps?.dueTodayList?.map((lead) => (
                        <div
                          key={lead._id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white block">
                              {lead.clientName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lead.phone} • {lead.projectType}
                            </span>
                          </div>
                          <button
                            onClick={() => onNavigateTab('leads', { search: lead.leadNumber || lead.clientName })}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-[11px] font-bold"
                          >
                            Call & Log
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Overdue Follow-up Alerts */}
                <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Overdue Client Follow-ups
                    </h3>
                    <span className="text-xs font-mono text-rose-400">
                      {dashboardData.followUps?.overdueList?.length || 0} overdue
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {dashboardData.followUps?.overdueList?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">
                        Awesome! Zero overdue follow-up tasks.
                      </p>
                    ) : (
                      dashboardData.followUps?.overdueList?.map((lead) => (
                        <div
                          key={lead._id}
                          className="p-3 rounded-xl bg-slate-950 border border-rose-500/20 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white block">
                              {lead.clientName}
                            </span>
                            <span className="text-[10px] text-rose-400/90 font-mono">
                              Scheduled for:{' '}
                              {new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <button
                            onClick={() => onNavigateTab('leads', { search: lead.leadNumber || lead.clientName })}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-[11px] font-bold"
                          >
                            Resolve Now
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
