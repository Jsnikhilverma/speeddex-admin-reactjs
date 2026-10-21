export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  HR: 'HR',
  SALES: 'SALES',
};

export const ROLE_LABELS = {
  SUPER_ADMIN: {
    title: 'Super Administrator',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    description: 'Unrestricted full access across CRM, HRMS, and server administration',
  },
  MANAGER: {
    title: 'Project / Operations Manager',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    description: 'Manages sales pipelines, site proposals, attendance & approvals',
  },
  HR: {
    title: 'Human Resources',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
    description: 'Manages user accounts, attendance, leaves, payroll & audit',
  },
  SALES: {
    title: 'Sales & Client Relations',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    description: 'Handles client leads, follow-ups, and construction site inquiries',
  },
};

export const ALL_PERMISSIONS = [
  { id: 'USERS_CREATE', name: 'Create Users', category: 'User Management' },
  { id: 'USERS_READ', name: 'View Users', category: 'User Management' },
  { id: 'USERS_UPDATE', name: 'Update Users', category: 'User Management' },
  { id: 'USERS_DELETE', name: 'Delete Users', category: 'User Management' },
  { id: 'USERS_MANAGE_ROLES', name: 'Assign Roles', category: 'User Management' },
  { id: 'USERS_MANAGE_STATUS', name: 'Activate/Deactivate Users', category: 'User Management' },

  { id: 'DEPARTMENTS_MANAGE', name: 'Manage Departments', category: 'Organization' },
  { id: 'DEPARTMENTS_READ', name: 'View Departments', category: 'Organization' },

  { id: 'EMPLOYEES_MANAGE', name: 'Manage Employees & Lifecycles', category: 'HRMS' },
  { id: 'EMPLOYEES_READ', name: 'View Employees', category: 'HRMS' },
  { id: 'SALARY_MANAGE', name: 'Manage Salary Structures & Increments', category: 'HRMS' },
  { id: 'SALARY_READ', name: 'View Salary Structures', category: 'HRMS' },
  { id: 'PROMOTIONS_MANAGE', name: 'Manage Promotions & Transfers', category: 'HRMS' },
  { id: 'DOCUMENTS_MANAGE', name: 'Manage Employee Documents', category: 'HRMS' },
  { id: 'HR_DOCUMENTS_GENERATE', name: 'Generate Official HR Letters', category: 'HRMS' },

  { id: 'LEADS_CREATE', name: 'Create Leads', category: 'Sales & CRM' },
  { id: 'LEADS_READ_ALL', name: 'View All Leads', category: 'Sales & CRM' },
  { id: 'LEADS_READ_ASSIGNED', name: 'View Assigned Leads', category: 'Sales & CRM' },
  { id: 'LEADS_UPDATE', name: 'Update Leads', category: 'Sales & CRM' },
  { id: 'LEADS_ASSIGN', name: 'Assign Leads to Sales Team', category: 'Sales & CRM' },

  { id: 'FOLLOWUPS_MANAGE_ALL', name: 'Manage All Follow-ups', category: 'Sales & CRM' },
  { id: 'FOLLOWUPS_MANAGE_OWN', name: 'Manage Own Follow-ups', category: 'Sales & CRM' },

  { id: 'PROPOSALS_CREATE', name: 'Generate BOQ & Proposals', category: 'Estimations' },
  { id: 'PROPOSALS_READ', name: 'View Proposals', category: 'Estimations' },
  { id: 'PROPOSALS_APPROVE', name: 'Approve Proposals', category: 'Estimations' },

  { id: 'ATTENDANCE_CHECKIN', name: 'Employee Self Check-in', category: 'HRMS' },
  { id: 'ATTENDANCE_READ_ALL', name: 'View All Attendance', category: 'HRMS' },
  { id: 'ATTENDANCE_MANAGE', name: 'Edit Attendance Records', category: 'HRMS' },

  { id: 'LEAVES_APPLY', name: 'Apply For Leave', category: 'HRMS' },
  { id: 'LEAVES_APPROVE_HR', name: 'Approve Leaves (HR)', category: 'HRMS' },
  { id: 'LEAVES_READ_ALL', name: 'View All Leaves', category: 'HRMS' },

  { id: 'PAYROLL_MANAGE', name: 'Process Monthly Payroll', category: 'Payroll' },
  { id: 'PAYROLL_READ_ALL', name: 'View All Payroll', category: 'Payroll' },

  { id: 'PROJECTS_CREATE', name: 'Create Projects & Handovers', category: 'Construction Operations' },
  { id: 'PROJECTS_READ_ALL', name: 'View All Construction Projects', category: 'Construction Operations' },
  { id: 'PROJECTS_READ_ASSIGNED', name: 'View Assigned Construction Projects', category: 'Construction Operations' },
  { id: 'PROJECTS_UPDATE', name: 'Update Construction Projects', category: 'Construction Operations' },
  { id: 'PROJECTS_ARCHIVE', name: 'Archive Construction Projects', category: 'Construction Operations' },
  { id: 'PROJECT_FINANCIALS_READ', name: 'View Project Financials & Budgets', category: 'Construction Operations' },

  { id: 'DOCUMENTS_MANAGE_ALL', name: 'Manage Site & HR Documents', category: 'Documents' },
  { id: 'CMS_MANAGE', name: 'Manage Website CMS & Showcase', category: 'Marketing & CMS' },
  { id: 'CMS_READ', name: 'View Website CMS Content', category: 'Marketing & CMS' },
  { id: 'AUDIT_READ', name: 'View Security Audit Logs', category: 'Security' },
  { id: 'REPORTS_VIEW', name: 'Generate Analytics & Reports', category: 'Analytics' },
  { id: 'SETTINGS_MANAGE', name: 'Manage System Settings', category: 'System' },
];

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS.map((p) => p.id),
  [ROLES.MANAGER]: [
    'USERS_CREATE',
    'USERS_READ',
    'USERS_UPDATE',
    'USERS_MANAGE_ROLES',
    'USERS_MANAGE_STATUS',
    'DEPARTMENTS_READ',
    'EMPLOYEES_MANAGE',
    'EMPLOYEES_READ',
    'LEADS_CREATE',
    'LEADS_READ_ALL',
    'LEADS_UPDATE',
    'LEADS_ASSIGN',
    'FOLLOWUPS_MANAGE_ALL',
    'PROPOSALS_CREATE',
    'PROPOSALS_READ',
    'PROPOSALS_APPROVE',
    'ATTENDANCE_CHECKIN',
    'ATTENDANCE_READ_ALL',
    'LEAVES_APPLY',
    'LEAVES_READ_ALL',
    'DOCUMENTS_MANAGE',
    'DOCUMENTS_MANAGE_ALL',
    'REPORTS_VIEW',
    'PROJECTS_CREATE',
    'PROJECTS_READ_ALL',
    'PROJECTS_UPDATE',
    'PROJECTS_ARCHIVE',
    'PROJECT_FINANCIALS_READ',
  ],
  [ROLES.HR]: [
    'USERS_CREATE',
    'USERS_READ',
    'USERS_UPDATE',
    'USERS_MANAGE_ROLES',
    'USERS_MANAGE_STATUS',
    'DEPARTMENTS_MANAGE',
    'DEPARTMENTS_READ',
    'EMPLOYEES_MANAGE',
    'EMPLOYEES_READ',
    'SALARY_MANAGE',
    'SALARY_READ',
    'LEADS_CREATE',
    'LEADS_READ_ALL',
    'LEADS_UPDATE',
    'LEADS_ASSIGN',
    'FOLLOWUPS_MANAGE_ALL',
    'PROPOSALS_CREATE',
    'PROPOSALS_READ',
    'PROPOSALS_APPROVE',
    'ATTENDANCE_CHECKIN',
    'ATTENDANCE_READ_ALL',
    'ATTENDANCE_MANAGE',
    'LEAVES_APPLY',
    'LEAVES_APPROVE_HR',
    'LEAVES_READ_ALL',
    'PAYROLL_MANAGE',
    'PAYROLL_READ_ALL',
    'DOCUMENTS_MANAGE',
    'DOCUMENTS_MANAGE_ALL',
    'PROMOTIONS_MANAGE',
    'HR_DOCUMENTS_GENERATE',
    'AUDIT_READ',
    'REPORTS_VIEW',
    'PROJECTS_READ_ASSIGNED',
  ],
  [ROLES.SALES]: [
    'EMPLOYEES_READ',
    'LEADS_CREATE',
    'LEADS_READ_ASSIGNED',
    'LEADS_UPDATE',
    'FOLLOWUPS_MANAGE_OWN',
    'PROPOSALS_CREATE',
    'PROPOSALS_READ',
    'ATTENDANCE_CHECKIN',
    'LEAVES_APPLY',
    'DOCUMENTS_MANAGE',
  ],
};

