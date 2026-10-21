import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Target,
  HardHat,
  UserPlus,
  FileSpreadsheet,
  Clock,
  Calendar,
  ShieldAlert,
  ShieldPlus,
  Banknote,
  LayoutDashboard,
  BarChart3,
  Users,
  Building2,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { canAccessModule, userHasAnyPermission } from '../../utils/permissions';

export const CommandPalette = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerAction,
}) => {
  const { user, isSuperAdmin, hasAnyPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Define full command items
  const allItems = [
    // --- QUICK ACTIONS ---
    {
      id: 'action-lead',
      category: 'Quick Actions',
      title: 'Create New Lead / Inquiry',
      subtitle: 'Add client contact, project type & site address',
      icon: Target,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => onTriggerAction?.('lead'),
    },
    {
      id: 'action-project',
      category: 'Quick Actions',
      title: 'Start New Construction Project',
      subtitle: 'Create project site, assign project manager & budget',
      icon: HardHat,
      color: 'text-blue-400 bg-blue-500/10',
      action: () => onTriggerAction?.('project'),
    },
    {
      id: 'action-employee',
      category: 'Quick Actions',
      title: 'Add New Employee Record',
      subtitle: 'Register employee profile, department & compensation',
      icon: UserPlus,
      color: 'text-emerald-400 bg-emerald-500/10',
      action: () => onTriggerAction?.('employee'),
    },
    {
      id: 'action-proposal',
      category: 'Quick Actions',
      title: 'Create BOQ Proposal / Quote',
      subtitle: 'Draft rate estimation and schedule of finishes',
      icon: FileSpreadsheet,
      color: 'text-violet-400 bg-violet-500/10',
      action: () => onTriggerAction?.('proposal'),
    },
    {
      id: 'action-attendance',
      category: 'Quick Actions',
      title: 'Clock In / Punch Attendance',
      subtitle: 'Mark today attendance or check site working session',
      icon: Clock,
      color: 'text-cyan-400 bg-cyan-500/10',
      action: () => onTriggerAction?.('attendance'),
    },
    {
      id: 'action-leave',
      category: 'Quick Actions',
      title: 'Apply for Leave',
      subtitle: 'Submit casual or sick leave approval request',
      icon: Calendar,
      color: 'text-pink-400 bg-pink-500/10',
      action: () => onTriggerAction?.('leave'),
    },
    {
      id: 'action-user',
      category: 'Quick Actions',
      title: 'Add Team User & RBAC Login',
      subtitle: 'Create login account and set permissions',
      icon: ShieldPlus,
      color: 'text-orange-400 bg-orange-500/10',
      action: () => onTriggerAction?.('user'),
    },
    {
      id: 'action-payroll',
      category: 'Quick Actions',
      title: 'Generate Monthly Payroll',
      subtitle: 'Calculate salary slips, attendance deductions & taxes',
      icon: Banknote,
      color: 'text-teal-400 bg-teal-500/10',
      action: () => onTriggerAction?.('payroll'),
    },

    // --- MAIN PAGES ---
    {
      id: 'page-dashboard',
      category: 'Pages & Navigation',
      title: 'Dashboard Overview',
      subtitle: 'Executive KPIs, lead conversion funnel & live revenue',
      icon: LayoutDashboard,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => onNavigate?.('dashboard'),
    },
    {
      id: 'page-leads',
      category: 'Pages & Navigation',
      title: 'Leads & Inquiries',
      subtitle: 'Client inquiries, site visits, follow-up timeline',
      icon: Target,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => onNavigate?.('leads'),
    },
    {
      id: 'page-proposals',
      category: 'Pages & Navigation',
      title: 'Proposals & BOQ Quotes',
      subtitle: 'Estimation quotes, line items, revisions & approvals',
      icon: FileSpreadsheet,
      color: 'text-blue-400 bg-blue-500/10',
      action: () => onNavigate?.('proposals'),
    },
    {
      id: 'page-projects',
      category: 'Pages & Navigation',
      title: 'Projects & Sites',
      subtitle: 'Construction site execution, milestones & contractors',
      icon: HardHat,
      color: 'text-yellow-400 bg-yellow-500/10',
      action: () => onNavigate?.('projects'),
    },
    {
      id: 'page-employees',
      category: 'Pages & Navigation',
      title: 'Employees & Workforce',
      subtitle: 'Staff directory, salary versioning & private KYC docs',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/10',
      action: () => onNavigate?.('employees'),
    },
    {
      id: 'page-attendance',
      category: 'Pages & Navigation',
      title: 'Attendance & Daily Roster',
      subtitle: 'Live punch clock, overtime, daily shift records',
      icon: Clock,
      color: 'text-cyan-400 bg-cyan-500/10',
      action: () => onNavigate?.('attendance'),
    },
    {
      id: 'page-leaves',
      category: 'Pages & Navigation',
      title: 'Leaves & Approvals Queue',
      subtitle: '2-tier manager & HR leave approval matrix',
      icon: Calendar,
      color: 'text-purple-400 bg-purple-500/10',
      action: () => onNavigate?.('leaves'),
    },
    {
      id: 'page-payroll',
      category: 'Pages & Navigation',
      title: 'Payroll & Salary Slips',
      subtitle: 'Monthly pay cycles, bank disbursement & paystubs',
      icon: Banknote,
      color: 'text-emerald-400 bg-emerald-500/10',
      action: () => onNavigate?.('payroll'),
    },
    {
      id: 'page-departments',
      category: 'Pages & Navigation',
      title: 'Departments & Divisions',
      subtitle: 'Organizational hierarchy & engineering branches',
      icon: Building2,
      color: 'text-indigo-400 bg-indigo-500/10',
      action: () => onNavigate?.('departments'),
    },
    {
      id: 'page-reports',
      category: 'Pages & Navigation',
      title: 'Reports & Analytics',
      subtitle: 'Financial breakdowns, conversion reports & CSV exports',
      icon: BarChart3,
      color: 'text-emerald-400 bg-emerald-500/10',
      action: () => onNavigate?.('reports'),
    },
    {
      id: 'page-users',
      category: 'Pages & Navigation',
      title: 'User Control & Roles',
      subtitle: 'RBAC access permissions, account statuses & logins',
      icon: Users,
      color: 'text-blue-400 bg-blue-500/10',
      action: () => onNavigate?.('users'),
    },
    {
      id: 'page-health',
      category: 'Pages & Navigation',
      title: 'System Health & Server Telemetry',
      subtitle: 'MongoDB roundtrip latency, memory heaps & uptime',
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10',
      action: () => onNavigate?.('health'),
    },
    {
      id: 'page-audit',
      category: 'Pages & Navigation',
      title: 'Security & Audit Logs',
      subtitle: 'Forensic trails with actor IP addresses & diffs',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10',
      action: () => onNavigate?.('audit'),
    },
    {
      id: 'page-modules',
      category: 'Pages & Navigation',
      title: 'Modules Architecture Overview',
      subtitle: 'System modules inventory and backend API map',
      icon: Layers,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => onNavigate?.('modules'),
    },
    {
      id: 'page-profile',
      category: 'Pages & Navigation',
      title: 'My Profile & Security',
      subtitle: 'Change password, view session credentials & role',
      icon: UserCheck,
      color: 'text-slate-400 bg-slate-800',
      action: () => onNavigate?.('profile'),
    },

    // --- QUICK FILTERS & DIRECT VIEWS ---
    {
      id: 'filter-new-leads',
      category: 'Sub-Views & Filters',
      title: 'New Client Inquiries (Untouched)',
      subtitle: 'Filter leads with status = NEW',
      icon: Target,
      color: 'text-blue-400 bg-blue-500/10',
      action: () => onNavigate?.('leads', { filter: 'NEW' }),
    },
    {
      id: 'filter-followups',
      category: 'Sub-Views & Filters',
      title: 'Leads Due for Follow-up',
      subtitle: 'Overdue & today follow-up interactions',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10',
      action: () => onNavigate?.('leads', { filter: 'FOLLOW_UP' }),
    },
    {
      id: 'filter-pending-leaves',
      category: 'Sub-Views & Filters',
      title: 'Pending Leave Approvals',
      subtitle: 'Awaiting manager or HR signoff',
      icon: Calendar,
      color: 'text-pink-400 bg-pink-500/10',
      action: () => onNavigate?.('leaves', { subTab: 'pending' }),
    },
    {
      id: 'filter-my-attendance',
      category: 'Sub-Views & Filters',
      title: 'Live Clock & Today Attendance',
      subtitle: 'Biometric punch & personal timesheet',
      icon: Clock,
      color: 'text-cyan-400 bg-cyan-500/10',
      action: () => onNavigate?.('attendance', { subTab: 'my' }),
    },
    {
      id: 'filter-my-payslips',
      category: 'Sub-Views & Filters',
      title: 'My Salary Payslips',
      subtitle: 'Download monthly PDF salary statements',
      icon: Banknote,
      color: 'text-teal-400 bg-teal-500/10',
      action: () => onNavigate?.('payroll', { subTab: 'my-payslips' }),
    },
  ];

  // Filter items by permission first
  const isItemPermitted = (item) => {
    if (isSuperAdmin) return true;
    switch (item.id) {
      case 'action-lead':
        return hasAnyPermission('LEADS_CREATE', 'LEADS_UPDATE');
      case 'action-project':
        return hasAnyPermission('PROJECTS_CREATE', 'PROJECTS_UPDATE');
      case 'action-employee':
        return hasAnyPermission('EMPLOYEES_MANAGE');
      case 'action-proposal':
        return hasAnyPermission('PROPOSALS_CREATE');
      case 'action-attendance':
        return hasAnyPermission('ATTENDANCE_CHECKIN');
      case 'action-leave':
        return hasAnyPermission('LEAVES_APPLY');
      case 'action-user':
        return hasAnyPermission('USERS_CREATE', 'USERS_MANAGE_ROLES');
      case 'action-payroll':
        return hasAnyPermission('PAYROLL_MANAGE');

      case 'page-dashboard':
        return canAccessModule(user, 'dashboard');
      case 'page-leads':
        return canAccessModule(user, 'leads');
      case 'page-proposals':
        return canAccessModule(user, 'proposals');
      case 'page-projects':
        return canAccessModule(user, 'projects');
      case 'page-employees':
        return canAccessModule(user, 'employees');
      case 'page-attendance':
        return canAccessModule(user, 'attendance');
      case 'page-leaves':
        return canAccessModule(user, 'leaves');
      case 'page-payroll':
        return canAccessModule(user, 'payroll');
      case 'page-departments':
        return canAccessModule(user, 'departments');
      case 'page-reports':
        return canAccessModule(user, 'reports');
      case 'page-users':
        return canAccessModule(user, 'users');
      case 'page-audit':
        return canAccessModule(user, 'audit');
      case 'page-modules':
        return canAccessModule(user, 'modules');
      case 'page-profile':
        return true;

      case 'filter-new-leads':
      case 'filter-followups':
        return canAccessModule(user, 'leads');
      case 'filter-pending-leaves':
        return hasAnyPermission('LEAVES_APPROVE_HR', 'LEAVES_READ_ALL');
      case 'filter-my-attendance':
        return hasAnyPermission('ATTENDANCE_CHECKIN');
      case 'filter-my-payslips':
        return hasAnyPermission('PAYROLL_READ_ALL', 'PAYROLL_MANAGE', 'SALARY_READ');
      default:
        return true;
    }
  };

  const permittedItems = allItems.filter(isItemPermitted);

  const filteredItems = search.trim()
    ? permittedItems.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase())
      )
    : permittedItems;

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? (filteredItems.length || 1) - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[75vh] text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command, page name, or action (e.g. lead, attendance, salary, project)..."
            className="flex-1 bg-transparent border-0 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-0 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-mono text-slate-600">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No matching command found
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Try searching for 'lead', 'payroll', 'project', 'employee', or 'leave'
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`pt-1.5 first:pt-0`}
                >
                  <div
                    className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/25'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm truncate ${
                              isSelected ? 'font-black text-white' : 'font-bold text-slate-900'
                            }`}
                          >
                            {item.title}
                          </p>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-extrabold tracking-wider border ${
                              isSelected
                                ? 'bg-white/20 text-white border-white/30'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-white font-mono">
                          <span>Enter</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">
                Esc
              </kbd>
              Exit
            </span>
          </div>

          <span className="text-blue-600 font-bold hidden sm:inline">
            Speeddex Global Search
          </span>
        </div>
      </div>
    </div>
  );
};
