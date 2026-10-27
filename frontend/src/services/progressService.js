import api from './api';

export const progressService = {
  async getVerifiedProgress(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/progress`, { params });
    return { data: response.data };
  },

  async getActivityProgress(projectId, activityId) {
    const response = await api.get(`/projects/${projectId}/progress/activities/${activityId}`);
    return { data: response.data };
  },

  async createProgressRecord(projectId, data) {
    const response = await api.post(`/projects/${projectId}/progress/records`, data);
    return { data: response.data };
  },
};
