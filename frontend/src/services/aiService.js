import api from './api'

const aiService = {
  getDemandForecast: async (params = {}) => {
    const response = await api.get('/ai/demand-forecast', { params })
    return response.data
  },

  getPredictedStockouts: async (params = {}) => {
    const response = await api.get('/ai/predicted-stockouts', { params })
    return response.data
  },

  getResourceOptimization: async (params = {}) => {
    const response = await api.get('/ai/resource-optimization', { params })
    return response.data
  },

  getUnderperforming: async (params = {}) => {
    const response = await api.get('/ai/underperforming-centers', { params })
    return response.data
  },

  getInsights: async (params = {}) => {
    const response = await api.get('/ai/insights', { params })
    return response.data
  },

  getAnomalies: async (params = {}) => {
    const response = await api.get('/ai/anomalies', { params })
    return response.data
  },
}

export default aiService
