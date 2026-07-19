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

  chat: async (message, history = []) => {
    const response = await api.post('/ai/chat', { message, history })
    return response.data
  },

  getChats: async (params = {}) => {
    const response = await api.get('/ai/chats', { params })
    return response.data
  },

  createChat: async (data = {}) => {
    const response = await api.post('/ai/chats', data)
    return response.data
  },

  getChatDetails: async (id) => {
    const response = await api.get(`/ai/chats/${id}`)
    return response.data
  },

  updateChat: async (id, data) => {
    const response = await api.put(`/ai/chats/${id}`, data)
    return response.data
  },

  deleteChat: async (id) => {
    const response = await api.delete(`/ai/chats/${id}`)
    return response.data
  },

  sendChatMessage: async (id, message, config = {}) => {
    const response = await api.post(`/ai/chats/${id}/messages`, { message }, config)
    return response.data
  },
}

export default aiService