export const MODULE_PERMISSIONS = {
  dashboard: [], // Accessible to any active user with access to the system
  reports: ['REPORTS_VIEW'],
  leads: [
    'LEADS_READ_ALL',
    'LEADS_READ_ASSIGNED',
    'LEADS_CREATE',
    'LEADS_UPDATE',
    'FOLLOWUPS_MANAGE_ALL',
    'FOLLOWUPS_MANAGE_OWN',
  ],
  proposals: [
    'PROPOSALS_READ',
    'PROPOSALS_CREATE',
    'PROPOSALS_APPROVE',
  ],
  projects: [
    'PROJECTS_READ_ALL',
    'PROJECTS_READ_ASSIGNED',
    'PROJECTS_CREATE',
    'PROJECTS_UPDATE',
    'PROJECTS_ARCHIVE',
    'PROJECT_FINANCIALS_READ',
  ],
  employees: [
    'EMPLOYEES_READ',
    'EMPLOYEES_MANAGE',
    'SALARY_READ',
    'SALARY_MANAGE',
  ],
  attendance: [
    'ATTENDANCE_CHECKIN',
    'ATTENDANCE_READ_ALL',
    'ATTENDANCE_MANAGE',
  ],
  leaves: [
    'LEAVES_APPLY',
    'LEAVES_READ_ALL',
    'LEAVES_APPROVE_HR',
  ],
  departments: [
    'DEPARTMENTS_READ',
    'DEPARTMENTS_MANAGE',
  ],
  payroll: [
    'PAYROLL_READ_ALL',
    'PAYROLL_MANAGE',
    'SALARY_READ',
    'SALARY_MANAGE',
  ],
  users: [
    'USERS_READ',
    'USERS_CREATE',
    'USERS_UPDATE',
    'USERS_DELETE',
    'USERS_MANAGE_ROLES',
    'USERS_MANAGE_STATUS',
  ],
  audit: ['AUDIT_READ'],
  cms: ['CMS_MANAGE', 'CMS_READ'],
  health: ['SETTINGS_MANAGE'],
  modules: ['SETTINGS_MANAGE', 'REPORTS_VIEW', 'USERS_READ'],
  profile: [], // Always accessible for personal profile and security
};

