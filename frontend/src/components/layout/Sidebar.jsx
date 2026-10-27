import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  UploadCloud,
  FileText,
  Sparkles,
  GitCompare,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function Sidebar({ collapsed, onToggle }) {
  const { projectId } = useParams();
  const { selectedProject, projectMatches } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const basePath = `/projects/${activeProjectId}`;

  // Count pending reviews for badge
  const matches = projectMatches[activeProjectId] || [];
  const pendingCount = matches.filter((m) => m.status === 'Needs Review').length;

  const mainNavGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
        { label: 'Project Setup', icon: Sliders, path: 'setup' },
      ],
    },
    {
      group: 'SCHEDULE & CAPTURE',
      items: [
        { label: 'Schedule Explorer', icon: Calendar, path: 'schedule' },
        { label: 'Schedule Upload', icon: UploadCloud, path: 'schedule/upload' },
        { label: 'Daily Reports', icon: FileText, path: 'reports' },
      ],
    },
    {
      group: 'AI & VALIDATION',
      items: [
        { label: 'AI Extraction', icon: Sparkles, path: 'ai/extraction' },
        { label: 'Activity Matching', icon: GitCompare, path: 'ai/matching' },
        {
          label: 'Planner Review',
          icon: ClipboardCheck,
          path: 'reviews',
          badge: pendingCount > 0 ? pendingCount : null,
          badgeColor: 'bg-warning-100 text-warning-800 border border-warning-200',
        },
      ],
    },
    {
      group: 'CONTROLS & INSIGHTS',
      items: [
        { label: 'Progress Tracking', icon: TrendingUp, path: 'progress' },
        { label: 'Delay Analysis', icon: AlertTriangle, path: 'delays' },
        { label: 'Knowledge Base', icon: BookOpen, path: 'knowledge-base' },
        { label: 'Audit Trail', icon: History, path: 'audit' },
      ],
    },
  ];

  const bottomNavItems = [
    { label: 'Project Settings', icon: Settings, path: 'settings' },
  ];

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-30 bg-white border-r border-slate-200 flex flex-col
        transition-all duration-200 ease-in-out
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4" aria-label="Main navigation">
        {mainNavGroups.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-bold text-slate-400 tracking-wider">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={`${basePath}/${item.path}`}
                    end={item.path === 'schedule' || item.path === 'reports'}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                      ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <item.icon
                        size={17}
                        className={`flex-shrink-0 ${item.badge ? 'text-warning-600' : ''}`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!collapsed && item.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="py-2 px-2 border-t border-slate-100 bg-slate-50/50">
        <ul className="space-y-0.5">
          {bottomNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={`${basePath}/${item.path}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={17} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span>Collapse Menu</span>}
        </button>
      </div>
    </aside>
  );
}
