import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitCompare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Layers,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function AiMatching() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectMatches } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const matches = projectMatches[activeProjectId] || [];

  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || 'match-001');
  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  const [selectedCandidateId, setSelectedCandidateId] = useState(
    activeMatch?.selectedCandidate || activeMatch?.candidates?.[0]?.activityId || 'L6-101'
  );

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidateId(candidateId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <GitCompare size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Activity Schedule Linking Engine</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  AI Suggested
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Matches extracted field narrative events against baseline L5/L6 schedule activities
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedMatchId}
            onChange={(e) => {
              setSelectedMatchId(e.target.value);
              const m = matches.find((item) => item.id === e.target.value);
              if (m) setSelectedCandidateId(m.selectedCandidate || m.candidates?.[0]?.activityId);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.extractedActivity} ({m.confidence}% Conf)
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
          >
            Open Planner Review Queue
          </Button>
        </div>
      </div>

      {/* Simulated AI disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info size={15} className="text-primary-600 flex-shrink-0" />
          <span>
            <strong>Simulated Linking Engine:</strong> Fuzzy lexical score (Levenshtein token ratio) and semantic vector similarity scores are simulated for demonstration.
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Linking Version: 1.8.0-demo</span>
      </div>

      {/* Extracted Event Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Field Event to Link
          </span>
          <span className="text-xs text-slate-400 font-medium">{activeMatch?.reportName}</span>
        </div>

        <div className="p-4 bg-primary-50/40 rounded-xl border border-primary-200">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            "{activeMatch?.extractedActivity}"
          </h2>
          <p className="text-xs text-slate-600 italic mb-3">
            "{activeMatch?.extractedEvent?.evidence}"
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="bg-white px-2.5 py-1 rounded-md border border-primary-100 font-semibold text-slate-700">
              Discipline: {activeMatch?.extractedEvent?.discipline || 'Piping'}
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-primary-100 font-semibold text-slate-700">
              Location: {activeMatch?.extractedEvent?.location || 'Unit A'}
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-primary-100 font-semibold text-slate-700">
              Quantity: {activeMatch?.extractedEvent?.quantity ? `${activeMatch.extractedEvent.quantity} ${activeMatch.extractedEvent.unit}` : 'Not Specified'}
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-primary-100 font-mono text-slate-500">
              Physical Progress: {activeMatch?.extractedEvent?.progress || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Candidate Ranking Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Ranked Candidate Activities ({activeMatch?.candidates?.length || 0})
            </h3>
            <p className="text-xs text-slate-500">
              Ranked by combined fuzzy lexical similarity and semantic embedding distance
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Select preferred target activity for planner verification
          </span>
        </div>

        <div className="space-y-3">
          {activeMatch?.candidates?.map((candidate, index) => {
            const isSelected = selectedCandidateId === candidate.activityId;
            const isTopRanked = index === 0;

            return (
              <div
                key={candidate.activityId}
                onClick={() => handleSelectCandidate(candidate.activityId)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                          {candidate.activityId}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{candidate.name}</h4>
                        {isTopRanked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-success-50 text-success-700 rounded-full border border-success-200">
                            Recommended Target
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1.5 font-mono">
                        {candidate.hierarchyPath}
                      </p>

                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong>Matching Rationale:</strong> {candidate.reason}
                      </p>
                    </div>
                  </div>

                  {/* Scores breakdown */}
                  <div className="flex lg:flex-col items-end gap-2 min-w-[140px] pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Confidence:</span>
                      <span
                        className={`text-base font-mono font-bold px-2 py-0.5 rounded ${
                          candidate.confidence >= 85
                            ? 'bg-success-50 text-success-700'
                            : candidate.confidence >= 65
                            ? 'bg-warning-50 text-warning-700'
                            : 'bg-danger-50 text-danger-700'
                        }`}
                      >
                        {candidate.confidence}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>Fuzzy: {candidate.fuzzyScore}%</span>
                      <span>·</span>
                      <span>Semantic: {candidate.semanticScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-600">
          Selected Target: <strong className="font-mono text-primary-700">{selectedCandidateId}</strong>
        </div>
        <Button
          size="sm"
          icon={ArrowRight}
          iconPosition="right"
          onClick={() => navigate(`/projects/${activeProjectId}/reviews`)}
        >
          Confirm Candidate & Open Review Queue
        </Button>
      </div>
    </div>
  );
}
