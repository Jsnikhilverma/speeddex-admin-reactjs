import axiosClient from './axiosClient';

export const notificationApi = {
  getMyNotifications: (params) => axiosClient.get('/notifications', { params }),
  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
  markAsRead: (id) => axiosClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch('/notifications/mark-all-read'),
  deleteNotification: (id) => axiosClient.delete(`/notifications/${id}`),
  scanFollowUps: () => axiosClient.post('/notifications/scan-followups'),
};
