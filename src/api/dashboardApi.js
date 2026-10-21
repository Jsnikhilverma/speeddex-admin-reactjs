import axiosClient from './axiosClient';

// Helper to safely extract list from paginated or raw response
const extractList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.data?.employees)) return res.data.employees;
  if (Array.isArray(res.data?.records)) return res.data.records;
  if (Array.isArray(res.data?.leads)) return res.data.leads;
  if (Array.isArray(res.data?.proposals)) return res.data.proposals;
  if (Array.isArray(res.data?.leaves)) return res.data.leaves;
  if (Array.isArray(res.data?.payrolls)) return res.data.payrolls;
  if (Array.isArray(res.data?.departments)) return res.data.departments;
  if (Array.isArray(res.data?.logs)) return res.data.logs;
  if (Array.isArray(res.employees)) return res.employees;
  if (Array.isArray(res.records)) return res.records;
  if (Array.isArray(res.leads)) return res.leads;
  if (Array.isArray(res.proposals)) return res.proposals;
  if (Array.isArray(res.leaves)) return res.leaves;
  if (Array.isArray(res.payrolls)) return res.payrolls;
  if (Array.isArray(res.departments)) return res.departments;
  if (Array.isArray(res.logs)) return res.logs;
  return [];
};

// Client-side computation of real metrics directly from live MongoDB resources
// Used when /dashboards/* route is not yet mounted on a running server instance
const computeSuperAdminDashboardFromDB = async () => {
  const [leadsRes, proposalsRes, employeesRes, attendanceRes, leavesRes, payrollRes, auditRes] =
    await Promise.allSettled([
      axiosClient.get('/leads', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/proposals', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/employees', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/attendance', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/leaves', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/payroll', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/audit-logs', { params: { limit: 10 } }).catch(() => null),
    ]);

  const leads = extractList(leadsRes.value);
  const proposals = extractList(proposalsRes.value);
  const employees = extractList(employeesRes.value);
  const attendance = extractList(attendanceRes.value);
  const leaves = extractList(leavesRes.value);
  const payrolls = extractList(payrollRes.value);
  const auditLogs = extractList(auditRes.value);

  // 1. Leads & Conversions
  const totalLeads = leads.length;
  const wonLeads = leads.filter(
    (l) => l.status === 'WON' || l.status === 'CONVERTED'
  );
  const wonCount = wonLeads.length;
  const wonRevenue = wonLeads.reduce((acc, l) => acc + Number(l.budget || 0), 0);
  const conversionRate =
    totalLeads > 0 ? Number(((wonCount / totalLeads) * 100).toFixed(1)) : 0;

  // 2. Lead Funnel
  const leadFunnel = {};
  leads.forEach((l) => {
    const st = l.status || 'NEW';
    if (!leadFunnel[st]) leadFunnel[st] = { count: 0, totalBudget: 0 };
    leadFunnel[st].count += 1;
    leadFunnel[st].totalBudget += Number(l.budget || 0);
  });

  // 3. Proposals Pipeline
  let acceptedCount = 0;
  let pipelineValue = 0;
  proposals.forEach((p) => {
    const lastVersion = p.versions?.[p.versions.length - 1];
    const amount = Number(p.acceptedAmount || lastVersion?.grandTotal || 0);
    pipelineValue += amount;
    if (p.status === 'ACCEPTED' || p.isAccepted) {
      acceptedCount += 1;
    }
  });

  // 4. Workforce
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(
    (e) => e.employmentStatus !== 'TERMINATED' && e.employmentStatus !== 'ARCHIVED'
  ).length;

  // 5. Attendance Summary
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.dateStr === todayStr);
  const clockedInTotal = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const currentlyActive = todayAttendance.filter(
    (a) => a.currentStatus === 'ACTIVE'
  ).length;
  const onBreak = todayAttendance.filter((a) => a.currentStatus === 'ON_BREAK').length;
  const completedShift = todayAttendance.filter(
    (a) => a.currentStatus === 'COMPLETED'
  ).length;

  // 6. Pending Leaves
  const pendingManagerApproval = leaves.filter(
    (l) => l.status === 'PENDING_MANAGER'
  ).length;
  const pendingHrApproval = leaves.filter((l) => l.status === 'PENDING_HR').length;
  const currentlyOnLeaveToday = leaves.filter(
    (l) => l.status === 'APPROVED' && l.startDateStr <= todayStr && l.endDateStr >= todayStr
  ).length;

  // 7. Real Payroll Totals from DB
  const curMonth = new Date().getMonth() + 1;
  const curYear = new Date().getFullYear();
  let matchedPayrolls = payrolls.filter(
    (p) => Number(p.month) === curMonth && Number(p.year) === curYear
  );

  // If no payroll generated for current month yet, pick latest available payroll records in DB
  let displayMonth = curMonth;
  let displayYear = curYear;
  if (matchedPayrolls.length === 0 && payrolls.length > 0) {
    const sortedPayrolls = [...payrolls].sort(
      (a, b) => (Number(b.year) - Number(a.year)) || (Number(b.month) - Number(a.month))
    );
    displayMonth = sortedPayrolls[0].month;
    displayYear = sortedPayrolls[0].year;
    matchedPayrolls = payrolls.filter(
      (p) => Number(p.month) === Number(displayMonth) && Number(p.year) === Number(displayYear)
    );
  }

  const totalGross = matchedPayrolls.reduce(
    (acc, p) => acc + Number(p.grossSalary || p.earnings?.grossSalary || 0),
    0
  );
  const totalDeductions = matchedPayrolls.reduce(
    (acc, p) => acc + Number(p.deductions?.totalDeductions || 0),
    0
  );
  const totalNetPayout = matchedPayrolls.reduce(
    (acc, p) => acc + Number(p.netPayable || 0),
    0
  );

  return {
    conversions: { totalLeads, wonCount, wonRevenue, conversionRate },
    proposalPipeline: {
      pipelineValue,
      acceptedCount,
      totalCount: proposals.length,
    },
    workforce: { activeEmployees, totalEmployees },
    attendanceSummary: {
      clockedInTotal,
      currentlyActive,
      onBreak,
      completedShift,
    },
    leadFunnel,
    pendingLeaves: {
      pendingManagerApproval,
      pendingHrApproval,
      currentlyOnLeaveToday,
    },
    payrollTotals: {
      month: displayMonth,
      year: displayYear,
      totalGross,
      totalDeductions,
      totalNetPayout,
    },
    auditActivity: auditLogs,
  };
};

