import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || 'Erro na requisição'
    return Promise.reject(new Error(msg))
  }
)

export const clientesAPI = {
  listar: () => api.get('/clientes'),
  buscar: id => api.get(`/clientes/${id}`),
  criar: data => api.post('/clientes', data),
  atualizar: (id, data) => api.put(`/clientes/${id}`, data),
  remover: id => api.delete(`/clientes/${id}`)
}

export const petsAPI = {
  listar: () => api.get('/pets'),
  buscar: id => api.get(`/pets/${id}`),
  criar: data => api.post('/pets', data),
  atualizar: (id, data) => api.put(`/pets/${id}`, data),
  remover: id => api.delete(`/pets/${id}`),
  uploadImagem: (id, file) => {
    const form = new FormData()
    form.append('imagem', file)
    return api.post(`/pets/${id}/imagem`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const agendamentosAPI = {
  listar: () => api.get('/agendamentos'),
  buscar: id => api.get(`/agendamentos/${id}`),
  criar: data => api.post('/agendamentos', data),
  atualizar: (id, data) => api.put(`/agendamentos/${id}`, data),
  remover: id => api.delete(`/agendamentos/${id}`)
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  recent: () => api.get('/dashboard/recent')
}

export const healthAPI = {
  check: () => api.get('/health')
}
