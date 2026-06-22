import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
})

export const petsAPI = {
  list: () => api.get('/pets').then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  get: (id) => api.get(`/pets/${id}`).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  create: (data) => api.post('/pets', data).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  update: (id, data) => api.put(`/pets/${id}`, data).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  delete: (id) => api.delete(`/pets/${id}`).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
}

export const clientesAPI = {
  list: () => api.get('/clientes').then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  create: (data) => api.post('/clientes', data).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
}

export const agendamentosAPI = {
  list: (params) => api.get('/agendamentos', { params }).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  get: (id) => api.get(`/agendamentos/${id}`).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  create: (data) => api.post('/agendamentos', data).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
  updateStatus: (id, status) => api.put(`/agendamentos/${id}/status`, { status }).then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
}

export const servicosAPI = {
  list: () => api.get('/servicos').then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
}

export const statsAPI = {
  get: () => api.get('/stats').then(r => Array.isArray(r.data) || typeof r.data === 'object' ? r.data : []),
}

export default api
