import axiosInstance from './axiosInstance';

export const advancedAnalyticsApi = {
  /** GET /api/advanced-analytics */
  getDashboard: () =>
    axiosInstance.get('/advanced-analytics'),
};
