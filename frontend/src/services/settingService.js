import api from './api';

export const settingService = {
  async getSettings(projectId) {
    const response = await api.get(`/projects/${projectId}/settings`);
    return { data: response.data };
  },

  async updateSettings(projectId, settingsData) {
    const response = await api.patch(`/projects/${projectId}/settings`, settingsData);
    return { data: response.data };
  },
};
