import axiosClient, { API_BASE_URL } from './axiosClient';

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

// CSV sanitizer against formula injection
const sanitizeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Fallback computing functions querying real database resources directly
const computeLeadsReportFromDB = async ({ startDate, endDate } = {}) => {
  const res = await axiosClient.get('/leads', { params: { limit: 100 } }).catch(() => null);
  let leads = extractList(res);

  if (startDate) {
    leads = leads.filter((l) => (l.createdAt ? l.createdAt.slice(0, 10) >= startDate : true));
  }
  if (endDate) {
    leads = leads.filter((l) => (l.createdAt ? l.createdAt.slice(0, 10) <= endDate : true));
  }

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'WON' || l.status === 'CONVERTED');
  const wonCount = wonLeads.length;
  const totalWonRevenue = wonLeads.reduce((acc, l) => acc + Number(l.budget || 0), 0);
  const pipelineBudget = leads.reduce((acc, l) => acc + Number(l.budget || 0), 0);
  const conversionRate = totalLeads > 0 ? Number(((wonCount / totalLeads) * 100).toFixed(1)) : 0;

  // Group by source
  const sourceMap = {};
  leads.forEach((l) => {
    const src = l.leadSource || 'OTHER';
    if (!sourceMap[src]) {
      sourceMap[src] = {
        _id: src,
        source: src,
        totalLeads: 0,
        count: 0,
        wonCount: 0,
        wonValue: 0,
        totalWonRevenue: 0,
        totalBudget: 0,
      };
    }
    sourceMap[src].totalLeads += 1;
    sourceMap[src].count += 1;
    sourceMap[src].totalBudget += Number(l.budget || 0);
    if (l.status === 'WON' || l.status === 'CONVERTED') {
      sourceMap[src].wonCount += 1;
      sourceMap[src].wonValue += Number(l.budget || 0);
      sourceMap[src].totalWonRevenue += Number(l.budget || 0);
    }
  });

  const sources = Object.values(sourceMap).map((s) => ({
    ...s,
    conversionRate: s.count > 0 ? Number(((s.wonCount / s.count) * 100).toFixed(1)) : 0,
  }));

  // Group by status
  const statusMap = {};
  leads.forEach((l) => {
    const st = l.status || 'NEW';
    if (!statusMap[st]) statusMap[st] = { _id: st, status: st, count: 0, totalBudget: 0, avgBudget: 0 };
    statusMap[st].count += 1;
    statusMap[st].totalBudget += Number(l.budget || 0);
  });
  Object.values(statusMap).forEach((st) => {
    st.avgBudget = st.count > 0 ? Math.round(st.totalBudget / st.count) : 0;
  });

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    summary: {
      totalLeads,
      wonLeads: wonCount,
      wonCount,
      conversionRate,
      totalWonRevenue,
      pipelineBudget,
      totalBudgetVolume: pipelineBudget,
    },
    sources,
    statuses: Object.values(statusMap),
  };
};

const computeSalesPerformanceReportFromDB = async ({ startDate, endDate } = {}) => {
  const [leadsRes, usersRes] = await Promise.allSettled([
    axiosClient.get('/leads', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/users', { params: { limit: 100 } }).catch(() => null),
  ]);

  let leads = extractList(leadsRes.value);
  const users = extractList(usersRes.value);

  if (startDate) {
    leads = leads.filter((l) => (l.createdAt ? l.createdAt.slice(0, 10) >= startDate : true));
  }
  if (endDate) {
    leads = leads.filter((l) => (l.createdAt ? l.createdAt.slice(0, 10) <= endDate : true));
  }

  const repMap = {};
  leads.forEach((l) => {
    const repId = l.assignedTo?._id || l.assignedTo || 'unassigned';
    const repUser = users.find((u) => u._id === repId);
    const repName = l.assignedTo?.name || repUser?.name || 'Unassigned Staff';
    const repEmail = l.assignedTo?.email || repUser?.email || '';

    if (!repMap[repId]) {
      repMap[repId] = {
        salespersonId: repId,
        userId: repId,
        name: repName,
        email: repEmail,
        role: repUser?.role || 'SALES',
        totalAssigned: 0,
        contactedCount: 0,
        siteVisitCompleted: 0,
        wonCount: 0,
        lostCount: 0,
        totalWonRevenue: 0,
        pipelineBudget: 0,
      };
    }

    repMap[repId].totalAssigned += 1;
    const budget = Number(l.budget || 0);

    const isContacted = !['NEW', 'ASSIGNED', 'NOT_CONNECTED', 'SPAM', 'ARCHIVED'].includes(l.status);
    if (isContacted) {
      repMap[repId].contactedCount += 1;
    }

    const isSiteVisit = [
      'SITE_VISIT_COMPLETED',
      'SITE_VISIT_DONE',
      'PROPOSAL_IN_PROGRESS',
      'ESTIMATION_IN_PROGRESS',
      'PROPOSAL_SENT',
      'PROPOSAL_SUBMITTED',
      'NEGOTIATION',
      'WON',
      'CONVERTED',
    ].includes(l.status);
    if (isSiteVisit) {
      repMap[repId].siteVisitCompleted += 1;
    }

    if (l.status === 'WON' || l.status === 'CONVERTED') {
      repMap[repId].wonCount += 1;
      repMap[repId].totalWonRevenue += budget;
    } else if (l.status === 'LOST') {
      repMap[repId].lostCount += 1;
    } else {
      repMap[repId].pipelineBudget += budget;
    }
  });

  const performance = Object.values(repMap).map((r) => ({
    ...r,
    conversionRate: r.totalAssigned > 0 ? Number(((r.wonCount / r.totalAssigned) * 100).toFixed(1)) : 0,
  }));

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    totalRepresentatives: Object.keys(repMap).length,
    performance,
  };
};

