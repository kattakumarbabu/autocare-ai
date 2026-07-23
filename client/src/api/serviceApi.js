import axiosInstance from './axiosInstance';

const buildFormData = (data) => {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        fd.append(key, JSON.stringify(value));
      } else {
        fd.append(key, value);
      }
    }
  });
  return fd;
};

const multipartConfig = { headers: { 'Content-Type': undefined } };

export const serviceApi = {
  /** GET /api/services/vehicle/:vehicleId?search=&serviceType=&sort=&page=&limit= */
  getByVehicle: (vehicleId, params = {}) =>
    axiosInstance.get(`/services/vehicle/${vehicleId}`, { params }),

  /** GET /api/services/:id */
  getById: (id) =>
    axiosInstance.get(`/services/${id}`),

  /** POST /api/services (multipart) */
  create: (data) =>
    axiosInstance.post('/services', buildFormData(data), multipartConfig),

  /** PUT /api/services/:id (multipart) */
  update: (id, data) =>
    axiosInstance.put(`/services/${id}`, buildFormData(data), multipartConfig),

  /** DELETE /api/services/:id */
  remove: (id) =>
    axiosInstance.delete(`/services/${id}`),
};
