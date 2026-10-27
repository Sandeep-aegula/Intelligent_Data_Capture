import api from './api';

export const reportService = {
  async getReports(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/reports`, { params });
    const list = response.data || [];
    return {
      data: list.map((r) => ({
        ...r,
        reportNumber: r.report_number,
        date: r.report_date,
        sourceType: r.source_type,
        uploadedBy: r.uploaded_by,
        eventsExtracted: r.extracted_event_count ?? 0,
      })),
    };
  },

  async getReport(projectId, reportId) {
    const response = await api.get(`/projects/${projectId}/reports/${reportId}`);
    const r = response.data;
    return {
      data: {
        ...r,
        reportNumber: r.report_number,
        date: r.report_date,
        sourceType: r.source_type,
        uploadedBy: r.uploaded_by,
        eventsExtracted: r.extracted_event_count ?? 0,
      },
    };
  },

  async uploadReport(projectId, file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.reportDate) formData.append('report_date', metadata.reportDate);
    if (metadata.author) formData.append('author', metadata.author);

    const response = await api.post(`/projects/${projectId}/reports/upload`, formData);
    return {
      data: {
        success: true,
        reportId: response.data.id,
        fileName: file.name,
        status: response.data.status,
      },
    };
  },

  async createDirectReport(projectId, reportData) {
    const response = await api.post(`/projects/${projectId}/reports`, reportData);
    return { data: response.data };
  },

  async extractEvents(projectId, reportId) {
    const response = await api.post(`/projects/${projectId}/reports/${reportId}/extract`);
    return { data: response.data };
  },

  async getReportEvents(projectId, reportId) {
    const response = await api.get(`/projects/${projectId}/reports/${reportId}/events`);
    return { data: response.data };
  },

  async updateExtractedEvent(projectId, eventId, updateData) {
    const response = await api.patch(`/projects/${projectId}/events/${eventId}`, updateData);
    return { data: response.data };
  },

  async validateExtractedEvent(projectId, eventId) {
    const response = await api.post(`/projects/${projectId}/events/${eventId}/validate`);
    return { data: response.data };
  },
};
