import api from './api'

export const attendanceService = {
  markAttendance: (payload) => api.post('/attendance', payload),
  getMyAttendance: () => api.get('/attendance/me'),
  getAttendanceRecords: (params) => api.get('/attendance/records', { params }),
  getMonthlyReport: (params) => api.get('/attendance/report', { params }),
}