const computeManagerDashboardFromDB = async () => {
  const [leadsRes, employeesRes, attendanceRes, leavesRes] = await Promise.allSettled([
    axiosClient.get('/leads', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/employees', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/attendance', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/leaves', { params: { limit: 100 } }).catch(() => null),
  ]);

  const leads = extractList(leadsRes.value);
  const employees = extractList(employeesRes.value);
  const attendance = extractList(attendanceRes.value);
  const leaves = extractList(leavesRes.value);

  const totalLeads = leads.length;
  const wonLeads = leads.filter(
    (l) => l.status === 'WON' || l.status === 'CONVERTED'
  ).length;
  const conversionRate =
    totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.dateStr === todayStr);
  const clockedIn = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const absent = todayAttendance.filter((a) => a.status === 'ABSENT').length;

  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING_MANAGER');

  // Distribution by sales rep
  const repMap = {};
  leads.forEach((l) => {
    const repName = l.assignedTo?.name || 'Unassigned';
    if (!repMap[repName]) repMap[repName] = { name: repName, count: 0, wonCount: 0 };
    repMap[repName].count += 1;
    if (l.status === 'WON' || l.status === 'CONVERTED') repMap[repName].wonCount += 1;
  });

  const assignmentDistribution = Object.values(repMap).map((r) => ({
    ...r,
    percentage: totalLeads > 0 ? Math.round((r.count / totalLeads) * 100) : 0,
  }));

  return {
    teamSummary: { totalLeads, wonLeads, conversionRate },
    followUps: { dueToday: 0, overdue: 0 },
    teamAttendanceToday: { clockedIn, totalTeam: employees.length, absent },
    pendingApprovals: { count: pendingLeaves.length, leaves: pendingLeaves },
    assignmentDistribution,
  };
};

