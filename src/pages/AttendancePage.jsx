import React, { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import { departmentApi } from '../api/departmentApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/permissions';
import { LiveClockWidget } from '../components/attendance/LiveClockWidget';
import { AttendanceTable } from '../components/attendance/AttendanceTable';
import { CloseForgottenSessionModal } from '../components/attendance/CloseForgottenSessionModal';
import { PageHeaderGuide } from '../components/common/PageHeaderGuide';
import {
  Clock,
  Users,
  Building2,
  Calendar,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';

export const AttendancePage = ({ tabParams }) => {
  const { user, isSuperAdmin, hasRole } = useAuth();
  const { showToast } = useToast();

  const canManage = isSuperAdmin || hasRole(ROLES.HR, ROLES.MANAGER);
  const isHRorSuperAdmin = isSuperAdmin || hasRole(ROLES.HR);

  const [activeTab, setActiveTab] = useState(tabParams?.subTab || 'my'); // 'my' | 'team' | 'all'
  const [todayData, setTodayData] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [teamRecords, setTeamRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    dateStr: new Date().toISOString().slice(0, 10),
    department: '',
    status: 'ALL',
    search: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isPunchLoading, setIsPunchLoading] = useState(false);
  const [forgottenSessionId, setForgottenSessionId] = useState(null);

  // Load departments for filter
  useEffect(() => {
    departmentApi
      .getDepartments({ limit: 100, isActive: true })
      .then((res) => setDepartments(res.data.departments || []))
      .catch(() => { });
  }, []);

  // Fetch today's live status
  const fetchMyToday = useCallback(async () => {
    try {
      const res = await attendanceApi.getMyToday();
      setTodayData(res.data);
    } catch (err) {
      console.warn('Today attendance fetch error:', err);
    }
  }, []);

  // Fetch active tab data
  const fetchData = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);

        if (activeTab === 'my') {
          const res = await attendanceApi.getMyHistory({ page, limit: 15 });
          const records = Array.isArray(res.data) ? res.data : (res.data?.records || []);
          setHistoryRecords(records);
          setPagination(res.meta?.pagination || res.data?.pagination || { page: 1, limit: 15, total: records.length, totalPages: 1 });
        } else if (activeTab === 'team') {
          const res = await attendanceApi.getTeamAttendance({
            dateStr: filters.dateStr,
            page,
            limit: 50,
          });
          const records = res.data?.records || (Array.isArray(res.data) ? res.data : []);
          setTeamRecords(records);
        } else if (activeTab === 'all') {
          const res = await attendanceApi.getAllAttendance({
            page,
            limit: 20,
            dateStr: filters.dateStr || undefined,
            department: filters.department || undefined,
            status: filters.status !== 'ALL' ? filters.status : undefined,
            search: filters.search || undefined,
          });
          const records = Array.isArray(res.data) ? res.data : (res.data?.records || []);
          setAllRecords(records);
          setPagination(res.meta?.pagination || res.data?.pagination || { page: 1, limit: 20, total: records.length, totalPages: 1 });
        }
      } catch (err) {
        showToast(err.message || 'Failed to fetch attendance data', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [activeTab, filters, showToast]
  );

  useEffect(() => {
    fetchMyToday();
  }, [fetchMyToday]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Handlers for clock-in / out / breaks
  const handleCheckIn = async ({ locationNotes }) => {
    try {
      setIsPunchLoading(true);
      const res = await attendanceApi.checkIn({ locationNotes });
      showToast(res.message || 'Clocked in successfully!', 'success');
      fetchMyToday();
      fetchData(1);
    } catch (err) {
      showToast(err.message || 'Failed to clock in', 'error');
    } finally {
      setIsPunchLoading(false);
    }
  };

  const handleCheckOut = async ({ remarks }) => {
    try {
      setIsPunchLoading(true);
      const res = await attendanceApi.checkOut({ remarks });
      showToast(res.message || 'Clocked out successfully!', 'success');
      fetchMyToday();
      fetchData(1);
    } catch (err) {
      showToast(err.message || 'Failed to clock out', 'error');
    } finally {
      setIsPunchLoading(false);
    }
  };

  const handleStartBreak = async ({ breakType, remarks }) => {
    try {
      setIsPunchLoading(true);
      const res = await attendanceApi.startBreak({ breakType, remarks });
      showToast(res.message || 'Break started', 'success');
      fetchMyToday();
      fetchData(1);
    } catch (err) {
      showToast(err.message || 'Failed to start break', 'error');
    } finally {
      setIsPunchLoading(false);
    }
  };

  const handleEndBreak = async ({ remarks }) => {
    try {
      setIsPunchLoading(true);
      const res = await attendanceApi.endBreak({ remarks });
      showToast(res.message || 'Break ended. Welcome back!', 'success');
      fetchMyToday();
      fetchData(1);
    } catch (err) {
      showToast(err.message || 'Failed to end break', 'error');
    } finally {
      setIsPunchLoading(false);
    }
  };

  const handleSessionClosed = async (sessionId, { reason }) => {
    try {
      const res = await attendanceApi.closeForgottenSession(sessionId, { reason });
      showToast(res.message || 'Forgotten session closed and audited', 'success');
      fetchData(pagination.page);
    } catch (err) {
      showToast(err.message || 'Failed to close session', 'error');
    }
  };

  // Sync with Sidebar sub-links
  useEffect(() => {
    if (tabParams?.subTab) {
      setActiveTab(tabParams.subTab);
    }
  }, [tabParams]);

  return (
    <div className="space-y-6">
      {/* Contextual User Experience Guide */}


      {/* Header */}
      <div>

        <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
          Attendance & Shift Management
        </h1>

      </div>

      {/* Flagship Live Clock Widget */}
      <LiveClockWidget
        todayData={todayData}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onStartBreak={handleStartBreak}
        onEndBreak={handleEndBreak}
        isLoading={isPunchLoading}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'my'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Attendance Log</span>
          </button>

          {canManage && (
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'team'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team & Site Roster</span>
            </button>
          )}

          {isHRorSuperAdmin && (
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Roster (HR Master)</span>
            </button>
          )}
        </div>

        {/* Filters (When viewing Team or All) */}
        {activeTab !== 'my' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              value={filters.dateStr}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateStr: e.target.value }))}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500/50"
            />

            {activeTab === 'all' && (
              <>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </>
            )}

            <button
              onClick={() => fetchData(1)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title="Refresh Records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Roster Live Stats Header (When viewing Team or Company Master) */}
      {activeTab !== 'my' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Workforce</span>
            <p className="text-xl font-black text-white font-['Outfit'] mt-0.5">
              {(activeTab === 'all' ? allRecords : teamRecords).length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Present on Site</span>
            <p className="text-xl font-black text-emerald-300 font-['Outfit'] mt-0.5">
              {(activeTab === 'all' ? allRecords : teamRecords).filter((r) => r.status === 'PRESENT' || r.status === 'HALF_DAY').length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Absent Today</span>
            <p className="text-xl font-black text-rose-300 font-['Outfit'] mt-0.5">
              {(activeTab === 'all' ? allRecords : teamRecords).filter((r) => r.status === 'ABSENT').length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">On Approved Leave</span>
            <p className="text-xl font-black text-blue-300 font-['Outfit'] mt-0.5">
              {(activeTab === 'all' ? allRecords : teamRecords).filter((r) => r.status === 'ON_LEAVE').length}
            </p>
          </div>
        </div>
      )}

      {/* Content Table based on active tab */}
      {activeTab === 'my' && (
        <AttendanceTable
          records={historyRecords}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={(p) => fetchData(p)}
          canManage={false}
        />
      )}

      {activeTab === 'team' && (
        <AttendanceTable
          records={teamRecords}
          pagination={{ page: 1, totalPages: 1, total: teamRecords.length }}
          isLoading={isLoading}
          onPageChange={() => { }}
          onCloseForgottenSession={(id) => setForgottenSessionId(id)}
          canManage={true}
        />
      )}

      {activeTab === 'all' && (
        <AttendanceTable
          records={allRecords}
          pagination={pagination}
          isLoading={isLoading}
          onPageChange={(p) => fetchData(p)}
          onCloseForgottenSession={(id) => setForgottenSessionId(id)}
          canManage={true}
        />
      )}

      {/* Close Forgotten Session Modal */}
      <CloseForgottenSessionModal
        isOpen={!!forgottenSessionId}
        onClose={() => setForgottenSessionId(null)}
        sessionId={forgottenSessionId}
        onSessionClosed={handleSessionClosed}
      />
    </div>
  );
};