const computeProposalsReportFromDB = async ({ startDate, endDate } = {}) => {
  const res = await axiosClient.get('/proposals', { params: { limit: 100 } }).catch(() => null);
  let proposals = extractList(res);

  if (startDate) {
    proposals = proposals.filter((p) => (p.createdAt ? p.createdAt.slice(0, 10) >= startDate : true));
  }
  if (endDate) {
    proposals = proposals.filter((p) => (p.createdAt ? p.createdAt.slice(0, 10) <= endDate : true));
  }

  const totalProposals = proposals.length;
  let acceptedCount = 0;
  let acceptedRevenue = 0;
  let totalPipelineQuoted = 0;
  let totalRevisionsCreated = 0;

  const statusMap = {};

  proposals.forEach((p) => {
    const lastVersion = p.versions?.[p.versions.length - 1];
    const amount = Number(p.acceptedAmount || lastVersion?.grandTotal || 0);
    totalPipelineQuoted += amount;
    totalRevisionsCreated += p.versions?.length || 1;

    const st = p.status || 'DRAFT';
    if (!statusMap[st]) statusMap[st] = { _id: st, status: st, count: 0, totalQuoted: 0 };
    statusMap[st].count += 1;
    statusMap[st].totalQuoted += amount;

    if (p.status === 'ACCEPTED' || p.isAccepted) {
      acceptedCount += 1;
      acceptedRevenue += amount;
    }
  });

  const acceptanceRate =
    totalProposals > 0 ? Number(((acceptedCount / totalProposals) * 100).toFixed(1)) : 0;
  const avgRevisionsPerProposal =
    totalProposals > 0 ? Number((totalRevisionsCreated / totalProposals).toFixed(1)) : 1;

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    summary: {
      totalProposals,
      acceptedCount,
      acceptedRevenue,
      acceptanceRate,
      totalPipelineQuoted,
      avgRevisionsPerProposal,
      totalRevisionsCreated,
    },
    statusBreakdown: Object.values(statusMap),
  };
};

