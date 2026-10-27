import { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { useProject } from '../../context/ProjectContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { projectId } = useParams();
  const { projects, selectProject, selectedProject, loading } = useProject();
  const navigate = useNavigate();

  // Synchronize URL projectId with ProjectContext
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const match = projects.find((p) => p.id === projectId);
      if (match && selectedProject?.id !== projectId) {
        selectProject(match);
      }
    }
  }, [projectId, projects, selectProject, selectedProject]);

  // Handle unknown/missing project ID
  const isUnknownProject = !loading && projects.length > 0 && projectId && !projects.some((p) => p.id === projectId);

  if (isUnknownProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            The project identifier <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-xs">{projectId}</code> does not exist or has been removed.
          </p>
          <Button icon={ArrowLeft} onClick={() => navigate('/projects')} className="w-full">
            Back to My Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={`pt-14 transition-all duration-200 ${
          sidebarCollapsed ? 'pl-16' : 'pl-60'
        }`}
      >
        <div className="p-6 max-w-[1440px] mx-auto">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
