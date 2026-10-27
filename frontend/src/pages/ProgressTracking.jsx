import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { getMockDashboardData } from '../mock/dashboard';
import { dashboardService } from '../services/dashboardService';
import { progressService } from '../services/progressService';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function ProgressTracking() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const [liveDashboard, setLiveDashboard] = useState(null);
  const [liveProgressRecords, setLiveProgressRecords] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadProgressData = async () => {
      try {
        const [dashRes, progRes] = await Promise.allSettled([
          dashboardService.getDashboard(activeProjectId),
          progressService.getVerifiedProgress(activeProjectId),
        ]);
        if (!isMounted) return;
        if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
          setLiveDashboard(dashRes.value.data);
        }
        if (progRes.status === 'fulfilled' && Array.isArray(progRes.value?.data)) {
          setLiveProgressRecords(progRes.value.data);
        }
      } catch (err) {
        console.warn('Live progress API offline or error:', err.message);
      }
    };
    loadProgressData();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const dashboardData = liveDashboard || getMockDashboardData(activeProjectId);
  const [metricView, setMetricView] = useState('percentage'); // 'percentage' | 'quantities'

  const milestones = [
    { name: 'Groundbreaking & Site Clearing', target: '2026-02-01', forecast: '2026-01-28', status: 'Completed', progress: 100 },
    { name: 'Process Plant Foundations Handover', target: '2026-05-30', forecast: '2026-05-25', status: 'Completed', progress: 100 },
    { name: 'Above Ground Piping Spool Delivery (Unit A)', target: '2026-09-15', forecast: '2026-09-20', status: 'Completed', progress: 100 },
    { name: 'Unit A 10-inch CS Pipeline Installation', target: '2026-12-15', forecast: '2026-12-10', status: 'In Progress', progress: 55 },
    { name: 'Unit B 12-inch CS Spool Tie-In', target: '2027-01-31', forecast: '2027-02-14', status: 'Delayed', progress: 30 },
    { name: 'Pre-Commissioning & Hydrotest Run', target: '2027-06-30', forecast: '2027-07-15', status: 'Planned', progress: 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <TrendingUp size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Physical Progress & Earned Value (EVM)</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Earned physical progress aggregated from verified field daily reports vs baseline S-Curve
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-semibold">
            <button
              onClick={() => setMetricView('percentage')}
              className={`px-3 py-1 rounded-md transition-colors ${
                metricView === 'percentage' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => setMetricView('quantities')}
              className={`px-3 py-1 rounded-md transition-colors ${
                metricView === 'quantities' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Quantities (Meters / Tons)
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/delays`)}
          >
            Delay Variance Analysis →
          </Button>
        </div>
      </div>

      {/* EVM KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Physical Percent Complete</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">34.0%</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Planned Target: 36.0%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Schedule Variance (SV)</span>
          <p className="text-2xl font-bold text-danger-600 mt-1">-2.0%</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Lagging behind planned envelope</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Schedule Performance Index (SPI)</span>
          <p className="text-2xl font-bold text-warning-600 mt-1 font-mono">0.94</p>
          <p className="text-[11px] text-slate-400 mt-1">Acceptable range (0.90 – 1.05)</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Critical Path Float</span>
          <p className="text-2xl font-bold text-danger-600 mt-1 font-mono">-14 Days</p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Primary Driver: Unit B Piping</p>
        </div>
      </div>

      {/* S-Curve Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Baseline vs Verified Earned S-Curve</h2>
            <p className="text-xs text-slate-500">Cumulative physical completion trajectory across project timeline</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-400 border border-slate-400 border-dashed" /> Planned Baseline Rev 3
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-primary-600 rounded-xs" /> Verified Earned Actual
            </span>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardData.progressOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                formatter={(val, name) => [`${val}%`, name === 'planned' ? 'Planned Baseline' : 'Verified Earned']}
              />
              <Area type="monotone" dataKey="planned" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} fill="none" />
              <Area type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#progressGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Milestones Tracking Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar size={14} /> Critical Milestone Tracking & Forecast
          </span>
          <span className="text-xs text-slate-400">Baseline Target vs Latest Verified Forecast</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Forecast Date</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Progress %</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestones.map((m) => {
                const isDelayed = m.status === 'Delayed';
                return (
                  <tr key={m.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{m.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{m.target}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{m.forecast}</td>
                    <td className="py-3 px-4 font-mono">
                      {isDelayed ? (
                        <span className="text-danger-600 font-bold">+14 Days</span>
                      ) : (
                        <span className="text-success-600 font-medium">On Track</span>
                      )}
                    </td>
                    <td className="py-3 px-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.progress === 100
                                ? 'bg-success-500'
                                : isDelayed
                                ? 'bg-danger-500'
                                : 'bg-primary-600'
                            }`}
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-700 w-8 text-right">
                          {m.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          m.status === 'Completed'
                            ? 'success'
                            : m.status === 'In Progress'
                            ? 'primary'
                            : m.status === 'Delayed'
                            ? 'danger'
                            : 'default'
                        }
                        size="xs"
                      >
                        {m.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
