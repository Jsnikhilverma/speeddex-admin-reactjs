import axiosClient from './axiosClient';

export const employeeApi = {
  // Employee CRUD & Lifecycle
  getEmployees: (params) => axiosClient.get('/employees', { params }),
  getEmployeeById: (id) => axiosClient.get(`/employees/${id}`),
  createEmployee: (data) => axiosClient.post('/employees', data),
  updateEmployee: (id, data) => axiosClient.patch(`/employees/${id}`, data),
  changeStatus: (id, data) => axiosClient.patch(`/employees/${id}/status`, data),
  transferEmployee: (id, data) => axiosClient.patch(`/employees/${id}/transfer`, data),
  archiveEmployee: (id, reason) => axiosClient.patch(`/employees/${id}/archive`, { reason }),
  restoreEmployee: (id) => axiosClient.patch(`/employees/${id}/restore`),
  deleteEmployee: (id) => axiosClient.delete(`/employees/${id}`),
  managePortalAccess: (id, data) => axiosClient.post(`/employees/${id}/portal-access`, data),
  updateBankDetails: (id, data) => axiosClient.patch(`/employees/${id}/bank-details`, data),
  verifyBankDetails: (id, data) => axiosClient.patch(`/employees/${id}/bank-details/verify`, data),

  // Promotions & Career History
  promoteEmployee: (id, data) => axiosClient.post(`/employees/${id}/promote`, data),
  getPromotionHistory: (id) => axiosClient.get(`/employees/${id}/promotions`),

  // Salary Structure & Versioning
  getSalaryStructures: (employeeId) => axiosClient.get(`/employees/${employeeId}/salary`),
  getActiveSalary: (employeeId) => axiosClient.get(`/employees/${employeeId}/salary/active`),
  getSalaryForPeriod: (employeeId, params) =>
    axiosClient.get(`/employees/${employeeId}/salary/for-period`, { params }),
  createInitialSalary: (employeeId, data) =>
    axiosClient.post(`/employees/${employeeId}/salary`, data),
  createSalaryIncrement: (employeeId, data) =>
    axiosClient.post(`/employees/${employeeId}/salary/increment`, data),
  getSalaryHistory: (employeeId) =>
    axiosClient.get(`/employees/${employeeId}/salary/history`),

  // Private Employee Documents & Official Document Generator
  getDocuments: (employeeId) => axiosClient.get(`/employees/${employeeId}/documents`),
  uploadDocument: (employeeId, formData) =>
    axiosClient.post(`/employees/${employeeId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  downloadDocument: (employeeId, documentId) =>
    axiosClient.get(`/employees/${employeeId}/documents/${documentId}/download`, {
      responseType: 'blob',
    }),
  deleteDocument: (employeeId, documentId) =>
    axiosClient.delete(`/employees/${employeeId}/documents/${documentId}`),
  previewDocument: (employeeId, data) =>
    axiosClient.post(`/employees/${employeeId}/documents/preview`, data),
  generateDocument: (employeeId, data) =>
    axiosClient.post(`/employees/${employeeId}/documents/generate`, data, {
      responseType: 'blob',
    }),
};
