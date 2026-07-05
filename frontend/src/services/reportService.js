import api from './api'

const reportService = {
  getAll: async (params = {}) => {
    const response = await api.get('/reports', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/reports', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/reports/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/reports/${id}`)
    return response.data
  },

  submit: async (id) => {
    const response = await api.patch(`/reports/${id}/submit`)
    return response.data
  },

  approve: async (id, comments) => {
    const response = await api.patch(`/reports/${id}/approve`, { comments })
    return response.data
  },

  reject: async (id, reason) => {
    const response = await api.patch(`/reports/${id}/reject`, { reason })
    return response.data
  },

  getSummary: async (params = {}) => {
    const response = await api.get('/reports/summary', { params })
    return response.data
  },

  getByCenter: async (centerId, params = {}) => {
    const response = await api.get(`/reports/center/${centerId}`, { params })
    return response.data
  },
}

export default reportService
