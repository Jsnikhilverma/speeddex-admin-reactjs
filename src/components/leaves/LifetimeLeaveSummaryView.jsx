
import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  FileText,
} from 'lucide-react';

const MONTHS = [
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

const STATUS_LABELS = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REJECTED_BY_MANAGER: 'Rejected by Manager',
  REJECTED_BY_HR: 'Rejected by HR',
  PENDING: 'Pending',
  PENDING_MANAGER: 'Pending Manager',
  PENDING_HR: 'Pending HR',
  WITHDRAWN: 'Withdrawn',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASSES = {
  APPROVED:
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  REJECTED:
    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  REJECTED_BY_MANAGER:
    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  REJECTED_BY_HR:
    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  PENDING:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PENDING_MANAGER:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PENDING_HR:
    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  WITHDRAWN:
    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  CANCELLED:
    'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const toValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value, options = {}) => {
  const date = toValidDate(value);

  if (!date) return '—';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

const formatNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const getStatusBadge = (status) => {
  const normalizedStatus = String(status || '').toUpperCase();

  return (
    STATUS_CLASSES[normalizedStatus] ||
    'bg-slate-700/10 text-slate-400 border-slate-700/20'
  );
};

const getStatusLabel = (status) => {
  const normalizedStatus = String(status || '').toUpperCase();

  return (
    STATUS_LABELS[normalizedStatus] ||
    normalizedStatus.replace(/_/g, ' ') ||
    'Unknown'
  );
};

const getLeaveTypeLabel = (leaveType) => {
  if (!leaveType) return 'Unspecified';

  return String(leaveType)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getRecordKey = (leave, index) =>
  leave?._id || leave?.id || `${leave?.startDate || 'leave'}-${index}`;

const getRequestedDays = (row) =>
  formatNumber(row?.rejectedRequestedDays) +
  formatNumber(row?.pendingRequestedDays) +
  formatNumber(row?.approvedDays);

const SummaryCard = ({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  valueClass,
  footer,
}) => (
  <div className="min-w-0 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      {Icon && (
        <Icon
          className={`h-4 w-4 shrink-0 ${iconClass || 'text-amber-400'}`}
          aria-hidden="true"
        />
      )}
    </div>

    <div className="flex flex-wrap items-baseline gap-2">
      <span
        className={`text-3xl font-black ${valueClass || 'text-white'
          }`}
      >
        {value}
      </span>

      {subtitle && (
        <span className="text-xs font-medium text-slate-400">
          {subtitle}
        </span>
      )}
    </div>

    {footer && (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px]">
        {footer}
      </div>
    )}
  </div>
);

const TableEmptyState = ({ colSpan, children }) => (
  <tr>
    <td
      colSpan={colSpan}
      className="px-4 py-10 text-center text-sm text-slate-500"
    >
      {children}
    </td>
  </tr>
);

const TableHeader = ({ children, align = 'left' }) => (
  <th
    scope="col"
    className={`whitespace-nowrap px-4 py-3 text-${align} text-[10px] font-bold uppercase tracking-wider text-slate-400`}
  >
    {children}
  </th>
);

