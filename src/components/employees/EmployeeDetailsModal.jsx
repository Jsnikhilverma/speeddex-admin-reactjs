import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES, ROLE_LABELS } from '../../utils/permissions';

import {
  User,
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Home,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  ArrowRightLeft,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Shield,
  Coins,
  Sparkles,
  Receipt,
  Edit3,
  Award,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  BriefcaseBusiness,
  MapPin,
  Wallet,
  History,
  LockKeyhole,
  BadgeCheck,
  AlertCircle,
  Banknote,
  ChevronRight,
  UserRound,
} from 'lucide-react';

import { SalaryIncrementModal } from './SalaryIncrementModal';
import { UploadDocumentModal } from './UploadDocumentModal';
import { SalarySlipModal } from '../payroll/SalarySlipModal';
import { EditBankDetailsModal } from './EditBankDetailsModal';
import { PromoteEmployeeModal } from './PromoteEmployeeModal';
import { GenerateDocumentModal } from './GenerateDocumentModal';

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */

const formatDate = (value, options = {}) => {
  if (!value) return 'Not provided';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not provided';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '₹0';

  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
};

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  return (
    employee.fullName ||
    [employee.name?.firstName, employee.name?.lastName]
      .filter(Boolean)
      .join(' ') ||
    'Employee'
  );
};

const getBankDetails = (employee) =>
  employee?.identityDetails?.bankDetails || employee?.bankDetails || {};

const getBankVerificationStatus = (employee) =>
  getBankDetails(employee).verificationStatus || 'UNVERIFIED';

const getTabButtonClass = (isActive) =>
  [
    'relative inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3',
    'text-xs font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-amber-400/50',
    isActive
      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
      : 'text-slate-400 hover:bg-white/5 hover:text-gray-900',
  ].join(' ');

/* -------------------------------------------------------------------------- */
/*                              Reusable UI                                   */
/* -------------------------------------------------------------------------- */

const SectionCard = ({ children, className = '' }) => (
  <section
    className={[
      'min-w-0 rounded-2xl border border-slate-800/90',
      'bg-white p-4 sm:p-5',
      className,
    ].join(' ')}
  >
    {children}
  </section>
);

const SectionHeading = ({
  icon: Icon,
  title,
  description,
  action,
  color = 'amber',
}) => {
  const iconClasses = {
    amber: 'bg-amber-400/10 text-amber-400 border-amber-400/15',
    blue: 'bg-blue-400/10 text-blue-400 border-blue-400/15',
    emerald: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/15',
    indigo: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/15',
    rose: 'bg-rose-400/10 text-rose-400 border-rose-400/15',
  };

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              iconClasses[color] || iconClasses.amber,
            ].join(' ')}
          >
            <Icon size={19} />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

const InfoItem = ({
  label,
  value,
  icon: Icon,
  valueClassName = '',
  className = '',
}) => (
  <div className={`min-w-0 space-y-1.5 ${className}`}>
    <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
      {label}
    </span>

    <div className="flex min-w-0 items-start gap-2">
      {Icon && <Icon size={14} className="mt-0.5 shrink-0 text-slate-500" />}

      <span
        className={[
          'min-w-0 break-words text-xs font-medium leading-5 text-slate-800',
          valueClassName,
        ].join(' ')}
      >
        {value === null || value === undefined || value === ''
          ? 'Not provided'
          : value}
      </span>
    </div>
  </div>
);

const StatusBadge = ({ children, variant = 'neutral' }) => {
  const variants = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    danger: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    neutral: 'border-slate-700 bg-white/70 text-slate-300',
  };

  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-full border',
        'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
        variants[variant] || variants.neutral,
      ].join(' ')}
    >
      {children}
    </span>
  );
};

const MetricCard = ({ label, value, icon: Icon, color = 'amber' }) => {
  const colors = {
    amber: 'bg-amber-400/10 text-amber-400',
    emerald: 'bg-emerald-400/10 text-emerald-400',
    blue: 'bg-blue-400/10 text-blue-400',
    rose: 'bg-rose-400/10 text-rose-400',
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-white/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">{label}</span>

        {Icon && (
          <span className={`rounded-lg p-2 ${colors[color] || colors.amber}`}>
            <Icon size={16} />
          </span>
        )}
      </div>

      <p className="mt-3 break-words text-lg font-extrabold tracking-tight text-gray-900">
        {value}
      </p>
    </div>
  );
};

