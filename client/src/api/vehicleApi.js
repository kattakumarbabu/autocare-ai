import axiosInstance from './axiosInstance';

const buildFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, value);
    }
  });
  return fd;
};

// Tell axios to let the browser set Content-Type with correct multipart boundary
const multipartConfig = { headers: { 'Content-Type': undefined } };

export const vehicleApi = {
  /** GET /api/vehicles?search=&vehicleType=&sort=&page=&limit= */
  getAll:   (params = {}) => axiosInstance.get('/vehicles', { params }),

  /** GET /api/vehicles/stats */
  getStats: () => axiosInstance.get('/vehicles/stats'),

  /** GET /api/vehicles/:id */
  getById:  (id) => axiosInstance.get(`/vehicles/${id}`),

  /** POST /api/vehicles  (multipart) */
  create:   (data) => axiosInstance.post('/vehicles', buildFormData(data), multipartConfig),

  /** PUT /api/vehicles/:id  (multipart) */
  update:   (id, data) => axiosInstance.put(`/vehicles/${id}`, buildFormData(data), multipartConfig),

  /** DELETE /api/vehicles/:id */
  remove:   (id) => axiosInstance.delete(`/vehicles/${id}`),
};
