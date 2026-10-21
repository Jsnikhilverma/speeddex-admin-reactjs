import React, { useEffect } from 'react';
import {
  Target,
  HardHat,
  UserPlus,
  FileSpreadsheet,
  Clock,
  Calendar,
  ShieldPlus,
  Banknote,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/permissions';

export const QuickActionsModal = ({
  isOpen,
  onClose,
  onOpenCreateLead,
  onOpenCreateProject,
  onOpenCreateEmployee,
  onOpenCreateProposal,
  onOpenClockPunch,
  onOpenApplyLeave,
  onOpenAddUser,
  onOpenRunPayroll,
}) => {
  const { hasRole, hasAnyPermission, isSuperAdmin } = useAuth();

  const canCreateLead = isSuperAdmin || hasAnyPermission('LEADS_CREATE', 'LEADS_UPDATE');
  const canCreateProject = isSuperAdmin || hasAnyPermission('PROJECTS_CREATE', 'PROJECTS_UPDATE');
  const canCreateEmployee = isSuperAdmin || hasAnyPermission('EMPLOYEES_MANAGE');
  const canCreateProposal = isSuperAdmin || hasAnyPermission('PROPOSALS_CREATE');
  const canPunchAttendance = isSuperAdmin || hasAnyPermission('ATTENDANCE_CHECKIN');
  const canApplyLeave = isSuperAdmin || hasAnyPermission('LEAVES_APPLY');
  const canAddUser = isSuperAdmin || hasAnyPermission('USERS_CREATE', 'USERS_MANAGE_ROLES');
  const canRunPayroll = isSuperAdmin || hasAnyPermission('PAYROLL_MANAGE');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Numeric shortcuts 1-8
      if (e.key === '1' && onOpenCreateLead && canCreateLead) {
        e.preventDefault();
        onClose();
        onOpenCreateLead();
      } else if (e.key === '2' && onOpenCreateProject && canCreateProject) {
        e.preventDefault();
        onClose();
        onOpenCreateProject();
      } else if (e.key === '3' && onOpenCreateEmployee && canCreateEmployee) {
        e.preventDefault();
        onClose();
        onOpenCreateEmployee();
      } else if (e.key === '4' && onOpenCreateProposal && canCreateProposal) {
        e.preventDefault();
        onClose();
        onOpenCreateProposal();
      } else if (e.key === '5' && onOpenClockPunch && canPunchAttendance) {
        e.preventDefault();
        onClose();
        onOpenClockPunch();
      } else if (e.key === '6' && onOpenApplyLeave && canApplyLeave) {
        e.preventDefault();
        onClose();
        onOpenApplyLeave();
      } else if (e.key === '7' && onOpenAddUser && canAddUser) {
        e.preventDefault();
        onClose();
        onOpenAddUser();
      } else if (e.key === '8' && onOpenRunPayroll && canRunPayroll) {
        e.preventDefault();
        onClose();
        onOpenRunPayroll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    onClose,
    onOpenCreateLead,
    onOpenCreateProject,
    onOpenCreateEmployee,
    onOpenCreateProposal,
    onOpenClockPunch,
    onOpenApplyLeave,
    onOpenAddUser,
    onOpenRunPayroll,
    canCreateLead,
    canCreateProject,
    canCreateEmployee,
    canCreateProposal,
    canPunchAttendance,
    canApplyLeave,
    canAddUser,
    canRunPayroll,
  ]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'lead',
      key: '1',
      title: 'New Client Lead / Inquiry',
      subtitle: 'Naya client lead register karein, budget & site survey set karein',
      icon: Target,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400 group-hover:border-amber-400',
      badge: 'Sales & CRM',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      onClick: () => {
        onClose();
        onOpenCreateLead?.();
      },
      show: canCreateLead,
    },
    {
      id: 'project',
      key: '2',
      title: 'New Construction Project',
      subtitle: 'Naya site ya child work create karein aur manager assign karein',
      icon: HardHat,
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400 group-hover:border-blue-400',
      badge: 'Operations & Site',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      onClick: () => {
        onClose();
        onOpenCreateProject?.();
      },
      show: canCreateProject,
    },
    {
      id: 'employee',
      key: '3',
      title: 'Add New Employee',
      subtitle: 'Team member profile, department, initial salary & KYC documents',
      icon: UserPlus,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-400',
      badge: 'HR & Personnel',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      onClick: () => {
        onClose();
        onOpenCreateEmployee?.();
      },
      show: canCreateEmployee,
    },
    {
      id: 'proposal',
      key: '4',
      title: 'Create BOQ Proposal / Quote',
      subtitle: 'Bill of quantities estimate banayein client ke liye',
      icon: FileSpreadsheet,
      color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400 group-hover:border-violet-400',
      badge: 'Costing & Sales',
      badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      onClick: () => {
        onClose();
        onOpenCreateProposal?.();
      },
      show: canCreateProposal,
    },
    {
      id: 'attendance',
      key: '5',
      title: 'Attendance Clock In / Out',
      subtitle: 'Aaj ka biometric / site presence punch karein',
      icon: Clock,
      color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400',
      badge: 'Daily Roster',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      onClick: () => {
        onClose();
        onOpenClockPunch?.();
      },
      show: canPunchAttendance,
    },
    {
      id: 'leave',
      key: '6',
      title: 'Apply for Leave',
      subtitle: 'Casual, sick ya emergency leave request submit karein',
      icon: Calendar,
      color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400 group-hover:border-pink-400',
      badge: 'Approvals',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      onClick: () => {
        onClose();
        onOpenApplyLeave?.();
      },
      show: canApplyLeave,
    },
    {
      id: 'user',
      key: '7',
      title: 'Add System User (Login)',
      subtitle: 'System login ID, password aur RBAC roles create karein',
      icon: ShieldPlus,
      color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400 group-hover:border-orange-400',
      badge: 'Access & RBAC',
      badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      onClick: () => {
        onClose();
        onOpenAddUser?.();
      },
      show: canAddUser,
    },
    {
      id: 'payroll',
      key: '8',
      title: 'Run Monthly Payroll',
      subtitle: 'Mahine ke salary slips calculate karein aur generate karein',
      icon: Banknote,
      color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-400 group-hover:border-teal-400',
      badge: 'Finance & HR',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      onClick: () => {
        onClose();
        onOpenRunPayroll?.();
      },
      show: canRunPayroll,
    },
  ].filter((a) => a.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  Quick Actions Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  Instant Shortcuts
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kisi bhi page se direct create karein • Press number (1-8) for instant launch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.onClick}
                className="group relative text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 transition-all duration-200 hover:bg-blue-50/60 hover:border-blue-400 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-white border-slate-200 text-blue-700"
                    >
                      {act.badge}
                    </span>
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center group-hover:text-blue-600 group-hover:border-blue-300">
                      {act.key}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 mt-1">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {act.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-end text-[11px] text-blue-600 font-bold group-hover:text-blue-700 transition-colors">
                  <span className="flex items-center gap-1">
                    Open Action <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700">
              Esc
            </span>
            to close •
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700">
              1-8
            </span>
            number keys to open instantly
          </span>
          <span className="text-blue-600 font-bold">Speeddex Control Center</span>
        </div>
      </div>
    </div>
  );
};
