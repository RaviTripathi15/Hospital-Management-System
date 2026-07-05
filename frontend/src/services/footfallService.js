import api from './api'

const footfallService = {
  log: async (data) => {
    const response = await api.post('/footfall', data)
    return response.data
  },

  getStats: async (params = {}) => {
    const response = await api.get('/footfall/stats', { params })
    return response.data
  },

  getPeakHours: async (params = {}) => {
    const response = await api.get('/footfall/peak-hours', { params })
    return response.data
  },

  getTrends: async (params = {}) => {
    const response = await api.get('/footfall/trends', { params })
    return response.data
  },
}

export default footfallService