const computeAttendanceReportFromDB = async ({ startDate, endDate } = {}) => {
  const [attendanceRes, employeesRes] = await Promise.allSettled([
    axiosClient.get('/attendance', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/employees', { params: { limit: 100 } }).catch(() => null),
  ]);

  let attendance = extractList(attendanceRes.value);
  const employees = extractList(employeesRes.value);

  if (startDate) {
    attendance = attendance.filter((a) => (a.dateStr ? a.dateStr >= startDate : true));
  }
  if (endDate) {
    attendance = attendance.filter((a) => (a.dateStr ? a.dateStr <= endDate : true));
  }

  const totalMinutes = attendance.reduce((acc, a) => acc + Number(a.totalWorkMinutes || 0), 0);
  const totalHoursLogged = Number((totalMinutes / 60).toFixed(1));

  // Group by employee
  const empMap = {};
  employees.forEach((e) => {
    empMap[e._id] = {
      id: e._id,
      employeeId: e.employeeId || 'EMP',
      employeeName: `${e.name?.firstName || ''} ${e.name?.lastName || ''}`.trim() || e.employeeId,
      department: e.department?.name || 'Unassigned',
      designation: e.designation || 'Staff',
      totalSessions: 0,
      completedSessions: 0,
      totalWorkHours: 0,
      totalBreakHours: 0,
      avgDailyHours: 0,
      lateMarks: 0,
    };
  });

  attendance.forEach((a) => {
    const empId = a.employee?._id || a.employee;
    if (!empMap[empId]) {
      empMap[empId] = {
        id: empId,
        employeeId: a.employee?.employeeId || 'EMP',
        employeeName: a.employee?.name || 'Staff',
        department: a.employee?.department?.name || 'Unassigned',
        designation: a.employee?.designation || 'Staff',
        totalSessions: 0,
        completedSessions: 0,
        totalWorkHours: 0,
        totalBreakHours: 0,
        avgDailyHours: 0,
        lateMarks: 0,
      };
    }

    empMap[empId].totalSessions += 1;
    if (a.currentStatus === 'COMPLETED' || a.status === 'PRESENT') {
      empMap[empId].completedSessions += 1;
    }
    const workHrs = Number((Number(a.totalWorkMinutes || 0) / 60).toFixed(2));
    const breakHrs = Number((Number(a.totalBreakMinutes || 0) / 60).toFixed(2));
    empMap[empId].totalWorkHours = Number((empMap[empId].totalWorkHours + workHrs).toFixed(2));
    empMap[empId].totalBreakHours = Number((empMap[empId].totalBreakHours + breakHrs).toFixed(2));
    if (a.isLate) empMap[empId].lateMarks += 1;
  });

  const records = Object.values(empMap).map((r) => ({
    ...r,
    avgDailyHours: r.totalSessions > 0 ? Number((r.totalWorkHours / r.totalSessions).toFixed(1)) : 0,
  }));

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    employeeCount: records.length,
    summary: {
      totalEmployees: records.length,
      totalHoursLogged,
      avgDailyHours: attendance.length > 0 ? Number((totalHoursLogged / attendance.length).toFixed(1)) : 0,
      onTimeCheckIns: attendance.filter((a) => a.status === 'PRESENT' && !a.isLate).length,
      lateCheckIns: attendance.filter((a) => a.isLate).length,
    },
    records,
  };
};

const computeLeavesReportFromDB = async ({ startDate, endDate } = {}) => {
  const res = await axiosClient.get('/leaves', { params: { limit: 100 } }).catch(() => null);
  let leaves = extractList(res);

  if (startDate) {
    leaves = leaves.filter((l) => (l.startDateStr ? l.startDateStr >= startDate : true));
  }
  if (endDate) {
    leaves = leaves.filter((l) => (l.endDateStr ? l.endDateStr <= endDate : true));
  }

  const totalApplications = leaves.length;
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED');
  const rejectedLeaves = leaves.filter((l) => l.status?.includes('REJECTED'));
  const totalLeaveDays = leaves.reduce((acc, l) => acc + Number(l.totalDays || 1), 0);
  const approvalRate =
    totalApplications > 0
      ? Number(((approvedLeaves.length / totalApplications) * 100).toFixed(1))
      : 0;

  // By type
  const typeMap = {};
  leaves.forEach((l) => {
    const t = l.leaveType || 'CASUAL';
    if (!typeMap[t]) {
      typeMap[t] = {
        _id: t,
        leaveType: t,
        applications: 0,
        count: 0,
        approvedCount: 0,
        totalDays: 0,
      };
    }
    typeMap[t].applications += 1;
    typeMap[t].count += 1;
    if (l.status === 'APPROVED') typeMap[t].approvedCount += 1;
    typeMap[t].totalDays += Number(l.totalDays || 1);
  });

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    summary: {
      totalApplications,
      approvalRate,
      totalLeaveDays,
      rejectedApplications: rejectedLeaves.length,
      approvedCount: approvedLeaves.length,
    },
    byType: Object.values(typeMap),
  };
};

