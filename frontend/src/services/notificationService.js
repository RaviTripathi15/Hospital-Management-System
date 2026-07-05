import api from './api'

const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notifications', { params })
    return response.data
  },

  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  markAllRead: async () => {
    const response = await api.patch('/notifications/read-all')
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },

  deleteAll: async () => {
    const response = await api.delete('/notifications')
    return response.data
  },
}

export default notificationService
