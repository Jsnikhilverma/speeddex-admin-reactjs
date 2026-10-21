import axiosClient from './axiosClient';

export const proposalApi = {
  // Get all proposals with filters
  getProposals: (params) => axiosClient.get('/proposals', { params }),

  // Get single proposal with all versions
  getProposalById: (id) => axiosClient.get(`/proposals/${id}`),

  // Create initial proposal (v1)
  createProposal: (data) => axiosClient.post('/proposals', data),

  // Update existing proposal (active version in place)
  updateProposal: (id, data) => axiosClient.put(`/proposals/${id}`, data),

  // Create new revision (vN+1)
  createRevision: (id, data) => axiosClient.post(`/proposals/${id}/revisions`, data),

  // Record client revision request
  recordRevisionRequest: (id, data) =>
    axiosClient.post(`/proposals/${id}/revision-requests`, data),

  // Update proposal status (SENT, VIEWED, REJECTED, EXPIRED)
  updateStatus: (id, data) => axiosClient.patch(`/proposals/${id}/status`, data),

  // Accept proposal version (Final award & lead conversion)
  acceptProposal: (id, data) => axiosClient.patch(`/proposals/${id}/accept`, data),
};
