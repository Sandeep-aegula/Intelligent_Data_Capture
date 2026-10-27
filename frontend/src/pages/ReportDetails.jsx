import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  GitCompare,
  ClipboardCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function ReportDetails() {
  const { projectId, reportId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectReports, projectMatches } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const reports = projectReports[activeProjectId] || [];
  const report = reports.find((r) => r.id === reportId) || reports[0];

  const matches = projectMatches[activeProjectId] || [];
  const relatedMatches = matches.filter((m) => m.reportId === report?.id);

  // Extracted events representation for this report
  const extractedEvents = useMemo(() => {
    if (report?.originalText?.includes('10-inch carbon steel') || report?.id === 'rpt-104') {
      return [
        {
          id: 'ev-01',
          eventType: 'IN_PROGRESS',
          activity: '10-inch carbon steel pipeline installation',
          discipline: 'Piping',
          location: 'Unit A',
          quantity: 30,
          unit: 'meters',
          progress: 'Not specified', // Required by user prompt!
          evidence:
            'Today the piping crew started installation of the 10-inch carbon steel pipeline in Unit A. Approximately 30 meters were installed.',
          matchedActivityId: 'L6-101',
          confidence: 95,
        },
        {
          id: 'ev-02',
          eventType: 'IN_PROGRESS',
          activity: 'Concrete foundation work',
          discipline: 'Civil',
          location: 'Pump House B',
          quantity: null,
          unit: null,
          progress: 'Not specified',
          evidence:
            'The civil team continued work on the Pump House B foundation, completing the second concrete pour.',
          matchedActivityId: 'L6-204',
          confidence: 90,
        },
        {
          id: 'ev-03',
          eventType: 'IN_PROGRESS',
          activity: 'Cable tray installation',
          discipline: 'Electrical',
          location: 'Substation C',
          quantity: 15,
          unit: 'meters',
          progress: 'Not specified',
          evidence: 'Cable tray installation at Substation C progressed with 15 meters of tray mounted.',
          matchedActivityId: 'L6-312',
          confidence: 61,
        },
      ];
    }

    return [
      {
        id: 'ev-default',
        eventType: 'IN_PROGRESS',
        activity: 'General field installation',
        discipline: 'Piping',
        location: 'Unit A',
        quantity: 25,
        unit: 'meters',
        progress: 'Not specified',
        evidence: report?.originalText || 'Field work recorded.',
        matchedActivityId: 'L6-101',
        confidence: 88,
      },
    ];
  }, [report]);

  const [selectedEventId, setSelectedEventId] = useState(extractedEvents[0]?.id);
  const activeEvent = extractedEvents.find((e) => e.id === selectedEventId) || extractedEvents[0];

  if (!report) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-500">Report not found</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => navigate(`/projects/${activeProjectId}/reports`)}
        >
          Return to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/projects/${activeProjectId}/reports`)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mb-2"
          >
            <ArrowLeft size={13} /> Back to Daily Reports
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Daily Report #{report.reportNumber}
            </h1>
            <Badge variant={report.status === 'Verified' ? 'success' : 'primary'}>
              {report.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span>Date: <strong>{report.date}</strong></span>
            <span>·</span>
            <span>Source: <strong>{report.sourceType}</strong></span>
            <span>·</span>
            <span>Submitted by: <strong>{report.uploadedBy}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={GitCompare}
            onClick={() => navigate(`/projects/${activeProjectId}/ai/matching`)}
          >
            Schedule Matcher
          </Button>
          <Button
            size="sm"
            icon={ClipboardCheck}
            onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
          >
            Open Planner Review
          </Button>
        </div>
      </div>

      {/* Split View: Source Evidence (Left) + Structured Extraction (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Original Evidence & Text */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText size={14} /> Source Text & Evidence Quotation
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
              Raw Field Input
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 font-sans space-y-3">
            <p className="italic">
              "{report.originalText}"
            </p>
          </div>

          {/* Highlighted Evidence for Selected Event */}
          <div className="p-4 bg-primary-50/50 border border-primary-200 rounded-xl space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 flex items-center gap-1">
              <Sparkles size={12} /> Active Extracted Evidence Anchor
            </span>
            <p className="text-xs text-primary-900 font-medium bg-white p-3 rounded-lg border border-primary-100 shadow-xs">
              "{activeEvent.evidence}"
            </p>
            <div className="flex items-center gap-2 text-[11px] text-primary-700 pt-1">
              <span>Discipline: <strong>{activeEvent.discipline}</strong></span>
              <span>·</span>
              <span>Location: <strong>{activeEvent.location}</strong></span>
              <span>·</span>
              <span>Quantity: <strong>{activeEvent.quantity ? `${activeEvent.quantity} ${activeEvent.unit}` : 'Not Specified'}</strong></span>
            </div>
          </div>

          {/* List of events extracted */}
          <div className="pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Extracted Events in this Report ({extractedEvents.length})
            </span>
            <div className="space-y-2">
              {extractedEvents.map((ev, i) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedEventId === ev.id
                      ? 'bg-primary-50 border-primary-300 font-medium shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{ev.activity}</span>
                    <span className="text-[10px] font-mono font-bold text-primary-700 bg-primary-100/70 px-1.5 py-0.2 rounded">
                      {ev.confidence}% Match
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                    {ev.location} · {ev.quantity ? `${ev.quantity} ${ev.unit}` : 'Unspecified Qty'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Structured Event Fields */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary-600" /> Structured Entity Fields
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-success-50 text-success-700 rounded font-semibold">
              AI Suggested
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Event Type</span>
                <span className="font-mono font-bold text-slate-800">{activeEvent.eventType}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Discipline</span>
                <span className="font-semibold text-slate-800">{activeEvent.discipline}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Extracted Activity</span>
              <span className="font-semibold text-slate-900 text-sm">{activeEvent.activity}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
                <span className="font-semibold text-slate-800">{activeEvent.location || 'Not Specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Recorded Quantity</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {activeEvent.quantity ? `${activeEvent.quantity} ${activeEvent.unit}` : 'Not Specified'}
                </span>
              </div>
            </div>

            {/* Crucial requirement: Progress MUST be 'Not specified' unless explicit progress or sufficient quantity context exists */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Physical Progress %</span>
                <span className="text-[10px] text-slate-400 italic">Strict context rule applied</span>
              </div>
              <span className="font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded text-xs inline-block mt-1">
                {activeEvent.progress}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Progress percentage was not explicitly stated in the narrative. Physical delta will be computed upon planner verification of total install against baseline L6 target (450m).
              </p>
            </div>

            {/* Target L6 Linking Activity */}
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary-700 uppercase">
                  Target Candidate WBS Link
                </span>
                <span className="text-xs font-mono font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded">
                  {activeEvent.confidence}% Confidence
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-primary-200">
                <p className="font-mono font-bold text-primary-700 text-sm">
                  {activeEvent.matchedActivityId}
                </p>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">
                  {activeEvent.matchedActivityId === 'L6-101'
                    ? 'Install 10-inch CS Pipeline — Unit A'
                    : activeEvent.matchedActivityId === 'L6-204'
                    ? 'Pour Foundation — Pump House B'
                    : 'Install Cable Tray — Substation C'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Baseline Scope: 450 meters · Current Progress: 55%
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/projects/${activeProjectId}/ai/matching`)}
            >
              Compare Candidates
            </Button>
            <Button
              size="sm"
              icon={ClipboardCheck}
              onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
            >
              Proceed to Planner Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
