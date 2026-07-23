import axiosInstance from './axiosInstance';

export const resaleAIApi = {
  /** GET /api/resale-ai/vehicle/:vehicleId */
  getPrediction: (vehicleId) =>
    axiosInstance.get(`/resale-ai/vehicle/${vehicleId}`),
};