const computePayrollReportFromDB = async ({ month, year } = {}) => {
  const [payrollsRes, employeesRes] = await Promise.allSettled([
    axiosClient.get('/payroll', { params: { limit: 100 } }).catch(() => null),
    axiosClient.get('/employees', { params: { limit: 100 } }).catch(() => null),
  ]);

  let payrolls = extractList(payrollsRes.value);
  const employees = extractList(employeesRes.value);

  if (month) payrolls = payrolls.filter((p) => Number(p.month) === Number(month));
  if (year) payrolls = payrolls.filter((p) => Number(p.year) === Number(year));

  const totalGross = payrolls.reduce(
    (acc, p) => acc + Number(p.grossSalary || p.earnings?.grossSalary || 0),
    0
  );
  const totalDeductions = payrolls.reduce(
    (acc, p) => acc + Number(p.deductions?.totalDeductions || 0),
    0
  );
  const totalNetPayable = payrolls.reduce((acc, p) => acc + Number(p.netPayable || 0), 0);

  const records = payrolls.map((p) => {
    const emp = employees.find((e) => e._id === (p.employee?._id || p.employee)) || p.employee;
    return {
      id: p._id,
      employeeId: emp?.employeeId || p.employeeId || 'EMP',
      employeeName: `${emp?.name?.firstName || ''} ${emp?.name?.lastName || ''}`.trim() || emp?.employeeId || 'Staff',
      designation: emp?.designation || p.designation || 'Staff',
      department: emp?.department?.name || p.department?.name || 'Operations',
      departmentName: emp?.department?.name || p.department?.name || 'Operations',
      month: p.month,
      year: p.year,
      salaryVersion: p.salaryVersion || p.salaryStructureSnapshot?.version || 1,
      payableDays: p.payableDays ?? p.calculationInputs?.payableDays ?? 30,
      unpaidDays: p.unpaidDays ?? p.calculationInputs?.unpaidDays ?? 0,
      grossSalary: Number(p.grossSalary || p.earnings?.grossSalary || 0),
      totalDeductions: Number(p.deductions?.totalDeductions || 0),
      netPayable: Number(p.netPayable || 0),
      status: p.status || 'DRAFT',
    };
  });

  const totals = {
    totalGross,
    totalDeductions,
    totalNetPayable,
    totalEmployees: payrolls.length,
  };

  return {
    filters: { month: month || null, year: year || null },
    totalRecords: payrolls.length,
    totals,
    summary: totals,
    records,
  };
};

export const reportApi = {
  getLeadsReport: async (params) => {
    try {
      return await axiosClient.get('/reports/leads', { params });
    } catch (err) {
      const data = await computeLeadsReportFromDB(params);
      return { success: true, data };
    }
  },

  getSalesPerformanceReport: async (params) => {
    try {
      return await axiosClient.get('/reports/sales-performance', { params });
    } catch (err) {
      const data = await computeSalesPerformanceReportFromDB(params);
      return { success: true, data };
    }
  },

  getProposalsReport: async (params) => {
    try {
      return await axiosClient.get('/reports/proposals', { params });
    } catch (err) {
      const data = await computeProposalsReportFromDB(params);
      return { success: true, data };
    }
  },

  getAttendanceReport: async (params) => {
    try {
      return await axiosClient.get('/reports/attendance', { params });
    } catch (err) {
      const data = await computeAttendanceReportFromDB(params);
      return { success: true, data };
    }
  },

  getLeavesReport: async (params) => {
    try {
      return await axiosClient.get('/reports/leaves', { params });
    } catch (err) {
      const data = await computeLeavesReportFromDB(params);
      return { success: true, data };
    }
  },

  getPayrollReport: async (params) => {
    try {
      return await axiosClient.get('/reports/payroll', { params });
    } catch (err) {
      const data = await computePayrollReportFromDB(params);
      return { success: true, data };
    }
  },

  // Trigger browser download for sanitized CSV export
  downloadReportCsv: async ({ type, startDate, endDate, month, year, departmentId }) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (departmentId) params.append('departmentId', departmentId);

    const token = localStorage.getItem('speeddex_access_token');
    const url = `${API_BASE_URL}/reports/export-csv?${params.toString()}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get('content-disposition');
        let filename = `speeddex_${type || 'report'}_${new Date().toISOString().slice(0, 10)}.csv`;
        if (disposition && disposition.includes('filename=')) {
          const match = disposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) filename = match[1];
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        return;
      }
    } catch (e) {
      // Fallback to client-side CSV generator below
    }

    // Client-side CSV generator fallback if backend endpoint not active
    let rows = [];
    let headers = [];
    if (type === 'leads') {
      const r = await computeLeadsReportFromDB({ startDate, endDate });
      headers = ['Source', 'Total Leads', 'Won Deals', 'Won Revenue (INR)', 'Total Budget (INR)'];
      rows = r.sources.map((s) => [
        sanitizeCsvCell(s._id),
        sanitizeCsvCell(s.totalLeads),
        sanitizeCsvCell(s.wonCount),
        sanitizeCsvCell(s.wonValue),
        sanitizeCsvCell(s.totalBudget),
      ]);
    } else if (type === 'proposals') {
      const r = await computeProposalsReportFromDB({ startDate, endDate });
      headers = ['Status', 'Count', 'Total Quoted Value (INR)'];
      rows = r.statusBreakdown.map((s) => [
        sanitizeCsvCell(s._id),
        sanitizeCsvCell(s.count),
        sanitizeCsvCell(s.totalQuoted),
      ]);
    } else {
      headers = ['Report', 'Generated At'];
      rows = [[sanitizeCsvCell(type), sanitizeCsvCell(new Date().toISOString())]];
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `speeddex_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
