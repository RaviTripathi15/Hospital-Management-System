import api from './api'

const patientService = {
  getAll: async (params = {}) => {
    const response = await api.get('/patients', { params })
    return response.data
  },

  getMyProfile: async () => {
    const response = await api.get('/patients/my-profile')
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/patients/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/patients', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/patients/${id}`)
    return response.data
  },

  search: async (query, params = {}) => {
    const response = await api.get('/patients/search', { params: { q: query, ...params } })
    return response.data
  },

  getByCenter: async (centerId, params = {}) => {
    const response = await api.get(`/patients/center/${centerId}`, { params })
    return response.data
  },

  getHistory: async (id) => {
    const response = await api.get(`/patients/${id}/history`)
    return response.data
  },

  addVisitNote: async (id, noteData) => {
    const response = await api.post(`/patients/${id}/visit`, noteData)
    return response.data
  },
}

export default patientService
