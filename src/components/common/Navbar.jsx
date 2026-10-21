import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { healthApi } from '../../api/healthApi';
import { notificationApi } from '../../api/notificationApi';
import { leadApi } from '../../api/leadApi';
import { ROLES } from '../../utils/permissions';
import {
  Menu,
  Clock,
  LogOut,
  RefreshCw,
  Bell,
  Check,
  CheckCheck,
  Radar,
  Trash2,
  AlertTriangle,
  Target,
  FileSpreadsheet,
  Calendar,
  Banknote,
  Sparkles,
  Search,
  ChevronRight,
  HardHat,
  Users,
  Activity,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const Navbar = ({
  activeTab = 'dashboard',
  onToggleSidebar,
  onRefresh,
  onOpenQuickActions,
  onOpenCommandPalette,
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [istTime, setIstTime] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lead Intake Availability State
  const [isAvailable, setIsAvailable] = useState(user?.isAvailableForLeads ?? true);
  const [isTogglingAvail, setIsTogglingAvail] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isScanningFollowUps, setIsScanningFollowUps] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user && user.isAvailableForLeads !== undefined) {
      setIsAvailable(user.isAvailableForLeads);
    }
  }, [user]);

  const handleToggleAvailability = async () => {
    try {
      setIsTogglingAvail(true);
      const nextState = !isAvailable;
      await leadApi.toggleAvailability({ isAvailableForLeads: nextState });
      setIsAvailable(nextState);
      showToast(
        nextState ? 'You are now ACTIVE for lead distribution.' : 'You are now marked AWAY for leads.',
        nextState ? 'success' : 'warning'
      );
    } catch (e) {
      showToast('Failed to update lead availability status', 'error');
    } finally {
      setIsTogglingAvail(false);
    }
  };

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setIstTime(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic health ping
  useEffect(() => {
    const checkPing = async () => {
      try {
        await healthApi.ping();
        setIsBackendHealthy(true);
      } catch (err) {
        setIsBackendHealthy(false);
      }
    };

    checkPing();
    const interval = setInterval(checkPing, 15000);
    return () => clearInterval(interval);
  }, []);

  // Notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, countRes] = await Promise.allSettled([
        notificationApi.getMyNotifications({ limit: 12 }),
        notificationApi.getUnreadCount(),
      ]);

      if (listRes.status === 'fulfilled' && listRes.value) {
        setNotifications(listRes.value.data || []);
      }
      if (countRes.status === 'fulfilled' && countRes.value?.data) {
        setUnreadCount(countRes.value.data.unreadCount ?? 0);
      } else if (listRes.status === 'fulfilled' && listRes.value?.meta?.unreadCount !== undefined) {
        setUnreadCount(listRes.value.meta.unreadCount);
      }
    } catch (e) {
      // ignore silent errors
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const notifTimer = setInterval(fetchNotifications, 20000);
    return () => clearInterval(notifTimer);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read', 'success');
    } catch (e) {
      showToast('Could not mark all notifications as read', 'error');
    }
  };

  const handleMarkSingleRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(notifId);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      // silent
    }
  };

  const handleDeleteNotification = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      fetchNotifications();
      showToast('Notification removed', 'info');
    } catch (e) {
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleScanFollowUps = async () => {
    try {
      setIsScanningFollowUps(true);
      const res = await notificationApi.scanFollowUps();
      const dispatched = res.data?.dispatchedCount || 0;
      showToast(
        dispatched > 0
          ? `Scan complete: ${dispatched} follow-up alert(s) dispatched!`
          : 'Follow-up scan complete: All follow-ups are up to date.',
        'success'
      );
      fetchNotifications();
    } catch (e) {
      showToast('Failed to execute follow-up scan', 'error');
    } finally {
      setIsScanningFollowUps(false);
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchNotifications();
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Breadcrumb metadata lookup
  const BREADCRUMB_MAP = {
    dashboard: { group: 'Main Command Hub', title: 'Dashboard', icon: Target },
    reports: { group: 'Main Command Hub', title: 'Reports ', icon: Sparkles },
    // health: { group: 'Main Command Hub', title: 'System Diagnostics & Health', icon: Activity },
    // modules: { group: 'Main Command Hub', title: 'Modules Architecture Map', icon: Layers },
    leads: { group: 'CRM & Sales', title: 'Leads & Inquiries', icon: Target },
    proposals: { group: 'CRM & Sales', title: 'Proposals', icon: FileSpreadsheet },
    projects: { group: 'Operations & Sites', title: 'Projects & Sites Execution', icon: HardHat },
    employees: { group: 'HR & Workforce', title: 'Employees ', icon: Users },
    attendance: { group: 'HR & Workforce', title: 'Daily Attendance ', icon: Clock },
    leaves: { group: 'HR & Workforce', title: 'Employees Leaves', icon: Calendar },
    departments: { group: 'HR & Workforce', title: 'Departments', icon: Layers },
    payroll: { group: 'HR & Workforce', title: 'Payroll & Payslips', icon: Banknote },
    users: { group: 'Governance & Access', title: ' User Control', icon: Users },
    // audit: { group: 'Governance & Access', title: 'Security & Audit Logs', icon: ShieldAlert },
    profile: { group: 'Account Settings', title: 'Profile ', icon: Users },
  };

  const currentMeta = BREADCRUMB_MAP[activeTab] || {
    group: 'Speeddex CRM',
    title: 'Workspace',
    icon: HardHat,
  };

  const isManagerOrAdmin =
    user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.MANAGER;

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Context Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0 text-xs">
          <span className="hidden sm:inline font-bold uppercase tracking-wider text-slate-500 font-mono text-[11px] shrink-0">
            {currentMeta.group}
          </span>
          <ChevronRight className="hidden sm:inline w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-['Outfit'] truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            {currentMeta.title}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Trigger button */}
      {/* <div className="hidden md:flex items-centers">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition-all shadow-xs"
          title="Search actions, pages & data (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick search or jump...</span>
          <kbd className="px-1.5 py-0.2 rounded bg-slate-200 border border-slate-300 text-[10px] font-mono text-slate-700">
            ⌘K
          </kbd>
        </button>
      </div> */}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Quick Action Button in Navbar (BLUE) */}
        {/* <button
          type="button"
          onClick={onOpenQuickActions}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20"
          title="Quick Actions Control Hub"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Action</span>
        </button> */}

        {/* Sales Lead Availability Toggle */}
        {/* {user &&
          (user.role === ROLES.SALES ||
            user.role === ROLES.MANAGER ||
            user.role === ROLES.SUPER_ADMIN) && (
            <button
              onClick={handleToggleAvailability}
              disabled={isTogglingAvail}
              title={
                isAvailable
                  ? 'Leads Enabled: Receiving auto-distributed leads. Click to set Away.'
                  : 'Leads Paused: Currently set Away. Click to receive leads.'
              }
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isAvailable
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-xs'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isAvailable
                  ? 'bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.8)] animate-pulse'
                  : 'bg-slate-400'
                  }`}
              />
              <span className="text-[11px]">
                {isAvailable ? 'Leads Active' : 'Away'}
              </span>
            </button>
          )} */}

        {/* Backend live status indicator */}
        {/* <div
          title={isBackendHealthy ? 'Backend API Connected' : 'Backend API Unreachable'}
          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-default"
        >
          <span
            className={`w-2 h-2 rounded-full ${isBackendHealthy
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
              : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
          />
          <span className="hidden xl:inline text-slate-700 text-[11px] font-semibold">
            {isBackendHealthy ? 'API Online' : 'API Degraded'}
          </span>
        </div> */}

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-slate-100 transition-all"
            title="Refresh current data view"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
            />
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shadow-lg shadow-blue-600/50 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown (Clean White) */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[22rem] sm:w-[26rem] rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm font-['Outfit']">
                    Notifications
                  </span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {unreadCount} unread
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      All caught up
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isManagerOrAdmin && (
                    <button
                      onClick={handleScanFollowUps}
                      disabled={isScanningFollowUps}
                      title="Trigger automated scan for overdue & due soon lead follow-ups"
                      className="text-[11px] text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      <Radar
                        className={`w-3 h-3 ${isScanningFollowUps ? 'animate-spin text-blue-600' : 'text-blue-600'}`}
                      />
                      <span className="hidden sm:inline">Scan Follow-ups</span>
                    </button>
                  )}

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No notifications found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Updates regarding leads, approvals & payroll will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkSingleRead(n._id)}
                      className={`pt-2.5 p-2.5 rounded-xl transition-all cursor-pointer ${n.isRead
                        ? 'opacity-70 hover:opacity-100 hover:bg-slate-50'
                        : 'bg-blue-50/50 border border-blue-100 shadow-xs hover:border-blue-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {n.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!n.isRead && (
                            <button
                              onClick={(e) => handleMarkSingleRead(n._id, e)}
                              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(n._id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm font-['Outfit'] shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="hidden md:block text-left min-w-0">
              <span className="block text-xs font-bold text-slate-900 truncate max-w-[100px]">
                {user.name?.split(' ')[0] || 'User'}
              </span>
              <span className="block text-[10px] text-slate-500 font-mono leading-none">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-0.5"
              title="Logout Session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
