import React, { useState, useEffect, useCallback } from 'react';
import { departmentApi } from '../api/departmentApi';
import { DepartmentTable } from '../components/departments/DepartmentTable';
import { CreateDepartmentModal } from '../components/departments/CreateDepartmentModal';
import { EditDepartmentModal } from '../components/departments/EditDepartmentModal';
import { useToast } from '../context/ToastContext';
import { Building2 } from 'lucide-react';

export const DepartmentsPage = () => {
  const { showToast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', includeArchived: false, isActive: undefined });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const fetchDepartments = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const res = await departmentApi.getDepartments({
          page,
          limit: 10,
          search: filters.search,
          includeArchived: filters.includeArchived,
          isActive: filters.isActive,
        });

        setDepartments(res.data.departments || []);
        setPagination(res.data.pagination);
      } catch (err) {
        showToast(err.message || 'Failed to fetch departments', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [filters, showToast]
  );

  useEffect(() => {
    fetchDepartments(1);
  }, [fetchDepartments]);

  const handleOpenEdit = (dept) => {
    setSelectedDept(dept);
    setIsEditOpen(true);
  };

  const handleArchive = async (dept) => {
    const reason = window.prompt(
      `Are you sure you want to archive department "${dept.name}"?\nEmployees assigned will remain preserved.\nEnter archival reason:`,
      'Department consolidation'
    );
    if (reason === null) return; // User cancelled prompt

    try {
      const res = await departmentApi.archiveDepartment(dept._id, reason);
      showToast(res.message || `Department "${dept.name}" archived successfully`, 'success');
      fetchDepartments(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to archive department', 'error');
    }
  };

  const handleRestore = async (dept) => {
    if (!window.confirm(`Restore department "${dept.name}" to active status?`)) return;

    try {
      await departmentApi.restoreDepartment(dept._id);
      showToast(`Department "${dept.name}" restored successfully`, 'success');
      fetchDepartments(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to restore department', 'error');
    }
  };

  const handleDelete = async (dept) => {
    if (
      !window.confirm(
        `PERMANENT DELETION WARNING: Are you sure you want to permanently delete department "${dept.name}"?\nThis is only permitted if no employee has ever been assigned.`
      )
    ) {
      return;
    }

    try {
      await departmentApi.deleteDepartment(dept._id);
      showToast(`Department "${dept.name}" permanently deleted`, 'success');
      fetchDepartments(pagination.page);
    } catch (err) {
      showToast(err.message || 'Cannot delete department with active or past references', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
          {/* <Building2 className="w-4 h-4" />
          <span>Organizational Hierarchy & Divisions</span> */}
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
          Departments & Site Divisions
        </h1>
        {/* <p className="text-xs text-slate-400 mt-0.5">
          Manage corporate and site engineering departments, track allocated workforce, and oversee department archival
        </p> */}
      </div>

      {/* Main Table View */}
      <DepartmentTable
        departments={departments}
        pagination={pagination}
        isLoading={isLoading}
        filters={filters}
        onPageChange={(p) => fetchDepartments(p)}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onOpenEditModal={handleOpenEdit}
        onArchiveDepartment={handleArchive}
        onRestoreDepartment={handleRestore}
        onDeleteDepartment={handleDelete}
        onRefresh={() => fetchDepartments(pagination.page)}
      />

      {/* Modals */}
      <CreateDepartmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => fetchDepartments(1)}
      />

      <EditDepartmentModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedDept(null);
        }}
        department={selectedDept}
        onUpdated={() => fetchDepartments(pagination.page)}
      />
    </div>
  );
};
