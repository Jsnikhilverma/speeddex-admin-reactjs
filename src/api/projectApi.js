import axiosClient from './axiosClient';

export const projectApi = {
  // Get paginated and scoped list of projects
  getProjects: (params) => axiosClient.get('/projects', { params }),

  // Get single project details by ID (includes child sites and team roster)
  getProjectById: (id) => axiosClient.get(`/projects/${id}`),

  // Create project from converted CRM lead handover
  createFromLead: (leadId, data) => axiosClient.post(`/projects/handover-from-lead/${leadId}`, data),

  // Create standalone construction project
  createStandalone: (data) => axiosClient.post('/projects', data),

  // Update project details
  updateProject: (id, data) => axiosClient.put(`/projects/${id}`, data),

  // Change project status
  changeStatus: (id, data) => axiosClient.patch(`/projects/${id}/status`, data),

  // Soft-archive project
  archiveProject: (id, data) => axiosClient.delete(`/projects/${id}`, { data }),

  // Sites
  getSites: (projectId, params) => axiosClient.get(`/projects/${projectId}/sites`, { params }),
  getSiteById: (projectId, siteId) => axiosClient.get(`/projects/${projectId}/sites/${siteId}`),
  createSite: (projectId, data) => axiosClient.post(`/projects/${projectId}/sites`, data),
  updateSite: (projectId, siteId, data) => axiosClient.put(`/projects/${projectId}/sites/${siteId}`, data),
  changeSiteStatus: (projectId, siteId, data) => axiosClient.patch(`/projects/${projectId}/sites/${siteId}/status`, data),

  // Team Assignments
  getProjectTeam: (projectId) => axiosClient.get(`/projects/${projectId}/team`),
  assignTeamMember: (projectId, data) => axiosClient.post(`/projects/${projectId}/team`, data),
  releaseTeamMember: (projectId, assignmentId, data) => axiosClient.patch(`/projects/${projectId}/team/${assignmentId}/release`, data),
};
