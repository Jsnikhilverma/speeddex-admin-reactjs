import axiosClient from './axiosClient';

export const departmentApi = {
  getDepartments: (params) => axiosClient.get('/departments', { params }),
  getDepartmentById: (id) => axiosClient.get(`/departments/${id}`),
  createDepartment: (data) => axiosClient.post('/departments', data),
  updateDepartment: (id, data) => axiosClient.patch(`/departments/${id}`, data),
  archiveDepartment: (id, reason) => axiosClient.patch(`/departments/${id}/archive`, { reason }),
  restoreDepartment: (id) => axiosClient.patch(`/departments/${id}/restore`),
  deleteDepartment: (id) => axiosClient.delete(`/departments/${id}`),
};
