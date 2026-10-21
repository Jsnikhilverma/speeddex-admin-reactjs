import React, { useState, useEffect, useCallback, useRef } from 'react';

import { employeeApi } from '../api/employeeApi';
import { departmentApi } from '../api/departmentApi';
import { CreateEmployeeModal } from '../components/employees/CreateEmployeeModal';
import { EmployeeDetailsModal } from '../components/employees/EmployeeDetailsModal';
import { StatusChangeModal } from '../components/employees/StatusChangeModal';
import { TransferEmployeeModal } from '../components/employees/TransferEmployeeModal';
import { EditEmployeeRoleModal } from '../components/employees/EditEmployeeRoleModal';
import { SalaryIncrementModal } from '../components/employees/SalaryIncrementModal';
import { SalarySlipModal } from '../components/payroll/SalarySlipModal';
import { EditBankDetailsModal } from '../components/employees/EditBankDetailsModal';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 10;

const getEmployeeName = (employee) => {
  if (!employee) return 'Unknown employee';
  if (employee.fullName) return employee.fullName;

  const firstName = employee.name?.firstName || employee.firstName || '';
  const lastName = employee.name?.lastName || employee.lastName || '';
  const name = `${firstName} ${lastName}`.trim();

  return name || employee.employeeId || 'Unknown employee';
};

const getDepartmentName = (employee) => {
  const department = employee?.department;

  if (!department) return '—';
  if (typeof department === 'string') return department;

  return department.name || department.departmentName || '—';
};

const getEmployeeStatus = (employee) =>
  employee?.status || (employee?.isArchived ? 'ARCHIVED' : '—');

