import axiosInstance from './axiosInstance';

export const appointmentApi = {
  /** GET /api/appointments/mechanics */
  getMechanics: () =>
    axiosInstance.get('/appointments/mechanics'),

  /** GET /api/appointments/mechanics/:id */
  getMechanicById: (id) =>
    axiosInstance.get(`/appointments/mechanics/${id}`),

  /** GET /api/appointments/mechanics/dashboard */
  getMechanicDashboard: () =>
    axiosInstance.get('/appointments/mechanics/dashboard'),

  /** GET /api/appointments/stats */
  getStats: () =>
    axiosInstance.get('/appointments/stats'),

  /** GET /api/appointments?status=&vehicleId=&page= */
  getAll: (params = {}) =>
    axiosInstance.get('/appointments', { params }),

  /** GET /api/appointments/:id */
  getById: (id) =>
    axiosInstance.get(`/appointments/${id}`),

  /** POST /api/appointments */
  create: (data) =>
    axiosInstance.post('/appointments', data),

  /** PUT /api/appointments/:id/reschedule */
  reschedule: (id, data) =>
    axiosInstance.put(`/appointments/${id}/reschedule`, data),

  /** PUT /api/appointments/:id/cancel */
  cancel: (id) =>
    axiosInstance.put(`/appointments/${id}/cancel`),

  /** PUT /api/appointments/:id/status */
  updateStatus: (id, status) =>
    axiosInstance.put(`/appointments/${id}/status`, { status }),

  /** POST /api/appointments/:id/review */
  submitReview: (id, rating, review) =>
    axiosInstance.post(`/appointments/${id}/review`, { rating, review }),
};
