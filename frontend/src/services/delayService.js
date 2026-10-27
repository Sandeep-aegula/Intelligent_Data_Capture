import api from './api';

export const delayService = {
  async getDelayAnalysis(projectId) {
    const response = await api.get(`/projects/${projectId}/delays`);
    const delays = response.data || [];

    // Derive summary and root causes dynamically from database items
    const criticalImpactDays = delays
      .filter((d) => d.critical_path)
      .reduce((max, d) => Math.max(max, d.variance_days || 0), 0);

    const activeMitigations = delays.filter(
      (d) => d.mitigation_status && d.mitigation_status !== 'Mitigated'
    ).length;

    const causeMap = {};
    for (const d of delays) {
      const cause = d.root_cause || 'Other Variance';
      causeMap[cause] = (causeMap[cause] || 0) + 1;
    }

    const totalCauses = Object.values(causeMap).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#ef4444', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
    const rootCauses = Object.entries(causeMap).map(([cause, count], idx) => ({
      cause,
      count,
      percentage: Math.round((count / totalCauses) * 100),
      color: colors[idx % colors.length],
    }));

    const items = delays.map((d) => ({
      id: d.id,
      activityId: d.activity_id,
      activityName: d.activity_name,
      discipline: d.discipline,
      location: d.location,
      criticalPath: d.critical_path,
      baselineStart: d.baseline_start,
      baselineFinish: d.baseline_finish,
      forecastFinish: d.forecast_finish,
      varianceDays: d.variance_days,
      rootCause: d.root_cause,
      impact: d.impact,
      mitigationStatus: d.mitigation_status,
      mitigationPlan: d.mitigation_plan,
      loggedDate: d.logged_date,
      owner: d.owner,
    }));

    return {
      data: {
        summary: {
          totalDelayedActivities: delays.length,
          criticalPathImpactDays: criticalImpactDays,
          forecastedDelayCost: delays.length > 0 ? `$${delays.length * 25000}` : '$0',
          activeMitigationPlans: activeMitigations,
        },
        rootCauses,
        items,
      },
    };
  },

  async logDelay(projectId, delayData) {
    const payload = {
      category: delayData.category || 'Schedule Delay',
      title: delayData.title || delayData.rootCause || 'Unspecified Delay',
      description: delayData.description || delayData.mitigationPlan || '',
      reported_date: delayData.loggedDate || new Date().toISOString().split('T')[0],
      schedule_activity_id: delayData.activityId,
      severity: delayData.impact || 'Medium',
      delay_days: delayData.varianceDays || 0,
      is_critical_path_impact: Boolean(delayData.criticalPath),
      mitigation_action: delayData.mitigationPlan,
    };
    const response = await api.post(`/projects/${projectId}/delays`, payload);
    return { data: response.data };
  },

  async updateMitigation(projectId, delayId, plan) {
    const response = await api.patch(`/projects/${projectId}/delays/${delayId}`, {
      mitigation_plan: plan,
    });
    return { data: response.data };
  },
};
