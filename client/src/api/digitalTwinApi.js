import axiosInstance from './axiosInstance';

export const digitalTwinApi = {
  /** GET /api/digital-twin/vehicle/:vehicleId */
  getByVehicleId: (vehicleId) =>
    axiosInstance.get(`/digital-twin/vehicle/${vehicleId}`),
};
