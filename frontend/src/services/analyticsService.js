import api from './api'

const analyticsService = {
  getDashboard: async (params = {}) => {
    const response = await api.get('/analytics/dashboard', { params })
    return response.data
  },

  getDistrict: async (districtId, params = {}) => {
    const response = await api.get(`/analytics/district/${districtId}`, { params })
    return response.data
  },

  getNational: async (params = {}) => {
    const response = await api.get('/analytics/national', { params })
    return response.data
  },

  getInventoryAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/inventory', { params })
    return response.data
  },

  getTrends: async (type, params = {}) => {
    const response = await api.get(`/analytics/trends/${type}`, { params })
    return response.data
  },

  getCenterComparison: async (params = {}) => {
    const response = await api.get('/analytics/centers/comparison', { params })
    return response.data
  },

  getPatientDemographics: async (params = {}) => {
    const response = await api.get('/analytics/patients/demographics', { params })
    return response.data
  },
}

export default analyticsService