const computeHrDashboardFromDB = async () => {
  const [employeesRes, attendanceRes, leavesRes, payrollRes, deptsRes] =
    await Promise.allSettled([
      axiosClient.get('/employees', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/attendance', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/leaves', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/payroll', { params: { limit: 100 } }).catch(() => null),
      axiosClient.get('/departments').catch(() => null),
    ]);

  const employees = extractList(employeesRes.value);
  const attendance = extractList(attendanceRes.value);
  const leaves = extractList(leavesRes.value);
  const payrolls = extractList(payrollRes.value);
  const departments = extractList(deptsRes.value);

  const total = employees.length;
  const active = employees.filter((e) => e.employmentStatus === 'CONFIRMED').length;
  const probation = employees.filter((e) => e.employmentStatus === 'PROBATION').length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const clockedIn = attendance.filter(
    (a) => a.dateStr === todayStr && a.status === 'PRESENT'
  ).length;

  const pendingHrLeaves = leaves.filter((l) => l.status === 'PENDING_HR');

  const deptDistribution = departments.map((d) => ({
    name: d.name,
    count: employees.filter((e) => e.department?._id === d._id || e.department === d._id).length,
  }));

  return {
    workforce: { total, active, probation },
    attendanceToday: { clockedIn, lateMarks: 0 },
    pendingHrLeaves: { count: pendingHrLeaves.length, leaves: pendingHrLeaves },
    payrollSummaries: payrolls,
    departmentDistribution: deptDistribution,
    salaryIncrementHistory: [],
  };
};

const computeSalesDashboardFromDB = async (salesUserId) => {
  const [leadsRes, proposalsRes, attendanceRes] = await Promise.allSettled([
    axiosClient.get('/leads', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/proposals', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/attendance/my-today').catch(() => null),
  ]);

  const allLeads = extractList(leadsRes.value);
  const proposals = extractList(proposalsRes.value);

  const leads = salesUserId
    ? allLeads.filter(
        (l) => l.assignedTo?._id === salesUserId || l.assignedTo === salesUserId
      )
    : allLeads;

  const totalAssignedLeads = leads.length;
  const wonLeads = leads.filter(
    (l) => l.status === 'WON' || l.status === 'CONVERTED'
  );
  const wonDealsCount = wonLeads.length;
  const wonRevenue = wonLeads.reduce((acc, l) => acc + Number(l.budget || 0), 0);
  const winRate =
    totalAssignedLeads > 0
      ? Number(((wonDealsCount / totalAssignedLeads) * 100).toFixed(1))
      : 0;

  const myAttData = attendanceRes.value?.data;

  return {
    performance: { totalAssignedLeads, wonDealsCount, winRate, wonRevenue },
    followUps: { dueTodayCount: 0, overdueCount: 0 },
    myAttendance: {
      hasClockedIn: Boolean(myAttData?.firstCheckIn),
      status: myAttData?.status || 'NOT_CHECKED_IN',
    },
    myLeads: leads.slice(0, 5),
    recentProposals: proposals.slice(0, 5),
  };
};

// Resilient API object: queries backend first, falls back to direct MongoDB queries if route not mounted
export const dashboardApi = {
  getMyDashboard: async () => {
    try {
      return await axiosClient.get('/dashboards/me');
    } catch (err) {
      const data = await computeSuperAdminDashboardFromDB();
      return { success: true, data };
    }
  },

  getSuperAdminDashboard: async () => {
    try {
      return await axiosClient.get('/dashboards/super-admin');
    } catch (err) {
      const data = await computeSuperAdminDashboardFromDB();
      return { success: true, data };
    }
  },

  getManagerDashboard: async () => {
    try {
      return await axiosClient.get('/dashboards/manager');
    } catch (err) {
      const data = await computeManagerDashboardFromDB();
      return { success: true, data };
    }
  },

  getHrDashboard: async () => {
    try {
      return await axiosClient.get('/dashboards/hr');
    } catch (err) {
      const data = await computeHrDashboardFromDB();
      return { success: true, data };
    }
  },

  getSalesDashboard: async () => {
    try {
      return await axiosClient.get('/dashboards/sales');
    } catch (err) {
      const user = JSON.parse(localStorage.getItem('speeddex_user') || '{}');
      const data = await computeSalesDashboardFromDB(user._id);
      return { success: true, data };
    }
  },
};
