
import React, { useState, useEffect } from 'react';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  UserCheck,
  Calendar,
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

  const firstName = employee.name?.firstName || '';
  const lastName = employee.name?.lastName || '';
  const name = `${firstName} ${lastName}`.trim();

  return name || employee.employeeId || 'Employee';
};

const getEntityId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;

  return entity._id || entity.id || '';
};

const getErrorMessage = (err) => {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
};

export const PromoteEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onUpdated,
}) => {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  const [toDesignation, setToDesignation] = useState('');
  const [toDepartment, setToDepartment] = useState('');
  const [toReportingManager, setToReportingManager] = useState('');
  const [promotionDate, setPromotionDate] = useState(getLocalDate());
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !employee) return undefined;

    let cancelled = false;

    const loadOptions = async () => {
      setIsLoadingOptions(true);

      try {
        const [departmentResult, employeeResult] = await Promise.allSettled([
          departmentApi.getDepartments({
            limit: 100,
            isActive: true,
          }),
          employeeApi.getEmployees({
            limit: 100,
            employmentStatus: 'ACTIVE',
          }),
        ]);

        if (cancelled) return;

        if (departmentResult.status === 'fulfilled') {
          const response = departmentResult.value;
          const list = response?.data?.departments;

          setDepartments(Array.isArray(list) ? list : []);
        } else {
          setDepartments([]);
        }

        if (employeeResult.status === 'fulfilled') {
          const response = employeeResult.value;
          const list = response?.data?.employees;

          setManagers(
            (Array.isArray(list) ? list : []).filter(
              (item) =>
                item?._id &&
                item._id !== employee._id &&
                item.employmentStatus !== 'INACTIVE'
            )
          );
        } else {
          setManagers([]);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load department and manager options.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
        }
      }
    };

    const currentDepartmentId = getEntityId(employee.department);
    const currentManagerId = getEntityId(employee.reportingManager);

    setToDepartment(currentDepartmentId);
    setToReportingManager(currentManagerId);
    setToDesignation('');
    setPromotionDate(getLocalDate());
    setReason('');
    setRemarks('');
    setError('');

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const employeeName = getEmployeeName(employee);

  const currentDesignation =
    employee.employmentDetails?.designation ||
    employee.designation ||
    'Not Assigned';

  const currentDeptName =
    employee.department?.name ||
    departments.find(
      (department) => department._id === getEntityId(employee.department)
    )?.name ||
    'Unassigned';

  const managerName = (manager) => {
    if (!manager) return 'None';

    const name = `${manager.name?.firstName || ''} ${manager.name?.lastName || ''
      }`.trim();

    return name || manager.employeeId || 'Assigned';
  };

  const currentManagerName = managerName(employee.reportingManager);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const designation = toDesignation.trim();
    const promotionReason = reason.trim();

    if (!designation) {
      setError('Please enter the new designation or job title.');
      return;
    }

    if (designation.length > 100) {
      setError('Designation cannot exceed 100 characters.');
      return;
    }

    if (!promotionReason) {
      setError('Please provide a reason for this promotion.');
      return;
    }

    if (promotionReason.length > 2000) {
      setError('Promotion reason cannot exceed 2000 characters.');
      return;
    }

    if (!promotionDate) {
      setError('Please select the promotion effective date.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(promotionDate)) {
      setError('Please select a valid promotion date.');
      return;
    }

    const selectedDate = new Date(`${promotionDate}T00:00:00`);
    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.toISOString().slice(0, 10) !== promotionDate
    ) {
      setError('Please select a valid promotion date.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        toDesignation: designation,
        promotionDate,
        reason: promotionReason,
        remarks: remarks.trim(),
      };

      // Only send changed selections. Empty selection means
      // retain the existing department/manager.
      if (toDepartment && toDepartment !== getEntityId(employee.department)) {
        payload.toDepartment = toDepartment;
      }

      if (
        toReportingManager &&
        toReportingManager !== getEntityId(employee.reportingManager)
      ) {
        payload.toReportingManager = toReportingManager;
      }

      await employeeApi.promoteEmployee(employee._id, payload);

      showToast(
        `Promotion recorded for ${employeeName}. New role: ${designation}`,
        'success'
      );

      onUpdated?.();
      onClose?.();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50';

  const labelClass =
    'block text-xs font-medium text-slate-300 mb-1.5';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promote-employee-title"
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/50 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="promote-employee-title"
                className="flex flex-wrap items-center gap-2 font-['Outfit'] text-lg font-bold text-white"
              >
                Promote Employee
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h2>

              <p className="truncate font-mono text-xs text-slate-400">
                {employee.employeeId || 'No Employee ID'} · {employeeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close promotion modal"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current role */}
        <div className="px-4 pt-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs sm:grid-cols-3">
            <div className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Current Title
              </span>
              <span className="mt-0.5 block truncate font-semibold text-slate-200">
                {currentDesignation}
              </span>
            </div>

            <div className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Department
              </span>
              <span className="mt-0.5 block truncate font-semibold text-slate-200">
                {currentDeptName}
              </span>
            </div>

            <div className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Reporting Manager
              </span>
              <span className="mt-0.5 block truncate font-semibold text-slate-200">
                {currentManagerName}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto p-4 sm:p-6"
        >
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {/* New designation */}
          <div>
            <label htmlFor="promotion-designation" className={labelClass}>
              New Promoted Designation / Title{' '}
              <span className="text-rose-400">*</span>
            </label>

            <div className="relative">
              <Award className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                id="promotion-designation"
                type="text"
                value={toDesignation}
                onChange={(event) => setToDesignation(event.target.value)}
                placeholder="e.g. Senior Project Engineer"
                maxLength={100}
                autoComplete="off"
                className={`${inputClass} pl-9`}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Department and manager */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="promotion-department" className={labelClass}>
                Department
              </label>

              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />

                <select
                  id="promotion-department"
                  value={toDepartment}
                  onChange={(event) => setToDepartment(event.target.value)}
                  className={`${inputClass} pl-9`}
                  disabled={isSubmitting || isLoadingOptions}
                >
                  <option value="">
                    Keep Existing ({currentDeptName})
                  </option>

                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                      {department.code ? ` (${department.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="promotion-manager" className={labelClass}>
                Reporting Manager
              </label>

              <div className="relative">
                <UserCheck className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />

                <select
                  id="promotion-manager"
                  value={toReportingManager}
                  onChange={(event) =>
                    setToReportingManager(event.target.value)
                  }
                  className={`${inputClass} pl-9`}
                  disabled={isSubmitting || isLoadingOptions}
                >
                  <option value="">
                    Keep Existing ({currentManagerName})
                  </option>

                  {managers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {managerName(manager)}
                      {manager.employeeId ? ` (${manager.employeeId})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoadingOptions && (
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading departments and reporting managers...
            </p>
          )}

          {/* Effective date */}
          <div>
            <label htmlFor="promotion-date" className={labelClass}>
              Promotion Effective Date{' '}
              <span className="text-rose-400">*</span>
            </label>

            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                id="promotion-date"
                type="date"
                value={promotionDate}
                onChange={(event) => setPromotionDate(event.target.value)}
                className={`${inputClass} pl-9`}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="promotion-reason" className={labelClass}>
              Reason / Performance Justification{' '}
              <span className="text-rose-400">*</span>
            </label>

            <textarea
              id="promotion-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain the employee's performance, achievements, and reason for promotion."
              maxLength={2000}
              className={`${inputClass} resize-y`}
              required
              disabled={isSubmitting}
            />

            <p className="mt-1 text-right text-[10px] text-slate-500">
              {reason.length}/2000
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="promotion-remarks" className={labelClass}>
              Remarks & Career Notes (Optional)
            </label>

            <input
              id="promotion-remarks"
              type="text"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Additional HR notes or future performance targets"
              maxLength={1000}
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3 text-xs text-slate-400">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
            <span>
              Record the promotion with its effective date and justification.
              If the promotion includes a salary increase, update the
              employee's compensation separately. Confirm that your backend
              stores the promotion history and audit record.
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingOptions}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Recording Promotion...
                </>
              ) : (
                <>
                  <Award className="h-3.5 w-3.5" />
                  Confirm & Record Promotion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
