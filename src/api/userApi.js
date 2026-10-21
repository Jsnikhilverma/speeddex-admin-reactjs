import axiosClient from './axiosClient';

export const userApi = {
  getUsers: (params) => axiosClient.get('/users', { params }),
  getUserStats: () => axiosClient.get('/users/stats'),
  getUserById: (id) => axiosClient.get(`/users/${id}`),
  createUser: (userData) => axiosClient.post('/users', userData),
  updateUser: (id, userData) => axiosClient.patch(`/users/${id}`, userData),
  deleteUser: (id) => axiosClient.delete(`/users/${id}`),
};
