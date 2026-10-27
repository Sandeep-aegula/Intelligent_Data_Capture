import api from './api';

export const searchService = {
  async searchProject(projectId, query, limit = 20) {
    const response = await api.get(`/projects/${projectId}/search`, {
      params: { q: query, limit },
    });
    return { data: response.data };
  },
};
