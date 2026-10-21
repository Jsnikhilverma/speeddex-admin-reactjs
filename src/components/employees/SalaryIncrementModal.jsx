
import React, { useState, useEffect, useMemo } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { useToast } from '../../context/ToastContext';
import {
  TrendingUp,
  X,
  AlertCircle,
  Loader2,
  Check,
  IndianRupee,
  ShieldCheck,
  Coins,
  Sparkles,
  CalendarDays,
  Wallet,
  Calculator,
  RefreshCcw,
  Info,
  Building2,
} from 'lucide-react';

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateFromValue = (value) => {
  if (!value) return getLocalDate();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return getLocalDate();
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const toAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const formatINR = (value) =>
  toAmount(value).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  });

const getDefaultForm = (employee, salary = null) => {
  const hasSalary = Boolean(salary);

  return {
    effectiveDate: hasSalary
      ? getLocalDate()
      : getDateFromValue(employee?.joiningDate),
    changeType: hasSalary ? 'ANNUAL_INCREMENT' : 'INITIAL_ASSIGNMENT',
    reason: '',
    earnings: {
      basic: salary?.earnings?.basic ?? (hasSalary ? 0 : 30000),
      houseRentAllowance:
        salary?.earnings?.houseRentAllowance ?? (hasSalary ? 0 : 12000),
      conveyanceAllowance:
        salary?.earnings?.conveyanceAllowance ?? 3000,
      specialAllowance:
        salary?.earnings?.specialAllowance ?? 5000,
      dearnessAllowance:
        salary?.earnings?.dearnessAllowance ?? 0,
      medicalAllowance:
        salary?.earnings?.medicalAllowance ?? 0,
    },
    deductions: {
      providentFund: {
        employeeContribution:
          salary?.deductions?.providentFund?.employeeContribution ??
          (hasSalary ? 0 : 3600),
        employerContribution:
          salary?.deductions?.providentFund?.employerContribution ??
          (hasSalary ? 0 : 3600),
      },
      professionalTax:
        salary?.deductions?.professionalTax ?? (hasSalary ? 0 : 200),
      tds: salary?.deductions?.tds ?? 0,
    },
  };
};

const getEmployeeName = (employee) =>
  employee?.fullName ||
  [
    employee?.name?.firstName,
    employee?.name?.lastName,
  ]
    .filter(Boolean)
    .join(' ') ||
  'Employee';

