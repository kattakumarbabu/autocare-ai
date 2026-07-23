import axiosInstance from './axiosInstance';

export const documentApi = {
  /** GET /api/documents?search=&documentType=&vehicleId=&sort=&page=&limit= */
  getAll: (params = {}) =>
    axiosInstance.get('/documents', { params }),

  /** GET /api/documents/stats?vehicleId= */
  getStats: (vehicleId = '') =>
    axiosInstance.get('/documents/stats', { params: { vehicleId } }),

  /** GET /api/documents/:id */
  getById: (id) =>
    axiosInstance.get(`/documents/${id}`),

  /** POST /api/documents (FormData for file upload) */
  create: (formData) =>
    axiosInstance.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** PUT /api/documents/:id (FormData for optional file replacement) */
  update: (id, formData) =>
    axiosInstance.put(`/documents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** DELETE /api/documents/:id */
  remove: (id) =>
    axiosInstance.delete(`/documents/${id}`),
};
