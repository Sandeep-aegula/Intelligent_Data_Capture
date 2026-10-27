import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Edit2,
  Check,
  RotateCcw,
  GitCompare,
  Info,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function AiExtraction() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectReports } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const reports = projectReports[activeProjectId] || [];

  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || 'rpt-104');
  const currentReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  // Editable structured fields
  const [formData, setFormData] = useState({
    eventType: 'IN_PROGRESS',
    activity: '10-inch carbon steel pipeline installation',
    discipline: 'Piping',
    location: 'Unit A',
    quantity: '30',
    unit: 'meters',
    progress: 'Not specified',
    evidence:
      'Today the piping crew started installation of the 10-inch carbon steel pipeline in Unit A. Approximately 30 meters were installed.',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    setFormData({
      eventType: 'IN_PROGRESS',
      activity: '10-inch carbon steel pipeline installation',
      discipline: 'Piping',
      location: 'Unit A',
      quantity: '30',
      unit: 'meters',
      progress: 'Not specified',
      evidence:
        'Today the piping crew started installation of the 10-inch carbon steel pipeline in Unit A. Approximately 30 meters were installed.',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <Sparkles size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">AI Entity Extraction Workbench</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  AI Suggested
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect and correct structured construction events extracted from field narratives
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>
                Daily Report #{r.reportNumber} ({r.date})
              </option>
            ))}
          </select>
          <Button
            icon={GitCompare}
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/ai/matching`)}
          >
            Send to Schedule Matcher
          </Button>
        </div>
      </div>

      {/* Simulated Disclaimer Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-primary-600 flex-shrink-0" />
          <span>
            <strong>Simulated AI Extraction:</strong> Results and confidence scores are simulated for demonstration and human-in-the-loop review. No external model calls are made.
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Model: Pulser-NLP-v2.4</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Raw Evidence & Entity Tagging */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText size={14} /> Source Field Narrative
            </span>
            <span className="text-xs text-slate-400">{currentReport?.date}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 space-y-3">
            <p className="font-sans leading-6">
              "Today the piping crew started installation of the{' '}
              <mark className="bg-primary-100 text-primary-800 px-1 py-0.5 rounded font-medium">
                10-inch carbon steel pipeline
              </mark>{' '}
              in{' '}
              <mark className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-medium">
                Unit A
              </mark>
              . Approximately{' '}
              <mark className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-medium">
                30 meters
              </mark>{' '}
              were installed."
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
              Entity Tag Legend
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded font-medium">
                Activity / Material: 10-inch CS Pipeline
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium">
                Location: Unit A
              </span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                Quantity: 30 meters
              </span>
            </div>
          </div>
        </div>

        {/* Right: Editable Structured Event Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Structured Event Fields
              </span>
              {saveSuccess && (
                <span className="text-[10px] font-bold text-success-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Changes saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="xs" onClick={handleReset} icon={RotateCcw}>
                    Reset
                  </Button>
                  <Button size="xs" onClick={handleSave} icon={Check}>
                    Save Edits
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="xs" onClick={() => setIsEditing(true)} icon={Edit2}>
                  Edit Fields
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Event Type
                </label>
                {isEditing ? (
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                  </select>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg font-mono font-semibold text-slate-800">
                    {formData.eventType}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Discipline
                </label>
                {isEditing ? (
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="Piping">Piping</option>
                    <option value="Civil">Civil</option>
                    <option value="Structural">Structural</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg font-semibold text-slate-800">
                    {formData.discipline}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Activity Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 font-semibold text-slate-900"
                />
              ) : (
                <div className="p-2.5 bg-slate-50 rounded-lg font-semibold text-slate-900">
                  {formData.activity}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg font-medium text-slate-800">
                    {formData.location}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Quantity
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-primary-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg font-mono font-medium text-slate-800">
                    {formData.quantity}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Unit
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
                  />
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg font-medium text-slate-800">
                    {formData.unit}
                  </div>
                )}
              </div>
            </div>

            {/* Strict Progress Specification Rule */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">
                  Physical Progress %
                </label>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                  Context Rule
                </span>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700 font-mono font-bold">
                {formData.progress}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Progress must remain <em>"Not specified"</em> unless explicit progress or sufficient quantity context exists.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Source Evidence
              </label>
              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600 italic">
                "{formData.evidence}"
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button
              icon={GitCompare}
              onClick={() => navigate(`/projects/${activeProjectId}/ai/matching`)}
            >
              Send to Candidate Matching Engine →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
