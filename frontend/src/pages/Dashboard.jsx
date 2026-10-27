import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Sparkles,
  Calendar,
  MapPin,
  UploadCloud,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { getMockDashboardData } from '../mock/dashboard';
import { dashboardService } from '../services/dashboardService';
import { KPICard } from '../components/dashboard/KPICard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardTitle } from '../components/common/Card';

const statusColors = {
  Completed: '#22c55e',
  'In Progress': '#4f46e5',
  'Not Started': '#cbd5e1',
  Delayed: '#ef4444',
};

export default function Dashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectMatches, projectReports } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const [liveData, setLiveData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      try {
        const res = await dashboardService.getDashboard(activeProjectId);
        if (isMounted && res?.data) {
          setLiveData(res.data);
        }
      } catch (err) {
        console.warn('Backend dashboard API offline or error, using mock fallback:', err.message);
      } finally {
        if (isMounted) setLoadingDashboard(false);
      }
    };
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const fallbackData = getMockDashboardData(activeProjectId);
  const dashboardData = liveData || fallbackData;
  const project = selectedProject || {
    id: activeProjectId,
    name: liveData?.project?.name || 'ABC Refinery Expansion',
    code: liveData?.project?.code || 'ABC-REF-2026',
    location: 'Houston, TX',
    status: 'In Progress',
    overallProgress: liveData?.kpis?.overallProgress ?? 34,
    lastReportDate: '2026-10-07',
  };

  const matches = projectMatches[activeProjectId] || [];
  const reports = projectReports[activeProjectId] || [];
  const pendingCount = matches.filter((m) => m.status === 'Needs Review').length || dashboardData.kpis.pendingReview || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Project Hero Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {project.code}
              </span>
              <Badge variant={project.status === 'In Progress' ? 'primary' : 'warning'}>
                {project.status}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={13} /> {project.location}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1.5">{project.name}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Baseline Schedule Rev 3</span>
              <span>·</span>
              <span>Last report received: <strong>{project.lastReportDate || '2026-10-07'}</strong></span>
              <span>·</span>
              <span className="text-primary-600 font-medium">Demo Mode active</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              icon={UploadCloud}
              onClick={() => navigate(`/projects/${activeProjectId}/schedule/upload`)}
            >
              Sync Schedule
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FileText}
              onClick={() => navigate(`/projects/${activeProjectId}/reports`)}
            >
              Add Field Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ClipboardCheck}
              onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
            >
              Review Queue ({pendingCount})
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Overall Progress"
          value={project.overallProgress}
          suffix="%"
          icon={TrendingUp}
          trend={project.overallProgress >= 30 ? 'up' : 'down'}
          trendLabel="vs Planned: -2.0% variance"
          color="primary"
        />
        <KPICard
          title="Completed Scope"
          value={dashboardData.kpis.completedActivities.toLocaleString()}
          suffix={`/ ${(dashboardData.kpis.completedActivities + dashboardData.kpis.inProgress + 1245).toLocaleString()}`}
          icon={Activity}
          trend="up"
          trendLabel={`${dashboardData.kpis.inProgress} in progress`}
          color="success"
        />
        <KPICard
          title="Critical Delays"
          value={dashboardData.kpis.delayed}
          suffix=" tasks"
          icon={AlertTriangle}
          trend="down"
          trendLabel="+14 days critical path impact"
          color="danger"
        />
        <KPICard
          title="Pending Reviews"
          value={pendingCount}
          suffix=" unverified"
          icon={ClipboardCheck}
          trend={pendingCount > 0 ? 'down' : 'up'}
          trendLabel={pendingCount > 0 ? 'Action required by planner' : 'Queue cleared'}
          color="warning"
        />
        <KPICard
          title="AI Match Accuracy"
          value={dashboardData.kpis.aiMatchAccuracy}
          suffix="%"
          icon={Sparkles}
          trend="up"
          trendLabel="Human-verified feedback loop"
          color="info"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned vs Actual S-Curve */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Planned vs Actual Progress (S-Curve)</h2>
              <p className="text-xs text-slate-500">Cumulative physical percentage complete across monthly reporting cycles</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-400 border border-slate-400 border-dashed" /> Planned Baseline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-primary-600 rounded-xs" /> Verified Actual
              </span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.progressOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg">
                          <p className="font-semibold mb-1">{label}</p>
                          <p className="text-slate-300">Planned: <span className="font-mono text-white">{payload[0]?.value}%</span></p>
                          <p className="text-primary-300">Actual: <span className="font-mono text-white font-bold">{payload[1]?.value}%</span></p>
                          <p className="text-danger-400 text-[10px] mt-1">Variance: {(payload[1]?.value - payload[0]?.value).toFixed(1)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="planned" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} fill="none" />
                <Area type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#actualGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Activity Status Breakdown</h2>
            <p className="text-xs text-slate-500">Distribution across 2,430 WBS L6 schedule tasks</p>
          </div>

          <div className="h-56 relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.activityStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dashboardData.activityStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val.toLocaleString()} activities`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">{project.overallProgress}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Complete</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {dashboardData.activityStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-semibold text-slate-800">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discipline Progress & Attention Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discipline Comparative Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Discipline Progress Comparison</h2>
              <p className="text-xs text-slate-500">Physical progress (%) Planned vs Verified Actual by major discipline</p>
            </div>
            <button
              onClick={() => navigate(`/projects/${activeProjectId}/progress`)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Detailed S-Curves <ChevronRight size={13} />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.disciplineProgress}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="discipline" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val, name) => [`${val}%`, name === 'planned' ? 'Planned Target' : 'Verified Actual']}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-slate-600 capitalize">{value}</span>}
                />
                <Bar dataKey="planned" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="actual" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attention Items Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning-500" />
                Attention Items
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-warning-50 text-warning-700 rounded border border-warning-200">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Items flagged by the AI linking engine & critical path variance analysis
            </p>

            <div className="space-y-3">
              <div
                onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
                className="p-3 bg-warning-50/50 border border-warning-200 rounded-lg cursor-pointer hover:bg-warning-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-warning-600" />
                    <span className="text-xs font-semibold text-slate-800">10-inch CS Pipeline Match Pending</span>
                  </div>
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-1 rounded">95% Conf</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Report #104 reported 30m installed in Unit A. Planner approval needed to update L6-101.
                </p>
              </div>

              <div
                onClick={() => navigate(`/projects/${activeProjectId}/delays`)}
                className="p-3 bg-danger-50/50 border border-danger-200 rounded-lg cursor-pointer hover:bg-danger-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-danger-600" />
                    <span className="text-xs font-semibold text-slate-800">Critical Path Delay: Unit B Piping</span>
                  </div>
                  <span className="text-[10px] font-bold text-danger-700 bg-danger-100 px-1 rounded">+14d</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Activity L6-102 (12-inch CS) delayed due to spool delivery hold from fabricator Apex Steel.
                </p>
              </div>

              <div
                onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary-600" />
                    <span className="text-xs font-semibold text-slate-800">Ambiguous Underground Scope</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1 rounded">54% Conf</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Report #102 mentions underground piping tie-in at J-14 without explicit unit assignment.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
            className="w-full mt-4 justify-between text-primary-600 font-semibold"
          >
            <span>Open Planner Review Queue</span>
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {/* Lower Row: Recent Reports & Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Daily Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Field Reports</h2>
              <p className="text-xs text-slate-500">Latest site diary and subcontractor submissions</p>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => navigate(`/projects/${activeProjectId}/reports`)}
            >
              View All Reports
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Report</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Extracted</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.slice(0, 5).map((rpt) => (
                  <tr
                    key={rpt.id}
                    onClick={() => navigate(`/projects/${activeProjectId}/reports/${rpt.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      #{rpt.reportNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{rpt.date}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 text-[10px]">
                        {rpt.sourceType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{rpt.eventsExtracted} events</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={rpt.status === 'Verified' ? 'success' : 'primary'}>
                        {rpt.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-primary-600 hover:text-primary-700 font-medium">
                        View →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent AI Activity Matches */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent AI Linking Matches</h2>
              <p className="text-xs text-slate-500">Automated WBS linking candidate suggestions</p>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => navigate(`/projects/${activeProjectId}/ai/matching`)}
            >
              Matching Engine
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Extracted Scope</th>
                  <th className="py-2.5 px-3">Schedule Link</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches.slice(0, 5).map((match) => (
                  <tr
                    key={match.id}
                    onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 max-w-[150px] truncate font-medium text-slate-800">
                      {match.extractedActivity}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {match.selectedCandidate || match.candidates?.[0]?.activityId || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          match.confidence >= 85
                            ? 'bg-success-50 text-success-700'
                            : match.confidence >= 60
                            ? 'bg-warning-50 text-warning-700'
                            : 'bg-danger-50 text-danger-700'
                        }`}
                      >
                        {match.confidence}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={match.status === 'Approved' ? 'success' : match.status === 'Needs Review' ? 'warning' : 'default'}>
                        {match.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-primary-600 hover:text-primary-700 font-medium">
                        Review →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
