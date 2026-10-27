import api from './api';

export const projectService = {
  async getProjects() {
    const response = await api.get('/projects');
    return { data: response.data };
  },

  async getProject(projectId) {
    const response = await api.get(`/projects/${projectId}`);
    return { data: response.data };
  },

  async createProject(projectData) {
    const start = projectData.plannedStartDate || projectData.plannedStart;
    const finish = projectData.plannedEndDate || projectData.plannedFinish;
    const payload = {
      name: projectData.name,
      code: projectData.code,
      description: projectData.description,
      location: projectData.location,
      status: projectData.status || 'In Progress',
      planned_start_date: start ? new Date(start).toISOString() : null,
      planned_end_date: finish ? new Date(finish).toISOString() : null,
      client_name: projectData.clientName || 'Project Client',
    };
    const response = await api.post('/projects', payload);
    return { data: response.data };
  },

  async updateProject(projectId, projectData) {
    const response = await api.patch(`/projects/${projectId}`, projectData);
    return { data: response.data };
  },

  async deleteProject(projectId, hardDelete = false) {
    const response = await api.delete(`/projects/${projectId}`, {
      params: { hard_delete: hardDelete },
    });
    return { data: response.data };
  },
};
