import api from './api';

export const matchingService = {
  async getMatches(projectId, params = {}) {
    const response = await api.get(`/projects/${projectId}/reviews`, { params });
    const list = response.data || [];
    const adapted = list.map((r) => ({
      ...r,
      extractedActivity: r.event_description || 'Activity',
      extractedEvent: {
        eventType: r.event_type || 'IN_PROGRESS',
        activity: r.event_description || 'Activity',
        discipline: r.discipline,
        location: r.location,
        quantity: r.quantity,
        unit: r.unit,
        progress: 'Not specified',
        evidence: r.evidence_text,
      },
      candidates: (r.candidates || []).map((c) => ({
        ...c,
        activityId: c.activity_code || c.activity_id,
        name: c.activity_name,
        fuzzyScore: Math.round(c.fuzzy_score || 0),
        confidence: Math.round(c.combined_score || c.fuzzy_score || 0),
        reason: c.rationale,
      })),
      selectedCandidate: r.final_activity_code || r.suggested_activity_code || r.suggested_activity_id,
      confidence: Math.round(r.confidence || 0),
    }));
    return { data: adapted };
  },

  async getPendingReviews(projectId) {
    const response = await api.get(`/projects/${projectId}/reviews`, {
      params: { status: 'Needs Review' },
    });
    return { data: response.data };
  },

  async approveMatch(projectId, reviewId, data = {}) {
    const response = await api.post(`/projects/${projectId}/reviews/${reviewId}/approve`, {
      planner_name: data.plannerName || 'Project Planner',
      notes: data.notes,
      confirmed_quantity: data.confirmedQuantity,
      confirmed_percent_complete: data.confirmedPercent,
    });
    return { data: response.data };
  },

  async rejectMatch(projectId, reviewId, reason = 'Rejected by planner') {
    const response = await api.post(`/projects/${projectId}/reviews/${reviewId}/reject`, {
      reason,
      planner_name: 'Project Planner',
    });
    return { data: response.data };
  },

  async reassignMatch(projectId, reviewId, newActivityId, reason = 'Reassigned to correct WBS activity') {
    const response = await api.post(`/projects/${projectId}/reviews/${reviewId}/reassign`, {
      new_activity_id: newActivityId,
      reason,
      planner_name: 'Project Planner',
    });
    return { data: response.data };
  },

  async requestContext(projectId, reviewId, question) {
    const response = await api.post(`/projects/${projectId}/reviews/${reviewId}/request-context`, {
      question,
      planner_name: 'Project Planner',
    });
    return { data: response.data };
  },

  async matchEvent(projectId, eventId) {
    const response = await api.post(`/projects/${projectId}/events/${eventId}/match`);
    return { data: response.data };
  },

  async batchMatch(projectId, reportId) {
    const response = await api.post(`/projects/${projectId}/matching/batch`, { report_id: reportId });
    return { data: response.data };
  },
};
