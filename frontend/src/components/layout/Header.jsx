import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, LogOut, Settings, Building2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export function Header() {
  const { projects, selectedProject, selectProject, globalSearchOpen, setGlobalSearchOpen } = useProject();
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const projectDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  const handleProjectSelect = (project) => {
    selectProject(project);
    setProjectDropdownOpen(false);
    navigate(`/projects/${project.id}/dashboard`);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('selectedProjectId');
    navigate('/login');
  };

  const currentProjectId = selectedProject?.id || 'proj-001';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
        {/* Logo */}
        <div
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 min-w-[180px] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-xs">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 hidden sm:block tracking-tight">
            ProjectPulse <span className="text-primary-600 font-extrabold text-xs align-top">AI</span>
          </span>
        </div>

        {/* Project Selector */}
        <div className="relative" ref={projectDropdownRef}>
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm
              hover:bg-slate-100 transition-colors max-w-[280px]"
            aria-label="Select project"
            aria-expanded={projectDropdownOpen}
          >
            <span className="w-2 h-2 rounded-full bg-success-500 flex-shrink-0" />
            <span className="truncate text-slate-700 font-medium">
              {selectedProject ? selectedProject.name : 'Select Project'}
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {projectDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-scale-in z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Project
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors
                      ${selectedProject?.id === project.id ? 'bg-primary-50/70 border-l-2 border-primary-600' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-semibold truncate ${
                          selectedProject?.id === project.id ? 'text-primary-700' : 'text-slate-800'
                        }`}
                      >
                        {project.name}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.code} · {project.location} · {project.overallProgress}% complete
                    </p>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 px-3 py-2 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    navigate('/projects');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Projects →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search trigger bar */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <span>Search activities, reports, terms, delays...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-500">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex-1 md:hidden" />

        {/* Mobile search button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
          </button>

          {notificationOpen && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 animate-scale-in z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Notifications & Alerts
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-danger-50 text-danger-600 font-semibold rounded">
                  3 pending
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                <div
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate(`/projects/${currentProjectId}/reviews`);
                  }}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Clock size={15} className="text-warning-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {selectedProject?.pendingReviews || 12} Matches Pending Review
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Daily Report #104 contains matches requiring human planner verification.
                      </p>
                      <span className="text-[10px] text-primary-600 font-medium">Review queue →</span>
                    </div>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate(`/projects/${currentProjectId}/delays`);
                  }}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-danger-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Critical Path Delay Alert</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Activity L6-102 (12-inch CS Pipeline) flagged +14 days variance.
                      </p>
                      <span className="text-[10px] text-danger-600 font-medium">View delay analysis →</span>
                    </div>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate(`/projects/${currentProjectId}/schedule`);
                  }}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-success-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Baseline Schedule Rev 3 Synced</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        2,430 activities active across L1-L6 WBS.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
            aria-label="User menu"
            aria-expanded={userDropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
              JM
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">John Mitchell</p>
              <p className="text-slate-400 text-[10px]">Planner / PM</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-scale-in z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">John Mitchell</p>
                <p className="text-xs text-slate-500">john.mitchell@projectpulse.com</p>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded font-medium">
                  Senior Planning Engineer
                </span>
              </div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  navigate(`/projects/${currentProjectId}/settings`);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Settings size={14} /> Project Settings
              </button>
              <div className="border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 font-medium"
                >
                  <LogOut size={14} /> Sign Out Demo
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />
    </>
  );
}
