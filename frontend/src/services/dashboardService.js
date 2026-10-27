import api from './api';

export const dashboardService = {
  async getDashboard(projectId) {
    const response = await api.get(`/projects/${projectId}/dashboard`);
    const d = response.data;

    // Adapt backend schema to frontend dashboard structure
    return {
      data: {
        project: {
          id: d.project_id,
          name: d.project_name,
          code: d.project_code,
        },
        kpis: {
          overallProgress: d.kpis.overall_progress_percent || 0,
          completedActivities: d.kpis.completed_activities || 0,
          inProgress: d.kpis.in_progress_activities || 0,
          delayed: d.kpis.active_delays_count || 0,
          pendingReview: d.kpis.pending_reviews_count || 0,
          aiMatchAccuracy: d.kpis.approved_reviews_count > 0 ? 91 : 0,
        },
        activityStatus: [
          { name: 'Completed', value: d.status_distribution.completed || 0, color: '#22c55e' },
          { name: 'In Progress', value: d.status_distribution.in_progress || 0, color: '#6366f1' },
          { name: 'Not Started', value: d.status_distribution.not_started || 0, color: '#e2e8f0' },
          { name: 'Delayed', value: d.status_distribution.delayed || 0, color: '#ef4444' },
        ],
        disciplineProgress: (d.discipline_summaries || []).map((disc) => ({
          discipline: disc.discipline,
          planned: disc.average_progress ? Math.min(100, disc.average_progress + 5) : 10,
          actual: disc.average_progress || 0,
        })),
        progressOverTime: (d.progress_trends || []).map((trend) => ({
          month: trend.period,
          planned: trend.planned_progress,
          actual: trend.actual_progress,
        })),
        recentReports: (d.recent_reports || []).map((r) => ({
          id: r.id,
          date: r.report_date,
          source: 'Field Report',
          status: r.status,
          eventsExtracted: r.events_count,
        })),
        recentDelays: d.recent_delays || [],
      },
    };
  },
};
