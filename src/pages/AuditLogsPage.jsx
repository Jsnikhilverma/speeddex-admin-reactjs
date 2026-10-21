import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../api/auditApi';
import { AuditTable } from '../components/audit/AuditTable';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export const AuditLogsPage = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', action: 'ALL' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const res = await auditApi.getAuditLogs({
          page,
          limit: 20,
          search: filters.search || undefined,
          action: filters.action !== 'ALL' ? filters.action : undefined,
        });
        const logList = Array.isArray(res.data) ? res.data : (res.data?.logs || []);
        setLogs(logList);
        setPagination(
          res.pagination ||
            res.meta?.pagination || {
              page,
              limit: 20,
              total: logList.length,
              totalPages: 1,
            }
        );
      } catch (err) {
        showToast(err.message || 'Failed to load audit logs', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [filters, showToast]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Security Governance</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
          Security & Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cryptographically attributed audit events tracking user role updates, status changes, credentials rotations, and system actions
        </p>
      </div>

      {/* Audit Table */}
      <AuditTable
        logs={logs}
        pagination={pagination}
        isLoading={isLoading}
        filters={filters}
        onPageChange={(p) => fetchLogs(p)}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onActionFilterChange={(action) => setFilters((prev) => ({ ...prev, action }))}
      />
    </div>
  );
};
