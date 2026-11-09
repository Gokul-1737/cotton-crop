import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export const predictDisease = (formData) =>
  api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getModelInfo = () => api.get('/model-info')
export const getEvaluation = () => api.get('/evaluation')
export const getDatasetStats = () => api.get('/dataset/stats')
export const importDataset = (formData) =>
  api.post('/dataset/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const getHistory = (limit = 50, offset = 0) =>
  api.get(`/history?limit=${limit}&offset=${offset}`)
export const getPrediction = (id) => api.get(`/history/${id}`)
export const deletePrediction = (id) => api.delete(`/history/${id}`)
export const getHealth = () => api.get('/health')

export default api

