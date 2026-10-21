import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, canAccessModule, userHasAnyPermission } from '../../utils/permissions';
import { leaveApi } from '../../api/leaveApi';
import { leadApi } from '../../api/leadApi';
import { healthApi } from '../../api/healthApi';

import logo from '../../assets/loge.png';

import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Calendar,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Target,
  FileSpreadsheet,
  BarChart3,
  Banknote,
  Search,
  Plus,
  UserCheck,
  Command,
  Circle,
  FolderKanban,
  ShieldCheck,
  BriefcaseBusiness,
  Check,
  SearchX,
  Globe,
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  onOpenQuickActions,
  onOpenCommandPalette,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, isSuperAdmin, hasRole, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    leads: false,
    proposals: false,
    projects: false,
    employees: false,
    attendance: false,
    leaves: false,
    payroll: false,
  });

  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [followUpAlertsCount, setFollowUpAlertsCount] = useState(0);
  const [isBackendHealthy, setIsBackendHealthy] = useState(null);

  // Automatically expand the active navigation section.
  useEffect(() => {
    if (!activeTab) return;

    setExpandedSections((prev) => {
      if (prev[activeTab] === undefined || prev[activeTab]) {
        return prev;
      }

      return { ...prev, [activeTab]: true };
    });
  }, [activeTab]);

  // Fetch live sidebar counters and backend health.
  useEffect(() => {
    let mounted = true;

    const fetchBadges = async () => {
      const [leavesRes, alertsRes, healthRes] =
        await Promise.allSettled([
          leaveApi.getPendingApprovals(),
          leadApi.getFollowUpAlerts(),
          healthApi.ping(),
        ]);

      if (!mounted) return;

      if (leavesRes.status === 'fulfilled') {
        const data = leavesRes.value?.data;
        const count = Array.isArray(data)
          ? data.length
          : Number(
            data?.totalPending ??
            data?.count ??
            data?.data?.totalPending ??
            0
          );

        setPendingLeavesCount(
          Number.isFinite(count) ? Math.max(0, count) : 0
        );
      }

      if (alertsRes.status === 'fulfilled') {
        const data = alertsRes.value?.data;
        const overdue = Array.isArray(data?.overdue)
          ? data.overdue.length
          : Number(data?.overdueCount ?? 0);

        setFollowUpAlertsCount(
          Number.isFinite(overdue) ? Math.max(0, overdue) : 0
        );
      }

      setIsBackendHealthy(healthRes.status === 'fulfilled');
    };

    fetchBadges();

    const intervalId = setInterval(fetchBadges, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const toggleSection = useCallback((id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const navGroups = useMemo(
    () => [
      {
        id: 'main',
        label: 'Workspace',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            description: 'Business overview',
            icon: LayoutDashboard,
          },
          {
            id: 'reports',
            label: 'Reports & Analytics',
            description: 'Business performance',
            icon: BarChart3,
          },
        ],
      },
      {
        id: 'sales',
        label: 'CRM & Sales',
        items: [
          {
            id: 'leads',
            label: 'Leads & Inquiries',
            description: 'Clients and follow-ups',
            icon: Target,
            badge:
              followUpAlertsCount > 0
                ? followUpAlertsCount
                : null,
            badgeTone: 'blue',
            // subLinks: [
            //   { label: 'All Inquiries', params: { filter: '' }, permissions: ['LEADS_READ_ALL'] },
            //   {
            //     label: 'New Inquiries',
            //     params: { filter: 'NEW' },
            //     permissions: ['LEADS_READ_ALL', 'LEADS_READ_ASSIGNED'],
            //   },
            //   {
            //     label: 'Follow-ups Due',
            //     params: { filter: 'FOLLOW_UP' },
            //     permissions: ['FOLLOWUPS_MANAGE_ALL', 'FOLLOWUPS_MANAGE_OWN', 'LEADS_READ_ALL', 'LEADS_READ_ASSIGNED'],
            //   },
            //   {
            //     label: 'Won Inquiries',
            //     params: { filter: 'WON' },
            //     permissions: ['LEADS_READ_ALL', 'LEADS_READ_ASSIGNED'],
            //   },
            // ],
          },
          {
            id: 'proposals',
            label: 'Proposals & BOQ',
            description: 'Estimates and quotations',
            icon: FileSpreadsheet,
            // subLinks: [
            //   { label: 'All Proposals', params: { filter: '' }, permissions: ['PROPOSALS_READ'] },
            //   {
            //     label: 'Draft Quotes',
            //     params: { filter: 'DRAFT' },
            //     permissions: ['PROPOSALS_READ', 'PROPOSALS_CREATE'],
            //   },
            //   {
            //     label: 'Approved Quotes',
            //     params: { filter: 'ACCEPTED' },
            //     permissions: ['PROPOSALS_READ', 'PROPOSALS_APPROVE'],
            //   },
            // ],
          },
        ],
      },
      {
        id: 'operations',
        label: 'Project Operations',
        items: [
          {
            id: 'projects',
            label: 'Projects & Sites',
            description: 'Site execution and progress',
            icon: FolderKanban,
            // subLinks: [
            //   { label: 'All Projects', params: { filter: '' }, permissions: ['PROJECTS_READ_ALL', 'PROJECTS_READ_ASSIGNED'] },
            //   {
            //     label: 'In Progress',
            //     params: { filter: 'IN_PROGRESS' },
            //     permissions: ['PROJECTS_READ_ALL', 'PROJECTS_READ_ASSIGNED'],
            //   },
            //   {
            //     label: 'Completed Projects',
            //     params: { filter: 'COMPLETED' },
            //     permissions: ['PROJECTS_READ_ALL', 'PROJECTS_READ_ASSIGNED'],
            //   },
            // ],
          },
        ],
      },
      {
        id: 'website',
        label: 'Website & Marketing',
        items: [
          {
            id: 'cms',
            label: 'Website CMS',
            description: 'Banners, projects & reviews',
            icon: Globe,
          },
        ],
      },
      {
        id: 'workforce',
        label: 'People & Workforce',
        items: [
          {
            id: 'employees',
            label: 'Employees Directory',
            description: 'Staff and employee records',
            icon: Users,
            // subLinks: [
            //   { label: 'All Personnel', params: { filter: 'ALL' }, permissions: ['EMPLOYEES_READ', 'EMPLOYEES_MANAGE'] },
            //   { label: 'Active Workforce', params: { filter: 'ACTIVE' }, permissions: ['EMPLOYEES_READ', 'EMPLOYEES_MANAGE'] },
            // ],
          },
          {
            id: 'attendance',
            label: 'Daily Attendance',
            description: 'Clock-in and timesheets',
            icon: Clock,
            // subLinks: [
            //   { label: 'My Clock & Punch', params: { subTab: 'my' }, permissions: ['ATTENDANCE_CHECKIN'] },
            //   { label: 'Team Daily Roster', params: { subTab: 'team' }, permissions: ['ATTENDANCE_READ_ALL', 'ATTENDANCE_MANAGE'] },
            //   { label: 'All Records', params: { subTab: 'all' }, permissions: ['ATTENDANCE_READ_ALL', 'ATTENDANCE_MANAGE'] },
            // ],
          },
          {
            id: 'leaves',
            label: 'Leave Management',
            description: 'Requests and approvals',
            icon: Calendar,
            badge:
              pendingLeavesCount > 0
                ? pendingLeavesCount
                : null,
            badgeTone: 'rose',
            // subLinks: [
            //   {
            //     label: 'Pending Approvals',
            //     params: { subTab: 'pending' },
            //     permissions: ['LEAVES_APPROVE_HR', 'LEAVES_READ_ALL'],
            //   },
            //   { label: 'My Leaves', params: { subTab: 'my' }, permissions: ['LEAVES_APPLY'] },
            //   {
            //     label: 'Company History',
            //     params: { subTab: 'all' },
            //     permissions: ['LEAVES_READ_ALL'],
            //   },
            // ],
          },
          {
            id: 'departments',
            label: 'Departments',
            description: 'Teams and organization',
            icon: Building2,
          },
          // {
          //   id: 'payroll',
          //   label: 'Payroll & Payslips',
          //   description: 'Salary and payroll records',
          //   icon: Banknote,
          //   subLinks: [
          //     {
          //       label: 'Company Payroll Run',
          //       params: { subTab: 'company' },
          //       permissions: ['PAYROLL_MANAGE', 'PAYROLL_READ_ALL'],
          //     },
          //     {
          //       label: 'My Monthly Payslips',
          //       params: { subTab: 'my-payslips' },
          //       permissions: ['PAYROLL_READ_ALL', 'PAYROLL_MANAGE', 'SALARY_READ'],
          //     },
          //   ],
          // },
        ],
      },
      {
        id: 'governance',
        label: 'Administration',
        items: [
          // {
          //   id: 'users',
          //   label: 'User Management',
          //   description: 'Roles and permissions',
          //   icon: ShieldCheck,
          // },
          {
            id: 'profile',
            label: 'Profile & Security',
            description: 'Personal settings and security',
            icon: UserCheck,
          },
        ],
      },
    ],
    [followUpAlertsCount, pendingLeavesCount]
  );

  // Permission & Role-based filtering and searchable navigation.
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return navGroups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
            if (isSuperAdmin) return true;
            return canAccessModule(user, item.id);
          })
          .map((item) => {
            // Filter sublinks according to permissions if specified
            let subLinks = item.subLinks;
            if (subLinks && !isSuperAdmin) {
              subLinks = subLinks.filter((link) => {
                if (!link.permissions || link.permissions.length === 0) return true;
                return userHasAnyPermission(user, ...link.permissions);
              });
            }

            const itemWithFilteredLinks = {
              ...item,
              subLinks: subLinks || [],
            };

            if (!query) return itemWithFilteredLinks;

            const itemMatches =
              item.label.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query);

            const matchingLinks = itemWithFilteredLinks.subLinks?.filter((link) =>
              link.label.toLowerCase().includes(query)
            );

            if (itemMatches) return itemWithFilteredLinks;

            if (matchingLinks?.length) {
              return {
                ...itemWithFilteredLinks,
                subLinks: matchingLinks,
              };
            }

            return null;
          })
          .filter(Boolean),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, searchQuery, isSuperAdmin, user]);

  const handleNavigate = useCallback(
    (tabId, params) => {
      onSelectTab(tabId, params);
      onClose?.();
    },
    [onSelectTab, onClose]
  );

  const sidebarWidth = isCollapsed ? 'lg:w-[76px]' : 'lg:w-[280px]';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[280px] flex-col
          overflow-hidden
          border-r border-slate-700/50
          bg-[#0d1117] text-slate-100
          shadow-2xl shadow-black/60
          transition-[width,transform] duration-300 ease-in-out
          ${sidebarWidth}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Brand header */}
        <div
          className={`
            flex h-[76px] shrink-0 items-center
            border-b border-slate-800/80 bg-[#121821]
            ${isCollapsed ? 'justify-center px-2' : 'justify-between px-5'}
          `}
        >
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            title="Go to Dashboard"
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="min-w-0 mt-2">
              <img
                src={logo}
                alt="Speeddex Construction"
                className="h-70 w-99 max-w-[220px] object-contain object-left filter drop-shadow-md"
              />
            </div>
          </button>
        </div>

        {/* Quick actions */}
        {/* <div className="shrink-0 px-3.5 pt-4">
          <button
            type="button"
            onClick={onOpenQuickActions}
            title="Quick Actions"
            className={`
              group relative flex w-full items-center overflow-hidden
              rounded-xl border border-blue-400/30
              bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600
              text-white shadow-md shadow-blue-900/50
              transition-all duration-200
              hover:border-blue-300/50 hover:from-blue-500 hover:to-indigo-500
              active:scale-[0.98]
              ${isCollapsed
                ? 'h-11 justify-center px-0'
                : 'justify-between px-3.5 py-3'}
            `}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-inner">
                <Plus size={17} strokeWidth={2.8} />
              </span>

              {!isCollapsed && (
                <span className="text-xs font-bold tracking-wider text-white">
                  QUICK ACTIONS
                </span>
              )}
            </span>

            {!isCollapsed && (
              <span className="flex items-center gap-1 rounded-md border border-white/20 bg-black/20 px-1.5 py-1 text-[10px] font-semibold text-blue-100 shadow-sm">
                <Command size={10} />
                K
              </span>
            )}
          </button>
        </div> */}

        {/* Search */}


        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="sidebar-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3.5 pb-4 pt-4"
        >
          {filteredGroups.length === 0 && (
            <div className="flex flex-col items-center px-3 py-12 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50">
                <SearchX size={20} className="text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                No results found
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Try another search term.
              </p>
            </div>
          )}

          {filteredGroups.map((group) => (
            <section
              key={group.id}
              className="mb-5 last:mb-0"
            >
              {!isCollapsed && (
                <div className="mb-2 flex items-center justify-between px-3 py-1 rounded-md bg-white text-black">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-black">
                    {group.label}
                  </h2>
                  <span className="text-[10px] font-semibold text-white">
                    {String(group.items.length).padStart(2, '0')}
                  </span>
                </div>
              )}

              {isCollapsed && (
                <div className="mx-auto mb-3 mt-1 h-px w-8 bg-slate-700/60" />
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const hasSubLinks = Boolean(item.subLinks?.length);
                  const isExpanded =
                    Boolean(expandedSections[item.id]) ||
                    Boolean(searchQuery.trim());

                  return (
                    <div key={item.id}>
                      {/* Main navigation item */}
                      <div
                        className={`
                          group/item relative flex items-center
                          rounded-xl transition-all duration-200
                          ${isActive
                            ? 'bg-blue-600/20 ring-1 ring-inset ring-blue-400/40 shadow-sm'
                            : 'hover:bg-slate-800/60'}
                        `}
                      >
                        {isActive && (
                          <span className="absolute bottom-1.5 left-0 top-1.5 w-[3.5px] rounded-r-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isCollapsed && hasSubLinks) {
                              handleNavigate(item.id);
                              return;
                            }

                            handleNavigate(item.id);
                          }}
                          title={
                            isCollapsed
                              ? item.label
                              : item.description
                          }
                          aria-current={isActive ? 'page' : undefined}
                          className={`
                            flex min-w-0 flex-1 items-center gap-3
                            rounded-xl py-2.5 text-left
                            ${isCollapsed
                              ? 'justify-center px-2.5'
                              : 'pl-3.5 pr-1'}
                            ${isActive
                              ? 'text-blue-200 font-semibold'
                              : 'text-slate-300 hover:text-white'}
                          `}
                        >
                          <span
                            className={`
                              flex h-8 w-8 shrink-0
                              items-center justify-center rounded-lg
                              transition-all duration-200
                              ${isActive
                                ? 'bg-blue-500/30 text-blue-300 shadow-sm'
                                : 'bg-slate-800/80 text-slate-400 group-hover/item:bg-slate-700 group-hover/item:text-slate-100'}
                            `}
                          >
                            <Icon
                              size={18}
                              strokeWidth={isActive ? 2.3 : 1.8}
                            />
                          </span>

                          {!isCollapsed && (
                            <span className="min-w-0 flex-1">
                              <span
                                className={`
                                  block truncate text-xs
                                  leading-4
                                  ${isActive
                                    ? 'font-bold text-blue-100'
                                    : 'font-medium text-slate-200'}
                                `}
                              >
                                {item.label}
                              </span>

                              {/* <span className="mt-0.5 block truncate text-[10px] leading-3 text-slate-400">
                                {item.description}
                              </span> */}
                            </span>
                          )}

                          {!isCollapsed && item.badge != null && (
                            <span
                              className={`
                                shrink-0 rounded-md border px-2 py-0.5
                                text-[10px] font-bold tabular-nums shadow-sm
                                ${item.badgeTone === 'rose'
                                  ? 'border-rose-400/30 bg-rose-500/20 text-rose-200'
                                  : 'border-blue-400/30 bg-blue-500/20 text-blue-200'}
                              `}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>

                        {/* Separate submenu toggle */}
                        {!isCollapsed && hasSubLinks && (
                          <button
                            type="button"
                            onClick={() => toggleSection(item.id)}
                            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label}`}
                            aria-expanded={isExpanded}
                            title={isExpanded ? 'Collapse section' : 'Expand section'}
                            className={`
                              mr-2 flex h-7 w-7 shrink-0
                              items-center justify-center rounded-lg
                              transition hover:bg-slate-700/60
                              ${isExpanded
                                ? 'text-blue-300'
                                : 'text-slate-400 hover:text-slate-200'}
                            `}
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}

                        {!isCollapsed && !hasSubLinks && (
                          <span className="mr-3.5 text-slate-500">
                            <ChevronRight size={13} />
                          </span>
                        )}
                      </div>

                      {/* Submenu */}
                      {!isCollapsed && hasSubLinks && isExpanded && (
                        <div className="relative ml-4 mt-1 space-y-1 border-l-2 border-slate-700/80 pb-1 pl-4 pt-1">
                          {item.subLinks.map((link, index) => (
                            <button
                              key={`${item.id}-${link.label}-${index}`}
                              type="button"
                              onClick={() =>
                                handleNavigate(item.id, link.params)
                              }
                              className="
                                group/link flex w-full items-center
                                justify-between gap-2 rounded-lg
                                px-2.5 py-2 text-left
                                text-[11px] font-medium
                                text-slate-300 transition-all
                                hover:bg-blue-600/15
                                hover:text-blue-200
                              "
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <Circle
                                  size={6}
                                  className="shrink-0 text-slate-500 transition-colors group-hover/link:fill-blue-400 group-hover/link:text-blue-400"
                                />
                                <span className="truncate">
                                  {link.label}
                                </span>
                              </span>

                              <ChevronRight
                                size={12}
                                className="shrink-0 text-slate-500 opacity-0 transition-all group-hover/link:translate-x-0.5 group-hover/link:opacity-100 group-hover/link:text-blue-300"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        {/* User profile and logout */}
        <div className="shrink-0 border-t border-slate-800 bg-[#121821] p-3">
          <div
            className={`
              flex items-center gap-3 rounded-xl
              border border-slate-700/70 bg-[#1a212c] p-2.5 shadow-md
              ${isCollapsed ? 'justify-center p-2' : 'justify-between'}
            `}
          >
            <button
              type="button"
              onClick={() => handleNavigate('profile')}
              title={`${user?.name || 'Admin'} — Profile & Security`}
              className={`
                flex min-w-0 items-center gap-3 text-left
                ${isCollapsed ? 'justify-center' : 'flex-1'}
              `}
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-md ring-1 ring-white/20">
                {(user?.name || 'A').trim().charAt(0).toUpperCase()}
                <span
                  className={`
                    absolute -bottom-0.5 -right-0.5
                    h-3 w-3 rounded-full
                    border-2 border-[#1a212c]
                    ${isBackendHealthy === false ? 'bg-rose-400' : 'bg-emerald-400'}
                  `}
                />
              </span>

              {!isCollapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-100">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium capitalize text-slate-400">
                    <BriefcaseBusiness size={11} className="text-blue-400" />
                    {String(user?.role || 'User').replace(/_/g, ' ')}
                  </span>
                </span>
              )}
            </button>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Custom scrollbar styling */}
      <style>{`
        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #334155 transparent;
        }

        .sidebar-scrollbar::-webkit-scrollbar {
          width: 5px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #334155;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </>
  );
};

export default Sidebar;