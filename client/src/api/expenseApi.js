import axiosInstance from './axiosInstance';

export const expenseApi = {
  /** GET /api/expenses?search=&category=&vehicleId=&startDate=&endDate=&sort=&page=&limit= */
  getAll: (params = {}) =>
    axiosInstance.get('/expenses', { params }),

  /** GET /api/expenses/analytics?vehicleId= */
  getAnalytics: (vehicleId = '') =>
    axiosInstance.get('/expenses/analytics', { params: { vehicleId } }),

  /** GET /api/expenses/:id */
  getById: (id) =>
    axiosInstance.get(`/expenses/${id}`),

  /** POST /api/expenses (FormData for receipt file) */
  create: (formData) =>
    axiosInstance.post('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** PUT /api/expenses/:id (FormData for optional receipt file) */
  update: (id, formData) =>
    axiosInstance.put(`/expenses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /** DELETE /api/expenses/:id */
  remove: (id) =>
    axiosInstance.delete(`/expenses/${id}`),
};
