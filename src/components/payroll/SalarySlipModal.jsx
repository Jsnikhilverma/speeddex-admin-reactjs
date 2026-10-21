import React, { useState, useEffect, useRef } from 'react';
import { payrollApi } from '../../api/payrollApi';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Printer,
  Download,
  X,
  Calendar,
  User,
  Building,
  RefreshCw,
  Coins,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Receipt,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { EditBankDetailsModal } from '../employees/EditBankDetailsModal';

const MONTH_NAMES = [
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
];

export const SalarySlipModal = ({
  isOpen,
  onClose,
  initialEmployee = null,
  initialMonth = new Date().getMonth() + 1,
  initialYear = new Date().getFullYear(),
}) => {
  const { showToast } = useToast();
  const printRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    initialEmployee?._id || ''
  );
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const [payslipData, setPayslipData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Load employee list for dropdown switcher
  useEffect(() => {
    if (isOpen) {
      employeeApi
        .getEmployees({ limit: 200, status: 'ALL' })
        .then((res) => setEmployees(res.data?.employees || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // Sync state if initial props change
  useEffect(() => {
    if (isOpen) {
      if (initialEmployee?._id) {
        setSelectedEmployeeId(initialEmployee._id);
      }
      setSelectedMonth(initialMonth || new Date().getMonth() + 1);
      setSelectedYear(initialYear || new Date().getFullYear());
      setError('');
    }
  }, [isOpen, initialEmployee, initialMonth, initialYear]);

  // Fetch or on-the-fly calculate salary slip whenever employee, month, or year changes
  const fetchSalarySlip = async (recalculate = false) => {
    if (!selectedEmployeeId) return;

    try {
      setIsLoading(true);
      setError('');
      const res = await payrollApi.getEmployeeSalarySlip(selectedEmployeeId, {
        month: selectedMonth,
        year: selectedYear,
        recalculate: recalculate ? 'true' : 'false',
      });

      setPayslipData(res.data);
      if (recalculate) {
        showToast('Salary slip recalculated with latest compensation data!', 'success');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load salary slip. Please ensure employee has an active salary structure.'
      );
      setPayslipData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedEmployeeId) {
      fetchSalarySlip(false);
    }
  }, [isOpen, selectedEmployeeId, selectedMonth, selectedYear]);

  if (!isOpen) return null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  // Direct print handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF handler
  const handleDownloadPdf = async () => {
    if (!selectedEmployeeId) return;
    try {
      setIsDownloadingPdf(true);
      const empCode = payslipData?.employee?.employeeId || 'EMP';
      const filename = `salary_slip_${empCode}_${selectedYear}_${String(
        selectedMonth
      ).padStart(2, '0')}.pdf`;

      await payrollApi.downloadEmployeePayslipPdf(
        selectedEmployeeId,
        { month: selectedMonth, year: selectedYear },
        filename
      );

      showToast('Salary slip PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to download PDF payslip', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatCurrency = (val) =>
    Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });

  const selectedEmpObj =
    employees.find((e) => e._id === selectedEmployeeId) ||
    payslipData?.employee ||
    initialEmployee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Print Specific CSS Overrides */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-salary-slip-area, #printable-salary-slip-area * {
            visibility: visible !important;
          }
          #printable-salary-slip-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm 12mm !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/90 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-['Outfit'] flex items-center gap-2">
                <span>Employee Salary Slip</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate, review, and print official salary slips with month switcher
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Controls & Filters Bar */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          {/* Employee Selector */}
          <div className="flex items-center gap-2 min-w-[240px] flex-1">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.employeeId} - {emp.fullName || `${emp.name?.firstName} ${emp.name?.lastName}`} (
                  {emp.designation})
                </option>
              ))}
            </select>
          </div>

          {/* Month & Year Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-transparent text-white font-semibold text-xs focus:outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-transparent text-amber-400 font-bold font-mono text-xs focus:outline-none"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentMonth}
              className="px-2 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
            >
              Current
            </button>
          </div>

          {/* Action Buttons: Print, Download, Refresh, Bank Details */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditBankModalOpen(true)}
              title="Add or update bank account & PAN details for this employee"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Bank Details</span>
            </button>

            <button
              onClick={() => fetchSalarySlip(true)}
              disabled={isLoading || !selectedEmployeeId}
              title="Recalculate salary slip with latest compensation rules"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recalculate</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf || !payslipData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PDF</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!payslipData}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all font-['Outfit']"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Salary Slip</span>
            </button>
          </div>
        </div>

        {/* Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-semibold text-slate-300">
                Generating salary slip calculation for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}...
              </p>
              <p className="text-xs text-slate-500">
                Verifying applicable salary version, attendance days & statutory deductions
              </p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Unable to Generate Salary Slip
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
              <div className="pt-2">
                <button
                  onClick={() => fetchSalarySlip(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Retry Calculation
                </button>
              </div>
            </div>
          ) : payslipData ? (
            <>
              {/* Missing Bank Details Warning Banner (Screen Only) */}
              {!(
                payslipData.employee?.identityDetails?.bankDetails?.accountNumber ||
                payslipData.employee?.bankDetails?.accountNumber
              ) && (
                <div className="max-w-[780px] mx-auto mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg no-print">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Bank Account Details Missing</p>
                      <p className="text-[11px] text-amber-300/80">
                        This employee does not have bank account details saved. Add them now to show on this salary slip.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditBankModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shrink-0 transition-all shadow-md font-['Outfit']"
                  >
                    Add Bank Details Now
                  </button>
                </div>
              )}

              {/* Printable Salary Slip Sheet (Formatted as Official A4 Document) */}
              <div
                id="printable-salary-slip-area"
                ref={printRef}
                className="max-w-[780px] mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 font-sans text-xs border border-slate-200"
              >
              {/* 1. Official Company Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-['Outfit'] uppercase">
                      {payslipData.company?.name || 'Speeddex Construction Pvt. Ltd.'}
                    </h1>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {payslipData.company?.address ||
                        'Scheme 78, Vijay Nagar, Indore, Madhya Pradesh - 452010'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      CIN: {payslipData.company?.cin || 'U45200MP2024PTC001234'} &bull; PAN:{' '}
                      {payslipData.company?.pan || 'AAECS1234F'} &bull; Email:{' '}
                      {payslipData.company?.email || 'hr@speeddex.in'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded-md bg-slate-100 text-slate-900 font-bold font-mono text-[11px] border border-slate-300 uppercase">
                      {payslipData.status || 'FINALIZED'}
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      Slip #: {payslipData.payslip?.payslipNumber || `PAY-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${payslipData.employee?.employeeId || 'EMP'}`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-dashed border-slate-300 text-center">
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-950 font-['Outfit']">
                    SALARY SLIP FOR THE MONTH OF {MONTH_NAMES[selectedMonth - 1].toUpperCase()}{' '}
                    {selectedYear}
                  </h2>
                </div>
              </div>

              {/* 2. Employee Summary Grid */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Employee ID
                    </span>
                    <span className="font-mono font-bold text-slate-950">
                      {payslipData.employee?.employeeId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Employee Name
                    </span>
                    <span className="font-bold text-slate-950">
                      {payslipData.employee?.name?.firstName}{' '}
                      {payslipData.employee?.name?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Designation
                    </span>
                    <span className="font-semibold text-slate-900">
                      {payslipData.employee?.designation}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Department
                    </span>
                    <span className="font-semibold text-slate-900">
                      {payslipData.employee?.department?.name || 'General Operations'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Date of Joining
                    </span>
                    <span className="font-mono text-slate-800">
                      {payslipData.employee?.joiningDate
                        ? new Date(payslipData.employee.joiningDate).toLocaleDateString('en-IN')
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Bank Name
                    </span>
                    <span className="font-medium text-slate-800">
                      {payslipData.employee?.identityDetails?.bankDetails?.bankName ||
                        payslipData.employee?.bankDetails?.bankName ||
                        'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Account Number
                    </span>
                    <span className="font-mono font-semibold text-slate-900">
                      {payslipData.employee?.identityDetails?.bankDetails?.accountNumber ||
                        payslipData.employee?.bankDetails?.accountNumber ||
                        'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      IFSC / Branch
                    </span>
                    <span className="font-mono text-slate-800">
                      {payslipData.employee?.identityDetails?.bankDetails?.ifscCode ||
                        payslipData.employee?.bankDetails?.ifscCode ||
                        'N/A'}
                      {payslipData.employee?.identityDetails?.bankDetails?.branch ||
                      payslipData.employee?.bankDetails?.branch
                        ? ` - ${
                            payslipData.employee?.identityDetails?.bankDetails?.branch ||
                            payslipData.employee?.bankDetails?.branch
                          }`
                        : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      PAN Number
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {payslipData.employee?.identityDetails?.panNumber ||
                        payslipData.taxConfiguration?.pan ||
                        'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      EPF UAN
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {payslipData.employee?.identityDetails?.uan ||
                        payslipData.employee?.uan ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      PF Member ID
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      {payslipData.employee?.identityDetails?.pfNumber ||
                        payslipData.employee?.pfNumber ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Payment Mode
                    </span>
                    <span className="font-medium text-emerald-800">
                      Bank Transfer (NEFT/RTGS)
                    </span>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200 text-center font-mono text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[9px] uppercase block">
                      Calendar Days
                    </span>
                    <strong className="text-slate-950 font-bold">
                      {payslipData.attendance?.calendarDays || 30} Days
                    </strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[9px] uppercase block">
                      Payable Days
                    </span>
                    <strong className="text-emerald-700 font-bold">
                      {payslipData.attendance?.payableDays || 30} Days
                    </strong>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[9px] uppercase block">
                      Unpaid Leaves (LOP)
                    </span>
                    <strong className="text-rose-700 font-bold">
                      {payslipData.attendance?.unpaidDays || 0} Days
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Financial Breakdown: Earnings vs Deductions */}
              <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  {/* Left Column: Earnings */}
                  <div>
                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-bold text-slate-950 uppercase text-[10px] flex items-center justify-between">
                      <span>Earnings (A)</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="p-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-700">Basic Salary</span>
                        <span className="font-mono font-medium">
                          ₹{formatCurrency(payslipData.earnings?.basic)}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-700">House Rent Allowance (HRA)</span>
                        <span className="font-mono font-medium">
                          ₹{formatCurrency(payslipData.earnings?.houseRentAllowance)}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-700">Conveyance Allowance</span>
                        <span className="font-mono font-medium">
                          ₹{formatCurrency(payslipData.earnings?.conveyanceAllowance)}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-700">Special Allowance</span>
                        <span className="font-mono font-medium">
                          ₹{formatCurrency(payslipData.earnings?.specialAllowance)}
                        </span>
                      </div>
                      {Number(payslipData.earnings?.dearnessAllowance) > 0 && (
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-700">Dearness Allowance (DA)</span>
                          <span className="font-mono font-medium">
                            ₹{formatCurrency(payslipData.earnings.dearnessAllowance)}
                          </span>
                        </div>
                      )}
                      {Number(payslipData.earnings?.medicalAllowance) > 0 && (
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-700">Medical Allowance</span>
                          <span className="font-mono font-medium">
                            ₹{formatCurrency(payslipData.earnings.medicalAllowance)}
                          </span>
                        </div>
                      )}
                      {payslipData.adjustments?.additions?.length > 0 &&
                        payslipData.adjustments.additions.map((add, idx) => (
                          <div key={idx} className="flex justify-between py-0.5 text-emerald-800 font-medium">
                            <span>+ {add.title || 'Incentive / Bonus'}</span>
                            <span className="font-mono">₹{formatCurrency(add.amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right Column: Deductions */}
                  <div>
                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-bold text-slate-950 uppercase text-[10px] flex items-center justify-between">
                      <span>Deductions (B)</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="p-3 space-y-1.5 text-[11px]">
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-700">Provident Fund (Employee PF)</span>
                        <span className="font-mono font-medium">
                          ₹{formatCurrency(payslipData.deductions?.providentFund?.employeeContribution)}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-700">Professional Tax (PT)</span>
                        <span className="font-mono font-medium">
                          ₹{formatCurrency(payslipData.deductions?.professionalTax)}
                        </span>
                      </div>
                      {Number(payslipData.deductions?.employeeStateInsurance) > 0 && (
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-700">ESIC</span>
                          <span className="font-mono font-medium">
                            ₹{formatCurrency(payslipData.deductions.employeeStateInsurance)}
                          </span>
                        </div>
                      )}
                      {Number(payslipData.deductions?.tds) > 0 && (
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-700">TDS / Income Tax</span>
                          <span className="font-mono font-medium">
                            ₹{formatCurrency(payslipData.deductions.tds)}
                          </span>
                        </div>
                      )}
                      {Number(payslipData.attendance?.lopAmount) > 0 && (
                        <div className="flex justify-between py-0.5 text-rose-800 font-medium">
                          <span>Loss of Pay (LOP Deduction)</span>
                          <span className="font-mono">
                            ₹{formatCurrency(payslipData.attendance.lopAmount)}
                          </span>
                        </div>
                      )}
                      {payslipData.adjustments?.deductions?.length > 0 &&
                        payslipData.adjustments.deductions.map((ded, idx) => (
                          <div key={idx} className="flex justify-between py-0.5 text-rose-800 font-medium">
                            <span>- {ded.title || 'Penalty / Adjustment'}</span>
                            <span className="font-mono">₹{formatCurrency(ded.amount)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Totals Summary Row */}
                <div className="grid grid-cols-2 divide-x divide-slate-300 border-t-2 border-slate-300 bg-slate-100 font-bold text-[11px]">
                  <div className="px-3 py-2 flex justify-between items-center text-slate-950">
                    <span>Total Gross Earnings (A):</span>
                    <span className="font-mono font-extrabold text-sm">
                      ₹{formatCurrency(payslipData.grossSalary || payslipData.earnings?.grossSalary)}
                    </span>
                  </div>
                  <div className="px-3 py-2 flex justify-between items-center text-rose-900">
                    <span>Total Deductions (B):</span>
                    <span className="font-mono font-extrabold text-sm">
                      ₹{formatCurrency(payslipData.totalDeductions || payslipData.deductions?.totalDeductions)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Highlighted Net Pay Box */}
              <div className="bg-slate-950 text-white rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider block">
                    Take Home / Net Payable Amount (A - B)
                  </span>
                  <span className="text-2xl font-black font-mono tracking-tight text-white font-['Outfit']">
                    ₹{formatCurrency(payslipData.netPayable)}
                  </span>
                </div>

                <div className="text-right sm:max-w-xs">
                  <span className="text-slate-400 text-[10px] uppercase block font-semibold">
                    Amount in Words
                  </span>
                  <p className="text-xs font-medium italic text-slate-200 capitalize">
                    {payslipData.netPayableInWords || 'Amount in Indian Rupees'}
                  </p>
                </div>
              </div>

              {/* 5. Statutory Employer Information */}
              <div className="border border-slate-200 rounded-lg p-2.5 mb-6 text-[10px] text-slate-600 grid grid-cols-2 gap-2 bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-800">Employer PF Contribution:</span>{' '}
                  ₹{formatCurrency(payslipData.deductions?.providentFund?.employerContribution)}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-800">Monthly CTC Cost:</span>{' '}
                  ₹{formatCurrency(payslipData.ctc)}
                </div>
              </div>

              {/* 6. Signature Lines */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[11px] text-slate-600">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 w-48 mx-auto font-medium">
                    Employee Signature
                  </div>
                  <span className="text-[9px] text-slate-400">Date: ____________</span>
                </div>

                <div>
                  <div className="border-t border-slate-400 pt-1.5 w-48 mx-auto font-bold text-slate-900">
                    Authorized Signatory
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">
                    Speeddex Construction Pvt. Ltd.
                  </span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                This is a computer-generated document and is valid without a physical signature. Confidential & Proprietary.
              </div>
            </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>Select an employee and month above to generate and print their salary slip.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Bank Details Modal */}
      {isEditBankModalOpen && (
        <EditBankDetailsModal
          isOpen={isEditBankModalOpen}
          onClose={() => setIsEditBankModalOpen(false)}
          employee={
            payslipData?.employee ||
            employees.find((e) => e._id === selectedEmployeeId) ||
            initialEmployee
          }
          onUpdated={() => {
            fetchSalarySlip(false);
          }}
        />
      )}
    </div>
  );
};
