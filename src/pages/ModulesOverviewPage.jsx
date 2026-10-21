import React from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  FileText,
  Briefcase,
  PhoneCall,
  FileSpreadsheet,
  Clock,
  CalendarCheck,
  DollarSign,
  FolderLock,
  BarChart3,
  HardHat,
  CheckCircle2,
  Construction,
} from 'lucide-react';

export const ModulesOverviewPage = ({ onNavigateTab }) => {
  const allModules = [
    {
      id: 'auth',
      name: 'Authentication & RBAC',
      status: 'Live (v1.0)',
      stage: 'production',
      icon: ShieldCheck,
      endpoints: ['POST /api/v1/auth/login', 'POST /api/v1/auth/refresh-token', 'GET /api/v1/auth/me', 'POST /api/v1/auth/change-password'],
      desc: 'Dual-token JWT rotation (15m access / 7d refresh), bcrypt hashing (12 rounds), token reuse attack mitigation, and session revocation.',
    },
    {
      id: 'users',
      name: 'Team & User Control',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'users',
      icon: Users,
      endpoints: ['GET /api/v1/users', 'POST /api/v1/users', 'PATCH /api/v1/auth/users/:id/role', 'PATCH /api/v1/auth/users/:id/status'],
      desc: 'Speeddex workforce database with 10-digit Indian phone verification, dynamic RBAC permission overrides, and soft-delete safeguards.',
    },
    {
      id: 'departments',
      name: 'Departments & Site Divisions',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'departments',
      icon: HardHat,
      endpoints: ['GET /api/v1/departments', 'POST /api/v1/departments', 'PATCH /api/v1/departments/:id/archive'],
      desc: 'Organizational hierarchy, site engineering divisions, active workforce tracking, case-insensitive duplicate prevention, and safe archival.',
    },
    {
      id: 'employees',
      name: 'Employees & HRMS Lifecycle',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'employees',
      icon: Users,
      endpoints: ['GET /api/v1/employees', 'POST /api/v1/employees', 'PATCH /api/v1/employees/:id/status', 'PATCH /api/v1/employees/:id/transfer'],
      desc: 'Full workforce lifecycle with optional departments, audit-logged status transitions, lateral site transfers, accidental deletion prevention, and field-level privacy.',
    },
    {
      id: 'salary',
      name: 'Versioned Salary Structure',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'employees',
      icon: DollarSign,
      endpoints: ['GET /api/v1/employees/:id/salary', 'POST /api/v1/employees/:id/salary/increment', 'GET /api/v1/employees/:id/salary/for-period'],
      desc: 'Non-destructive salary versioning, auto gross/net/CTC calculation, overlap prevention, percentage hike tracking, and payroll pay-cycle period validation.',
    },
    {
      id: 'documents',
      name: 'Private HR Documents',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'employees',
      icon: FolderLock,
      endpoints: ['POST /api/v1/employees/:id/documents', 'GET /api/v1/employees/:id/documents/:docId/download'],
      desc: 'Configurable private storage for appointment letters, Aadhaar/PAN, and certificates with safe UUID hashing and RBAC streaming download authorization.',
    },
    {
      id: 'audit',
      name: 'Security Audit Trail',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'audit',
      icon: FileText,
      endpoints: ['GET /api/v1/audit-logs'],
      desc: 'Immutable audit logs with actor attribution, entity ID references, change diffs, client IP addresses, and user-agent forensics.',
    },
    {
      id: 'health',
      name: 'System Telemetry',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'health',
      icon: Activity,
      endpoints: ['GET /api/v1/health', 'GET /api/v1/health/ping'],
      desc: 'Real-time MongoDB roundtrip ping, Node engine memory usage, process uptime, and Indore Asian/Kolkata (IST) temporal alignment.',
    },
    {
      id: 'attendance',
      name: 'Biometric Attendance & Shifts',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'attendance',
      icon: Clock,
      endpoints: ['POST /api/v1/attendance/check-in', 'POST /api/v1/attendance/check-out', 'POST /api/v1/attendance/break/start', 'POST /api/v1/attendance/break/end', 'GET /api/v1/attendance/today'],
      desc: 'Live Asia/Kolkata attendance tracking, active work session elapsed ticker, paid/unpaid break policy auditing, site-wide team roster, and forgotten session recovery.',
    },
    {
      id: 'leaves',
      name: 'Leaves & 2-Stage Approvals',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'leaves',
      icon: CalendarCheck,
      endpoints: ['POST /api/v1/leaves/apply', 'PATCH /api/v1/leaves/:id/manager-decision', 'PATCH /api/v1/leaves/:id/hr-decision', 'PATCH /api/v1/leaves/:id/admin-override'],
      desc: 'Multi-stage leave approval workflow (Stage 1 Manager -> Stage 2 HR), dynamic balance auto-deductions, mandatory rejection reasons, withdrawal safeguards, and Super Admin administrative overrides.',
    },
    {
      id: 'leads',
      name: 'Construction Leads CRM',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'leads',
      icon: Briefcase,
      endpoints: ['GET /api/v1/leads', 'POST /api/v1/leads', 'PATCH /api/v1/leads/:id/status', 'PATCH /api/v1/leads/:id/assign', 'POST /api/v1/leads/:id/follow-ups'],
      desc: 'Canonical lead intake for residential, commercial & industrial projects, duplicate detection, immutable status history, and sales rep allocation.',
    },
    {
      id: 'followups',
      name: 'Site Follow-ups & Surveys',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'leads',
      icon: PhoneCall,
      endpoints: ['POST /api/v1/leads/:id/follow-ups', 'GET /api/v1/leads/:id/timeline', 'GET /api/v1/leads/follow-ups/alerts'],
      desc: 'Call logging, site inspection assessments with coordinates verification, overdue follow-up alerts, and private internal notes.',
    },
    {
      id: 'proposals',
      name: 'BOQ & Proposals Engine',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'proposals',
      icon: FileSpreadsheet,
      endpoints: ['POST /api/v1/proposals', 'GET /api/v1/proposals/:id', 'POST /api/v1/proposals/:id/revisions', 'PATCH /api/v1/proposals/:id/accept'],
      desc: 'Bill of Quantities (BOQ), multi-revision versioning, decimal-safe INR currency calculation, GST tax slabs, milestone payment tranches, and single-award acceptance.',
    },
    {
      id: 'projects',
      name: 'Projects & Site Operations',
      status: 'Live (v1.0)',
      stage: 'production',
      tabId: 'projects',
      icon: Construction,
      endpoints: [
        'GET /api/v1/projects',
        'POST /api/v1/projects',
        'POST /api/v1/projects/handover-from-lead/:leadId',
        'POST /api/v1/projects/:id/sites',
        'POST /api/v1/projects/:id/team',
        'PATCH /api/v1/projects/:id/status',
      ],
      desc: 'Project lifecycle management, converted CRM lead handovers with baseline immutability, child site coordinates with safety directives, and designated personnel roster deployments.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
          <HardHat className="w-4 h-4" />
          <span>Speeddex Enterprise Architecture</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight font-['Outfit']">
          Construction CRM & HRMS Suite
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Overview of all 12 backend modules powering Speeddex Construction operations in Indore, Madhya Pradesh
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allModules.map((m) => {
          const Icon = m.icon;
          const isLive = m.stage === 'production';

          return (
            <div
              key={m.id}
              onClick={() => m.tabId && onNavigateTab && onNavigateTab(m.tabId)}
              className={`p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${
                isLive
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-500 hover:shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              } ${m.tabId ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isLive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      isLive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white font-['Outfit'] mb-1.5">
                  {m.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {m.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                  {m.endpoints.map((ep) => (
                    <div key={ep} className="truncate">
                      {ep}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
