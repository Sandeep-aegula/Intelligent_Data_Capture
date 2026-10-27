import api from './api';

export const auditService = {
  async getAuditTrail(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/audit`, { params });
    const items = response.data?.items || [];
    return {
      data: items.map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action,
        category: entry.category,
        user: entry.user,
        entityType: entry.entity_type,
        entityId: entry.entity_id,
        details: entry.details,
        confidence: entry.confidence,
        previousValue: entry.previous_value,
        newValue: entry.newValue,
      })),
    };
  },

  async exportAuditCsv(projectId) {
    const response = await api.get(`/projects/${projectId}/audit/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
