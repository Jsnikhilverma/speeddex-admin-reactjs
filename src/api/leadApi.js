import axiosClient from './axiosClient';

export const leadApi = {
  // Get paginated leads with filters
  getLeads: (params) => axiosClient.get('/leads', { params }),

  // Get single lead by ID
  getLeadById: (id) => axiosClient.get(`/leads/${id}`),

  // Create new lead manually
  createLead: (data) => axiosClient.post('/leads', data),

  // Update lead
  updateLead: (id, data) => axiosClient.patch(`/leads/${id}`, data),

  // Change lead status
  changeStatus: (id, data) => axiosClient.patch(`/leads/${id}/status`, data),

  // Assign lead to salesperson
  assignLead: (id, data) => axiosClient.patch(`/leads/${id}/assign`, data),

  // Archive lead
  archiveLead: (id, data) => axiosClient.patch(`/leads/${id}/archive`, data),

  // follow-up / interaction
  logFollowUp: (id, data) => axiosClient.post(`/leads/${id}/follow-ups`, data),

  // Get interaction timeline
  getLeadTimeline: (id) => axiosClient.get(`/leads/${id}/timeline`),

  // Get overdue & upcoming follow-up alerts
  getFollowUpAlerts: () => axiosClient.get('/leads/follow-ups/alerts'),

  // Update follow-up interaction
  updateFollowUp: (followUpId, data) => axiosClient.patch(`/leads/follow-ups/${followUpId}`, data),

  // Delete follow-up interaction
  deleteFollowUp: (followUpId) => axiosClient.delete(`/leads/follow-ups/${followUpId}`),

  // Automated Distribution & Sales Availability Engine
  getDistributionStatus: () => axiosClient.get('/leads/distribution/status'),

  getDistributionConfig: () => axiosClient.get('/leads/distribution/config'),

  updateDistributionConfig: (data) => axiosClient.put('/leads/distribution/config', data),

  reassignUnavailable: (data) => axiosClient.post('/leads/distribution/reassign-unavailable', data),

  toggleAvailability: (data) => axiosClient.patch('/leads/distribution/availability', data),

  // Website Lead Intake (Public / Test)
  submitWebsiteLead: (data, headers = {}) => axiosClient.post('/leads/website', data, { headers }),

  // Full Construction Lifecycle Operations
  qualifyLead: (id, data) => axiosClient.post(`/leads/${id}/qualify`, data),

  scheduleSiteVisit: (id, data) => axiosClient.post(`/leads/${id}/site-visits`, data),

  completeSiteVisit: (id, visitId, data) => axiosClient.patch(`/leads/${id}/site-visits/${visitId}`, data),

  closeDeal: (id, data) => axiosClient.post(`/leads/${id}/close-deal`, data),

  recordPayment: (id, data) => axiosClient.post(`/leads/${id}/payments`, data),

  getPayments: (id) => axiosClient.get(`/leads/${id}/payments`),

  handoverLeadProject: (id, data) => axiosClient.post(`/leads/${id}/handover`, data),
};

