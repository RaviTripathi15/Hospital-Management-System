import api from './api'

const inventoryService = {
  getAll: async (params = {}) => {
    const response = await api.get('/inventory', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/inventory/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/inventory', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/inventory/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`)
    return response.data
  },

  updateStock: async (id, adjustmentData) => {
    const response = await api.patch(`/inventory/${id}/stock`, adjustmentData)
    return response.data
  },

  getLowStock: async (params = {}) => {
    const response = await api.get('/inventory/low-stock', { params })
    return response.data
  },

  getExpiring: async (days = 30, params = {}) => {
    const response = await api.get('/inventory/expiring', { params: { days, ...params } })
    return response.data
  },

  getByCentre: async (centreId, params = {}) => {
    const response = await api.get(`/inventory/center/${centreId}`, { params })
    return response.data
  },
}

export default inventoryService
