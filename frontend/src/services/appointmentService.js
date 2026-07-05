import api from './api'

const appointmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/appointments', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/appointments', data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/appointments/${id}`)
    return response.data
  },

  cancel: async (id, reason) => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason })
    return response.data
  },

  getToday: async (params = {}) => {
    const response = await api.get('/appointments/today', { params })
    return response.data
  },

  getByCenter: async (centerId, params = {}) => {
    const response = await api.get(`/appointments/center/${centerId}`, { params })
    return response.data
  },

  getByDoctor: async (doctorId, params = {}) => {
    const response = await api.get(`/appointments/doctor/${doctorId}`, { params })
    return response.data
  },

  getMyAppointments: async (params = {}) => {
    const response = await api.get('/appointments/my', { params })
    return response.data
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get('/appointments/available-slots', {
      params: { doctorId, date },
    })
    return response.data
  },
}

export default appointmentService
