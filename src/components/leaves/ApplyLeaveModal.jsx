
import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  X,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const LEAVE_TYPES = [
  {
    id: 'CASUAL',
    name: 'Casual Leave (CL)',
    desc: 'Short personal commitments or urgent errands',
  },
  {
    id: 'SICK',
    name: 'Sick Leave (SL)',
    desc: 'Medical emergencies, illness, or doctor consultation',
  },
  {
    id: 'EARNED',
    name: 'Earned / Privilege Leave',
    desc: 'Planned vacations and annual leave allowance',
  },
  {
    id: 'COMPENSATORY_OFF',
    name: 'Comp-Off (CO)',
    desc: 'Compensatory off for site overtime or weekend duty',
  },
  {
    id: 'BEREAVEMENT',
    name: 'Bereavement Leave',
    desc: 'Family bereavement support',
  },
  {
    id: 'UNPAID',
    name: 'Loss of Pay (Unpaid)',
    desc: 'Approved unpaid leave beyond allocated quota',
  },
];

const DURATION_TYPES = [
  { id: 'FULL_DAY', label: 'Full Day' },
  { id: 'FIRST_HALF', label: 'First Half (0.5)' },
  { id: 'SECOND_HALF', label: 'Second Half (0.5)' },
];

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  const firstName = employee.name?.firstName || '';
  const lastName = employee.name?.lastName || '';
  const name = `${firstName} ${lastName}`.trim();

  return name || employee.fullName || employee.employeeId || 'Worker';
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
  );
};