/**
 * Get the effective array of permissions for a user
 */
export const getUserEffectivePermissions = (user) => {
  if (!user) return [];
  if (user.role === ROLES.SUPER_ADMIN) {
    return ALL_PERMISSIONS.map((p) => p.id);
  }
  if (Array.isArray(user.customPermissions) && user.customPermissions.length > 0) {
    return user.customPermissions;
  }
  return ROLE_PERMISSIONS[user.role] || [];
};

/**
 * Check if a user possesses a specific permission
 */
export const userHasPermission = (user, permission) => {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  const effective = getUserEffectivePermissions(user);
  return effective.includes(permission);
};

/**
 * Check if a user possesses at least one of the given permissions
 */
export const userHasAnyPermission = (user, ...permissions) => {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (!permissions || permissions.length === 0) return true;
  const effective = getUserEffectivePermissions(user);
  return permissions.some((p) => effective.includes(p));
};

/**
 * Check if a user can access a specific application module/tab
 */
export const canAccessModule = (user, moduleId) => {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;

  const requiredPerms = MODULE_PERMISSIONS[moduleId];
  if (!requiredPerms || requiredPerms.length === 0) {
    return true;
  }

  const effective = getUserEffectivePermissions(user);
  return requiredPerms.some((perm) => effective.includes(perm));
};

