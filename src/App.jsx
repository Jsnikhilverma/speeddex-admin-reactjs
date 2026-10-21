import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { QuickActionsModal } from './components/common/QuickActionsModal';
import { CommandPalette } from './components/common/CommandPalette';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavesPage } from './pages/LeavesPage';
import { LeadsPage } from './pages/LeadsPage';
import { ProposalsPage } from './pages/ProposalsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PayrollPage } from './pages/PayrollPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ModulesOverviewPage } from './pages/ModulesOverviewPage';
import { CmsPage } from './pages/cms/CmsPage';

// Quick Global Creation Modals
import { CreateLeadModal } from './components/leads/CreateLeadModal';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { CreateEmployeeModal } from './components/employees/CreateEmployeeModal';
import { CreateProposalModal } from './components/proposals/CreateProposalModal';
import { AddUserModal } from './components/users/AddUserModal';
import { ApplyLeaveModal } from './components/leaves/ApplyLeaveModal';
import { canAccessModule } from './utils/permissions';

import { HardHat, ShieldAlert } from 'lucide-react';

const TABS_PRIORITY = [
  'dashboard',
  'leads',
  'proposals',
  'projects',
  'cms',
  'employees',
  'attendance',
  'leaves',
  'payroll',
  'departments',
  'reports',
  'users',
  'profile',
];

