import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  Layers,
  FileText,
  AlertTriangle,
  X,
  Clock,
  ArrowRight,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { mockScheduleHierarchy, getMockScheduleActivities } from '../mock/schedules';
import { scheduleService } from '../services/scheduleService';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export default function ScheduleExplorer() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectMatches, projectReports } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const [liveActivities, setLiveActivities] = useState(null);
  const [liveTree, setLiveTree] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const [actRes, treeRes] = await Promise.allSettled([
          scheduleService.getScheduleActivities(activeProjectId),
          scheduleService.getScheduleHierarchy(activeProjectId),
        ]);

        if (!isMounted) return;

        if (actRes.status === 'fulfilled' && Array.isArray(actRes.value?.data) && actRes.value.data.length > 0) {
          setLiveActivities(actRes.value.data);
        }
        if (treeRes.status === 'fulfilled' && treeRes.value?.data) {
          setLiveTree(treeRes.value.data);
        }
      } catch (err) {
        console.warn('Backend schedule API offline or error:', err.message);
      } finally {
        if (isMounted) setLoadingSchedule(false);
      }
    };
    fetchSchedule();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const mockActs = useMemo(() => getMockScheduleActivities(activeProjectId), [activeProjectId]);
  const allActivities = liveActivities || mockActs;
  const hierarchyTree = liveTree || mockScheduleHierarchy[activeProjectId] || mockScheduleHierarchy['proj-001'];

  // Filters & Search
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState({
    'L1-001': true,
    'L2-001': true,
    'L3-001': true,
    'L4-001': true,
    'L5-001': true,
  });

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const disciplines = ['All', 'Piping', 'Civil', 'Structural', 'Electrical'];
  const levels = ['All', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
  const statuses = ['All', 'In Progress', 'Completed', 'Delayed', 'Not Started'];

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      const matchSearch =
        act.name.toLowerCase().includes(search.toLowerCase()) ||
        act.activityId.toLowerCase().includes(search.toLowerCase()) ||
        (act.location && act.location.toLowerCase().includes(search.toLowerCase()));

      const matchDiscipline = disciplineFilter === 'All' || act.discipline === disciplineFilter;
      const matchLevel = levelFilter === 'All' || act.level === levelFilter;
      const matchStatus = statusFilter === 'All' || act.status === statusFilter;

      return matchSearch && matchDiscipline && matchLevel && matchStatus;
    });
  }, [allActivities, search, disciplineFilter, levelFilter, statusFilter]);

  // Recursively render tree node
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedActivity?.activityId === node.activityId;

    return (
      <div key={node.id} className="text-xs">
        <div
          onClick={() => {
            setSelectedActivity(node);
            if (hasChildren) toggleNode(node.id);
          }}
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-primary-50 text-primary-700 font-semibold border-l-2 border-primary-600'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          {hasChildren ? (
            <span className="text-slate-400 p-0.5 hover:text-slate-600">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          <span className="font-mono text-[10px] px-1 bg-slate-100 rounded text-slate-600">
            {node.level}
          </span>
          <span className="truncate flex-1">{node.name}</span>
          <span className="font-mono text-[10px] text-slate-400">{node.progress}%</span>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <Calendar size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Schedule Explorer (WBS L1–L6)</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Searchable project schedule tree, work package tracking, and field link drawer
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('L6-101');
            }}
          >
            Find L6-101 Demo
          </Button>
          <Button
            icon={UploadCloud}
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/schedule/upload`)}
          >
            Import / Sync Schedule
          </Button>
        </div>
      </div>

      {/* Main layout: Tree (left) + Table (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Tree panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs lg:col-span-1 max-h-[750px] flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers size={14} /> WBS Hierarchy Tree
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
              Rev 3
            </span>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 space-y-0.5">
            {hierarchyTree ? (
              renderTreeNode(hierarchyTree)
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No schedule tree loaded</p>
            )}
          </div>
        </div>

        {/* Table & Filters panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs lg:col-span-3 flex flex-col">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by activity ID, name, or unit..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="All">All Levels (L1-L6)</option>
                <option value="L6">Level 6 Only (Tasks)</option>
                <option value="L5">Level 5 Only (Packages)</option>
                <option value="L4">Level 4 Only (Areas)</option>
                <option value="L3">Level 3 Only (Disciplines)</option>
              </select>

              {/* Discipline Filter */}
              <select
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Disciplines' : d}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Showing {filteredActivities.length} activities</span>
              {selectedActivity && (
                <span className="text-primary-600 font-medium">
                  Selected: {selectedActivity.activityId} — {selectedActivity.name}
                </span>
              )}
            </div>
          </div>

          {/* Activities Table */}
          <div className="overflow-x-auto max-h-[650px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">WBS / ID</th>
                  <th className="py-2.5 px-3">Activity Name</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Planned Finish</th>
                  <th className="py-2.5 px-3">Physical Progress</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActivities.map((act) => {
                  const isSelected = selectedActivity?.activityId === act.activityId;
                  return (
                    <tr
                      key={act.id || act.activityId}
                      onClick={() => setSelectedActivity(act)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary-50/80 font-medium text-primary-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {act.activityId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate">
                        {act.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {act.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {act.discipline || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {act.location || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {act.plannedFinish}
                      </td>
                      <td className="py-2.5 px-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full"
                              style={{ width: `${act.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-700 w-8 text-right">
                            {act.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            act.status === 'Completed'
                              ? 'success'
                              : act.status === 'In Progress'
                              ? 'primary'
                              : act.status === 'Delayed'
                              ? 'danger'
                              : 'default'
                          }
                          size="xs"
                        >
                          {act.status}
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

      {/* Activity Detail Slide-Over Drawer */}
      {selectedActivity && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto animate-slide-in-right">
          <div>
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {selectedActivity.activityId}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded uppercase">
                    Level {selectedActivity.level}
                  </span>
                  <Badge
                    variant={
                      selectedActivity.status === 'Completed'
                        ? 'success'
                        : selectedActivity.status === 'In Progress'
                        ? 'primary'
                        : 'default'
                    }
                    size="xs"
                  >
                    {selectedActivity.status}
                  </Badge>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-2">
                  {selectedActivity.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Hierarchy Path */}
            <div className="py-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                WBS Hierarchy Path
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                {selectedActivity.hierarchyPath ||
                  `ABC Refinery Expansion → Process Plant → ${selectedActivity.discipline || 'Piping'} → ${selectedActivity.name}`}
              </p>
            </div>

            {/* Schedule & Quantity Metrics */}
            <div className="py-4 space-y-3 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Activity Attributes
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Discipline</span>
                  <span className="font-semibold text-slate-800">
                    {selectedActivity.discipline || 'Piping'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Location</span>
                  <span className="font-semibold text-slate-800">
                    {selectedActivity.location || 'Unit A'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Planned Start</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {selectedActivity.plannedStart}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Planned Finish</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {selectedActivity.plannedFinish}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Scope / Quantity</span>
                  <span className="font-semibold text-slate-800">
                    {selectedActivity.quantity ? `${selectedActivity.quantity} ${selectedActivity.unit}` : 'Not Specified'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Physical Progress</span>
                  <span className="font-bold text-primary-700 font-mono text-sm">
                    {selectedActivity.progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Daily Reports & Field Evidence */}
            <div className="py-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Linked Daily Reports & Field Evidence
              </span>

              {selectedActivity.activityId === 'L6-101' ? (
                <div className="p-3 bg-primary-50/50 border border-primary-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Daily Report #104 (2026-10-07)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-success-50 text-success-700 rounded">
                      Planner Verified
                    </span>
                  </div>
                  <p className="text-slate-600 italic">
                    "Today the piping crew started installation of the 10-inch carbon steel pipeline in Unit A. Approximately 30 meters were installed."
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Recorded Quantity: 30 meters · Verified by John Mitchell
                  </p>
                </div>
              ) : selectedActivity.activityId === 'L6-204' ? (
                <div className="p-3 bg-primary-50/50 border border-primary-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Daily Report #104 (2026-10-07)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-success-50 text-success-700 rounded">
                      Planner Verified
                    </span>
                  </div>
                  <p className="text-slate-600 italic">
                    "The civil team continued work on the Pump House B foundation, completing the second concrete pour."
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-400">
                  No daily reports linked to this activity yet.
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <Button
              className="w-full"
              size="sm"
              icon={FileText}
              onClick={() => navigate(`/projects/${activeProjectId}/reports`)}
            >
              Add Field Progress for {selectedActivity.activityId}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              size="sm"
              icon={AlertTriangle}
              onClick={() => navigate(`/projects/${activeProjectId}/delays`)}
            >
              Log Schedule Delay Variance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