const EmptyState = ({ icon: Icon = FileText, title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-800 bg-white/40 px-5 py-12 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-white text-slate-500">
      <Icon size={22} />
    </div>

    <h4 className="mt-4 text-sm font-bold text-slate-200">{title}</h4>

    {description && (
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>
    )}

    {action && <div className="mt-5">{action}</div>}
  </div>
);

const ActionButton = ({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  title,
  className = '',
}) => {
  const variants = {
    primary:
      'border border-amber-400 bg-amber-400 text-slate-950 hover:bg-amber-300',
    secondary:
      'border border-slate-700 bg-black text-slate-200 hover:bg-slate-700',
    indigo:
      'border border-indigo-500/30 bg-indigo-500/10 text-black hover:bg-indigo-500/20',
    success:
      'border border-emerald-500/30 bg-emerald-500 text-emerald-50 hover:bg-emerald-500/20',
    danger:
      'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex min-h-9 items-center justify-center gap-2 rounded-xl',
        'px-3 py-2 text-xs font-bold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-amber-400/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant] || variants.secondary,
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Employee Details Modal                             */
/* -------------------------------------------------------------------------- */

export const EmployeeDetailsModal = ({
  isOpen,
  onClose,
  employeeId,
  initialTab = 'overview',
  onOpenEditRoleModal,
  onOpenSalarySlipModal,
  onUpdated,
}) => {
  const { isSuperAdmin, hasRole } = useAuth();
  const { showToast } = useToast();

  const canManageHR =
    isSuperAdmin || hasRole(ROLES.HR, ROLES.MANAGER);

  const canManageRolesAndEmployees =
    isSuperAdmin || hasRole(ROLES.HR, ROLES.MANAGER);

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  const [employee, setEmployee] = useState(null);
  const [salaryVersions, setSalaryVersions] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isGenerateDocModalOpen, setIsGenerateDocModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);

  const [showFullAccount, setShowFullAccount] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null);

  const [checkDate, setCheckDate] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  });

  const [periodSalaryResult, setPeriodSalaryResult] = useState(null);
  const [isCheckingPeriod, setIsCheckingPeriod] = useState(false);

  const fetchFullEmployee = useCallback(async () => {
    if (!employeeId) {
      setEmployee(null);
      setLoadError('Employee ID is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const res = await employeeApi.getEmployeeById(employeeId);
      const fetchedEmployee = res?.data?.employee;

      if (!fetchedEmployee) {
        throw new Error('Employee details were not returned by the server.');
      }

      setEmployee(fetchedEmployee);

      if (canManageHR) {
        const results = await Promise.allSettled([
          employeeApi.getSalaryStructures(employeeId),
          employeeApi.getSalaryHistory(employeeId),
          employeeApi.getDocuments(employeeId),
          employeeApi.getPromotionHistory(employeeId),
        ]);

        const [salResult, histResult, docResult, promoResult] = results;

        setSalaryVersions(
          salResult.status === 'fulfilled'
            ? salResult.value?.data?.versions || []
            : []
        );

        setSalaryHistory(
          histResult.status === 'fulfilled'
            ? histResult.value?.data?.history || []
            : []
        );

        setDocuments(
          docResult.status === 'fulfilled'
            ? docResult.value?.data?.documents || []
            : []
        );

        setPromotions(
          promoResult.status === 'fulfilled'
            ? promoResult.value?.data?.promotions ||
            fetchedEmployee.promotionHistory ||
            []
            : fetchedEmployee.promotionHistory || []
        );
      } else {
        setSalaryVersions([]);
        setSalaryHistory([]);
        setDocuments([]);
        setPromotions([]);
      }
    } catch (err) {
      const message = err?.message || 'Failed to load employee details.';

      setLoadError(message);
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, canManageHR, showToast]);

  useEffect(() => {
    if (!isOpen) return;

    setActiveTab(initialTab || 'overview');
    setPeriodSalaryResult(null);
    setShowFullAccount(false);

    fetchFullEmployee();
  }, [isOpen, employeeId, initialTab, fetchFullEmployee]);

  const activeSalary = useMemo(
    () =>
      salaryVersions.find((salary) => salary.status === 'ACTIVE') ||
      salaryVersions[0] ||
      null,
    [salaryVersions]
  );

  const bankDetails = useMemo(
    () => getBankDetails(employee),
    [employee]
  );

  const bankVerificationStatus = getBankVerificationStatus(employee);

  if (!isOpen) return null;

  /* ------------------------------------------------------------------------ */
  /*                                 Actions                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = async () => {
    await fetchFullEmployee();

    if (onUpdated) onUpdated();
  };

  const handleDownloadDoc = async (doc) => {
    if (!employee?._id || !doc?._id || downloadingDocumentId) return;

    setDownloadingDocumentId(doc._id);

    try {
      showToast(`Preparing "${doc.originalFileName || doc.title}"...`, 'info');

      const response = await employeeApi.downloadDocument(
        employee._id,
        doc._id
      );

      const responseData = response?.data ?? response;

      const blob =
        responseData instanceof Blob
          ? responseData
          : new Blob([responseData], {
            type: doc.mimeType || 'application/octet-stream',
          });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download =
        doc.originalFileName || doc.title || 'employee-document';

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Allow the browser to begin consuming the Blob before revoking its URL.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      showToast('Document download started.', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to download document.', 'error');
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!employee?._id || !docId || deletingDocumentId) return;

    const confirmed = window.confirm(
      'Are you sure you want to permanently remove this document?'
    );

    if (!confirmed) return;

    setDeletingDocumentId(docId);

    try {
      await employeeApi.deleteDocument(employee._id, docId);

      setDocuments((previous) =>
        previous.filter((document) => document._id !== docId)
      );

      showToast('Document deleted successfully.', 'success');

      if (onUpdated) onUpdated();
    } catch (err) {
      showToast(err?.message || 'Failed to delete document.', 'error');
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleCheckPayrollVersion = async () => {
    if (!employee?._id || !checkDate || isCheckingPeriod) return;

    setIsCheckingPeriod(true);
    setPeriodSalaryResult(null);

    try {
      const res = await employeeApi.getSalaryForPeriod(employee._id, {
        date: checkDate,
      });

      setPeriodSalaryResult(res?.data || {});
    } catch (err) {
      setPeriodSalaryResult({
        error: err?.message || 'No applicable salary version found.',
      });
    } finally {
      setIsCheckingPeriod(false);
    }
  };

  const handleVerifyBank = async (verificationStatus) => {
    if (!employee?._id || isVerifyingBank) return;

    setIsVerifyingBank(true);

    try {
      await employeeApi.verifyBankDetails(employee._id, {
        verificationStatus,
        remarks:
          verificationStatus === 'VERIFIED'
            ? 'Verified by HR against documentation'
            : 'Marked unverified',
      });

      showToast(
        `Bank details marked as ${verificationStatus}.`,
        'success'
      );

      await fetchFullEmployee();

      if (onUpdated) onUpdated();
    } catch (err) {
      showToast(
        err?.message || 'Failed to update bank verification status.',
        'error'
      );
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleSalarySlipClick = () => {
    if (onOpenSalarySlipModal) {
      onOpenSalarySlipModal(employee);
    } else {
      setIsSalarySlipModalOpen(true);
    }
  };

  const refreshAfterMutation = async () => {
    await fetchFullEmployee();

    if (onUpdated) onUpdated();
  };

  /* ------------------------------------------------------------------------ */
  /*                             Tab definitions                              */
  /* ------------------------------------------------------------------------ */

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: User,
      visible: true,
    },
    {
      id: 'promotions',
      label: 'Career & Promotions',
      icon: Award,
      count: promotions.length,
      visible: canManageHR,
    },
    {
      id: 'salary',
      label: 'Salary & Payroll',
      icon: Wallet,
      count: salaryVersions.length,
      visible: canManageHR,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      count: documents.length,
      visible: canManageHR,
    },
    {
      id: 'lifecycle',
      label: 'History & Audits',
      icon: History,
      visible: true,
    },
  ].filter((tab) => tab.visible);

  const safeActiveTab = tabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : 'overview';

  const employeeName = getEmployeeName(employee);

  const accountNumber =
    bankDetails.accountNumber || '';

  const currentAddress = employee?.address?.current || {};
  const permanentAddress = employee?.address?.permanent || {};

  /* ------------------------------------------------------------------------ */
  /*                                   UI                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-2 backdrop-blur-sm sm:p-4" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl sm:rounded-3xl"
      >
        {/* Header */}
        <header className="relative shrink-0 overflow-hidden border-b border-slate-800 bg-white">
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-amber-400/[0.06] blur-3xl" />

          <div className="relative flex items-start justify-between gap-4 p-4 sm:p-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/10 sm:h-16 sm:w-16 sm:text-2xl">
                {employeeName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                {/* <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                    Employee Profile
                  </span>

                  {employee?.employeeId && (
                    <span className="rounded-lg border border-slate-700 bg-white px-2 py-1 font-mono text-[10px] font-bold text-slate-300">
                      {employee.employeeId}
                    </span>
                  )}
                </div> */}

                <h2
                  id="employee-details-title"
                  className="mt-1 break-words text-lg font-extrabold tracking-tight text-gray-900 sm:text-2xl"
                >
                  {employee ? employeeName : 'Employee Details'}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
                  {employee?.designation && (
                    <span className="inline-flex items-center gap-1.5">
                      <BriefcaseBusiness size={13} />
                      {employee.designation}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={13} />
                    {employee?.department?.name || 'Unassigned department'}
                  </span>


                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh employee data"
                className="rounded-xl border border-slate-700 bg-white p-2.5 text-slate-400 transition hover:border-slate-600 hover:text-gray-900 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={isLoading ? 'animate-spin' : ''}
                />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close employee details"
                className="rounded-xl border border-slate-700 bg-white p-2.5 text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isLoading && employee && (
            <div className="relative flex flex-wrap gap-2 px-4 pb-4 sm:px-6 sm:pb-5">
              {canManageHR && (
                <>
                  <ActionButton
                    variant="indigo"
                    onClick={() => setIsPromoteModalOpen(true)}
                  >
                    <Award size={14} />
                    Promote Employee
                  </ActionButton>

                  <ActionButton
                    variant="secondary"
                    onClick={() => setIsGenerateDocModalOpen(true)}
                  >
                    <FileText size={14} />
                    Generate Letter
                  </ActionButton>
                </>
              )}
            </div>
          )}
        </header>

        {/* Navigation */}
        <nav
          aria-label="Employee details sections"
          className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-800 bg-white px-3 py-3 sm:px-5"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = safeActiveTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={selected ? 'page' : undefined}
                className={getTabButtonClass(selected)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>

                {tab.count !== undefined && (
                  <span
                    className={[
                      'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                      selected
                        ? 'bg-white/10 text-slate-950'
                        : 'bg-white text-slate-400',
                    ].join(' ')}
                  >
                    {tab.count}
                  </span>
                )}

                {selected && (
                  <ChevronRight size={13} className="hidden sm:block" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.035),_transparent_45%)] p-3 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
                <RefreshCw
                  size={25}
                  className="animate-spin text-amber-400"
                />
              </div>

              <h3 className="mt-5 text-sm font-bold text-gray-900">
                Loading employee profile
              </h3>

              <p className="mt-2 text-xs text-slate-500">
                Fetching employee details and available HR records...
              </p>
            </div>
          ) : loadError && !employee ? (
            <EmptyState
              icon={AlertCircle}
              title="Unable to load employee"
              description={loadError}
              action={
                <ActionButton variant="primary" onClick={handleRefresh}>
                  <RefreshCw size={14} />
                  Try Again
                </ActionButton>
              }
            />
          ) : !employee ? (
            <EmptyState
              icon={User}
              title="Employee not found"
              description="The requested employee profile is not available."
              action={
                <ActionButton onClick={onClose}>
                  Close
                </ActionButton>
              }
            />
          ) : (
            <>
              {/* ============================================================ */}
              {/* OVERVIEW                                                     */}
              {/* ============================================================ */}

              {safeActiveTab === 'overview' && (
                <div className="space-y-5">
                  {/* Quick summary */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Employee ID"
                      value={employee.employeeId || 'Not assigned'}
                      icon={UserRound}
                    />

                    <MetricCard
                      label="Joining Date"
                      value={formatDate(employee.joiningDate)}
                      icon={Calendar}
                      color="blue"
                    />

                    <MetricCard
                      label="Department"
                      value={employee.department?.name || 'Unassigned'}
                      icon={Building2}
                      color="emerald"
                    />

                    <MetricCard
                      label="Portal Access"
                      value={
                        employee.user
                          ? employee.user.isActive
                            ? 'Active'
                            : 'Inactive'
                          : 'Not created'
                      }
                      icon={ShieldCheck}
                      color={employee.user?.isActive ? 'emerald' : 'rose'}
                    />
                  </div>

                  {/* Contact information */}
                  <SectionCard>
                    <SectionHeading
                      icon={User}
                      title="Personal & Contact Information"
                      description="Employee contact information stored in the HR system."
                    />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <InfoItem
                        label="First Name"
                        value={employee.name?.firstName}
                      />

                      <InfoItem
                        label="Last Name"
                        value={employee.name?.lastName}
                      />

                      <InfoItem
                        label="Official Email"
                        value={employee.contactDetails?.email}
                        icon={Mail}
                      />

                      <InfoItem
                        label="Mobile Phone"
                        value={employee.contactDetails?.phone}
                        icon={Phone}
                      />

                      <InfoItem
                        label="Alternate Phone"
                        value={employee.contactDetails?.alternatePhone}
                        icon={Phone}
                      />

                      <InfoItem
                        label="Personal Email"
                        value={employee.contactDetails?.personalEmail}
                        icon={Mail}
                      />

                      <InfoItem
                        label="Designation"
                        value={employee.designation}
                        icon={BriefcaseBusiness}
                      />

                      <InfoItem
                        label="Employment Status"
                        value={employee.employmentStatus?.replace(/_/g, ' ')}
                      />
                    </div>
                  </SectionCard>

                  {/* Workplace */}
                  <SectionCard>
                    <SectionHeading
                      icon={Building2}
                      title="Workplace & Reporting"
                      description="Employment information, department and reporting structure."
                      color="blue"
                    />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <InfoItem
                        label="Joining Date"
                        value={formatDate(employee.joiningDate)}
                        icon={Calendar}
                      />

                      <InfoItem
                        label="Department"
                        value={employee.department?.name || 'Unassigned'}
                        icon={Building2}
                      />

                      <InfoItem
                        label="Reporting Manager"
                        value={
                          employee.reportingManager?.name?.firstName
                            ? getEmployeeName({
                              name: employee.reportingManager.name,
                            })
                            : 'Not assigned'
                        }
                        icon={UserRound}
                      />

                      <InfoItem
                        label="Employee Record Created"
                        value={formatDate(employee.createdAt)}
                        icon={Clock}
                      />
                    </div>
                  </SectionCard>

                  {/* Portal access */}
                  <SectionCard>
                    <SectionHeading
                      icon={Shield}
                      title="Portal Access & Permissions"
                      description="Login status, assigned role and permission configuration."
                      color="indigo"
                      action={
                        canManageRolesAndEmployees && (
                          <ActionButton
                            variant="primary"
                            onClick={() => {
                              if (onOpenEditRoleModal) {
                                onOpenEditRoleModal(employee);
                              }
                            }}
                          >
                            <Edit3 size={14} />
                            Edit Role
                          </ActionButton>
                        )
                      }
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-white/60 p-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Assigned Role
                        </span>

                        <div className="mt-3">
                          {employee.user ? (
                            <StatusBadge variant="info">
                              <ShieldCheck size={12} />
                              {ROLE_LABELS[employee.user.role]?.label ||
                                employee.user.role ||
                                'Unknown role'}
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="warning">
                              No Portal Account
                            </StatusBadge>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-white/60 p-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Account Status
                        </span>

                        <div className="mt-3">
                          {employee.user ? (
                            <StatusBadge
                              variant={
                                employee.user.isActive ? 'success' : 'danger'
                              }
                            >
                              {employee.user.isActive
                                ? 'Active · Can Login'
                                : 'Inactive · Login Disabled'}
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="neutral">
                              Not provisioned
                            </StatusBadge>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-white/60 p-4">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Custom Permissions
                        </span>

                        <p className="mt-3 text-sm font-bold text-gray-900">
                          {employee.user?.customPermissions?.length || 0}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-500">
                          Additional permissions assigned
                        </p>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Address and emergency contact */}
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <SectionCard>
                      <SectionHeading
                        icon={MapPin}
                        title="Current Address"
                        color="emerald"
                      />

                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        {currentAddress.street || 'Street not provided'}
                      </p>

                      <p className="mt-1 text-xs leading-6 text-slate-400">
                        {[
                          currentAddress.city,
                          currentAddress.state,
                          currentAddress.pincode,
                          currentAddress.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Address details not provided'}
                      </p>
                    </SectionCard>

                    <SectionCard>
                      <SectionHeading
                        icon={Home}
                        title="Permanent Address"
                        color="blue"
                      />

                      <p className="text-sm font-semibold leading-6 text-gray-900">
                        {permanentAddress.street || 'Street not provided'}
                      </p>

                      <p className="mt-1 text-xs leading-6 text-slate-400">
                        {[
                          permanentAddress.city,
                          permanentAddress.state,
                          permanentAddress.pincode,
                          permanentAddress.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Address details not provided'}
                      </p>
                    </SectionCard>
                  </div>

                  <SectionCard>
                    <SectionHeading
                      icon={ShieldAlert}
                      title="Emergency Contact"
                      description="Person to contact in case of an emergency."
                      color="rose"
                    />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <InfoItem
                        label="Contact Name"
                        value={employee.emergencyContact?.name}
                      />

                      <InfoItem
                        label="Relationship"
                        value={employee.emergencyContact?.relationship}
                      />

                      <InfoItem
                        label="Emergency Phone"
                        value={employee.emergencyContact?.phone}
                        icon={Phone}
                      />
                    </div>
                  </SectionCard>

                  {/* Protected bank information */}
                  {canManageHR && (
                    <SectionCard>
                      <SectionHeading
                        icon={CreditCard}
                        title="Banking & Tax Information"
                        description="Confidential employee information. Access is restricted to authorized HR personnel and managers."
                        color="amber"
                        action={
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              variant={
                                bankVerificationStatus === 'VERIFIED'
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              <CheckCircle2 size={12} />
                              {bankVerificationStatus}
                            </StatusBadge>

                            <ActionButton
                              variant="secondary"
                              disabled={isVerifyingBank}
                              onClick={() =>
                                handleVerifyBank(
                                  bankVerificationStatus === 'VERIFIED'
                                    ? 'UNVERIFIED'
                                    : 'VERIFIED'
                                )
                              }
                            >
                              {isVerifyingBank ? (
                                <RefreshCw
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                <BadgeCheck size={14} />
                              )}

                              {bankVerificationStatus === 'VERIFIED'
                                ? 'Revoke Verification'
                                : 'Verify Bank'}
                            </ActionButton>

                            <ActionButton
                              variant="primary"
                              onClick={() => setIsEditBankModalOpen(true)}
                            >
                              <Edit3 size={14} />
                              Edit Details
                            </ActionButton>
                          </div>
                        }
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoItem
                          label="PAN Number"
                          value={employee.identityDetails?.panNumber}
                          valueClassName="uppercase"
                        />

                        <InfoItem
                          label="Aadhaar Number"
                          value={
                            employee.identityDetails?.aadhaarNumber
                              ? `•••• •••• ${String(
                                employee.identityDetails.aadhaarNumber
                              ).slice(-4)}`
                              : 'Not provided'
                          }
                        />

                        <InfoItem
                          label="Bank Name"
                          value={bankDetails.bankName}
                        />

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                              Account Number
                            </span>

                            {accountNumber && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowFullAccount((previous) => !previous)
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300"
                              >
                                {showFullAccount ? (
                                  <EyeOff size={12} />
                                ) : (
                                  <Eye size={12} />
                                )}

                                {showFullAccount ? 'Hide' : 'Reveal'}
                              </button>
                            )}
                          </div>

                          <p className="break-all font-mono text-xs font-semibold text-slate-800">
                            {accountNumber
                              ? showFullAccount
                                ? accountNumber
                                : `•••• •••• ${String(accountNumber).slice(-4)}`
                              : 'Not provided'}
                          </p>
                        </div>

                        <InfoItem
                          label="IFSC Code"
                          value={bankDetails.ifscCode}
                          valueClassName="uppercase"
                        />

                        <InfoItem
                          label="Account Holder"
                          value={
                            bankDetails.accountHolderName || employeeName
                          }
                        />

                        <InfoItem
                          label="Bank Branch"
                          value={bankDetails.branch}
                        />

                        <InfoItem
                          label="EPF UAN"
                          value={employee.identityDetails?.uan}
                        />

                        <InfoItem
                          label="PF Member ID"
                          value={employee.identityDetails?.pfNumber}
                        />
                      </div>
                    </SectionCard>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* PROMOTIONS                                                   */}
              {/* ============================================================ */}

              {safeActiveTab === 'promotions' && canManageHR && (
                <div className="space-y-5">
                  <SectionCard>
                    <SectionHeading
                      icon={Award}
                      title="Career & Promotion History"
                      description="Review designation changes, promotion decisions and their effective dates."
                      color="indigo"
                      action={
                        <ActionButton
                          variant="indigo"
                          onClick={() => setIsPromoteModalOpen(true)}
                        >
                          <Plus size={14} />
                          Record Promotion
                        </ActionButton>
                      }
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <MetricCard
                        label="Recorded Promotions"
                        value={promotions.length}
                        icon={Award}
                        color="blue"
                      />

                      <MetricCard
                        label="Current Designation"
                        value={employee.designation || 'Not assigned'}
                        icon={BriefcaseBusiness}
                        color="emerald"
                      />

                      <MetricCard
                        label="Current Department"
                        value={employee.department?.name || 'Unassigned'}
                        icon={Building2}
                      />
                    </div>
                  </SectionCard>

                  {promotions.length === 0 ? (
                    <EmptyState
                      icon={Award}
                      title="No promotions recorded"
                      description="Promotion and career advancement records will appear here once a promotion has been recorded."
                      action={
                        <ActionButton
                          variant="indigo"
                          onClick={() => setIsPromoteModalOpen(true)}
                        >
                          <Plus size={14} />
                          Record First Promotion
                        </ActionButton>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {promotions.map((promo, index) => (
                        <SectionCard key={promo._id || index}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-xs font-extrabold text-indigo-300">
                                #{promotions.length - index}
                              </div>

                              <div className="min-w-0">
                                <p className="break-words text-sm font-bold text-gray-900">
                                  {promo.fromDesignation || 'Initial Position'}
                                  <span className="mx-2 text-slate-600">
                                    →
                                  </span>
                                  <span className="text-indigo-300">
                                    {promo.toDesignation || 'New Designation'}
                                  </span>
                                </p>

                                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                                  <Calendar size={13} />
                                  Effective{' '}
                                  {formatDate(promo.promotionDate)}
                                </p>
                              </div>
                            </div>

                            <StatusBadge
                              variant={
                                (promo.approvalStatus || 'APPROVED') ===
                                  'APPROVED'
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {promo.approvalStatus || 'APPROVED'}
                            </StatusBadge>
                          </div>

                          <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-white/50 p-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Justification
                              </span>

                              <p className="mt-1 text-xs leading-5 text-slate-300">
                                {promo.reason || 'No justification provided.'}
                              </p>
                            </div>

                            {promo.remarks && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                  Remarks
                                </span>

                                <p className="mt-1 text-xs leading-5 text-slate-400">
                                  {promo.remarks}
                                </p>
                              </div>
                            )}

                            {promo.promotedBy?.name && (
                              <div className="border-t border-slate-800 pt-3 text-xs text-slate-500">
                                Authorized by{' '}
                                <span className="font-semibold text-slate-300">
                                  {promo.promotedBy.name}
                                </span>

                                {promo.promotedBy.role && (
                                  <span> · {promo.promotedBy.role}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </SectionCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* SALARY                                                       */}
              {/* ============================================================ */}

              {safeActiveTab === 'salary' && canManageHR && (
                <div className="space-y-5">
                  {activeSalary ? (
                    <SectionCard className="overflow-hidden border-amber-500/20 bg-white">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <StatusBadge variant="success">
                            <CheckCircle2 size={12} />
                            Active Salary · Version {activeSalary.version}
                          </StatusBadge>

                          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Monthly Gross Salary
                          </p>

                          <h3 className="mt-1 break-words text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                            {formatCurrency(
                              activeSalary.earnings?.grossSalary
                            )}
                          </h3>

                          <p className="mt-2 text-xs text-slate-400">
                            Effective from{' '}
                            {formatDate(activeSalary.effectiveFrom)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            variant="primary"
                            onClick={handleSalarySlipClick}
                          >
                            <Receipt size={14} />
                            Generate Payslip
                          </ActionButton>

                          <ActionButton
                            variant="success"
                            onClick={() => setIsIncrementModalOpen(true)}
                          >
                            <TrendingUp size={14} />
                            Salary Increment
                          </ActionButton>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                          label="Basic Pay"
                          value={formatCurrency(activeSalary.earnings?.basic)}
                          icon={Banknote}
                          color="blue"
                        />

                        <MetricCard
                          label="House Rent Allowance"
                          value={formatCurrency(
                            activeSalary.earnings?.houseRentAllowance
                          )}
                          icon={Home}
                        />

                        <MetricCard
                          label="Total Deductions"
                          value={formatCurrency(
                            activeSalary.deductions?.totalDeductions
                          )}
                          icon={Receipt}
                          color="rose"
                        />

                        <MetricCard
                          label="Net Take-Home"
                          value={formatCurrency(activeSalary.netSalary)}
                          icon={Wallet}
                          color="emerald"
                        />
                      </div>
                    </SectionCard>
                  ) : (
                    <EmptyState
                      icon={Coins}
                      title="No salary structure assigned"
                      description="Create the initial salary structure for this employee. Salary changes and future versions will be displayed here."
                      action={
                        <ActionButton
                          variant="primary"
                          onClick={() => setIsIncrementModalOpen(true)}
                        >
                          <Plus size={14} />
                          Assign Initial Salary
                        </ActionButton>
                      }
                    />
                  )}

                  {/* Salary breakdown */}
                  {activeSalary && (
                    <SectionCard>
                      <SectionHeading
                        icon={Wallet}
                        title="Salary Breakdown"
                        description="Available earnings and deduction figures for the active salary version."
                      />

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          {
                            label: 'Basic',
                            value: activeSalary.earnings?.basic,
                          },
                          {
                            label: 'HRA',
                            value: activeSalary.earnings?.houseRentAllowance,
                          },
                          {
                            label: 'Conveyance',
                            value: activeSalary.earnings?.conveyanceAllowance,
                          },
                          {
                            label: 'Special Allowance',
                            value: activeSalary.earnings?.specialAllowance,
                          },
                          {
                            label: 'Gross Salary',
                            value: activeSalary.earnings?.grossSalary,
                          },
                          {
                            label: 'Provident Fund',
                            value:
                              activeSalary.deductions?.providentFund
                                ?.employeeContribution,
                          },
                          {
                            label: 'Professional Tax',
                            value: activeSalary.deductions?.professionalTax,
                          },
                          {
                            label: 'TDS',
                            value: activeSalary.deductions?.tds,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-xl border border-slate-800 bg-white/50 p-4"
                          >
                            <p className="text-xs text-slate-400">
                              {item.label}
                            </p>

                            <p className="mt-2 text-sm font-bold text-gray-900">
                              {formatCurrency(item.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Payroll date validator */}
                  <SectionCard>
                    <SectionHeading
                      icon={ShieldCheck}
                      title="Payroll Salary Validator"
                      description="Check which salary version applies to a selected date using the existing payroll API."
                      color="blue"
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="w-full sm:max-w-xs">
                        <label
                          htmlFor="employee-payroll-check-date"
                          className="mb-2 block text-xs font-semibold text-slate-400"
                        >
                          Payroll Date
                        </label>

                        <input
                          id="employee-payroll-check-date"
                          type="date"
                          value={checkDate}
                          onChange={(event) => {
                            setCheckDate(event.target.value);
                            setPeriodSalaryResult(null);
                          }}
                          className="w-full rounded-xl border border-slate-700 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10"
                        />
                      </div>

                      <ActionButton
                        variant="primary"
                        disabled={isCheckingPeriod || !checkDate}
                        onClick={handleCheckPayrollVersion}
                      >
                        {isCheckingPeriod ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={14} />
                        )}

                        {isCheckingPeriod
                          ? 'Validating...'
                          : 'Validate Salary'}
                      </ActionButton>
                    </div>

                    {periodSalaryResult && (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-white/70 p-4">
                        {periodSalaryResult.error ? (
                          <div className="flex items-start gap-3 text-rose-300">
                            <AlertCircle
                              size={17}
                              className="mt-0.5 shrink-0"
                            />

                            <div>
                              <p className="text-xs font-bold">
                                Salary validation failed
                              </p>

                              <p className="mt-1 text-xs leading-5 text-rose-300/80">
                                {periodSalaryResult.error}
                              </p>
                            </div>
                          </div>
                        ) : periodSalaryResult.applicableSalary ? (
                          <div className="flex items-start gap-3">
                            <Check
                              size={18}
                              className="mt-0.5 shrink-0 text-emerald-400"
                            />

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-emerald-300">
                                Applicable salary version found
                              </p>

                              <p className="mt-2 text-xs text-slate-300">
                                Version{' '}
                                <strong>
                                  {
                                    periodSalaryResult.applicableSalary
                                      .version
                                  }
                                </strong>
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Gross Salary:{' '}
                                <strong className="text-gray-900">
                                  {formatCurrency(
                                    periodSalaryResult.applicableSalary
                                      .earnings?.grossSalary
                                  )}
                                </strong>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            The API returned a response, but no applicable
                            salary version was included.
                          </p>
                        )}
                      </div>
                    )}
                  </SectionCard>

                  {/* Salary version timeline */}
                  <SectionCard>
                    <SectionHeading
                      icon={History}
                      title="Salary Version Timeline"
                      description={`${salaryVersions.length} salary version(s) returned by the server.`}
                    />

                    {salaryVersions.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No salary versions are available.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {salaryVersions.map((version) => {
                          const isActive = version.status === 'ACTIVE';

                          return (
                            <div
                              key={version._id || version.version}
                              className={[
                                'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between',
                                isActive
                                  ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                                  : 'border-slate-800 bg-white/40',
                              ].join(' ')}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-white font-mono text-xs font-bold text-gray-900">
                                  V{version.version ?? '?'}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(
                                      version.earnings?.grossSalary
                                    )}
                                    <span className="ml-1 text-xs font-normal text-slate-500">
                                      / month
                                    </span>
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {formatDate(version.effectiveFrom)} →{' '}
                                    {version.effectiveTo
                                      ? formatDate(version.effectiveTo)
                                      : 'Ongoing'}
                                  </p>
                                </div>
                              </div>

                              <StatusBadge
                                variant={isActive ? 'success' : 'neutral'}
                              >
                                {version.status || 'HISTORICAL'}
                              </StatusBadge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>

                  {/* Salary history returned by API */}
                  {salaryHistory.length > 0 && (
                    <SectionCard>
                      <SectionHeading
                        icon={TrendingUp}
                        title="Salary Change History"
                        description="Additional salary history records returned by the salary history API."
                      />

                      <div className="space-y-3">
                        {salaryHistory.map((item, index) => (
                          <div
                            key={item._id || index}
                            className="rounded-xl border border-slate-800 bg-white/50 p-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <p className="text-xs font-semibold text-slate-800">
                                {item.reason ||
                                  item.remarks ||
                                  item.description ||
                                  'Salary history record'}
                              </p>

                              <span className="shrink-0 text-[11px] text-slate-500">
                                {formatDate(
                                  item.effectiveFrom ||
                                  item.effectiveDate ||
                                  item.createdAt
                                )}
                              </span>
                            </div>

                            {item.amount !== undefined && (
                              <p className="mt-2 text-sm font-bold text-emerald-300">
                                {formatCurrency(item.amount)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* DOCUMENTS                                                    */}
              {/* ============================================================ */}

              {safeActiveTab === 'documents' && canManageHR && (
                <div className="space-y-5">
                  <SectionCard>
                    <SectionHeading
                      icon={FileText}
                      title="Employee Documents"
                      description="Manage employee files, appointment letters and official HR documents."
                      color="blue"
                      action={
                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            variant="indigo"
                            onClick={() => setIsGenerateDocModalOpen(true)}
                          >
                            <Sparkles size={14} />
                            Generate Letter
                          </ActionButton>

                          <ActionButton
                            variant="primary"
                            onClick={() => setIsUploadDocModalOpen(true)}
                          >
                            <Plus size={14} />
                            Upload Document
                          </ActionButton>
                        </div>
                      }
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <MetricCard
                        label="Total Documents"
                        value={documents.length}
                        icon={FileText}
                        color="blue"
                      />

                      <MetricCard
                        label="Employee"
                        value={employeeName}
                        icon={User}
                      />

                      <MetricCard
                        label="Employee ID"
                        value={employee.employeeId || 'Not assigned'}
                        icon={ShieldCheck}
                        color="emerald"
                      />
                    </div>
                  </SectionCard>

                  {documents.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No documents uploaded"
                      description="Uploaded files and generated official letters will appear here."
                      action={
                        <ActionButton
                          variant="primary"
                          onClick={() => setIsUploadDocModalOpen(true)}
                        >
                          <Plus size={14} />
                          Upload First Document
                        </ActionButton>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      {documents.map((doc) => (
                        <div
                          key={doc._id}
                          className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-white/70 p-4 transition hover:border-slate-700 hover:bg-white"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
                            <FileText size={21} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4
                              title={doc.title || doc.originalFileName}
                              className="truncate text-sm font-bold text-gray-900"
                            >
                              {doc.title ||
                                doc.originalFileName ||
                                'Untitled document'}
                            </h4>

                            <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-amber-400">
                              {doc.documentType || 'General document'}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-500">
                              {Number.isFinite(Number(doc.fileSize))
                                ? `${(Number(doc.fileSize) / 1024).toFixed(1)} KB`
                                : 'File size unavailable'}
                              {' · '}
                              {formatDate(doc.createdAt)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              title="Download document"
                              aria-label={`Download ${doc.title || 'document'}`}
                              disabled={downloadingDocumentId === doc._id}
                              onClick={() => handleDownloadDoc(doc)}
                              className="rounded-xl border border-slate-700 bg-white p-2.5 text-emerald-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 disabled:opacity-50"
                            >
                              {downloadingDocumentId === doc._id ? (
                                <RefreshCw
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Download size={15} />
                              )}
                            </button>

                            <button
                              type="button"
                              title="Delete document"
                              aria-label={`Delete ${doc.title || 'document'}`}
                              disabled={deletingDocumentId === doc._id}
                              onClick={() => handleDeleteDoc(doc._id)}
                              className="rounded-xl border border-slate-700 bg-white p-2.5 text-rose-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 disabled:opacity-50"
                            >
                              {deletingDocumentId === doc._id ? (
                                <RefreshCw
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* LIFECYCLE                                                    */}
              {/* ============================================================ */}

              {safeActiveTab === 'lifecycle' && (
                <div className="space-y-5">
                  <SectionCard>
                    <SectionHeading
                      icon={History}
                      title="Employment History & Audit Trail"
                      description="Review recorded employment status changes and department transfers."
                      color="blue"
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <MetricCard
                        label="Status Changes"
                        value={employee.statusHistory?.length || 0}
                        icon={Clock}
                        color="blue"
                      />

                      <MetricCard
                        label="Transfers"
                        value={employee.transferHistory?.length || 0}
                        icon={ArrowRightLeft}
                        color="emerald"
                      />

                      <MetricCard
                        label="Promotions"
                        value={promotions.length}
                        icon={Award}
                      />
                    </div>
                  </SectionCard>

                  {/* Status history */}
                  <SectionCard>
                    <SectionHeading
                      icon={Clock}
                      title="Employment Status Changes"
                      description={`${employee.statusHistory?.length || 0} recorded status change(s).`}
                    />

                    {!employee.statusHistory?.length ? (
                      <EmptyState
                        icon={Clock}
                        title="No status changes recorded"
                        description="Employment status audit records will appear here when available."
                      />
                    ) : (
                      <div className="relative space-y-3 border-l border-slate-800 pl-5 sm:pl-6">
                        {employee.statusHistory.map((item, index) => (
                          <div
                            key={item._id || index}
                            className="relative rounded-xl border border-slate-800 bg-white/60 p-4"
                          >
                            <span className="absolute -left-[26px] top-5 h-3 w-3 rounded-full border-2 border-slate-950 bg-amber-400 sm:-left-[31px]" />

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs font-bold text-slate-200">
                                {item.fromStatus || 'Initial'}{' '}
                                <span className="mx-1 text-slate-600">→</span>
                                <span className="text-emerald-400">
                                  {item.toStatus || 'Updated'}
                                </span>
                              </p>

                              <span className="text-[11px] text-slate-500">
                                {formatDate(item.changedAt)}
                              </span>
                            </div>

                            {item.reason && (
                              <p className="mt-3 text-xs leading-5 text-slate-400">
                                {item.reason}
                              </p>
                            )}

                            {item.changedBy?.name && (
                              <p className="mt-3 border-t border-slate-800 pt-3 text-[11px] text-slate-500">
                                Changed by{' '}
                                <span className="font-semibold text-slate-300">
                                  {item.changedBy.name}
                                </span>

                                {item.changedBy.role &&
                                  ` · ${item.changedBy.role}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  {/* Transfer history */}
                  <SectionCard>
                    <SectionHeading
                      icon={ArrowRightLeft}
                      title="Department Transfers"
                      description={`${employee.transferHistory?.length || 0} recorded transfer(s).`}
                      color="indigo"
                    />

                    {!employee.transferHistory?.length ? (
                      <EmptyState
                        icon={ArrowRightLeft}
                        title="No transfers recorded"
                        description="Employee department transfer records will appear here."
                      />
                    ) : (
                      <div className="space-y-3">
                        {employee.transferHistory.map((transfer, index) => (
                          <div
                            key={transfer._id || index}
                            className="rounded-xl border border-slate-800 bg-white/50 p-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-bold text-gray-900">
                                {transfer.toDesignation ||
                                  employee.designation ||
                                  'Designation not specified'}
                              </p>

                              <span className="text-[11px] text-slate-500">
                                Effective{' '}
                                {formatDate(transfer.effectiveDate)}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span className="rounded-lg border border-slate-800 bg-white px-3 py-2 text-xs text-slate-400">
                                {transfer.fromDepartment?.name ||
                                  'Unassigned'}
                              </span>

                              <ArrowRightLeft
                                size={14}
                                className="text-amber-400"
                              />

                              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                                {transfer.toDepartment?.name ||
                                  'Unassigned'}
                              </span>
                            </div>

                            {transfer.reason && (
                              <p className="mt-3 text-xs leading-5 text-slate-400">
                                <span className="font-semibold text-slate-300">
                                  Reason:{' '}
                                </span>
                                {transfer.reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
            <LockKeyhole size={13} className="shrink-0" />

            <span className="truncate">
              Speeddex Construction · Employee HRMS
            </span>
          </div>

          <ActionButton onClick={onClose}>
            <X size={14} />
            Close
          </ActionButton>
        </footer>

        {/* ================================================================ */}
        {/* SUBMODALS                                                        */}
        {/* ================================================================ */}

        {employee && (
          <>
            <PromoteEmployeeModal
              isOpen={isPromoteModalOpen}
              onClose={() => setIsPromoteModalOpen(false)}
              employee={employee}
              onUpdated={refreshAfterMutation}
            />

            <GenerateDocumentModal
              isOpen={isGenerateDocModalOpen}
              onClose={() => setIsGenerateDocModalOpen(false)}
              employee={employee}
              onGenerated={refreshAfterMutation}
            />

            <SalaryIncrementModal
              isOpen={isIncrementModalOpen}
              onClose={() => setIsIncrementModalOpen(false)}
              employee={employee}
              activeSalary={activeSalary}
              onIncremented={refreshAfterMutation}
            />

            <UploadDocumentModal
              isOpen={isUploadDocModalOpen}
              onClose={() => setIsUploadDocModalOpen(false)}
              employee={employee}
              onUploaded={refreshAfterMutation}
            />

            <SalarySlipModal
              isOpen={isSalarySlipModalOpen}
              onClose={() => setIsSalarySlipModalOpen(false)}
              initialEmployee={employee}
            />

            <EditBankDetailsModal
              isOpen={isEditBankModalOpen}
              onClose={() => setIsEditBankModalOpen(false)}
              employee={employee}
              onUpdated={refreshAfterMutation}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;