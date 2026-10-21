
import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { useToast } from '../../context/ToastContext';
import {
  ArrowRightLeft,
  X,
  AlertCircle,
  Loader2,
  Check,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  UserRound,
  ArrowRight,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getEmployeeName = (employee) => {
  if (!employee) return 'Employee';

  if (employee.fullName?.trim()) {
    return employee.fullName.trim();
  }

  const firstName =
    typeof employee.name === 'string'
      ? employee.name
      : employee.name?.firstName || '';

  const lastName =
    typeof employee.name === 'object'
      ? employee.name?.lastName || ''
      : '';

  return `${firstName} ${lastName}`.trim() || 'Employee';
};

const getDepartmentId = (department) => {
  if (!department) return '';

  if (typeof department === 'string') {
    return department;
  }

  return department._id || department.id || '';
};

const getDepartmentName = (department) => {
  if (!department) return 'No Department';

  if (typeof department === 'string') {
    return 'Department assigned';
  }

  return department.name || 'No Department';
};

export const TransferEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentsError, setDepartmentsError] = useState('');

  const [targetDepartment, setTargetDepartment] = useState('');
  const [targetDesignation, setTargetDesignation] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(getLocalDate());
  const [reason, setReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const employeeName = getEmployeeName(employee);
  const currentDepartmentId = getDepartmentId(employee?.department);
  const currentDepartmentName = getDepartmentName(employee?.department);
  const currentDesignation = employee?.designation || 'Not assigned';

  const selectedDepartment = departments.find(
    (department) => department._id === targetDepartment
  );

  const hasDepartmentChanged =
    targetDepartment !== currentDepartmentId;

  const hasDesignationChanged =
    targetDesignation.trim() !== (employee?.designation || '').trim();

  const hasChanges = hasDepartmentChanged || hasDesignationChanged;

  useEffect(() => {
    if (!isOpen || !employee) return;

    setTargetDepartment(getDepartmentId(employee.department));
    setTargetDesignation(employee.designation || '');
    setEffectiveDate(getLocalDate());
    setReason('');
    setError('');
    setDepartmentsError('');
  }, [
    isOpen,
    employee?._id,
    employee?.department,
    employee?.designation,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    let isActive = true;

    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      setDepartmentsError('');

      try {
        const response = await departmentApi.getDepartments({
          limit: 100,
          isActive: true,
        });

        if (!isActive) return;

        const departmentList = response?.data?.departments;

        setDepartments(
          Array.isArray(departmentList) ? departmentList : []
        );
      } catch (err) {
        if (!isActive) return;

        setDepartmentsError(
          err?.message || 'Unable to load departments. Please retry.'
        );
      } finally {
        if (isActive) {
          setIsLoadingDepartments(false);
        }
      }
    };

    loadDepartments();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !employee) return null;

  const handleClose = () => {
    if (isSubmitting) return;

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    if (!targetDepartment && !targetDesignation.trim()) {
      setError(
        'Please select a department or enter a designation before continuing.'
      );
      return;
    }

    if (!effectiveDate) {
      setError('Please select an effective date.');
      return;
    }

    if (!reason.trim()) {
      setError('A mandatory reason is required for transfers or promotions.');
      return;
    }

    if (reason.trim().length < 5) {
      setError(
        'Please provide a more detailed reason (at least 5 characters).'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await employeeApi.transferEmployee(employee._id, {
        department: targetDepartment || null,
        designation: targetDesignation.trim() || undefined,
        effectiveDate,
        reason: reason.trim(),
      });

      showToast(
        `Transfer recorded successfully for ${employeeName}.`,
        'success'
      );

      if (typeof onClose === 'function') {
        onClose();
      }

      if (typeof onUpdated === 'function') {
        await onUpdated();
      }
    } catch (err) {
      setError(
        err?.message || 'Failed to record employee transfer. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

  const labelClass =
    'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/45 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        className="relative my-auto flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-black/20 sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-gray-200 bg-white px-5 py-5 sm:px-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <ArrowRightLeft className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2
                    id="transfer-modal-title"
                    className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl"
                  >
                    Transfer / Promote
                  </h2>

                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                    HR Action
                  </span>
                </div>

                <p className="text-xs leading-5 text-gray-500">
                  Update department, designation and effective date.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close transfer modal"
              className="shrink-0 rounded-xl border border-gray-200 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Employee identity */}
          <div className="relative mt-5 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-gray-950">
              {employeeName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('') || 'E'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">
                {employeeName}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-gray-500">
                Employee ID: {employee.employeeId || employee._id || 'N/A'}
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-2 sm:flex">
              <UserRound className="h-3.5 w-3.5 text-amber-700" />
              <span className="text-[10px] font-semibold text-gray-600">
                Employee Record
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="space-y-6 bg-gray-50/70 p-5 sm:p-7">
            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-rose-800">
                    Unable to complete transfer
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-rose-700">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError('')}
                  className="shrink-0 rounded-md p-1 text-rose-600 hover:bg-rose-100"
                  aria-label="Dismiss error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Department Section */}
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <Building2 className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Department Assignment
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Choose where the employee will be assigned.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelClass}>Current Department</label>

                  <div className="flex min-h-[46px] items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3">
                    <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                    <span
                      title={currentDepartmentName}
                      className="truncate text-sm font-medium text-gray-700"
                    >
                      {currentDepartmentName}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="transfer-target-department"
                    className={labelClass}
                  >
                    Target Department
                  </label>

                  <div className="relative">
                    <select
                      id="transfer-target-department"
                      value={targetDepartment}
                      onChange={(event) =>
                        setTargetDepartment(event.target.value)
                      }
                      disabled={isLoadingDepartments || isSubmitting}
                      className={`${inputClass} appearance-none pr-10`}
                    >
                      <option value="">No Department (Unassigned)</option>

                      {departments.map((department) => (
                        <option
                          key={department._id}
                          value={department._id}
                        >
                          {department.name}
                          {department.code ? ` (${department.code})` : ''}
                        </option>
                      ))}
                    </select>

                    {isLoadingDepartments ? (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-amber-600" />
                    ) : (
                      <ArrowRightLeft className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    )}
                  </div>

                  {departmentsError && (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-rose-700">
                        {departmentsError}
                      </p>

                      <button
                        type="button"
                        onClick={async () => {
                          setIsLoadingDepartments(true);
                          setDepartmentsError('');

                          try {
                            const response =
                              await departmentApi.getDepartments({
                                limit: 100,
                                isActive: true,
                              });

                            const list = response?.data?.departments;

                            setDepartments(Array.isArray(list) ? list : []);
                          } catch (err) {
                            setDepartmentsError(
                              err?.message ||
                              'Unable to load departments. Please retry.'
                            );
                          } finally {
                            setIsLoadingDepartments(false);
                          }
                        }}
                        disabled={isLoadingDepartments || isSubmitting}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 disabled:opacity-50"
                      >
                        <RefreshCcw className="h-3 w-3" />
                        Retry
                      </button>
                    </div>
                  )}

                  {!isLoadingDepartments &&
                    !departmentsError &&
                    departments.length === 0 && (
                      <p className="mt-2 text-[11px] text-gray-500">
                        No active departments found.
                      </p>
                    )}
                </div>
              </div>
            </section>

            <div className="h-px bg-gray-200" />

            {/* Designation Section */}
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Role & Designation
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Update the employee's job title if required.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelClass}>Current Designation</label>

                  <div className="flex min-h-[46px] items-center rounded-xl border border-gray-200 bg-white px-3.5 py-3">
                    <span className="truncate text-sm font-medium text-gray-700">
                      {currentDesignation}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="transfer-target-designation"
                    className={labelClass}
                  >
                    New Designation
                  </label>

                  <input
                    id="transfer-target-designation"
                    type="text"
                    value={targetDesignation}
                    onChange={(event) =>
                      setTargetDesignation(event.target.value)
                    }
                    placeholder="e.g. Senior Project Manager"
                    maxLength={100}
                    disabled={isSubmitting}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Change Preview */}
            {hasChanges && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-amber-700" />
                  <p className="text-xs font-bold text-amber-900">
                    Change Summary
                  </p>
                </div>

                <div className="space-y-3">
                  {hasDepartmentChanged && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate text-gray-600">
                        {currentDepartmentName}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                      <span className="min-w-0 flex-1 truncate text-right font-semibold text-gray-900">
                        {targetDepartment
                          ? selectedDepartment?.name || 'Selected Department'
                          : 'Unassigned'}
                      </span>
                    </div>
                  )}

                  {hasDesignationChanged && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate text-gray-600">
                        {currentDesignation}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                      <span className="min-w-0 flex-1 truncate text-right font-semibold text-gray-900">
                        {targetDesignation.trim() || 'Not assigned'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="h-px bg-gray-200" />

            {/* Effective Date */}
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Effective Date
                  </h3>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    When should this change take effect?
                  </p>
                </div>
              </div>

              <label htmlFor="transfer-effective-date" className="sr-only">
                Effective date
              </label>

              <input
                id="transfer-effective-date"
                type="date"
                required
                value={effectiveDate}
                onChange={(event) => setEffectiveDate(event.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              />
            </section>

            {/* Reason */}
            <section>
              <label htmlFor="transfer-reason" className={labelClass}>
                Justification / Reason
                <span className="ml-1 text-amber-700">*</span>
              </label>

              <textarea
                id="transfer-reason"
                rows={4}
                required
                minLength={5}
                maxLength={1000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this transfer or promotion is required..."
                disabled={isSubmitting}
                className={`${inputClass} resize-y leading-6`}
              />

              <div className="mt-2 flex items-end justify-end gap-3">
                <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
                  {reason.length}/1000
                </span>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="hidden items-center gap-1.5 text-[10px] text-gray-500 sm:flex">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              HR record update
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingDepartments}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-extrabold text-gray-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    Confirm Transfer
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
