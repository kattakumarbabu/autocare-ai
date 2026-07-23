import axiosInstance from './axiosInstance';

export const serviceCenterApi = {
  /** GET /api/service-centers/nearby?lat=&lng=&radius=&category=&brand=&service= */
  getNearby: (params = {}) =>
    axiosInstance.get('/service-centers/nearby', { params }),

  /** GET /api/service-centers?search=&category=&brand=&service= */
  search: (params = {}) =>
    axiosInstance.get('/service-centers', { params }),

  /** GET /api/service-centers/:id */
  getById: (id) =>
    axiosInstance.get(`/service-centers/${id}`),
};
