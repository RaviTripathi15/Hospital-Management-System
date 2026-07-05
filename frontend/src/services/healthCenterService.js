import api from './api'

const healthCenterService = {
  getAll: async (params = {}) => {
    const response = await api.get('/health-centers', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/health-centers/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/health-centers', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/health-centers/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/health-centers/${id}`)
    return response.data
  },

  getStats: async (id) => {
    const response = await api.get(`/health-centers/${id}/stats`)
    return response.data
  },

  getNearby: async (lat, lng, radius = 10) => {
    const response = await api.get('/health-centers/nearby', {
      params: { lat, lng, radius },
    })
    return response.data
  },

  assignStaff: async (centerId, userId) => {
    const response = await api.post(`/health-centers/${centerId}/staff`, { userId, action: 'add' })
    return response.data
  },

  removeStaff: async (centerId, userId) => {
    const response = await api.post(`/health-centers/${centerId}/staff`, { userId, action: 'remove' })
    return response.data
  },

  getStaff: async (centerId) => {
    const response = await api.get(`/health-centers/${centerId}/staff`)
    return response.data
  },
}

export default healthCenterService
