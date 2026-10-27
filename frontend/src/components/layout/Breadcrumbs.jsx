import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';

const routeLabels = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  upload: 'Upload',
  reports: 'Daily Reports',
  ai: 'AI Processing',
  extraction: 'Extraction',
  matching: 'Activity Matching',
  reviews: 'Planner Review',
  progress: 'Progress',
  delays: 'Delay Analysis',
  'knowledge-base': 'Knowledge Base',
  audit: 'Audit Trail',
  settings: 'Settings',
  setup: 'Project Setup',
};

export function Breadcrumbs() {
  const location = useLocation();
  const { projectId } = useParams();

  const pathParts = location.pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const crumbs = [];
  let pathAccumulator = '';

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    pathAccumulator += `/${part}`;

    // Skip the project ID itself
    if (part === projectId) continue;
    // Skip 'projects' root
    if (part === 'projects' && i === 0) continue;

    const label = routeLabels[part] || part;
    crumbs.push({
      label,
      path: pathAccumulator,
      isLast: i === pathParts.length - 1,
    });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1 text-sm mb-4">
      <Link
        to={projectId ? `/projects/${projectId}/dashboard` : '/projects'}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Home"
      >
        <Home size={14} />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-slate-300" />
          {crumb.isLast ? (
            <span className="text-slate-700 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-slate-400 hover:text-slate-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