const AppContent = () => {
  const { user, isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabParams, setTabParams] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Dialogs & Action Hubs
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Creation Modals
  const [isGlobalLeadOpen, setIsGlobalLeadOpen] = useState(false);
  const [isGlobalProjectOpen, setIsGlobalProjectOpen] = useState(false);
  const [isGlobalEmployeeOpen, setIsGlobalEmployeeOpen] = useState(false);
  const [isGlobalProposalOpen, setIsGlobalProposalOpen] = useState(false);
  const [isGlobalUserOpen, setIsGlobalUserOpen] = useState(false);
  const [isGlobalLeaveOpen, setIsGlobalLeaveOpen] = useState(false);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Auto-switch to first allowed tab if current activeTab is not permitted
  useEffect(() => {
    if (!isAuthenticated || isSuperAdmin || !user) return;
    if (!canAccessModule(user, activeTab)) {
      const firstAllowed = TABS_PRIORITY.find((t) => canAccessModule(user, t)) || 'profile';
      setActiveTab(firstAllowed);
    }
  }, [isAuthenticated, isSuperAdmin, user, activeTab]);

  const handleSelectTab = (tab, params = {}) => {
    if (!isSuperAdmin && !canAccessModule(user, tab)) {
      showToast(`Access Restricted: You do not have permission for this module`, 'warning');
      return;
    }
    setActiveTab(tab);
    setTabParams(params);
  };

  const handleCommandPaletteAction = (actionKey) => {
    switch (actionKey) {
      case 'lead':
        setIsGlobalLeadOpen(true);
        break;
      case 'project':
        setIsGlobalProjectOpen(true);
        break;
      case 'employee':
        setIsGlobalEmployeeOpen(true);
        break;
      case 'proposal':
        setIsGlobalProposalOpen(true);
        break;
      case 'attendance':
        handleSelectTab('attendance', { subTab: 'my' });
        break;
      case 'leave':
        setIsGlobalLeaveOpen(true);
        break;
      case 'user':
        setIsGlobalUserOpen(true);
        break;
      case 'payroll':
        handleSelectTab('payroll', { subTab: 'company', autoOpenGenerate: true });
        break;
      default:
        break;
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-500/25 text-white animate-bounce">
            <HardHat className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 animate-ping opacity-25" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800 font-['Outfit'] tracking-wider">
          Connecting to Speeddex Backend...
        </p>
        <span className="text-xs text-slate-500 font-mono mt-1">
          Indore, Madhya Pradesh
        </span>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!isAuthenticated) {
    if (authView === 'forgot') {
      return (
        <ForgotPasswordPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToReset={(tok) => {
            setResetToken(tok);
            setAuthView('reset');
          }}
        />
      );
    }
    if (authView === 'reset') {
      return (
        <ResetPasswordPage
          initialToken={resetToken}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToForgot={() => setAuthView('forgot')}
      />
    );
  }

  // Authenticated Layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenQuickActions={() => setIsQuickActionsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
          } flex flex-col min-w-0 transition-all duration-300 app-main-content bg-slate-50 text-slate-900`}
      >
        <Navbar
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          onOpenQuickActions={() => setIsQuickActionsOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto"
          key={refreshKey}
        >
          {!isSuperAdmin && !canAccessModule(user, activeTab) ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-lg shadow-amber-500/10">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md">
                Aapko is module ka access nahi diya gaya hai. Agar aapko access chahiye to apne administrator ya HR se contact karein.
              </p>
              <button
                type="button"
                onClick={() => {
                  const firstAllowed = TABS_PRIORITY.find((t) => canAccessModule(user, t)) || 'profile';
                  handleSelectTab(firstAllowed);
                }}
                className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
              >
                Go to My Workspace
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  onNavigateTab={handleSelectTab}
                  onOpenAddUser={() => setIsGlobalUserOpen(true)}
                />
              )}

              {activeTab === 'reports' && <ReportsPage />}

              {activeTab === 'payroll' && <PayrollPage tabParams={tabParams} />}

              {activeTab === 'users' && <UsersPage tabParams={tabParams} />}

              {activeTab === 'employees' && <EmployeesPage tabParams={tabParams} />}

              {activeTab === 'departments' && <DepartmentsPage />}

              {activeTab === 'attendance' && <AttendancePage tabParams={tabParams} />}

              {activeTab === 'leaves' && <LeavesPage tabParams={tabParams} />}

              {activeTab === 'leads' && (
                <LeadsPage
                  onNavigateTab={handleSelectTab}
                  tabParams={tabParams}
                />
              )}

              {activeTab === 'proposals' && (
                <ProposalsPage
                  onNavigateTab={handleSelectTab}
                  tabParams={tabParams}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsPage
                  onNavigateTab={handleSelectTab}
                  tabParams={tabParams}
                />
              )}

              {activeTab === 'cms' && <CmsPage />}

              {activeTab === 'audit' && <AuditLogsPage />}

              {activeTab === 'health' && <SystemHealthPage />}

              {activeTab === 'modules' && (
                <ModulesOverviewPage onNavigateTab={handleSelectTab} />
              )}

              {activeTab === 'profile' && <ProfilePage />}
            </>
          )}
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleSelectTab}
        onTriggerAction={handleCommandPaletteAction}
      />

      {/* Global Quick Actions Hub Modal */}
      <QuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
        onOpenCreateLead={() => setIsGlobalLeadOpen(true)}
        onOpenCreateProject={() => setIsGlobalProjectOpen(true)}
        onOpenCreateEmployee={() => setIsGlobalEmployeeOpen(true)}
        onOpenCreateProposal={() => setIsGlobalProposalOpen(true)}
        onOpenClockPunch={() => handleSelectTab('attendance', { subTab: 'my' })}
        onOpenApplyLeave={() => setIsGlobalLeaveOpen(true)}
        onOpenAddUser={() => setIsGlobalUserOpen(true)}
        onOpenRunPayroll={() => handleSelectTab('payroll', { subTab: 'company', autoOpenGenerate: true })}
      />

      {/* Global Creation Modals (Usable from anywhere in the app) */}
      <CreateLeadModal
        isOpen={isGlobalLeadOpen}
        onClose={() => setIsGlobalLeadOpen(false)}
        onCreated={() => {
          setIsGlobalLeadOpen(false);
          setRefreshKey((k) => k + 1);
          showToast('New client lead created successfully!', 'success');
        }}
      />

      <CreateProjectModal
        isOpen={isGlobalProjectOpen}
        onClose={() => setIsGlobalProjectOpen(false)}
        onSuccess={() => {
          setIsGlobalProjectOpen(false);
          setRefreshKey((k) => k + 1);
          showToast('New construction project created successfully!', 'success');
        }}
      />

      <CreateEmployeeModal
        isOpen={isGlobalEmployeeOpen}
        onClose={() => setIsGlobalEmployeeOpen(false)}
        onCreated={() => {
          setIsGlobalEmployeeOpen(false);
          setRefreshKey((k) => k + 1);
          showToast('Employee registered successfully in Speeddex workforce!', 'success');
        }}
      />

      <CreateProposalModal
        isOpen={isGlobalProposalOpen}
        onClose={() => setIsGlobalProposalOpen(false)}
        onCreated={() => {
          setIsGlobalProposalOpen(false);
          setRefreshKey((k) => k + 1);
          showToast('BOQ proposal quote generated successfully!', 'success');
        }}
      />

      <AddUserModal
        isOpen={isGlobalUserOpen}
        onClose={() => setIsGlobalUserOpen(false)}
        onUserCreated={() => {
          setIsGlobalUserOpen(false);
          setRefreshKey((k) => k + 1);
          showToast('New system user created successfully!', 'success');
        }}
      />

      <ApplyLeaveModal
        isOpen={isGlobalLeaveOpen}
        onClose={() => setIsGlobalLeaveOpen(false)}
        onApply={() => {
          setIsGlobalLeaveOpen(false);
          setRefreshKey((k) => k + 1);
          showToast('Leave request submitted successfully for approval!', 'success');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
