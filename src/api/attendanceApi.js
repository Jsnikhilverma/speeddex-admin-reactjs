import axiosClient from './axiosClient';

export const attendanceApi = {
  // Clock-in / Start work session
  checkIn: (data) => axiosClient.post('/attendance/check-in', data),

  // Clock-out / Complete work session
  checkOut: (data) => axiosClient.post('/attendance/check-out', data),

  // Breaks
  startBreak: (data) => axiosClient.post('/attendance/breaks/start', data),
  endBreak: (data) => axiosClient.post('/attendance/breaks/end', data),

  // Live status for employee
  getMyToday: () => axiosClient.get('/attendance/my-today'),

  // Personal history
  getMyHistory: (params) => axiosClient.get('/attendance/my-history', { params }),

  // Manager: Team attendance
  getTeamAttendance: (params) => axiosClient.get('/attendance/team', { params }),

  // HR & Super Admin: All company records
  getAllAttendance: (params) => axiosClient.get('/attendance', { params }),

  // Administrative: Close forgotten session
  closeForgottenSession: (sessionId, data) =>
    axiosClient.patch(`/attendance/sessions/${sessionId}/close-forgotten`, data),
};
