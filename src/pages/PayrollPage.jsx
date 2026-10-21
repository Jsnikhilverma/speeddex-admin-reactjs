import React, { useState, useEffect, useCallback } from 'react';
import { payrollApi } from '../api/payrollApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/permissions';
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
  Building,
  CheckCheck,
  AlertCircle,
  Receipt,
  Printer,
  RotateCcw,
  AlertTriangle,
  FileDown,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeaderGuide } from '../components/common/PageHeaderGuide';
import { SalarySlipModal } from '../components/payroll/SalarySlipModal';

export const PayrollPage = ({ tabParams }) => {
  const { showToast } = useToast();
  const { user, hasRole } = useAuth();
  const canManagePayroll = hasRole(ROLES.SUPER_ADMIN, ROLES.HR);

  const [activeTab, setActiveTab] = useState(
    tabParams?.subTab || (canManagePayroll ? 'company' : 'my-payslips')
  ); // 'company' | 'my-payslips'

  // Company Payroll States
  const [payrolls, setPayrolls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Action Targets
  const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
  const [selectedSlipEmployee, setSelectedSlipEmployee] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  // Single Approve / Finalize Modal
  const [finalizeTarget, setFinalizeTarget] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [finalizeRemarks, setFinalizeRemarks] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Batch Finalize Modal
  const [isBatchFinalizeOpen, setIsBatchFinalizeOpen] = useState(false);
  const [batchRemarks, setBatchRemarks] = useState('');
  const [isBatchFinalizing, setIsBatchFinalizing] = useState(false);

  // Disburse / Record Payment Modal
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Controlled Adjustment Modal
  const [adjustmentTarget, setAdjustmentTarget] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('ADDITION');
  const [adjustmentTitle, setAdjustmentTitle] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Controlled Reversal Modal
  const [reversalTarget, setReversalTarget] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  // Detailed Payslip Modal
  const [viewingRecord, setViewingRecord] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [needsServerRestart, setNeedsServerRestart] = useState(false);

  // My Payslips States
  const [myPayslips, setMyPayslips] = useState([]);
  const [isLoadingPayslips, setIsLoadingPayslips] = useState(false);

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });

  // Fetch company payroll records
  const fetchPayrollRecords = useCallback(
    async (page = 1) => {
      if (!canManagePayroll) return;
      try {
        setIsLoading(true);
        const res = await payrollApi.getPayrollRecords({
          month: selectedMonth,
          year: selectedYear,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search || undefined,
          page,
          limit: 20,
        });
        if (res.needsServerRestart) {
          setNeedsServerRestart(true);
        } else {
          setNeedsServerRestart(false);
        }
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.records)
            ? res.data.records
            : Array.isArray(res.records)
              ? res.records
              : [];
        setPayrolls(list);
        setPagination(
          res.pagination || res.meta?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      } catch (err) {
        showToast(err.message || 'Failed to fetch payroll records', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [canManagePayroll, selectedMonth, selectedYear, statusFilter, search, showToast]
  );

  // Fetch my payslips
  const fetchMyPayslips = useCallback(async () => {
    try {
      setIsLoadingPayslips(true);
      const res = await payrollApi.getMyPayslips({ page: 1, limit: 24 });
      setMyPayslips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // ignore
    } finally {
      setIsLoadingPayslips(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'company') {
      fetchPayrollRecords(1);
    } else {
      fetchMyPayslips();
    }
  }, [activeTab, fetchPayrollRecords, fetchMyPayslips]);

  // Handle Generate Draft Payroll
  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      const res = await payrollApi.generatePayroll({
        month: Number(generateMonth),
        year: Number(generateYear),
      });
      showToast(
        `Generated payroll calculation for ${res.data?.totalGenerated || 0} employee(s)!`,
        'success'
      );
      setIsGenerateModalOpen(false);
      setSelectedMonth(Number(generateMonth));
      setSelectedYear(Number(generateYear));
      fetchPayrollRecords(1);
    } catch (err) {
      showToast(err.message || 'Failed to generate monthly payroll', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Review Payroll
  const handleReviewRecord = async (record) => {
    try {
      await payrollApi.reviewPayroll(record._id, { remarks: 'Verified by HR Manager' });
      showToast(`Payroll for ${record.employee?.name?.firstName || 'staff'} marked as REVIEWED`, 'success');
      fetchPayrollRecords(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to review payroll', 'error');
    }
  };

  // Handle Finalize / Approve Single Record
  const handleFinalizeSingle = async (e) => {
    e.preventDefault();
    if (!finalizeTarget) return;
    try {
      setIsFinalizing(true);
      await payrollApi.approvePayroll(finalizeTarget._id, {
        paymentReference,
        remarks: finalizeRemarks,
      });
      showToast(
        `Approved & finalized payroll for ${finalizeTarget.employee?.name?.firstName || 'staff'}!`,
        'success'
      );
      setFinalizeTarget(null);
      fetchPayrollRecords(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to finalize payroll record', 'error');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Handle Batch Finalize
  const handleBatchFinalize = async (e) => {
    e.preventDefault();
    try {
      setIsBatchFinalizing(true);
      const res = await payrollApi.finalizeBatch({
        month: selectedMonth,
        year: selectedYear,
        remarks: batchRemarks,
      });
      showToast(
        `Batch finalized ${res.data?.finalizedCount || 0} payroll records successfully!`,
        'success'
      );
      setIsBatchFinalizeOpen(false);
      fetchPayrollRecords(1);
    } catch (err) {
      showToast(err.message || 'Failed to batch finalize payroll', 'error');
    } finally {
      setIsBatchFinalizing(false);
    }
  };

  // Handle Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget) return;
    try {
      setIsRecordingPayment(true);
      await payrollApi.recordPayment(paymentTarget._id, {
        paymentReference: paymentRefNumber,
        paymentDate,
        paymentMode,
        remarks: paymentRemarks,
      });
      showToast(`Recorded payment of ${formatCurrency(paymentTarget.netPayable)} as PAID!`, 'success');
      setPaymentTarget(null);
      fetchPayrollRecords(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Handle Add Adjustment
  const handleAddAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentTarget) return;
    try {
      setIsSubmittingAdjustment(true);
      await payrollApi.addAdjustment(adjustmentTarget._id, {
        type: adjustmentType,
        title: adjustmentTitle,
        amount: Number(adjustmentAmount),
        reason: adjustmentReason,
      });
      showToast(`Added ${adjustmentType} adjustment of ₹${adjustmentAmount} successfully!`, 'success');
      setAdjustmentTarget(null);
      fetchPayrollRecords(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to add adjustment', 'error');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Handle Controlled Reversal
  const handleReversePayroll = async (e) => {
    e.preventDefault();
    if (!reversalTarget) return;
    try {
      setIsReversing(true);
      await payrollApi.reversePayroll(reversalTarget._id, {
        reason: reversalReason,
      });
      showToast('Payroll record successfully reversed with audit history', 'warning');
      setReversalTarget(null);
      fetchPayrollRecords(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to reverse payroll', 'error');
    } finally {
      setIsReversing(false);
    }
  };

  // Handle Download PDF
  const handleDownloadPdf = async (payrollRecord) => {
    try {
      setIsDownloadingPdf(true);
      const empCode = payrollRecord.employee?.employeeId || payrollRecord.employeeId || 'EMP';
      const filename = `payslip_${empCode}_${payrollRecord.year}_${String(payrollRecord.month).padStart(2, '0')}.pdf`;
      await payrollApi.downloadPayslipPdf(payrollRecord._id, filename);
      showToast(`Downloaded payslip PDF: ${filename}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to download payslip PDF', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            DRAFT
          </span>
        );
      case 'CALCULATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            CALCULATED
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            REVIEWED
          </span>
        );
      case 'APPROVED':
      case 'FINALIZED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            APPROVED
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            PAID
          </span>
        );
      case 'REVERSED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            REVERSED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  // Metrics Summary
  const totalGross = payrolls.reduce(
    (acc, p) => acc + Number(p.grossSalary || p.earnings?.grossSalary || 0),
    0
  );
  const totalDeductions = payrolls.reduce(
    (acc, p) => acc + Number(p.totalDeductions || p.deductions?.totalDeductions || 0),
    0
  );
  const totalNet = payrolls.reduce((acc, p) => acc + Number(p.netPayable || 0), 0);

  // Sync with Sidebar sub-links and Quick Actions
  useEffect(() => {
    if (tabParams?.subTab) {
      setActiveTab(tabParams.subTab);
    }
    if (tabParams?.autoOpenGenerate && canManagePayroll) {
      setIsGenerateModalOpen(true);
    }
  }, [tabParams, canManagePayroll]);

  return (
    <div className="space-y-6">



      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
              Indian Construction Payroll & Compensation Engine
            </h1>

          </div>

        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {canManagePayroll && (
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'company'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              Company Payroll Run
            </button>
          )}
          <button
            onClick={() => setActiveTab('my-payslips')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'my-payslips'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            My Payslips
          </button>
        </div>
      </div>

      {/* Alert banner if backend process needs restart */}
      {needsServerRestart && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Backend Process Needs Restart (Port 3000)</p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                The running backend process (started 4+ hours ago) is running an old Node instance from before <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">/payroll</code> routes were mounted in memory. In your backend terminal, press <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-white">Ctrl + C</kbd> and run <code className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded font-mono text-emerald-400">npm run dev</code>.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchPayrollRecords(pagination.page)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* TAB 1: COMPANY PAYROLL RUN */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Net Payout
              </span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                {formatCurrency(totalNet)}
              </div>
              <span className="text-[10px] text-slate-500">
                {payrolls.length} employee(s) listed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Gross Earnings
              </span>
              <div className="text-xl font-black text-slate-200 font-mono mt-1">
                {formatCurrency(totalGross)}
              </div>
              <span className="text-[10px] text-slate-500">Includes Basic, HRA & Allowances</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Statutory Deductions
              </span>
              <div className="text-xl font-black text-rose-400 font-mono mt-1">
                {formatCurrency(totalDeductions)}
              </div>
              <span className="text-[10px] text-slate-500">EPF 12%, ESIC & MP PT</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pending Approvals
              </span>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">
                {payrolls.filter((p) => ['DRAFT', 'CALCULATED', 'REVIEWED'].includes(p.status)).length}
              </div>
              <span className="text-[10px] text-slate-500">Ready for finalization</span>
            </div>
          </div>

          {/* Controls Bar: Filters & Batch Action Buttons */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Month Selector */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
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
                ].map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CALCULATED">Calculated</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="APPROVED">Approved / Finalized</option>
                <option value="PAID">Paid</option>
                <option value="REVERSED">Reversed</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search staff, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44"
                />
              </div>

              <button
                onClick={() => fetchPayrollRecords(1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Refresh table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                onClick={() => {
                  setSelectedSlipEmployee(null);
                  setIsSalarySlipModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                title="Generate and print salary slip for any employee with month switcher"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Salary Slip Generator</span>
              </button>

              <button
                onClick={() => setIsBatchFinalizeOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Batch Approve</span>
              </button>

              <button
                onClick={() => {
                  setGenerateMonth(selectedMonth);
                  setGenerateYear(selectedYear);
                  setIsGenerateModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Generate Monthly Run</span>
              </button>
            </div>
          </div>

          {/* Payroll Records Table */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-5">Employee / Staff</th>
                    <th className="py-3 px-3 text-center">Version</th>
                    <th className="py-3 px-3 text-center">Payable / LOP</th>
                    <th className="py-3 px-4 text-right">Gross Salary</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right font-black text-emerald-400">Net Payable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Actions & Workflows</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                          <span>Calculating payroll records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : payrolls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Receipt className="w-8 h-8 text-slate-600" />
                          <span className="font-semibold text-slate-300">
                            No payroll records found for {selectedMonth}/{selectedYear}
                          </span>
                          <p className="text-xs text-slate-500">
                            Click "Generate Monthly Run" to calculate drafts using applicable salary versions.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payrolls.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Employee */}
                        <td className="py-3 px-5">
                          <div className="font-bold text-white text-xs">
                            {p.employee?.name?.firstName || ''} {p.employee?.name?.lastName || ''}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.employee?.employeeId || p.employeeId || 'EMP'} •{' '}
                            {p.employee?.designation || 'Staff'}
                          </div>
                        </td>

                        {/* Salary Version */}
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-[10px]" title="Immutable Salary Structure Version">
                            v{p.salaryVersion}
                          </span>
                        </td>

                        {/* Days / LOP */}
                        <td className="py-3 px-3 text-center font-mono">
                          <div className="text-slate-200 font-semibold">
                            {p.payableDays}/{p.daysInMonth}
                          </div>
                          {p.unpaidDays > 0 ? (
                            <span className="text-[10px] text-rose-400">
                              {p.unpaidDays} LOP
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">0 LOP</span>
                          )}
                        </td>

                        {/* Gross */}
                        <td className="py-3 px-4 text-right font-mono text-slate-200">
                          {formatCurrency(p.grossSalary || p.earnings?.grossSalary)}
                        </td>

                        {/* Deductions */}
                        <td className="py-3 px-4 text-right font-mono text-rose-400">
                          {formatCurrency(p.totalDeductions || p.deductions?.totalDeductions)}
                        </td>

                        {/* Net */}
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold text-sm">
                          {formatCurrency(p.netPayable)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {renderStatusBadge(p.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Salary Slip with Month Switcher & Direct Print */}
                            <button
                              onClick={() => {
                                setSelectedSlipEmployee(p.employee);
                                setIsSalarySlipModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors"
                              title="Generate, Switch Month & Print Salary Slip"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>

                            {/* View Slip */}
                            <button
                              onClick={() => setViewingRecord(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="View Interactive Payslip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Download PDF */}
                            <button
                              onClick={() => handleDownloadPdf(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Download Electronic PDF"
                            >
                              <FileDown className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            {/* Workflow Transitions */}
                            {['DRAFT', 'CALCULATED'].includes(p.status) && (
                              <button
                                onClick={() => handleReviewRecord(p)}
                                className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold"
                                title="Mark as Reviewed by HR"
                              >
                                Review
                              </button>
                            )}

                            {['DRAFT', 'CALCULATED', 'REVIEWED'].includes(p.status) && (
                              <button
                                onClick={() => {
                                  setFinalizeTarget(p);
                                  setPaymentReference('');
                                  setFinalizeRemarks('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
                                title="Approve & Finalize Payslip"
                              >
                                Approve
                              </button>
                            )}

                            {['APPROVED', 'FINALIZED'].includes(p.status) && (
                              <button
                                onClick={() => {
                                  setPaymentTarget(p);
                                  setPaymentRefNumber('');
                                  setPaymentMode('NEFT');
                                  setPaymentRemarks('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                                title="Record Bank Disbursement"
                              >
                                <Banknote className="w-3 h-3" />
                                <span>Disburse</span>
                              </button>
                            )}

                            {/* Add Adjustment */}
                            {!['PAID', 'REVERSED'].includes(p.status) && (
                              <button
                                onClick={() => {
                                  setAdjustmentTarget(p);
                                  setAdjustmentType('ADDITION');
                                  setAdjustmentTitle('');
                                  setAdjustmentAmount('');
                                  setAdjustmentReason('');
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                                title="Add Bonus or Deduction Adjustment"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Controlled Reversal */}
                            {['APPROVED', 'FINALIZED', 'PAID'].includes(p.status) && (
                              <button
                                onClick={() => {
                                  setReversalTarget(p);
                                  setReversalReason('');
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Controlled Reversal with Audit Trail"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY PAYSLIPS (Self-Service) */}
      {activeTab === 'my-payslips' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-['Outfit']">
                  My Official Payslips & Salary Statements
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Download and review monthly finalized salary slips with immutable statutory breakdowns
                </p>
              </div>
              <button
                onClick={fetchMyPayslips}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPayslips ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-3 px-5">Pay Period</th>
                  <th className="py-3 px-4 text-center">Version</th>
                  <th className="py-3 px-4 text-center">Payable Days</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-5 text-right font-black text-emerald-400">Net Take-Home</th>
                  <th className="py-3 px-4 text-center">Payment Ref</th>
                  <th className="py-3 px-5 text-right">Electronic Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoadingPayslips ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading your payslips...
                    </td>
                  </tr>
                ) : myPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt className="w-8 h-8 text-slate-600" />
                        <span className="font-semibold text-slate-300">
                          No finalized payslips available yet
                        </span>
                        <p className="text-xs text-slate-500">
                          Your payslips will appear here once approved by Human Resources.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  myPayslips.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-5 font-semibold text-white">
                        {p.month}/{p.year}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 text-[10px]">
                          v{p.salaryVersion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {p.payableDays} days
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        {formatCurrency(p.grossSalary || p.earnings?.grossSalary)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">
                        {formatCurrency(p.totalDeductions || p.deductions?.totalDeductions)}
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-emerald-400 font-bold text-sm">
                        {formatCurrency(p.netPayable)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-400">
                        {p.paymentReference || 'Direct Bank NEFT'}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingRecord(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE MONTHLY DRAFT PAYROLL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Generate Monthly Payroll Run
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayroll} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Applies effective Indian statutory rules (EPF 12%, ESIC 0.75%, Madhya Pradesh Professional Tax slabs), Loss of Pay (LOP) calculations, and immutable salary versions for all active employees.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Month</label>
                  <select
                    value={generateMonth}
                    onChange={(e) => setGenerateMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
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
                    ].map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Year</label>
                  <select
                    value={generateYear}
                    onChange={(e) => setGenerateYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isGenerating ? 'Calculating Run...' : 'Execute Calculation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPROVE / FINALIZE SINGLE RECORD */}
      {finalizeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Approve & Finalize Payroll
                </h3>
              </div>
              <button
                onClick={() => setFinalizeTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeSingle} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee:</span>
                  <span className="font-semibold text-white">
                    {finalizeTarget.employee?.name?.firstName} {finalizeTarget.employee?.name?.lastName} (
                    {finalizeTarget.employee?.employeeId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Take-Home:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(finalizeTarget.netPayable)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Salary Version:</span>
                  <span className="text-blue-400 font-mono font-bold">Version {finalizeTarget.salaryVersion}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Optional Bank / NEFT Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEFT-HDFC-20261014-0099"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Approval Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. October monthly salary approved for disbursement"
                  value={finalizeRemarks}
                  onChange={(e) => setFinalizeRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFinalizeTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFinalizing}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isFinalizing ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BATCH APPROVE */}
      {isBatchFinalizeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Batch Approve Monthly Payroll
                </h3>
              </div>
              <button
                onClick={() => setIsBatchFinalizeOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchFinalize} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <p className="font-bold">Attention:</p>
                <p>
                  This action will approve all remaining unapproved payroll records for{' '}
                  <span className="font-bold underline">{selectedMonth}/{selectedYear}</span>. Amounts will be frozen, generating immutable payslips and alerts for employees.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Batch Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. October payroll batch approved by HR Head"
                  value={batchRemarks}
                  onChange={(e) => setBatchRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchFinalizeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBatchFinalizing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isBatchFinalizing ? 'Approving Batch...' : 'Approve All Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DISBURSE / RECORD PAYMENT */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Record Salary Disbursement
                </h3>
              </div>
              <button
                onClick={() => setPaymentTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee:</span>
                  <span className="font-semibold text-white">
                    {paymentTarget.employee?.name?.firstName} {paymentTarget.employee?.name?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Disbursed:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {formatCurrency(paymentTarget.netPayable)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Bank Reference Number / UTR / Cheque No. <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC-NEFT-20261014-9988"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {['NEFT', 'RTGS', 'IMPS', 'UPI', 'CHEQUE', 'BANK_TRANSFER', 'CASH'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Disbursed via direct corporate internet banking"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isRecordingPayment ? 'Recording...' : 'Mark as PAID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD ADJUSTMENT */}
      {adjustmentTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Add Payroll Adjustment
                </h3>
              </div>
              <button
                onClick={() => setAdjustmentTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdjustment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Employee:</span>
                <span className="font-semibold text-white">
                  {adjustmentTarget.employee?.name?.firstName} {adjustmentTarget.employee?.name?.lastName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="ADDITION">+ Addition (Bonus / Allowance)</option>
                    <option value="DEDUCTION">- Deduction (Penalty / Advance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5000"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Adjustment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Performance Bonus"
                  value={adjustmentTitle}
                  onChange={(e) => setAdjustmentTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason / Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Authorized site completion incentive bonus"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmittingAdjustment ? 'Applying...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CONTROLLED REVERSAL */}
      {reversalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Controlled Payroll Reversal
                </h3>
              </div>
              <button
                onClick={() => setReversalTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReversePayroll} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                <p className="font-bold">Audit Warning:</p>
                <p>
                  Reversing a payroll marks this payout record as REVERSED and revokes its valid state. An immutable audit trail entry with your identity will be logged.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Mandatory Reversal Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bank return: invalid beneficiary IFSC code provided by employee"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReversing || reversalReason.trim().length < 5}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {isReversing ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: DETAILED PAYSLIP BREAKDOWN WITH DIRECT PDF DOWNLOAD */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Payslip Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-lg font-['Outfit']">
                    SPEEDDEX CONSTRUCTION PVT. LTD.
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    INDORE, MP
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">
                  Salary Payslip — {viewingRecord.month}/{viewingRecord.year}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Reference: {viewingRecord.paymentReference || 'Direct Bank Transfer'} • Salary Structure Version: v{viewingRecord.salaryVersion}
                </p>
              </div>

              <button
                onClick={() => setViewingRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Info Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Employee</span>
                <span className="font-bold text-white block mt-0.5">
                  {viewingRecord.employee?.name?.firstName || ''} {viewingRecord.employee?.name?.lastName || ''}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {viewingRecord.employee?.employeeId || viewingRecord.employeeId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Designation</span>
                <span className="font-semibold text-slate-200 block mt-0.5">
                  {viewingRecord.employee?.designation || 'Staff'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {viewingRecord.employee?.department?.name || 'Operations'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Payable Days</span>
                <span className="font-bold text-emerald-400 font-mono text-sm block mt-0.5">
                  {viewingRecord.payableDays} / {viewingRecord.daysInMonth}
                </span>
                <span className="text-rose-400 text-[10px]">
                  {viewingRecord.unpaidDays > 0 ? `${viewingRecord.unpaidDays} LOP days` : '0 LOP'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
                <div className="mt-1">
                  {renderStatusBadge(viewingRecord.status)}
                </div>
              </div>
            </div>

            {/* Breakdown: Earnings vs Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800/80 pb-2">
                  Earnings & Allowances (INR)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic Salary:</span>
                    <span className="font-mono text-white">
                      {formatCurrency(viewingRecord.earnings?.basic)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">House Rent Allowance (HRA):</span>
                    <span className="font-mono text-white">
                      {formatCurrency(viewingRecord.earnings?.houseRentAllowance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Special Allowance:</span>
                    <span className="font-mono text-white">
                      {formatCurrency(viewingRecord.earnings?.specialAllowance)}
                    </span>
                  </div>
                  {viewingRecord.earnings?.dearnessAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dearness Allowance (DA):</span>
                      <span className="font-mono text-white">
                        {formatCurrency(viewingRecord.earnings?.dearnessAllowance)}
                      </span>
                    </div>
                  )}
                  {viewingRecord.earnings?.conveyanceAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Conveyance Allowance:</span>
                      <span className="font-mono text-white">
                        {formatCurrency(viewingRecord.earnings?.conveyanceAllowance)}
                      </span>
                    </div>
                  )}
                  {viewingRecord.earnings?.siteAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Site Allowance:</span>
                      <span className="font-mono text-white">
                        {formatCurrency(viewingRecord.earnings?.siteAllowance)}
                      </span>
                    </div>
                  )}
                  {viewingRecord.earnings?.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-emerald-400 font-semibold">Performance Bonus:</span>
                      <span className="font-mono text-emerald-400">
                        {formatCurrency(viewingRecord.earnings?.bonus)}
                      </span>
                    </div>
                  )}
                  {viewingRecord.earnings?.reimbursements > 0 && (
                    <div className="flex justify-between">
                      <span className="text-emerald-400 font-semibold">Reimbursements:</span>
                      <span className="font-mono text-emerald-400">
                        {formatCurrency(viewingRecord.earnings?.reimbursements)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                    <span className="text-white">Gross Salary:</span>
                    <span className="font-mono text-emerald-400">
                      {formatCurrency(viewingRecord.grossSalary || viewingRecord.earnings?.grossSalary)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-800/80 pb-2">
                  Statutory Deductions (INR)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provident Fund (EPF 12%):</span>
                    <span className="font-mono text-rose-300">
                      {formatCurrency(viewingRecord.deductions?.providentFund)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Professional Tax (PT MP):</span>
                    <span className="font-mono text-rose-300">
                      {formatCurrency(viewingRecord.deductions?.professionalTax)}
                    </span>
                  </div>
                  {viewingRecord.deductions?.employeeStateInsurance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ESIC (0.75%):</span>
                      <span className="font-mono text-rose-300">
                        {formatCurrency(viewingRecord.deductions?.employeeStateInsurance)}
                      </span>
                    </div>
                  )}
                  {viewingRecord.deductions?.taxDeductedAtSource > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Income Tax (TDS):</span>
                      <span className="font-mono text-rose-300">
                        {formatCurrency(viewingRecord.deductions?.taxDeductedAtSource)}
                      </span>
                    </div>
                  )}
                  {viewingRecord.deductions?.advanceDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Advance Recovery:</span>
                      <span className="font-mono text-rose-300">
                        {formatCurrency(viewingRecord.deductions?.advanceDeduction)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                    <span className="text-white">Total Deductions:</span>
                    <span className="font-mono text-rose-400">
                      {formatCurrency(viewingRecord.totalDeductions || viewingRecord.deductions?.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adjustments section if any */}
            {viewingRecord.adjustments?.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Approved Adjustments Applied
                </span>
                <div className="space-y-1.5">
                  {viewingRecord.adjustments.map((adj, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-300">
                      <span className="font-medium">
                        [{adj.type}] {adj.title} ({adj.reason})
                      </span>
                      <span className={`font-mono font-bold ${adj.type === 'ADDITION' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {adj.type === 'ADDITION' ? '+' : '-'}{formatCurrency(adj.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Net Salary & Download Actions */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  Net Disbursed Take-Home
                </span>
                <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                  {formatCurrency(viewingRecord.netPayable)}
                </span>
                {viewingRecord.payslip?.hash && (
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">
                    SHA-256: {viewingRecord.payslip.hash.slice(0, 24)}... (Verified)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(viewingRecord)}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Employee Salary Slip Generator & Print Modal */}
      <SalarySlipModal
        isOpen={isSalarySlipModalOpen}
        onClose={() => {
          setIsSalarySlipModalOpen(false);
          setSelectedSlipEmployee(null);
        }}
        initialEmployee={selectedSlipEmployee}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
      />
    </div>
  );
};
