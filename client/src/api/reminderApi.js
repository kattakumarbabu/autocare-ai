import axiosInstance from './axiosInstance';

export const reminderApi = {
  /** GET /api/reminders?search=&reminderType=&status=&priority=&vehicleId=&sort=&page=&limit= */
  getAll: (params = {}) =>
    axiosInstance.get('/reminders', { params }),

  /** GET /api/reminders/stats */
  getStats: () =>
    axiosInstance.get('/reminders/stats'),

  /** GET /api/reminders/:id */
  getById: (id) =>
    axiosInstance.get(`/reminders/${id}`),

  /** POST /api/reminders */
  create: (data) =>
    axiosInstance.post('/reminders', data),

  /** PUT /api/reminders/:id */
  update: (id, data) =>
    axiosInstance.put(`/reminders/${id}`, data),

  /** PUT /api/reminders/:id/complete */
  complete: (id) =>
    axiosInstance.put(`/reminders/${id}/complete`),

  /** PUT /api/reminders/:id/snooze */
  snooze: (id, days = 3) =>
    axiosInstance.put(`/reminders/${id}/snooze`, { days }),

  /** PUT /api/reminders/:id/restore */
  restore: (id) =>
    axiosInstance.put(`/reminders/${id}/restore`),

  /** DELETE /api/reminders/:id */
  remove: (id) =>
    axiosInstance.delete(`/reminders/${id}`),
};
