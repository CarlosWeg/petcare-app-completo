import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
})

function asArray(value) {
  return Array.isArray(value) ? value : []
}

export const petsAPI = {
  list: () => api.get('/pets').then(r => asArray(r.data)),
  get: (id) => api.get(`/pets/${id}`).then(r => r.data),
  create: (data) => api.post('/pets', data).then(r => r.data),
  update: (id, data) => api.put(`/pets/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/pets/${id}`).then(r => r.data),
}

export const clientesAPI = {
  list: () => api.get('/clientes').then(r => asArray(r.data)),
  create: (data) => api.post('/clientes', data).then(r => r.data),
}

export const agendamentosAPI = {
  list: (params) => api.get('/agendamentos', { params }).then(r => asArray(r.data)),
  get: (id) => api.get(`/agendamentos/${id}`).then(r => r.data),
  create: (data) => api.post('/agendamentos', data).then(r => r.data),
  updateStatus: (id, status) => api.put(`/agendamentos/${id}/status`, { status }).then(r => r.data),
}

export const servicosAPI = {
  list: () => api.get('/servicos').then(r => asArray(r.data)),
}

export const statsAPI = {
  get: () => api.get('/stats').then(r => r.data),
}

export default api
