import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Calendar, FileText, Cpu, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { getMockScheduleActivities } from '../../mock/schedules';
import { searchService } from '../../services/searchService';

export function GlobalSearchModal({ isOpen, onClose }) {
  const { selectedProject, projectReports, projectTerms, projectDelays } = useProject();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [liveResults, setLiveResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim() || !selectedProject?.id) {
      setLiveResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchService.searchProject(selectedProject.id, query.trim(), 10);
        setLiveResults(res.data?.results || []);
      } catch (err) {
        console.warn('Backend search unavailable, using client-side scope:', err);
        setLiveResults(null);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, selectedProject?.id]);

  if (!isOpen || !selectedProject) return null;

  const projectId = selectedProject.id;
  const activities = getMockScheduleActivities(projectId) || [];
  const reports = projectReports[projectId] || [];
  const terms = projectTerms[projectId] || [];
  const delayItems = projectDelays[projectId]?.items || [];

  const q = query.trim().toLowerCase();

  const matchingActivities = q
    ? activities.filter(
        (a) =>
          a.activityId?.toLowerCase().includes(q) ||
          a.name?.toLowerCase().includes(q) ||
          a.discipline?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchingReports = q
    ? reports.filter(
        (r) =>
          r.id?.toLowerCase().includes(q) ||
          r.originalText?.toLowerCase().includes(q) ||
          r.uploadedBy?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchingTerms = q
    ? terms.filter(
        (t) =>
          t.term?.toLowerCase().includes(q) ||
          t.expansion?.toLowerCase().includes(q) ||
          t.definition?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchingDelays = q
    ? delayItems.filter(
        (d) =>
          d.activityName?.toLowerCase().includes(q) ||
          d.rootCause?.toLowerCase().includes(q) ||
          d.mitigationPlan?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const totalResults =
    matchingActivities.length + matchingReports.length + matchingTerms.length + matchingDelays.length;

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search size={18} className="text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${selectedProject.name} (activities, reports, terms, delays)...`}
            className="w-full py-4 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">
                Type keywords like <span className="font-semibold text-primary-600">"Piping"</span>,{' '}
                <span className="font-semibold text-primary-600">"Unit A"</span>,{' '}
                <span className="font-semibold text-primary-600">"L6-101"</span>, or{' '}
                <span className="font-semibold text-primary-600">"CS"</span> to search this project.
              </p>
            </div>
          )}

          {searching && (
            <div className="py-6 text-center text-xs text-slate-400">
              Searching project database...
            </div>
          )}

          {Array.isArray(liveResults) && liveResults.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Cpu size={13} /> Project Database Search Results ({liveResults.length})
              </p>
              <div className="space-y-1">
                {liveResults.map((item, idx) => (
                  <button
                    key={item.item_id || idx}
                    onClick={() => {
                      const base = `/projects/${projectId}`;
                      if (item.category === 'schedule') handleSelect(`${base}/schedule`);
                      else if (item.category === 'report') handleSelect(`${base}/reports/${item.item_id}`);
                      else if (item.category === 'delay') handleSelect(`${base}/delays`);
                      else handleSelect(`${base}/knowledge-base`);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {item.category}
                        </span>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-primary-600 truncate">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.snippet}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !searching && ((liveResults && liveResults.length === 0) || (!liveResults && totalResults === 0)) && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No results found for "{query}".</p>
            </div>
          )}

          {/* Activities */}
          {matchingActivities.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} /> Schedule Activities
              </p>
              <div className="space-y-1">
                {matchingActivities.map((act) => (
                  <button
                    key={act.activityId}
                    onClick={() => handleSelect(`/projects/${projectId}/schedule`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {act.activityId}
                        </span>
                        <span className="text-sm font-medium text-slate-800 group-hover:text-primary-600">
                          {act.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {act.level} · {act.discipline || 'General'} · Progress: {act.progress}%
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Daily Reports */}
          {matchingReports.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <FileText size={13} /> Daily Reports
              </p>
              <div className="space-y-1">
                {matchingReports.map((rpt) => (
                  <button
                    key={rpt.id}
                    onClick={() => handleSelect(`/projects/${projectId}/reports/${rpt.id}`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          Daily Report #{rpt.reportNumber}
                        </span>
                        <span className="text-xs text-slate-400">{rpt.date}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-primary-50 text-primary-700 rounded">
                          {rpt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {rpt.originalText}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge & Terminology */}
          {matchingTerms.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <BookOpen size={13} /> Terminology
              </p>
              <div className="space-y-1">
                {matchingTerms.map((term) => (
                  <button
                    key={term.term}
                    onClick={() => handleSelect(`/projects/${projectId}/knowledge-base`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded">
                          {term.term}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {term.expansion}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {term.definition}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delays */}
          {matchingDelays.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-danger-500" /> Delays & Variances
              </p>
              <div className="space-y-1">
                {matchingDelays.map((del) => (
                  <button
                    key={del.id}
                    onClick={() => handleSelect(`/projects/${projectId}/delays`)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-danger-700 bg-danger-50 px-1.5 py-0.5 rounded">
                          +{del.varianceDays}d Delay
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {del.activityName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cause: {del.rootCause} · Plan: {del.mitigationPlan}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Project scope: <strong>{selectedProject.name}</strong></span>
          <span className="flex items-center gap-2">
            <span>Navigate with click</span>
            <span>·</span>
            <span>Press ESC to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