export const SalaryIncrementModal = ({
  isOpen,
  onClose,
  employee,
  activeSalary,
  onIncremented,
}) => {
  const { showToast } = useToast();

  const [currentActiveSalary, setCurrentActiveSalary] = useState(
    activeSalary ?? null
  );
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);
  const [salaryLoadError, setSalaryLoadError] = useState('');
  const [formData, setFormData] = useState(() =>
    getDefaultForm(employee)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const employeeName = getEmployeeName(employee);
  const employeeId = employee?._id;
  const joiningDate = employee?.joiningDate;

  useEffect(() => {
    if (!isOpen || !employeeId) return undefined;

    let cancelled = false;

    setError('');
    setSalaryLoadError('');

    if (activeSalary !== undefined) {
      setCurrentActiveSalary(activeSalary || null);
      setFormData(getDefaultForm(employee, activeSalary || null));
      setIsLoadingSalary(false);
      return undefined;
    }

    setIsLoadingSalary(true);

    employeeApi
      .getActiveSalary(employeeId)
      .then((response) => {
        if (cancelled) return;

        const salary = response?.data?.salary || null;

        setCurrentActiveSalary(salary);
        setFormData(getDefaultForm(employee, salary));
      })
      .catch((err) => {
        if (cancelled) return;

        setCurrentActiveSalary(null);
        setSalaryLoadError(
          err?.message ||
          'Could not load the current salary. Please close and retry.'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSalary(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, employeeId, joiningDate, activeSalary]);

  const isInitial = !currentActiveSalary;
  const previousVersion = currentActiveSalary?.version || 1;

  const totals = useMemo(() => {
    const earnings = formData.earnings;
    const deductions = formData.deductions;

    const gross =
      toAmount(earnings.basic) +
      toAmount(earnings.houseRentAllowance) +
      toAmount(earnings.conveyanceAllowance) +
      toAmount(earnings.specialAllowance) +
      toAmount(earnings.dearnessAllowance) +
      toAmount(earnings.medicalAllowance);

    const employeePF = toAmount(
      deductions.providentFund.employeeContribution
    );

    const employerPF = toAmount(
      deductions.providentFund.employerContribution
    );

    const professionalTax = toAmount(deductions.professionalTax);
    const tds = toAmount(deductions.tds);

    const totalDeductions = employeePF + professionalTax + tds;
    const net = gross - totalDeductions;
    const ctc = gross + employerPF;

    const previousGross = toAmount(
      currentActiveSalary?.earnings?.grossSalary ??
      (currentActiveSalary?.earnings
        ? Object.values(currentActiveSalary.earnings).reduce(
          (sum, value) => sum + toAmount(value),
          0
        )
        : 0)
    );

    const difference = gross - previousGross;

    const percentage =
      previousGross > 0
        ? (difference / previousGross) * 100
        : 0;

    return {
      gross,
      employeePF,
      employerPF,
      professionalTax,
      tds,
      totalDeductions,
      net,
      ctc,
      previousGross,
      difference,
      percentage,
    };
  }, [formData, currentActiveSalary]);

  const allAmounts = [
    ...Object.values(formData.earnings),
    formData.deductions.providentFund.employeeContribution,
    formData.deductions.providentFund.employerContribution,
    formData.deductions.professionalTax,
    formData.deductions.tds,
  ];

  const hasInvalidAmount = allAmounts.some(
    (value) =>
      value === '' ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
  );

  const updateEarning = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      earnings: {
        ...previous.earnings,
        [field]: value,
      },
    }));
  };

  const updateDeduction = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      deductions: {
        ...previous.deductions,
        [field]: value,
      },
    }));
  };

  const updatePF = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      deductions: {
        ...previous.deductions,
        providentFund: {
          ...previous.deductions.providentFund,
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || isLoadingSalary || salaryLoadError) return;

    setError('');

    if (!formData.effectiveDate) {
      setError('Please select a salary effective date.');
      return;
    }

    if (hasInvalidAmount) {
      setError(
        'All salary and deduction amounts must be valid, non-negative numbers.'
      );
      return;
    }

    if (toAmount(formData.earnings.basic) <= 0) {
      setError('Basic salary must be greater than ₹0.');
      return;
    }

    if (totals.totalDeductions > totals.gross) {
      setError(
        'Total employee deductions cannot exceed gross monthly earnings.'
      );
      return;
    }

    if (!isInitial && !formData.reason.trim()) {
      setError(
        'A justification reason is required for salary revisions.'
      );
      return;
    }

    if (!isInitial && formData.reason.trim().length < 5) {
      setError('Please provide a more detailed revision reason.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isInitial) {
        await employeeApi.createInitialSalary(employeeId, {
          effectiveFrom: formData.effectiveDate,
          salaryBasis: 'MONTHLY',
          currency: 'INR',
          earnings: formData.earnings,
          deductions: formData.deductions,
          notes:
            formData.reason.trim() ||
            'Initial salary structure agreed upon onboarding',
        });

        showToast(
          `Initial salary assigned to ${employeeName}. Gross: ₹${formatINR(totals.gross)}/month.`,
          'success'
        );
      } else {
        const response = await employeeApi.createSalaryIncrement(
          employeeId,
          {
            effectiveDate: formData.effectiveDate,
            changeType: formData.changeType,
            reason: formData.reason.trim(),
            earnings: formData.earnings,
            deductions: formData.deductions,
          }
        );

        const nextVersion =
          response?.data?.newSalary?.version ||
          previousVersion + 1;

        showToast(
          `Salary revision Version ${nextVersion} created successfully.`,
          'success'
        );
      }

      if (typeof onClose === 'function') {
        onClose();
      }

      if (typeof onIncremented === 'function') {
        onIncremented();
      }
    } catch (err) {
      const message =
        err?.message || 'Failed to save the salary structure.';

      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !employee) return null;

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-mono text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

  const labelClass =
    'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-700';

  const renderAmountField = (
    label,
    value,
    onChange,
    options = {}
  ) => (
    <div className="min-w-0" key={label}>
      <label className={labelClass}>
        {label}
        {options.required && (
          <span className="ml-1 text-amber-600">*</span>
        )}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          required={Boolean(options.required)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isSubmitting || isLoadingSalary}
          placeholder="0"
          className={`${inputClass} pl-7`}
        />
      </div>
    </div>
  );

  const renderSummaryCard = (label, value, color, icon) => {
    const Icon = icon;

    const colorClasses = {
      amber: 'text-amber-700 border-amber-200 bg-amber-50',
      emerald: 'text-emerald-700 border-emerald-200 bg-emerald-50',
      rose: 'text-rose-700 border-rose-200 bg-rose-50',
      blue: 'text-sky-700 border-sky-200 bg-sky-50',
    };

    return (
      <div
        key={label}
        className={`min-w-0 rounded-xl border p-3 ${colorClasses[color]}`}
      >
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-[9px] font-bold uppercase tracking-wider text-gray-600">
            {label}
          </span>
        </div>

        <p className="mt-2 break-words font-mono text-base font-extrabold text-gray-900 sm:text-lg">
          ₹{formatINR(value)}
        </p>
        <p className="mt-1 text-[9px] text-gray-500">Per month</p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gray-900/50 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSubmitting
        ) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="salary-modal-title"
        className="my-auto flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-100/80 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isInitial
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
              >
                {isInitial ? (
                  <Coins className="h-5 w-5" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="salary-modal-title"
                    className="text-base font-extrabold tracking-tight text-gray-950 sm:text-lg"
                  >
                    {isInitial
                      ? 'Assign Initial Salary'
                      : 'Salary Increment & Revision'}
                  </h2>

                  <span
                    className={`rounded-full border px-2 py-1 font-mono text-[9px] font-bold ${isInitial
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      }`}
                  >
                    {isInitial
                      ? 'VERSION 1'
                      : `V${previousVersion} → V${previousVersion + 1}`}
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-gray-600">
                  {employee.employeeId || employee._id} · {employeeName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close salary modal"
              className="shrink-0 rounded-xl border border-gray-300 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto bg-gray-50/70"
        >
          <div className="space-y-5 p-5 sm:p-7">
            {/* Loading state */}
            {isLoadingSalary && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Loading salary details
                  </p>
                  <p className="mt-1 text-[11px] text-gray-600">
                    Retrieving the employee's current salary structure...
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
                <p className="flex-1 break-words text-xs leading-5 text-rose-800">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => setError('')}
                  aria-label="Dismiss error"
                  className="rounded p-1 text-rose-700 hover:bg-rose-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {salaryLoadError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
                  <div>
                    <p className="text-xs font-bold text-rose-800">
                      Could not verify current salary
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-700">
                      {salaryLoadError} Initial salary creation is disabled
                      until the current salary can be verified.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoadingSalary || isSubmitting}
                  onClick={() => {
                    setSalaryLoadError('');
                    setError('');
                    setIsLoadingSalary(true);

                    employeeApi
                      .getActiveSalary(employeeId)
                      .then((response) => {
                        const salary = response?.data?.salary || null;
                        setCurrentActiveSalary(salary);
                        setFormData(getDefaultForm(employee, salary));
                      })
                      .catch((err) => {
                        setSalaryLoadError(
                          err?.message ||
                          'Could not load the current salary. Please retry.'
                        );
                      })
                      .finally(() => setIsLoadingSalary(false));
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Retry loading salary
                </button>
              </div>
            )}

            {/* Live salary summary */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Live Salary Summary
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {renderSummaryCard(
                  'Gross Salary',
                  totals.gross,
                  'emerald',
                  IndianRupee
                )}

                {renderSummaryCard(
                  'Employee Deductions',
                  totals.totalDeductions,
                  'rose',
                  Wallet
                )}

                {renderSummaryCard(
                  'Net Take-Home',
                  totals.net,
                  'amber',
                  Coins
                )}

                {renderSummaryCard(
                  'Monthly CTC',
                  totals.ctc,
                  'blue',
                  Building2
                )}
              </div>

              {!isInitial && (
                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Previous Gross
                    </p>
                    <p className="mt-1 font-mono text-sm font-bold text-gray-900">
                      ₹{formatINR(totals.previousGross)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Gross Difference
                    </p>
                    <p
                      className={`mt-1 font-mono text-sm font-bold ${totals.difference >= 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                        }`}
                    >
                      {totals.difference >= 0 ? '+' : '-'}₹
                      {formatINR(Math.abs(totals.difference))}
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                      Gross Change
                    </p>
                    <p
                      className={`mt-1 font-mono text-sm font-extrabold ${totals.percentage >= 0
                          ? 'text-amber-700'
                          : 'text-rose-700'
                        }`}
                    >
                      {totals.previousGross > 0
                        ? `${totals.percentage > 0 ? '+' : ''}${totals.percentage.toFixed(2)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-2 text-[10px] leading-5 text-gray-600">
                All amounts are monthly. CTC here is calculated as gross
                earnings plus employer PF; other employer-side costs are not
                included.
              </p>
            </section>

            {/* Context banner */}
            <div
              className={`flex items-start gap-3 rounded-xl border p-3.5 ${isInitial
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-sky-200 bg-sky-50'
                }`}
            >
              {isInitial ? (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              ) : (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              )}

              <div>
                <p
                  className={`text-xs font-bold ${isInitial ? 'text-amber-900' : 'text-sky-900'
                    }`}
                >
                  {isInitial
                    ? 'Initial Salary Structure'
                    : 'Salary Revision'}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-700">
                  {isInitial
                    ? 'Set the employee’s baseline monthly compensation. Confirm the amounts and effective date before saving.'
                    : `The existing salary is Version ${previousVersion}. The backend should preserve salary history and apply the new version according to the selected effective date.`}
                </p>
              </div>
            </div>

            {/* Effective date and revision type */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-amber-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Effective Details
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Effective Date <span className="text-amber-700">*</span>
                  </label>

                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    disabled={isSubmitting || isLoadingSalary}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        effectiveDate: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {isInitial ? 'Salary Basis' : 'Revision Category'}
                  </label>

                  {isInitial ? (
                    <div className="flex min-h-[43px] items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5">
                      <span className="text-xs font-medium text-gray-800">
                        Monthly Compensation
                      </span>
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-[9px] font-bold text-amber-800">
                        INR
                      </span>
                    </div>
                  ) : (
                    <select
                      value={formData.changeType}
                      disabled={isSubmitting || isLoadingSalary}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          changeType: event.target.value,
                        }))
                      }
                      className={`${inputClass} font-sans`}
                    >
                      <option value="ANNUAL_INCREMENT">
                        Annual Appraisal Increment
                      </option>
                      <option value="PROMOTION_INCREMENT">
                        Promotion & Role Upgrade
                      </option>
                      <option value="MARKET_CORRECTION">
                        Market Correction
                      </option>
                      <option value="REVISED_BENEFITS">
                        Revised Benefits
                      </option>
                      <option value="OTHER">
                        Other Revision
                      </option>
                    </select>
                  )}
                </div>
              </div>
            </section>

            {/* Earnings */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <IndianRupee className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-950">
                      Earnings Structure
                    </h3>
                    <p className="mt-0.5 text-[10px] text-gray-600">
                      Monthly salary components
                    </p>
                  </div>
                </div>

                <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-xs font-bold text-emerald-800">
                  ₹{formatINR(totals.gross)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {renderAmountField(
                  'Basic Salary',
                  formData.earnings.basic,
                  (value) => updateEarning('basic', value),
                  { required: true }
                )}

                {renderAmountField(
                  'House Rent Allowance',
                  formData.earnings.houseRentAllowance,
                  (value) => updateEarning('houseRentAllowance', value)
                )}

                {renderAmountField(
                  'Special Allowance',
                  formData.earnings.specialAllowance,
                  (value) => updateEarning('specialAllowance', value)
                )}

                {renderAmountField(
                  'Conveyance Allowance',
                  formData.earnings.conveyanceAllowance,
                  (value) => updateEarning('conveyanceAllowance', value)
                )}

                {renderAmountField(
                  'Dearness Allowance',
                  formData.earnings.dearnessAllowance,
                  (value) => updateEarning('dearnessAllowance', value)
                )}

                {renderAmountField(
                  'Medical Allowance',
                  formData.earnings.medicalAllowance,
                  (value) => updateEarning('medicalAllowance', value)
                )}
              </div>
            </section>

            {/* Deductions */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                    <Wallet className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-950">
                      Deductions & PF
                    </h3>
                    <p className="mt-0.5 text-[10px] text-gray-600">
                      Employee deductions and employer contribution
                    </p>
                  </div>
                </div>

                <span className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-mono text-xs font-bold text-rose-800">
                  ₹{formatINR(totals.totalDeductions)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {renderAmountField(
                  'PF · Employee',
                  formData.deductions.providentFund.employeeContribution,
                  (value) => updatePF('employeeContribution', value)
                )}

                {renderAmountField(
                  'PF · Employer',
                  formData.deductions.providentFund.employerContribution,
                  (value) => updatePF('employerContribution', value)
                )}

                {renderAmountField(
                  'Professional Tax',
                  formData.deductions.professionalTax,
                  (value) => updateDeduction('professionalTax', value)
                )}

                {renderAmountField(
                  'TDS / Income Tax',
                  formData.deductions.tds,
                  (value) => updateDeduction('tds', value)
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Employee PF
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-rose-800">
                    ₹{formatINR(totals.employeePF)}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-600">
                    Included in employee deductions.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Employer PF
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-sky-800">
                    ₹{formatINR(totals.employerPF)}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-600">
                    Added to the employer's monthly cost, not deducted from
                    take-home pay.
                  </p>
                </div>
              </div>
            </section>

            {/* Reason */}
            <section>
              <label className={labelClass}>
                {isInitial
                  ? 'Salary Agreement Notes'
                  : 'Revision Justification'}
                {!isInitial && (
                  <span className="ml-1 text-amber-700">*</span>
                )}
              </label>

              <textarea
                rows={3}
                maxLength={1500}
                required={!isInitial}
                minLength={!isInitial ? 5 : undefined}
                value={formData.reason}
                disabled={isSubmitting || isLoadingSalary}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    reason: event.target.value,
                  }))
                }
                placeholder={
                  isInitial
                    ? 'Optional: appointment letter, agreed compensation, or onboarding notes...'
                    : 'Explain the appraisal, promotion, market adjustment, or reason for the revision...'
                }
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm leading-6 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              />

              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="flex items-start gap-1.5 text-[10px] leading-5 text-gray-600">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                  Keep a clear record of the salary decision for HR reference.
                </p>

                <span className="shrink-0 font-mono text-[10px] text-gray-500">
                  {formData.reason.length}/1500
                </span>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600">
                Estimated monthly take-home
              </p>
              <p
                className={`mt-1 font-mono text-lg font-extrabold ${totals.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
              >
                ₹{formatINR(totals.net)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isLoadingSalary ||
                  Boolean(salaryLoadError)
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 ${isInitial
                    ? 'bg-amber-600'
                    : 'bg-emerald-700'
                  }`}
              >
                {isSubmitting || isLoadingSalary ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isLoadingSalary ? 'Loading salary...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    {isInitial
                      ? 'Assign Initial Salary'
                      : `Publish Version ${previousVersion + 1}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
