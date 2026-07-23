import axiosInstance from './axiosInstance';

export const performanceReportApi = {
  /** GET /api/performance-report/vehicle/:vehicleId */
  getByVehicleId: (vehicleId) =>
    axiosInstance.get(`/performance-report/vehicle/${vehicleId}`),
};
