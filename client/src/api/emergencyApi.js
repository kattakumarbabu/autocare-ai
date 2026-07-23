import axiosInstance from './axiosInstance';

export const emergencyApi = {
  /** POST /api/emergency/sos */
  triggerSOS: (payload) =>
    axiosInstance.post('/emergency/sos', payload),

  /** GET /api/emergency/nearby */
  getNearby: () =>
    axiosInstance.get('/emergency/nearby'),
};
