import axiosInstance from './axiosInstance';

export const aiApi = {
  /** GET /api/ai/insights */
  getInsights: () =>
    axiosInstance.get('/ai/insights'),

  /** GET /api/ai/monthly-report */
  getMonthlyReport: () =>
    axiosInstance.get('/ai/monthly-report'),

  /** POST /api/ai/chat { prompt } */
  chat: (prompt) =>
    axiosInstance.post('/ai/chat', { prompt }),
};
