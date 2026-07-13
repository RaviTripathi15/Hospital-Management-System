import api from './api'

const roleRequestService = {
  createRequest: async (formData) => {
    const response = await api.post('/role-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getMyRequest: async () => {
    const response = await api.get('/role-requests/me')
    return response.data
  },

  getAllRequests: async (params = {}) => {
    const response = await api.get('/role-requests', { params })
    return response.data
  },

  approveRequest: async (id, adminFeedback) => {
    const response = await api.put(`/role-requests/${id}/approve`, { adminFeedback })
    return response.data
  },

  rejectRequest: async (id, adminFeedback) => {
    const response = await api.put(`/role-requests/${id}/reject`, { adminFeedback })
    return response.data
  },
}

export default roleRequestService