const formatStatus = (status) => {
  if (!status) return '—';

  return String(status)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const isArchivedEmployee = (employee) =>
  Boolean(
    employee?.isArchived ||
    employee?.archived ||
    employee?.archivedAt ||
    String(employee?.status || '').toUpperCase() === 'ARCHIVED'
  );

const getInitials = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'E';

const getRoleName = (employee) => {
  const role = employee?.role;

  if (typeof role === 'string') return role;
  if (role?.name) return role.name;
  if (employee?.roleName) return employee.roleName;

  return '—';
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const EmployeesPage = ({ tabParams }) => {
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: tabParams?.filter || 'ALL',
    includeArchived: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isSalarySlipOpen, setIsSalarySlipOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // Selected employee records
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeForRole, setSelectedEmployeeForRole] =
    useState(null);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] =
    useState(null);
  const [selectedEmployeeForSlip, setSelectedEmployeeForSlip] =
    useState(null);
  const [selectedEmployeeForBank, setSelectedEmployeeForBank] =
    useState(null);

  const [detailsInitialTab, setDetailsInitialTab] = useState('overview');

  // Sync sidebar filters and quick actions
  useEffect(() => {
    if (tabParams?.filter !== undefined) {
      setFilters((previous) => ({
        ...previous,
        status: tabParams.filter,
      }));
    }

    if (tabParams?.autoOpenCreate) {
      setIsCreateOpen(true);
    }
  }, [tabParams]);

  // Close action menu when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setOpenActionMenuId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load departments
  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      try {
        const response = await departmentApi.getDepartments({
          limit: 100,
          isActive: true,
        });

        if (!cancelled) {
          setDepartments(response?.data?.departments || []);
        }
      } catch (error) {
        if (!cancelled) {
          showToast(
            getErrorMessage(error, 'Failed to load departments'),
            'error'
          );
        }
      }
    };

    loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // Fetch employees
  const fetchEmployees = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);

        const response = await employeeApi.getEmployees({
          page,
          limit: PAGE_SIZE,
          search: filters.search.trim(),
          department: filters.department || undefined,
          status: filters.status !== 'ALL' ? filters.status : undefined,
          includeArchived: filters.includeArchived,
        });

        const data = response?.data || {};
        const employeeList = Array.isArray(data.employees)
          ? data.employees
          : [];

        setEmployees(employeeList);

        setPagination((previous) => ({
          ...previous,
          ...(data.pagination || {}),
          page: data.pagination?.page ?? page,
          limit: data.pagination?.limit ?? PAGE_SIZE,
          total: data.pagination?.total ?? employeeList.length,
          totalPages: Math.max(
            1,
            data.pagination?.totalPages ?? 1
          ),
        }));
      } catch (error) {
        showToast(
          getErrorMessage(error, 'Failed to fetch employee records'),
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      filters.search,
      filters.department,
      filters.status,
      filters.includeArchived,
      showToast,
    ]
  );

  useEffect(() => {
    fetchEmployees(1);
  }, [fetchEmployees]);

  const refreshEmployees = useCallback(() => {
    fetchEmployees(pagination.page || 1);
  }, [fetchEmployees, pagination.page]);

  // Modal handlers
  const handleOpenDetails = (employee, tab = 'overview') => {
    setSelectedEmployee(employee);
    setDetailsInitialTab(tab);
    setIsDetailsOpen(true);
    setOpenActionMenuId(null);
  };

  const handleOpenStatus = (employee) => {
    setSelectedEmployee(employee);
    setIsStatusOpen(true);
    setOpenActionMenuId(null);
  };

  const handleOpenTransfer = (employee) => {
    setSelectedEmployee(employee);
    setIsTransferOpen(true);
    setOpenActionMenuId(null);
  };

  const handleOpenEditRole = (employee) => {
    setSelectedEmployeeForRole(employee);
    setIsEditRoleOpen(true);
    setOpenActionMenuId(null);
  };

  const handleOpenSalaryModal = (employee) => {
    setSelectedEmployeeForSalary(employee);
    setIsSalaryModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleOpenSalarySlipModal = (employee) => {
    setSelectedEmployeeForSlip(employee);
    setIsSalarySlipOpen(true);
    setOpenActionMenuId(null);
  };

  const handleOpenBankModal = (employee) => {
    setSelectedEmployeeForBank(employee);
    setIsBankModalOpen(true);
    setOpenActionMenuId(null);
  };

  // Archive employee
  const handleArchive = async (employee) => {
    const name = getEmployeeName(employee);

    const reason = window.prompt(
      `Archive employee "${name}" (${employee.employeeId || 'No employee ID'})?\nEnter the reason:`,
      'End of contract / resignation'
    );

    if (reason === null) return;

    if (!reason.trim()) {
      showToast('Please enter an archive reason', 'error');
      return;
    }

    setOpenActionMenuId(null);

    try {
      const response = await employeeApi.archiveEmployee(
        employee._id,
        reason.trim()
      );

      showToast(
        response?.message || 'Employee archived successfully',
        'success'
      );

      await refreshEmployees();
    } catch (error) {
      showToast(
        getErrorMessage(error, 'Failed to archive employee'),
        'error'
      );
    }
  };

  // Restore employee
  const handleRestore = async (employee) => {
    const name = getEmployeeName(employee);

    if (
      !window.confirm(
        `Restore employee "${name}" from the archive?`
      )
    ) {
      return;
    }

    setOpenActionMenuId(null);

    try {
      await employeeApi.restoreEmployee(employee._id);

      showToast('Employee restored successfully', 'success');

      await refreshEmployees();
    } catch (error) {
      showToast(
        getErrorMessage(error, 'Failed to restore employee'),
        'error'
      );
    }
  };

  // Permanently delete employee
  const handleDelete = async (employee) => {
    const name = getEmployeeName(employee);

    const confirmed = window.confirm(
      `PERMANENT DELETION WARNING\n\n` +
      `Delete "${name}" (${employee.employeeId || 'No employee ID'}) permanently?\n\n` +
      `Deletion may be blocked if historical salary, attendance, lead, or audit records reference this employee. Consider archiving instead.`
    );

    if (!confirmed) return;

    setOpenActionMenuId(null);

    try {
      await employeeApi.deleteEmployee(employee._id);

      showToast('Employee record permanently deleted', 'success');

      await refreshEmployees();
    } catch (error) {
      showToast(
        getErrorMessage(
          error,
          'Deletion blocked: this employee may be referenced in historical records. Archive instead.'
        ),
        'error'
      );
    }
  };

  const setFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      status: tabParams?.filter || 'ALL',
      includeArchived: false,
    });
  };

  const totalPages = Math.max(
    1,
    Number(pagination.totalPages) || 1
  );

  const currentPage = Math.min(
    Math.max(1, Number(pagination.page) || 1),
    totalPages
  );

  const totalRecords = Number(pagination.total) || 0;

  const startRecord =
    totalRecords === 0
      ? 0
      : (currentPage - 1) * (pagination.limit || PAGE_SIZE) + 1;

  const endRecord = Math.min(
    currentPage * (pagination.limit || PAGE_SIZE),
    totalRecords
  );

  // Reusable dropdown action
  const renderAction = (
    label,
    description,
    onClick,
    danger = false
  ) => (
    <button
      key={label}
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${danger
        ? 'text-red-700 hover:bg-red-50'
        : 'text-gray-800 hover:bg-gray-100'
        }`}
    >
      <span className="block text-sm font-semibold">{label}</span>

      <span
        className={`mt-0.5 block whitespace-normal text-xs leading-4 ${danger ? 'text-red-600' : 'text-gray-500'
          }`}
      >
        {description}
      </span>
    </button>
  );

  return (
    <div className="space-y-6 bg-white text-gray-900">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-950">
            Employee Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Manage employee records, roles, salary, bank details,
            transfers and employment status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          + Add Employee
        </button>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="employee-search"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700"
            >
              Search employees
            </label>

            <input
              id="employee-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilter('search', event.target.value)
              }
              placeholder="Name, employee ID..."
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div>
            <label
              htmlFor="employee-department"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700"
            >
              Department
            </label>

            <select
              id="employee-department"
              value={filters.department}
              onChange={(event) =>
                setFilter('department', event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            >
              <option value="">All departments</option>

              {departments.map((department) => {
                const departmentId =
                  department._id || department.id || department.name;

                return (
                  <option
                    key={departmentId}
                    value={department._id || department.id || ''}
                  >
                    {department.name ||
                      department.departmentName ||
                      'Unnamed department'}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="employee-status"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700"
            >
              Employment status
            </label>

            <select
              id="employee-status"
              value={filters.status}
              onChange={(event) =>
                setFilter('status', event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex flex-col justify-end gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.includeArchived}
                onChange={(event) =>
                  setFilter('includeArchived', event.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 accent-gray-900"
              />

              Include archived employees
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-sm font-semibold text-gray-800 underline decoration-gray-300 underline-offset-4 hover:text-black"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Employee table */}
      <section className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Employee records
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Select Actions to view available employee operations.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshEmployees}
            disabled={isLoading}
            className="self-start rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            {isLoading ? 'Refreshing…' : 'Refresh records'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3 font-bold sm:px-5">
                  Employee
                </th>
                <th className="px-4 py-3 font-bold">Employee ID</th>
                <th className="px-4 py-3 font-bold">Department</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold sm:px-5">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center text-sm text-gray-600"
                  >
                    Loading employee records...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm font-bold text-gray-900">
                      No employees found
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Try changing your filters or add a new employee.
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(true)}
                      className="mt-4 rounded-lg bg-gray-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-black"
                    >
                      Add employee
                    </button>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const name = getEmployeeName(employee);
                  const archived = isArchivedEmployee(employee);
                  const employeeKey =
                    employee._id || employee.employeeId;

                  return (
                    <tr
                      key={employeeKey}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-800">
                            {getInitials(name)}
                          </div>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(employee)}
                              className="block max-w-[240px] truncate text-left text-sm font-bold text-gray-900 hover:text-gray-600"
                              title="View employee details"
                            >
                              {name}
                            </button>

                            <p className="mt-1 max-w-[240px] truncate text-xs text-gray-500">
                              {employee.email ||
                                employee.contact?.email ||
                                'No email provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-700">
                        {employee.employeeId || '—'}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {getDepartmentName(employee)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {getRoleName(employee)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${archived
                            ? 'border-gray-300 bg-gray-100 text-gray-700'
                            : ['ACTIVE', 'CONFIRMED'].includes(
                              String(
                                employee.status || ''
                              ).toUpperCase()
                            )
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                        >
                          {formatStatus(getEmployeeStatus(employee))}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right sm:px-5">
                        <div
                          className="relative inline-block text-left"
                          ref={
                            openActionMenuId === employeeKey
                              ? actionMenuRef
                              : null
                          }
                        >
                          <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={openActionMenuId === employeeKey}
                            onClick={() =>
                              setOpenActionMenuId((current) =>
                                current === employeeKey ? null : employeeKey
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                          >
                            Actions
                            <span aria-hidden="true" className="text-xs text-gray-500">
                              {openActionMenuId === employeeKey ? '▲' : '▼'}
                            </span>
                          </button>

                          {openActionMenuId === employeeKey && (
                            <div
                              role="menu"
                              aria-label={`Actions for ${name}`}
                              className="absolute right-0 z-50 mt-2 max-h-[min(70vh,520px)] w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 text-left shadow-xl shadow-gray-300/50"
                            >
                              <div className="border-b border-gray-200 px-3 py-2">
                                <p className="truncate text-xs font-bold uppercase tracking-wide text-gray-500">
                                  {name}
                                </p>
                              </div>

                              {renderAction(
                                'View employee details',
                                'View profile, employment information and records.',
                                () => handleOpenDetails(employee)
                              )}

                              {renderAction(
                                'Change employment status',
                                'Update this employee’s employment status.',
                                () => handleOpenStatus(employee)
                              )}

                              {renderAction(
                                'Transfer employee',
                                'Open the employee transfer workflow.',
                                () => handleOpenTransfer(employee)
                              )}

                              {renderAction(
                                'Edit employee role',
                                'Change the employee role or assigned access.',
                                () => handleOpenEditRole(employee)
                              )}

                              {renderAction(
                                'Salary increment',
                                'Open the salary increment form for this employee.',
                                () => handleOpenSalaryModal(employee)
                              )}

                              {renderAction(
                                'View salary slip',
                                'Open salary slip options for this employee.',
                                () => handleOpenSalarySlipModal(employee)
                              )}

                              {renderAction(
                                'Edit bank details',
                                'Review or update the employee bank information.',
                                () => handleOpenBankModal(employee)
                              )}

                              <div className="my-1 border-t border-gray-200" />




                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-gray-600">
            Showing{' '}
            <span className="font-bold text-gray-900">{startRecord}</span>
            {' '}to{' '}
            <span className="font-bold text-gray-900">{endRecord}</span>
            {' '}of{' '}
            <span className="font-bold text-gray-900">{totalRecords}</span>
            {' '}employees
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchEmployees(currentPage - 1)}
              disabled={isLoading || currentPage <= 1}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="min-w-[92px] text-center text-xs font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => fetchEmployees(currentPage + 1)}
              disabled={isLoading || currentPage >= totalPages}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Create employee */}
      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchEmployees(1);
        }}
      />

      {/* Employee details */}
      <EmployeeDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedEmployee(null);
          setDetailsInitialTab('overview');
        }}
        employeeId={selectedEmployee?._id}
        initialTab={detailsInitialTab}
        onOpenEditRoleModal={handleOpenEditRole}
        onOpenSalarySlipModal={handleOpenSalarySlipModal}
        onUpdated={refreshEmployees}
      />

      {/* Salary increment */}
      <SalaryIncrementModal
        isOpen={isSalaryModalOpen}
        onClose={() => {
          setIsSalaryModalOpen(false);
          setSelectedEmployeeForSalary(null);
        }}
        employee={selectedEmployeeForSalary}
        onIncremented={refreshEmployees}
      />

      {/* Salary slip */}
      <SalarySlipModal
        isOpen={isSalarySlipOpen}
        onClose={() => {
          setIsSalarySlipOpen(false);
          setSelectedEmployeeForSlip(null);
        }}
        initialEmployee={selectedEmployeeForSlip}
      />

      {/* Edit role */}
      <EditEmployeeRoleModal
        isOpen={isEditRoleOpen}
        onClose={() => {
          setIsEditRoleOpen(false);
          setSelectedEmployeeForRole(null);
        }}
        employee={selectedEmployeeForRole}
        onRoleUpdated={refreshEmployees}
      />

      {/* Change status */}
      <StatusChangeModal
        isOpen={isStatusOpen}
        onClose={() => {
          setIsStatusOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onUpdated={refreshEmployees}
      />

      {/* Transfer employee */}
      <TransferEmployeeModal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onUpdated={refreshEmployees}
      />

      {/* Bank details */}
      <EditBankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => {
          setIsBankModalOpen(false);
          setSelectedEmployeeForBank(null);
        }}
        employee={selectedEmployeeForBank}
        onUpdated={refreshEmployees}
      />
    </div>
  );
};

export default EmployeesPage;