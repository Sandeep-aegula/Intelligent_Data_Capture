import api from './api';

function normalizeNode(node) {
  if (!node) return node;
  return {
    ...node,
    activityId: node.activity_code || node.activityId || node.id,
    plannedStart: node.planned_start || node.plannedStart,
    plannedFinish: node.planned_finish || node.plannedFinish,
    actualStart: node.actual_start || node.actualStart,
    actualFinish: node.actual_finish || node.actualFinish,
    criticalPath: node.critical_path ?? node.criticalPath ?? false,
    children: (node.children || []).map(normalizeNode),
  };
}

export const scheduleService = {
  async getScheduleHierarchy(projectId) {
    const response = await api.get(`/projects/${projectId}/schedule/tree`);
    const tree = response.data;
    const rawRoot = Array.isArray(tree) && tree.length > 0 ? tree[0] : tree;
    return { data: normalizeNode(rawRoot) };
  },

  async getScheduleActivities(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/schedule/activities`, { params });
    const list = response.data || [];
    return {
      data: list.map((a) => ({
        ...a,
        activityId: a.activity_code || a.activityId || a.id,
        plannedStart: a.planned_start || a.plannedStart,
        plannedFinish: a.planned_finish || a.plannedFinish,
        actualStart: a.actual_start || a.actualStart,
        actualFinish: a.actual_finish || a.actualFinish,
        criticalPath: a.critical_path ?? a.criticalPath ?? false,
      })),
    };
  },

  async getActivity(projectId, activityId) {
    const response = await api.get(`/projects/${projectId}/schedule/activities/${activityId}`);
    return { data: response.data };
  },

  async updateActivity(projectId, activityId, updateData) {
    const response = await api.patch(`/projects/${projectId}/schedule/activities/${activityId}`, updateData);
    return { data: response.data };
  },

  async createImportStage(projectId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${projectId}/schedule/imports`, formData);
    return { data: response.data };
  },

  async getImportPreview(projectId, importId) {
    const response = await api.get(`/projects/${projectId}/schedule/imports/${importId}`);
    return { data: response.data };
  },

  async validateImportStage(projectId, importId, mapping = null) {
    const response = await api.post(`/projects/${projectId}/schedule/imports/${importId}/validate`, mapping || undefined);
    return { data: response.data };
  },

  async uploadSchedule(projectId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await api.post(`/projects/${projectId}/schedule/imports`, formData);
    const importId = uploadRes.data.import_id;

    // Validate import stage automatically
    const valRes = await api.post(`/projects/${projectId}/schedule/imports/${importId}/validate`);

    return {
      data: {
        success: valRes.data.is_valid,
        importId,
        fileName: uploadRes.data.filename,
        activitiesImported: valRes.data.valid_rows_count || uploadRes.data.total_rows,
        warnings: valRes.data.warnings || [],
        errors: valRes.data.errors || [],
      },
    };
  },

  async commitImport(projectId, importId, versionName) {
    const response = await api.post(`/projects/${projectId}/schedule/imports/${importId}/commit`, {
      version_name: versionName,
    });
    return { data: response.data };
  },
};
