import axiosInstance from './axiosInstance';

export const fuelApi = {
  /** GET /api/fuel?search=&vehicleId=&startDate=&endDate=&sort=&page=&limit= */
  getAll: (params = {}) =>
    axiosInstance.get('/fuel', { params }),

  /** GET /api/fuel/stats?vehicleId= */
  getStats: (vehicleId = '') =>
    axiosInstance.get('/fuel/stats', { params: { vehicleId } }),

  /** GET /api/fuel/:id */
  getById: (id) =>
    axiosInstance.get(`/fuel/${id}`),

  /** POST /api/fuel */
  create: (data) =>
    axiosInstance.post('/fuel', data),

  /** PUT /api/fuel/:id */
  update: (id, data) =>
    axiosInstance.put(`/fuel/${id}`, data),

  /** DELETE /api/fuel/:id */
  remove: (id) =>
    axiosInstance.delete(`/fuel/${id}`),
};
