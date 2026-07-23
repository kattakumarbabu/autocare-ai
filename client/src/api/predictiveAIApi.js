import axiosInstance from './axiosInstance';

export const predictiveAIApi = {
  /** GET /api/predictive-ai/dashboard */
  getDashboard: () =>
    axiosInstance.get('/predictive-ai/dashboard'),

  /** GET /api/predictive-ai/timeline */
  getTimeline: () =>
    axiosInstance.get('/predictive-ai/timeline'),

  /** GET /api/predictive-ai/reports/monthly */
  getMonthlyReport: () =>
    axiosInstance.get('/predictive-ai/reports/monthly'),

  /** GET /api/predictive-ai/reports/annual */
  getAnnualReport: () =>
    axiosInstance.get('/predictive-ai/reports/annual'),

  /** POST /api/predictive-ai/chat { prompt } */
  chat: (prompt) =>
    axiosInstance.post('/predictive-ai/chat', { prompt }),
};
