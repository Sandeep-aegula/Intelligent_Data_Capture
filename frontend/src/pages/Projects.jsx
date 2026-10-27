import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MapPin,
  Calendar,
  Activity,
  ClipboardCheck,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { LoadingState } from '../components/common/StateDisplays';

const statusVariant = {
  'In Progress': 'primary',
  'Planning': 'warning',
  'Completed': 'success',
  'On Hold': 'default',
};

export default function Projects() {
  const { projects, selectProject, addProject, loading } = useProject();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    location: '',
    description: '',
    plannedStart: '',
    plannedFinish: '',
  });

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenProject = (project) => {
    selectProject(project);
    navigate(`/projects/${project.id}/dashboard`);
  };

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleCreateProject = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await projectService.createProject({
        ...newProject,
        status: 'Planning',
      });
      const created = res.data;
      const normalized = {
        ...created,
        overallProgress: created.overall_progress ?? 0,
        plannedStartDate: created.planned_start ?? newProject.plannedStart,
        plannedEndDate: created.planned_finish ?? newProject.plannedFinish,
        actualStartDate: created.actual_start,
      };
      addProject(normalized);
      setShowCreateModal(false);
      setNewProject({ name: '', code: '', location: '', description: '', plannedStart: '', plannedFinish: '' });
    } catch (err) {
      setCreateError(err.userMessage || err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const statuses = ['All', ...new Set(projects.map((p) => p.status))];

  if (loading) {
    return <LoadingState message="Loading projects..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
              <p className="text-sm text-slate-500 mt-1">
                {projects.length} project{projects.length !== 1 ? 's' : ''} across your organization
              </p>
            </div>
            <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
              Create Project
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg
                  placeholder:text-slate-400 text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
                    ${statusFilter === status
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hover
              onClick={() => handleOpenProject(project)}
              className="animate-fade-in"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 truncate">{project.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{project.code}</p>
                </div>
                <Badge variant={statusVariant[project.status] || 'default'}>
                  {project.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                <MapPin size={12} />
                <span>{project.location}</span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Overall Progress</span>
                  <span className="text-xs font-semibold text-slate-700">{project.overallProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${project.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{project.totalActivities.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Activities</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{project.pendingReviews}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{project.aiMatchAccuracy}%</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">AI Accuracy</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {project.plannedStart}
                  </span>
                  <span>→</span>
                  <span>{project.plannedFinish}</span>
                </div>
                <ArrowRight size={16} className="text-slate-400" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Project"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateProject();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-name" className="block text-sm font-medium text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                id="proj-name"
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g., ABC Refinery Expansion"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="proj-code" className="block text-sm font-medium text-slate-700 mb-1">
                Project Code *
              </label>
              <input
                id="proj-code"
                type="text"
                value={newProject.code}
                onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                placeholder="e.g., ABC-REF-2026"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="proj-location" className="block text-sm font-medium text-slate-700 mb-1">
              Location
            </label>
            <input
              id="proj-location"
              type="text"
              value={newProject.location}
              onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
              placeholder="e.g., Houston, TX"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="proj-desc" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="proj-desc"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Brief project description..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="proj-start" className="block text-sm font-medium text-slate-700 mb-1">
                Planned Start
              </label>
              <input
                id="proj-start"
                type="date"
                value={newProject.plannedStart}
                onChange={(e) => setNewProject({ ...newProject, plannedStart: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="proj-finish" className="block text-sm font-medium text-slate-700 mb-1">
                Planned Finish
              </label>
              <input
                id="proj-finish"
                type="date"
                value={newProject.plannedFinish}
                onChange={(e) => setNewProject({ ...newProject, plannedFinish: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {createError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createLoading} disabled={!newProject.name || !newProject.code}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
