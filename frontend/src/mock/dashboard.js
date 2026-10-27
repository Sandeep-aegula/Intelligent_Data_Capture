// Mock dashboard data for frontend demonstration
// These are demo values — not connected to any real backend

export const getMockDashboardData = (projectId) => {
  const dashboards = {
    'proj-001': {
      kpis: {
        overallProgress: 34,
        completedActivities: 826,
        inProgress: 312,
        delayed: 47,
        pendingReview: 12,
        aiMatchAccuracy: 89,
      },
      progressOverTime: [
        { month: 'Apr 2026', planned: 12, actual: 11 },
        { month: 'May 2026', planned: 16, actual: 15 },
        { month: 'Jun 2026', planned: 20, actual: 18 },
        { month: 'Jul 2026', planned: 24, actual: 22 },
        { month: 'Aug 2026', planned: 28, actual: 26 },
        { month: 'Sep 2026', planned: 32, actual: 30 },
        { month: 'Oct 2026', planned: 36, actual: 34 },
      ],
      activityStatus: [
        { name: 'Completed', value: 826, color: '#22c55e' },
        { name: 'In Progress', value: 312, color: '#6366f1' },
        { name: 'Not Started', value: 1245, color: '#e2e8f0' },
        { name: 'Delayed', value: 47, color: '#ef4444' },
      ],
      disciplineProgress: [
        { discipline: 'Civil', planned: 45, actual: 42 },
        { discipline: 'Structural', planned: 38, actual: 35 },
        { discipline: 'Mechanical', planned: 30, actual: 28 },
        { discipline: 'Piping', planned: 35, actual: 32 },
        { discipline: 'Electrical', planned: 25, actual: 22 },
        { discipline: 'Instrumentation', planned: 20, actual: 18 },
      ],
      recentReports: [
        { id: 'rpt-104', date: '2026-10-07', source: 'PDF', status: 'Processed', eventsExtracted: 8 },
        { id: 'rpt-103', date: '2026-10-06', source: 'Text', status: 'Verified', eventsExtracted: 5 },
        { id: 'rpt-102', date: '2026-10-05', source: 'PDF', status: 'Verified', eventsExtracted: 12 },
        { id: 'rpt-101', date: '2026-10-04', source: 'Excel', status: 'Verified', eventsExtracted: 6 },
        { id: 'rpt-100', date: '2026-10-03', source: 'PDF', status: 'Verified', eventsExtracted: 9 },
      ],
      recentMatches: [
        {
          reportId: 'rpt-104',
          reportName: 'Daily Report #104',
          extractedActivity: 'CS Pipeline Installation',
          matchedActivity: 'L6-101',
          matchedActivityName: 'Install 10-inch CS Pipeline — Unit A',
          confidence: 92,
          status: 'Approved',
        },
        {
          reportId: 'rpt-104',
          reportName: 'Daily Report #104',
          extractedActivity: 'Concrete Foundation Work',
          matchedActivity: 'L6-204',
          matchedActivityName: 'Pour Foundation — Pump House B',
          confidence: 88,
          status: 'Approved',
        },
        {
          reportId: 'rpt-103',
          reportName: 'Daily Report #103',
          extractedActivity: 'Cable Tray Installation',
          matchedActivity: 'L6-312',
          matchedActivityName: 'Install Cable Tray — Substation C',
          confidence: 61,
          status: 'Needs Review',
        },
        {
          reportId: 'rpt-103',
          reportName: 'Daily Report #103',
          extractedActivity: 'Structural Steel Erection',
          matchedActivity: 'L6-155',
          matchedActivityName: 'Erect Steel — Pipe Rack Area D',
          confidence: 95,
          status: 'Approved',
        },
        {
          reportId: 'rpt-102',
          reportName: 'Daily Report #102',
          extractedActivity: 'Underground Piping',
          matchedActivity: 'L6-089',
          matchedActivityName: 'Install UG SS Pipeline — Unit E',
          confidence: 54,
          status: 'Needs Review',
        },
      ],
    },
    'proj-002': {
      kpis: {
        overallProgress: 58,
        completedActivities: 719,
        inProgress: 186,
        delayed: 23,
        pendingReview: 5,
        aiMatchAccuracy: 92,
      },
      progressOverTime: [
        { month: 'Apr 2026', planned: 40, actual: 39 },
        { month: 'May 2026', planned: 44, actual: 43 },
        { month: 'Jun 2026', planned: 48, actual: 47 },
        { month: 'Jul 2026', planned: 52, actual: 51 },
        { month: 'Aug 2026', planned: 55, actual: 54 },
        { month: 'Sep 2026', planned: 58, actual: 56 },
        { month: 'Oct 2026', planned: 62, actual: 58 },
      ],
      activityStatus: [
        { name: 'Completed', value: 719, color: '#22c55e' },
        { name: 'In Progress', value: 186, color: '#6366f1' },
        { name: 'Not Started', value: 312, color: '#e2e8f0' },
        { name: 'Delayed', value: 23, color: '#ef4444' },
      ],
      disciplineProgress: [
        { discipline: 'Civil', planned: 70, actual: 68 },
        { discipline: 'Piping', planned: 55, actual: 52 },
        { discipline: 'Mechanical', planned: 48, actual: 46 },
        { discipline: 'Electrical', planned: 42, actual: 40 },
      ],
      recentReports: [
        { id: 'rpt-056', date: '2026-10-06', source: 'PDF', status: 'Verified', eventsExtracted: 6 },
        { id: 'rpt-055', date: '2026-10-05', source: 'Text', status: 'Verified', eventsExtracted: 4 },
      ],
      recentMatches: [
        {
          reportId: 'rpt-056',
          reportName: 'Daily Report #56',
          extractedActivity: 'Valve Station Assembly',
          matchedActivity: 'L6-045',
          matchedActivityName: 'Assemble Valve Station VS-003',
          confidence: 94,
          status: 'Approved',
        },
      ],
    },
    'proj-003': {
      kpis: {
        overallProgress: 8,
        completedActivities: 148,
        inProgress: 45,
        delayed: 3,
        pendingReview: 2,
        aiMatchAccuracy: 85,
      },
      progressOverTime: [
        { month: 'Jul 2026', planned: 2, actual: 2 },
        { month: 'Aug 2026', planned: 4, actual: 4 },
        { month: 'Sep 2026', planned: 6, actual: 6 },
        { month: 'Oct 2026', planned: 10, actual: 8 },
      ],
      activityStatus: [
        { name: 'Completed', value: 148, color: '#22c55e' },
        { name: 'In Progress', value: 45, color: '#6366f1' },
        { name: 'Not Started', value: 1654, color: '#e2e8f0' },
        { name: 'Delayed', value: 3, color: '#ef4444' },
      ],
      disciplineProgress: [
        { discipline: 'Civil', planned: 12, actual: 10 },
        { discipline: 'Mechanical', planned: 8, actual: 7 },
        { discipline: 'Electrical', planned: 5, actual: 4 },
      ],
      recentReports: [
        { id: 'rpt-012', date: '2026-10-05', source: 'Text', status: 'Processed', eventsExtracted: 3 },
      ],
      recentMatches: [],
    },
  };

  return dashboards[projectId] || dashboards['proj-001'];
};
