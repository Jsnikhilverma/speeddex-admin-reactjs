import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  logout: (refreshToken) => axiosClient.post('/auth/logout', { refreshToken }),
  getMe: () => axiosClient.get('/auth/me'),
  changePassword: (passwords) => axiosClient.post('/auth/change-password', passwords),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),
  updateUserRole: (userId, data) => axiosClient.patch(`/auth/users/${userId}/role`, data),
  updateUserStatus: (userId, data) => axiosClient.patch(`/auth/users/${userId}/status`, data),
};
