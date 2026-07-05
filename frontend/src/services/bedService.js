import api from './api'

const bedService = {
  allocate: async (data) => {
    const response = await api.post('/beds/allocate', data)
    return response.data
  },

  release: async (id) => {
    const response = await api.post(`/beds/release/${id}`)
    return response.data
  },

  getActive: async (params = {}) => {
    const response = await api.get('/beds/active', { params })
    return response.data
  },

  getHistory: async (params = {}) => {
    const response = await api.get('/beds/history', { params })
    return response.data
  },

  getStats: async (params = {}) => {
    const response = await api.get('/beds/stats', { params })
    return response.data
  },
}

export default bedService
