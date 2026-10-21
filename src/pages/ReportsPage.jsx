import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../api/reportApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/permissions';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Target,
  FileSpreadsheet,
  Clock,
  CalendarCheck,
  Banknote,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const ReportsPage = () => {
  const { showToast } = useToast();
  const { user, hasRole } = useAuth();

  const [activeTab, setActiveTab] = useState('leads'); // 'leads' | 'sales' | 'proposals' | 'attendance' | 'leaves' | 'payroll'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(today);
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      let res;
      if (activeTab === 'leads') {
        res = await reportApi.getLeadsReport({ startDate, endDate });
      } else if (activeTab === 'sales') {
        res = await reportApi.getSalesPerformanceReport({ startDate, endDate });
      } else if (activeTab === 'proposals') {
        res = await reportApi.getProposalsReport({ startDate, endDate });
      } else if (activeTab === 'attendance') {
        res = await reportApi.getAttendanceReport({ startDate, endDate });
      } else if (activeTab === 'leaves') {
        res = await reportApi.getLeavesReport({ startDate, endDate });
      } else if (activeTab === 'payroll') {
        res = await reportApi.getPayrollReport({ month, year });
      }

      setReportData(res?.data || null);
    } catch (err) {
      showToast(err.message || 'Failed to load report data', 'error');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, startDate, endDate, month, year, showToast]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [fetchReport]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await reportApi.downloadReportCsv({
        type: activeTab,
        startDate,
        endDate,
        month,
        year,
      });
      showToast(`Exported ${activeTab} report to CSV successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePresetRange = (preset) => {
    const now = new Date();
    if (preset === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      setStartDate(firstDay);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'last-30') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      setStartDate(past30);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'last-90') {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      setStartDate(past90);
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'all-time') {
      setStartDate('2024-01-01');
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  const reportTabs = [
    { id: 'leads', label: 'Leads & Funnel', icon: Target },
    { id: 'sales', label: 'Sales Performance', icon: TrendingUp },
    { id: 'proposals', label: 'Proposals & BOQ', icon: FileSpreadsheet },
    { id: 'attendance', label: 'Attendance & Hours', icon: Clock },
    { id: 'leaves', label: 'Leave Utilization', icon: CalendarCheck },
    { id: 'payroll', label: 'Payroll & Versions', icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Outfit']">
            Reports & Analytics
          </h1>
          {/* <p className="text-xs sm:text-sm text-slate-400 mt-1">
            High-efficiency aggregated analytics across leads, proposals, workforce shifts, leave trends, and monthly compensation
          </p> */}
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>{isExporting ? 'Exporting CSV...' : 'Export CSV Report'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {reportTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 ${isActive
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'text-black bg-slate-800 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter & Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        {activeTab !== 'payroll' ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-800">
              <button
                type="button"
                onClick={() => handlePresetRange('this-month')}
                className="px-2.5 py-1 text-[11px] font-medium text-white bg-blue-600 hover:text-white  hover:bg-slate-800 rounded-md transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handlePresetRange('last-30')}
                className="px-2.5 py-1 text-[11px] font-medium text-black bg-slate-200 hover:text-white hover:bg-blue-800 rounded-md transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetRange('last-90')}
                className="px-2.5 py-1 text-[11px] font-medium text-black bg-slate-200 hover:text-white hover:bg-blue-800 rounded-md transition-colors"
              >
                Quarter
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Payroll Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Year:</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={fetchReport}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Report Content Body */}
      {isLoading ? (
        <div className="p-16 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Aggregating enterprise metrics...
          </span>
        </div>
      ) : !reportData ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          No data returned for selected filter range.
        </div>
      ) : (
        <>
          {/* 1. LEADS & FUNNEL REPORT */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Total Inquiries</span>
                  <span className="text-2xl font-black text-white font-['Outfit'] mt-1 block">
                    {reportData.summary?.totalLeads ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">Across all channels</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Deals Won</span>
                  <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.wonCount ?? reportData.summary?.wonLeads ?? 0}
                  </span>
                  <span className="text-[11px] text-emerald-500/80 block mt-1">
                    Conversion Rate: {reportData.summary?.conversionRate ?? 0}%
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Total Won Revenue</span>
                  <span className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1 block">
                    {formatCurrency(reportData.summary?.totalWonRevenue ?? reportData.summary?.wonVolume ?? 0)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">Contract value</span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Active Pipeline Value</span>
                  <span className="text-2xl font-black text-blue-400 font-['Outfit'] mt-1 block">
                    {formatCurrency(reportData.summary?.pipelineBudget ?? reportData.summary?.totalBudgetVolume ?? reportData.summary?.totalVolume ?? 0)}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">In discussion & negotiation</span>
                </div>
              </div>

              {/* Source Breakdown Table */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Acquisition Channel Breakdown
                  </h3>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3 px-5">Lead Source</th>
                      <th className="py-3 px-4 text-center">Total Inquiries</th>
                      <th className="py-3 px-4 text-center">Deals Won</th>
                      <th className="py-3 px-4 text-center">Conversion %</th>
                      <th className="py-3 px-5 text-right">Won Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.sources?.map((s) => (
                      <tr key={s.source || s._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-5 font-semibold text-white">{s.source || s._id}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">{s.count ?? s.totalLeads ?? 0}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                          {s.wonCount ?? 0}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {s.conversionRate ?? 0}%
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-amber-400 font-bold">
                          {formatCurrency(s.totalWonRevenue ?? s.wonValue ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. SALES PERFORMANCE REPORT */}
          {activeTab === 'sales' && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Sales Representative Productivity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Individual assignment volumes, contact rates, site visits, and won deals
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {reportData.totalRepresentatives || 0} Reps Active
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-3 px-5">Salesperson</th>
                    <th className="py-3 px-4 text-center">Assigned</th>
                    <th className="py-3 px-4 text-center">Contacted</th>
                    <th className="py-3 px-4 text-center">Site Visits</th>
                    <th className="py-3 px-4 text-center">Deals Won</th>
                    <th className="py-3 px-4 text-center">Win Rate</th>
                    <th className="py-3 px-5 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {reportData.performance?.map((p) => (
                    <tr key={p.salespersonId || p.userId} className="hover:bg-slate-800/40">
                      <td className="py-3 px-5">
                        <div className="font-semibold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.email}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {p.totalAssigned}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {p.contactedCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-blue-400">
                        {p.siteVisitCompleted}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                        {p.wonCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          {p.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-amber-400 font-bold">
                        {formatCurrency(p.totalWonRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. PROPOSALS & BOQ REPORT */}
          {activeTab === 'proposals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Proposals Generated</span>
                  <span className="text-2xl font-black text-white font-['Outfit'] mt-1 block">
                    {reportData.summary?.totalProposals || 0}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Acceptance Rate</span>
                  <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.acceptanceRate || 0}%
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {reportData.summary?.acceptedCount || 0} accepted contracts
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Accepted Contract Value</span>
                  <span className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1 block">
                    {formatCurrency(reportData.summary?.acceptedRevenue)}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Revisions Per Proposal</span>
                  <span className="text-2xl font-black text-purple-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.avgRevisionsPerProposal || 1}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {reportData.summary?.totalRevisionsCreated || 0} total revisions
                  </span>
                </div>
              </div>

              {/* Status Breakdown Table */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Proposal Status Pipeline
                  </h3>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-4 text-center">Count</th>
                      <th className="py-3 px-5 text-right">Quoted Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.statusBreakdown?.map((s) => (
                      <tr key={s.status} className="hover:bg-slate-800/40">
                        <td className="py-3 px-5 font-semibold text-white">{s.status}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">{s.count}</td>
                        <td className="py-3 px-5 text-right font-mono text-amber-400 font-bold">
                          {formatCurrency(s.totalQuoted)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ATTENDANCE & HOURS REPORT */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Employees Logged</span>
                  <span className="text-2xl font-black text-white font-['Outfit'] mt-1 block">
                    {reportData.employeeCount || 0}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Total Working Hours</span>
                  <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.totalHoursLogged || 0} hrs
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3 px-5">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Completed Shifts</th>
                      <th className="py-3 px-4 text-center">Effective Work Hours</th>
                      <th className="py-3 px-4 text-center">Break Hours</th>
                      <th className="py-3 px-4 text-center">Avg Daily Hours</th>
                      <th className="py-3 px-4 text-center">Late Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.records?.map((r) => (
                      <tr key={r.employeeId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-5">
                          <div className="font-semibold text-white">{r.employeeName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{r.department}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">
                          {r.completedSessions}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                          {r.totalWorkHours} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {r.totalBreakHours} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-blue-400">
                          {r.avgDailyHours} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {r.lateMarks > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold">
                              {r.lateMarks}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. LEAVES & UTILIZATION REPORT */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Applications</span>
                  <span className="text-2xl font-black text-white font-['Outfit'] mt-1 block">
                    {reportData.summary?.totalApplications || 0}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Approval Rate</span>
                  <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.approvalRate || 0}%
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Total Leave Days</span>
                  <span className="text-2xl font-black text-amber-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.totalLeaveDays || 0} days
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Rejected</span>
                  <span className="text-2xl font-black text-rose-400 font-['Outfit'] mt-1 block">
                    {reportData.summary?.rejectedApplications || 0}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white font-['Outfit']">
                    Leaves Utilization By Type
                  </h3>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3 px-5">Leave Category</th>
                      <th className="py-3 px-4 text-center">Applications</th>
                      <th className="py-3 px-4 text-center">Approved Count</th>
                      <th className="py-3 px-5 text-right">Total Days Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.byType?.map((t) => (
                      <tr key={t.leaveType || t._id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-5 font-semibold text-white">{t.leaveType || t._id}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">{t.applications ?? t.count ?? 0}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-400">{t.approvedCount ?? 0}</td>
                        <td className="py-3 px-5 text-right font-mono text-amber-400 font-bold">
                          {t.totalDays ?? 0} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. PAYROLL REPORT */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Gross Company Payroll</span>
                  <span className="text-2xl font-black text-white font-['Outfit'] mt-1 block">
                    {formatCurrency(reportData.totals?.totalGross ?? reportData.summary?.totalGross)}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Statutory Deductions (PF+TDS)</span>
                  <span className="text-2xl font-black text-rose-400 font-['Outfit'] mt-1 block">
                    {formatCurrency(reportData.totals?.totalDeductions ?? reportData.summary?.totalDeductions)}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                  <span className="text-xs text-slate-400 block font-medium">Net Disbursed Pay</span>
                  <span className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1 block">
                    {formatCurrency(reportData.totals?.totalNetPayable ?? reportData.summary?.totalNetPayable)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-3 px-5">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Salary Version</th>
                      <th className="py-3 px-4 text-center">Days (Paid/Unpaid)</th>
                      <th className="py-3 px-4 text-right">Gross Salary</th>
                      <th className="py-3 px-4 text-right">Deductions</th>
                      <th className="py-3 px-5 text-right">Net Payable</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportData.records?.map((r) => (
                      <tr key={r.id || r._id || r.employeeId} className="hover:bg-slate-800/40">
                        <td className="py-3 px-5">
                          <div className="font-semibold text-white">{r.employeeName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{r.department || r.departmentName || 'Operations'}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                            v{r.salaryVersion || 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">
                          {r.payableDays ?? 30} / {r.unpaidDays ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-200">
                          {formatCurrency(r.grossSalary)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-400">
                          {formatCurrency(r.totalDeductions)}
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-emerald-400 font-bold">
                          {formatCurrency(r.netPayable)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'FINALIZED' || r.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
