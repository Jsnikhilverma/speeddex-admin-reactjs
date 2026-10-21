import axiosClient from './axiosClient';

export const leaveApi = {
  // Apply for leave
  applyLeave: (data) => axiosClient.post('/leaves', data),

  // Employee: My submitted leaves
  getMyLeaves: (params) => axiosClient.get('/leaves/my-leaves', { params }),

  // Employee: My lifetime leave summary and reports
  getMyLeaveSummary: (params) => axiosClient.get('/leaves/my-summary', { params }),

  // Employee: Self-withdrawal of pending leave
  withdrawLeave: (id, data) => axiosClient.patch(`/leaves/${id}/withdraw`, data),

  // Approvals queue for Manager & HR
  getPendingApprovals: () => axiosClient.get('/leaves/pending'),

  // Stage 1: Manager decision
  managerDecision: (id, data) => axiosClient.patch(`/leaves/${id}/manager-decision`, data),

  // Stage 2: HR final decision
  hrDecision: (id, data) => axiosClient.patch(`/leaves/${id}/hr-decision`, data),

  // Super Admin administrative override
  superAdminOverride: (id, data) => axiosClient.patch(`/leaves/${id}/override`, data),

  // Get single leave with timeline & approval history
  getLeaveById: (id) => axiosClient.get(`/leaves/${id}`),

  // HR & Super Admin: All company leaves
  getAllLeaves: (params) => axiosClient.get('/leaves', { params }),
};