const calculateRequestedDays = (startDate, endDate, durationType) => {
  if (!isValidDate(startDate)) return 0;

  if (durationType !== 'FULL_DAY') {
    return 0.5;
  }

  if (!isValidDate(endDate) || endDate < startDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return (
    Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1
  );
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Unable to submit the leave application. Please try again.';

export const ApplyLeaveModal = ({
  isOpen,
  onClose,
  onApply,
  employees = [],
  isPrivileged = false,
}) => {
  const submittingRef = useRef(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState(getLocalDate());
  const [endDate, setEndDate] = useState(getLocalDate());
  const [durationType, setDurationType] = useState('FULL_DAY');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployeeId('');
      setLeaveType('CASUAL');
      setStartDate(getLocalDate());
      setEndDate(getLocalDate());
      setDurationType('FULL_DAY');
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const employeeList = Array.isArray(employees) ? employees : [];

  const totalDays = calculateRequestedDays(
    startDate,
    endDate,
    durationType
  );

  const isDateRangeInvalid =
    !isValidDate(startDate) ||
    (durationType === 'FULL_DAY' &&
      (!isValidDate(endDate) || endDate < startDate));

  const selectedEmployeeExists = employeeList.some(
    (employee) => employee._id === selectedEmployeeId
  );

  const hasValidEmployee = isPrivileged
    ? Boolean(selectedEmployeeId) &&
    (selectedEmployeeId === 'SUPER_ADMIN_SELF' ||
      selectedEmployeeExists)
    : true;

  const canSubmit =
    !isSubmitting &&
    !isDateRangeInvalid &&
    totalDays > 0 &&
    reason.trim().length >= 5 &&
    hasValidEmployee;

  const handleClose = () => {
    if (submittingRef.current) return;
    onClose?.();
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);

    if (!value) return;

    if (durationType !== 'FULL_DAY' || !endDate || value > endDate) {
      setEndDate(value);
    }
  };

  const handleDurationChange = (value) => {
    setDurationType(value);

    if (value !== 'FULL_DAY') {
      setEndDate(startDate);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    setError('');

    if (!isValidDate(startDate)) {
      setError('Please select a valid leave start date.');
      return;
    }

    if (
      durationType === 'FULL_DAY' &&
      (!isValidDate(endDate) || endDate < startDate)
    ) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (!LEAVE_TYPES.some((type) => type.id === leaveType)) {
      setError('Please select a valid leave type.');
      return;
    }

    if (!DURATION_TYPES.some((type) => type.id === durationType)) {
      setError('Please select a valid leave duration.');
      return;
    }

    if (reason.trim().length < 5) {
      setError('Please provide a reason of at least 5 characters.');
      return;
    }

    if (isPrivileged && !hasValidEmployee) {
      setError('Please select a valid employee for this leave application.');
      return;
    }

    if (typeof onApply !== 'function') {
      setError('Leave application service is unavailable. Please try again.');
      return;
    }

    const payload = {
      employeeId:
        selectedEmployeeId === 'SUPER_ADMIN_SELF'
          ? 'SUPER_ADMIN_SELF'
          : selectedEmployeeId || undefined,
      leaveType,
      startDate,
      endDate: durationType === 'FULL_DAY' ? endDate : startDate,
      durationType,
      reason: reason.trim(),
    };

    try {
      submittingRef.current = true;
      setIsSubmitting(true);

      await onApply(payload);

      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

  const labelClass = 'mb-2 block text-sm font-semibold text-gray-800';

  const sectionTitleClass =
    'text-sm font-bold tracking-tight text-gray-900';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-leave-title"
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-black/20"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
              <Calendar className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="apply-leave-title"
                className="text-lg font-bold tracking-tight text-gray-950 sm:text-xl"
              >
                Apply for Leave
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                Submit your leave application for approval
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close leave application"
            className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto bg-white p-4 sm:p-6"
        >
          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* Employee selection */}
          <div>
            <label htmlFor="leave-employee" className={labelClass}>
              Employee / Applicant{' '}
              {isPrivileged && <span className="text-red-600">*</span>}
            </label>

            <select
              id="leave-employee"
              value={selectedEmployeeId}
              onChange={(event) =>
                setSelectedEmployeeId(event.target.value)
              }
              className={inputClass}
              disabled={isSubmitting}
              required={isPrivileged}
            >
              <option value="">
                {isPrivileged
                  ? '-- Select Employee --'
                  : '-- Apply for Myself --'}
              </option>

              {isPrivileged && (
                <option value="SUPER_ADMIN_SELF">
                  Super Admin (Self / Corporate Account)
                </option>
              )}

              {employeeList.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.employeeId || 'No ID'} —{' '}
                  {getEmployeeName(employee)} (
                  {employee.designation ||
                    employee.employmentDetails?.designation ||
                    'Staff'}
                  )
                </option>
              ))}
            </select>

            {isPrivileged && (
              <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                Select the employee on whose behalf this leave is being
                requested.
              </p>
            )}
          </div>

          {/* Leave type */}
          <fieldset>
            <legend className={labelClass}>
              Leave Classification Type{' '}
              <span className="text-red-600">*</span>
            </legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LEAVE_TYPES.map((type) => {
                const selected = leaveType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={isSubmitting}
                    onClick={() => setLeaveType(type.id)}
                    className={`rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${selected
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-400'
                        : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${selected ? 'text-amber-900' : 'text-gray-900'
                          }`}
                      >
                        {type.name}
                      </span>

                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-amber-700" />
                      )}
                    </span>

                    <span className="mt-1.5 block text-xs leading-relaxed text-gray-600">
                      {type.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Duration */}
          <fieldset>
            <legend className={labelClass}>Duration Mode</legend>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {DURATION_TYPES.map((duration) => {
                const selected = durationType === duration.id;

                return (
                  <button
                    type="button"
                    key={duration.id}
                    aria-pressed={selected}
                    disabled={isSubmitting}
                    onClick={() => handleDurationChange(duration.id)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${selected
                        ? 'border-gray-950 bg-gray-950 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {duration.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="leave-start-date" className={labelClass}>
                Start Date <span className="text-red-600">*</span>
              </label>

              <input
                id="leave-start-date"
                type="date"
                required
                value={startDate}
                onChange={(event) =>
                  handleStartDateChange(event.target.value)
                }
                className={inputClass}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="leave-end-date" className={labelClass}>
                End Date <span className="text-red-600">*</span>
              </label>

              <input
                id="leave-end-date"
                type="date"
                required
                min={startDate || undefined}
                disabled={isSubmitting || durationType !== 'FULL_DAY'}
                value={durationType !== 'FULL_DAY' ? startDate : endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className={inputClass}
              />

              {durationType !== 'FULL_DAY' && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Half-day leave applies to the selected start date only.
                </p>
              )}
            </div>
          </div>

          {/* Days preview */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
                <Clock className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Total Requested Leave
                </p>
                <p className="text-xs text-gray-500">
                  Estimated calendar days
                </p>
              </div>
            </div>

            <span
              className={`text-right text-base font-bold ${totalDays > 0 && !isDateRangeInvalid
                  ? 'text-gray-950'
                  : 'text-red-600'
                }`}
            >
              {totalDays > 0 && !isDateRangeInvalid
                ? `${totalDays} Day${totalDays === 1 ? '' : 's'}`
                : 'Invalid Date Range'}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            This is a calendar-day estimate. Final chargeable leave may depend
            on company holidays, weekly offs, and your leave policy.
          </p>

          {/* Reason */}
          <div>
            <label htmlFor="leave-reason" className={labelClass}>
              Reason for Leave <span className="text-red-600">*</span>
            </label>

            <textarea
              id="leave-reason"
              rows={4}
              required
              minLength={5}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain the reason for leave and any work handover arrangements."
              className={`${inputClass} resize-y`}
              disabled={isSubmitting}
            />

            <p className="mt-1.5 text-right text-xs text-gray-500">
              {reason.length}/1000 characters
            </p>
          </div>

          {/* Approval notice */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Approval Workflow
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-700">
                Your application will follow the approval workflow configured
                by your organization.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
