import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Plus,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export default function DelayAnalysis() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectDelays, addDelayItem } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const delaysData = projectDelays[activeProjectId] || {
    summary: { totalDelayedActivities: 47, criticalPathImpactDays: 14, forecastedDelayCost: '$180,000', activeMitigationPlans: 6 },
    rootCauses: [],
    items: [],
  };

  const [search, setSearch] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [newDelay, setNewDelay] = useState({
    activityId: 'L6-102',
    activityName: 'Install 12-inch CS Pipeline — Unit B',
    discipline: 'Piping',
    location: 'Unit B',
    criticalPath: true,
    varianceDays: 14,
    rootCause: 'Material Delivery Delay',
    impact: 'High',
    mitigationPlan: '',
  });

  const filteredItems = (delaysData.items || []).filter((item) => {
    return (
      item.activityName.toLowerCase().includes(search.toLowerCase()) ||
      item.activityId.toLowerCase().includes(search.toLowerCase()) ||
      item.rootCause.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreateDelay = (e) => {
    e.preventDefault();
    addDelayItem(activeProjectId, {
      ...newDelay,
      baselineStart: '2026-05-01',
      baselineFinish: '2027-01-31',
      forecastFinish: '2027-02-14',
    });
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-danger-50 text-danger-600 rounded-lg">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Schedule Delay & Root Cause Analysis</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Variance tracking, critical path impacts, and mitigation plans
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button icon={Plus} onClick={() => setShowLogModal(true)}>
            Log Delay Event
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <ShieldAlert size={22} className="text-danger-600 flex-shrink-0" />
          <div>
            <span className="font-bold text-danger-900 text-sm block">
              Critical Path Alert: +{delaysData.summary.criticalPathImpactDays} Days Variance
            </span>
            <span className="text-danger-700">
              Primary bottleneck: Unit B carbon steel piping delivery holds. Expedited mitigation plan in effect.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-danger-800 font-semibold font-mono">
          <span>Cost Impact: {delaysData.summary.forecastedDelayCost}</span>
        </div>
      </div>

      {/* Root Causes Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie / Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Root Cause Distribution</h2>
            <p className="text-xs text-slate-500">Breakdown across recorded delay events</p>
          </div>

          <div className="h-56 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={delaysData.rootCauses}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {delaysData.rootCauses.map((entry) => (
                    <Cell key={entry.cause} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name, props) => [`${val} tasks (${props.payload.percentage}%)`, props.payload.cause]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {delaysData.rootCauses.map((item) => (
              <div key={item.cause} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.cause}</span>
                </span>
                <span className="font-semibold text-slate-800 font-mono">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Delay Frequency by Root Cause Category</h2>
              <p className="text-xs text-slate-500">Number of activities impacted by specific cause</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delaysData.rootCauses} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="cause" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val} activities`, 'Impact Count']}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Impacted Activities Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Impacted Critical Activities ({filteredItems.length})
          </span>
          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search delayed activities..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Activity ID</th>
                <th className="py-3 px-4">Activity Name</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4">Critical Path</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4">Root Cause</th>
                <th className="py-3 px-4">Mitigation Plan</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.activityId}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{item.activityName}</td>
                  <td className="py-3 px-4 text-slate-600">{item.discipline}</td>
                  <td className="py-3 px-4">
                    {item.criticalPath ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger-50 text-danger-700 border border-danger-200">
                        Critical
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">Non-critical</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-danger-600">
                    +{item.varianceDays} Days
                  </td>
                  <td className="py-3 px-4 text-slate-700">{item.rootCause}</td>
                  <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={item.mitigationPlan}>
                    {item.mitigationPlan}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={item.mitigationStatus === 'Resolved' ? 'success' : 'warning'}
                      size="xs"
                    >
                      {item.mitigationStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Delay Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Log Schedule Delay & Mitigation Plan"
      >
        <form onSubmit={handleCreateDelay} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Impacted Activity ID *
            </label>
            <input
              type="text"
              value={newDelay.activityId}
              onChange={(e) => setNewDelay({ ...newDelay, activityId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Activity Name *
            </label>
            <input
              type="text"
              value={newDelay.activityName}
              onChange={(e) => setNewDelay({ ...newDelay, activityName: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Root Cause Category
              </label>
              <select
                value={newDelay.rootCause}
                onChange={(e) => setNewDelay({ ...newDelay, rootCause: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
              >
                <option value="Material Delivery Delay">Material Delivery Delay</option>
                <option value="Engineering RFI Pending">Engineering RFI Pending</option>
                <option value="Adverse Weather">Adverse Weather</option>
                <option value="Contractor Resource Shortage">Contractor Resource Shortage</option>
                <option value="Permit & Site Access">Permit & Site Access</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Variance (Days) *
              </label>
              <input
                type="number"
                value={newDelay.varianceDays}
                onChange={(e) => setNewDelay({ ...newDelay, varianceDays: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-primary-500 font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mitigation Action Plan
            </label>
            <textarea
              rows={3}
              value={newDelay.mitigationPlan}
              onChange={(e) => setNewDelay({ ...newDelay, mitigationPlan: e.target.value })}
              placeholder="Outline contractor acceleration, overtime shift, or revised delivery logistics..."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="secondary" size="sm" onClick={() => setShowLogModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Log Delay Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
