import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/userApi';
import { UserTable } from '../components/users/UserTable';
import { AddUserModal } from '../components/users/AddUserModal';
import { EditRoleModal } from '../components/users/EditRoleModal';
import { UserDetailsModal } from '../components/users/UserDetailsModal';
import { useToast } from '../context/ToastContext';
import { Users, UserPlus, Shield } from 'lucide-react';
import { PageHeaderGuide } from '../components/common/PageHeaderGuide';

export const UsersPage = ({ tabParams }) => {
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', role: 'ALL', status: 'ALL' });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const res = await userApi.getUsers({
          page,
          limit: 10,
          search: filters.search,
          role: filters.role,
          status: filters.status,
        });
        setUsers(res.data.users || []);
        setPagination(res.data.pagination);
      } catch (err) {
        showToast(err.message || 'Failed to fetch team members', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [filters, showToast]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleOpenEditRole = (user) => {
    setSelectedUser(user);
    setIsEditRoleOpen(true);
  };

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  // Sync with Sidebar sub-links and Quick Actions
  useEffect(() => {
    if (tabParams?.autoOpenCreate) {
      setIsAddModalOpen(true);
    }
  }, [tabParams]);

  return (
    <div className="space-y-6">
      {/* Contextual User Experience Guide */}


      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>

          <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
            Team & User Management
          </h1>

        </div>
      </div>

      {/* Users Table */}
      <UserTable
        users={users}
        pagination={pagination}
        isLoading={isLoading}
        filters={filters}
        onPageChange={(p) => fetchUsers(p)}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onRoleFilterChange={(role) => setFilters((prev) => ({ ...prev, role }))}
        onStatusFilterChange={(status) => setFilters((prev) => ({ ...prev, status }))}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenEditRoleModal={handleOpenEditRole}
        onOpenDetailsModal={handleOpenDetails}
        onRefresh={() => fetchUsers(pagination.page)}
      />

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={() => fetchUsers(1)}
      />

      <EditRoleModal
        isOpen={isEditRoleOpen}
        onClose={() => {
          setIsEditRoleOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onRoleUpdated={() => fetchUsers(pagination.page)}
      />

      <UserDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};