export const LifetimeLeaveSummaryView = ({
  summaryData,
  isLoading = false,
  onRefresh,
  onOpenTimeline,
}) => {
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('monthly');

  const totals = summaryData?.totals || {};
  const balances = totals.balances || {};

  const monthlyList = Array.isArray(summaryData?.monthlyBreakdown)
    ? summaryData.monthlyBreakdown
    : [];

  const yearlyList = Array.isArray(summaryData?.yearlyBreakdown)
    ? summaryData.yearlyBreakdown
    : [];

  const allLeaves = Array.isArray(summaryData?.leaves)
    ? summaryData.leaves
    : [];

  const availableYears = useMemo(() => {
    const years = new Set();

    yearlyList.forEach((row) => {
      const year = Number(row?.year);

      if (Number.isInteger(year) && year > 0) {
        years.add(year);
      }
    });

    allLeaves.forEach((leave) => {
      const date = toValidDate(leave?.startDate);

      if (date) {
        years.add(date.getFullYear());
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [yearlyList, allLeaves]);

  const availableTypes = useMemo(() => {
    return Array.from(
      new Set(
        allLeaves
          .map((leave) => leave?.leaveType)
          .filter((type) => typeof type === 'string' && type.trim())
      )
    ).sort();
  }, [allLeaves]);

  const availableStatuses = useMemo(() => {
    return Array.from(
      new Set(
        allLeaves
          .map((leave) => leave?.status)
          .filter((status) => typeof status === 'string' && status.trim())
      )
    ).sort();
  }, [allLeaves]);

  const filteredMonthly = useMemo(() => {
    return monthlyList
      .filter((row) => {
        const year = Number(row?.year);
        const month = Number(row?.month);

        if (selectedYear !== 'ALL' && year !== Number(selectedYear)) {
          return false;
        }

        if (selectedMonth !== 'ALL' && month !== Number(selectedMonth)) {
          return false;
        }

        return true;
      })
      .slice()
      .sort((a, b) => {
        const yearDifference = Number(b?.year) - Number(a?.year);

        if (yearDifference !== 0) return yearDifference;

        return Number(b?.month) - Number(a?.month);
      });
  }, [monthlyList, selectedYear, selectedMonth]);

  const filteredYearly = useMemo(() => {
    return yearlyList
      .filter((row) => {
        return (
          selectedYear === 'ALL' ||
          Number(row?.year) === Number(selectedYear)
        );
      })
      .slice()
      .sort((a, b) => Number(b?.year) - Number(a?.year));
  }, [yearlyList, selectedYear]);

  const filteredLeaves = useMemo(() => {
    return allLeaves
      .filter((leave) => {
        const startDate = toValidDate(leave?.startDate);

        // Records without a valid start date cannot match a date filter.
        if (selectedYear !== 'ALL') {
          if (
            !startDate ||
            startDate.getFullYear() !== Number(selectedYear)
          ) {
            return false;
          }
        }

        if (selectedMonth !== 'ALL') {
          if (
            !startDate ||
            startDate.getMonth() + 1 !== Number(selectedMonth)
          ) {
            return false;
          }
        }

        if (
          selectedType !== 'ALL' &&
          leave?.leaveType !== selectedType
        ) {
          return false;
        }

        if (
          selectedStatus !== 'ALL' &&
          leave?.status !== selectedStatus
        ) {
          return false;
        }

        return true;
      })
      .slice()
      .sort((a, b) => {
        const dateA =
          toValidDate(a?.startDate)?.getTime() ??
          toValidDate(a?.createdAt)?.getTime() ??
          0;

        const dateB =
          toValidDate(b?.startDate)?.getTime() ??
          toValidDate(b?.createdAt)?.getTime() ??
          0;

        return dateB - dateA;
      });
  }, [
    allLeaves,
    selectedYear,
    selectedMonth,
    selectedType,
    selectedStatus,
  ]);

  const handleRefresh = useCallback(() => {
    if (isLoading || typeof onRefresh !== 'function') return;

    onRefresh();
  }, [isLoading, onRefresh]);

  const resetFilters = useCallback(() => {
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
  }, []);

  if (isLoading) {
    return (
      <div
        className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400"
        role="status"
        aria-live="polite"
      >
        <RefreshCw
          className="mx-auto mb-3 h-8 w-8 animate-spin text-amber-500"
          aria-hidden="true"
        />

        <p className="text-xs font-semibold">
          Loading lifetime leave records and historical summaries...
        </p>
      </div>
    );
  }

  const viewOptions = [
    { value: 'monthly', label: 'Monthly Breakdown' },
    { value: 'yearly', label: 'Yearly Summary' },
    {
      value: 'records',
      label: `Historical Records (${filteredLeaves.length})`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Lifetime KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Applications"
          value={formatNumber(totals.totalApplications)}
          subtitle="all-time requests"
          icon={FileText}
          iconClass="text-amber-400"
          footer={
            <>
              <span className="font-semibold text-emerald-400">
                {formatNumber(totals.approvedApplications)} Approved
              </span>

              <span className="font-semibold text-rose-400">
                {formatNumber(totals.rejectedApplications)} Rejected
              </span>

              <span className="font-semibold text-amber-400">
                {formatNumber(totals.pendingApplications)} Pending
              </span>
            </>
          }
        />

        <SummaryCard
          label="Approved Leave Days"
          value={formatNumber(totals.approvedDays)}
          subtitle="days approved"
          icon={CheckCircle2}
          iconClass="text-emerald-400"
          valueClass="text-emerald-400"
          footer={
            <>
              <span className="text-slate-300">
                Paid: {formatNumber(totals.paidDays)}d
              </span>

              <span className="text-amber-400">
                Unpaid / LOP: {formatNumber(totals.unpaidDays)}d
              </span>
            </>
          }
        />

        <SummaryCard
          label="Rejected Requested Days"
          value={formatNumber(totals.rejectedRequestedDays)}
          subtitle="days requested"
          icon={XCircle}
          iconClass="text-rose-400"
          valueClass="text-rose-400"
          footer={
            <p className="text-slate-500">
              Requested days only; not counted as approved leave.
            </p>
          }
        />

        <SummaryCard
          label="Remaining Leave Balance"
          value={
            balances.remainingDays !== undefined &&
              balances.remainingDays !== null
              ? balances.remainingDays
              : '—'
          }
          subtitle="days balance"
          icon={Clock}
          iconClass="text-cyan-400"
          valueClass="text-cyan-400"
          footer={
            <>
              <span className="text-slate-300">
                Entitled: {balances.totalEntitlement ?? '—'}d
              </span>

              <span className="text-slate-300">
                Used: {formatNumber(balances.usedDays)}d
              </span>
            </>
          }
        />
      </div>

      {/* View selector and filters */}
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setViewMode(option.value)}
              aria-pressed={viewMode === option.value}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${viewMode === option.value
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="min-w-32 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
          >
            <option value="ALL">All Years</option>

            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {viewMode !== 'yearly' && (
            <select
              aria-label="Filter by month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="min-w-36 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
            >
              <option value="ALL">All Months</option>

              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          )}

          {viewMode === 'records' && (
            <>
              <select
                aria-label="Filter by leave type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="min-w-36 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              >
                <option value="ALL">All Leave Types</option>

                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {getLeaveTypeLabel(type)}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="min-w-40 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>

                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || typeof onRefresh !== 'function'}
            title="Refresh lifetime leave data"
            aria-label="Refresh lifetime leave data"
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-amber-400"
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Monthly breakdown */}
      {viewMode === 'monthly' && (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-5 py-4 sm:px-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Calendar className="h-4 w-4 text-amber-400" />
              Monthly Historical Leave Summary
            </h3>

            <span className="text-xs text-slate-400">
              {filteredMonthly.length} calendar months
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950">
                <tr>
                  <TableHeader>Month</TableHeader>
                  <TableHeader align="center">Applied</TableHeader>
                  <TableHeader align="center">Approved</TableHeader>
                  <TableHeader align="center">Rejected</TableHeader>
                  <TableHeader align="center">Pending</TableHeader>
                  <TableHeader align="center">Approved Days</TableHeader>
                  <TableHeader align="center">Requested Days</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredMonthly.length === 0 ? (
                  <TableEmptyState colSpan={7}>
                    No monthly leave records found for the selected filters.
                  </TableEmptyState>
                ) : (
                  filteredMonthly.map((row, index) => (
                    <tr
                      key={row.key || `${row.year}-${row.month}-${index}`}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-sans font-semibold text-white">
                        {row.monthName ||
                          MONTHS[Number(row.month) - 1] ||
                          'Unknown'}{' '}
                        {row.year || ''}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-200">
                        {formatNumber(row.appliedCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                        {formatNumber(row.approvedCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-rose-400">
                        {formatNumber(row.rejectedCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-amber-400">
                        {formatNumber(row.pendingCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-black text-emerald-400">
                        {formatNumber(row.approvedDays)}d
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-400">
                        {getRequestedDays(row)}d
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Yearly breakdown */}
      {viewMode === 'yearly' && (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-5 py-4 sm:px-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              Annual Leave Summary
            </h3>

            <span className="text-xs text-slate-400">
              {filteredYearly.length} calendar years
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950">
                <tr>
                  <TableHeader>Year</TableHeader>
                  <TableHeader align="center">Applied</TableHeader>
                  <TableHeader align="center">Approved</TableHeader>
                  <TableHeader align="center">Rejected</TableHeader>
                  <TableHeader align="center">Pending</TableHeader>
                  <TableHeader align="center">Approved Days</TableHeader>
                  <TableHeader align="center">Total Requested</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {filteredYearly.length === 0 ? (
                  <TableEmptyState colSpan={7}>
                    No annual leave records found for the selected filters.
                  </TableEmptyState>
                ) : (
                  filteredYearly.map((row) => (
                    <tr
                      key={row.year}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5 font-sans text-sm font-black text-amber-400">
                        {row.year}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-slate-200">
                        {formatNumber(row.appliedCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                        {formatNumber(row.approvedCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-rose-400">
                        {formatNumber(row.rejectedCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold text-amber-400">
                        {formatNumber(row.pendingCount)}
                      </td>

                      <td className="px-4 py-3.5 text-center font-black text-emerald-400">
                        {formatNumber(row.approvedDays)}d
                      </td>

                      <td className="px-4 py-3.5 text-center text-slate-400">
                        {getRequestedDays(row)}d
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* All historical records */}
      {viewMode === 'records' && (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-5 py-4 sm:px-6">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <FileText className="h-4 w-4 text-amber-400" />
              Complete Chronological Leave History
            </h3>

            <span className="text-xs text-slate-400">
              {filteredLeaves.length} matching records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950">
                <tr>
                  <TableHeader>Period</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Days</TableHeader>
                  <TableHeader>Reason</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader align="right">Details</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLeaves.length === 0 ? (
                  <TableEmptyState colSpan={6}>
                    No leave records match the active filters.
                  </TableEmptyState>
                ) : (
                  filteredLeaves.map((leave, index) => (
                    <tr
                      key={getRecordKey(leave, index)}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-semibold text-white">
                          {formatDate(leave.startDate)} —{' '}
                          {formatDate(leave.endDate)}
                        </div>

                        <span className="mt-1 block text-[10px] text-slate-500">
                          Applied: {formatDate(leave.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-200">
                        {getLeaveTypeLabel(leave.leaveType)}

                        {leave.isHalfDay && (
                          <span className="ml-1.5 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-amber-400">
                            Half Day
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 font-mono font-bold text-white">
                        {formatNumber(leave.totalDays)}{' '}
                        {formatNumber(leave.totalDays) === 1
                          ? 'day'
                          : 'days'}
                      </td>

                      <td className="max-w-xs px-4 py-3.5">
                        <p
                          className="truncate text-slate-300"
                          title={leave.reason || 'Personal leave'}
                        >
                          {leave.reason || 'Personal leave'}
                        </p>

                        {leave.rejectionReason && (
                          <p
                            className="mt-1 truncate text-[10px] text-rose-400"
                            title={leave.rejectionReason}
                          >
                            Rejection: {leave.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(
                            leave.status
                          )}`}
                        >
                          {getStatusLabel(leave.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenTimeline?.(leave)}
                          disabled={typeof onOpenTimeline !== 'function'}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`View timeline for leave starting ${formatDate(
                            leave.startDate
                          )}`}
                        >
                          Timeline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default LifetimeLeaveSummaryView;
