import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  MessageSquare,
  History,
  ChevronDown,
  Edit2,
  HelpCircle,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export default function PlannerReview() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    selectedProject,
    projectMatches,
    approveMatch,
    rejectMatch,
    reassignMatch,
    requestContextMatch,
  } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const matches = projectMatches[activeProjectId] || [];

  const [statusFilter, setStatusFilter] = useState('All'); // All | Needs Review | Approved | Rejected
  const [comments, setComments] = useState({});
  const [verifiedQuantities, setVerifiedQuantities] = useState({});

  // Modals state
  const [rejectModalMatch, setRejectModalMatch] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [editModalMatch, setEditModalMatch] = useState(null);
  const [editCandidateId, setEditCandidateId] = useState('');
  const [editComment, setEditComment] = useState('');

  const [contextModalMatch, setContextModalMatch] = useState(null);
  const [contextNote, setContextNote] = useState('');

  const filteredMatches = matches.filter((m) => {
    if (statusFilter === 'All') return true;
    return m.status === statusFilter;
  });

  const pendingCount = matches.filter((m) => m.status === 'Needs Review').length;
  const approvedCount = matches.filter((m) => m.status === 'Approved').length;

  const handleApprove = (match) => {
    const comment = comments[match.id] || '';
    const verifiedQty = verifiedQuantities[match.id] !== undefined ? verifiedQuantities[match.id] : match.extractedEvent?.quantity;
    approveMatch(activeProjectId, match.id, comment, verifiedQty);
  };

  const handleOpenReject = (match) => {
    setRejectModalMatch(match);
    setRejectReason('Scope description does not correspond to baseline WBS packages.');
  };

  const handleConfirmReject = () => {
    if (rejectModalMatch) {
      rejectMatch(activeProjectId, rejectModalMatch.id, rejectReason);
      setRejectModalMatch(null);
      setRejectReason('');
    }
  };

  const handleOpenEdit = (match) => {
    setEditModalMatch(match);
    setEditCandidateId(match.selectedCandidate || match.candidates?.[0]?.activityId || 'L6-101');
    setEditComment('');
  };

  const handleConfirmEdit = () => {
    if (editModalMatch && editCandidateId) {
      reassignMatch(activeProjectId, editModalMatch.id, editCandidateId, editComment);
      setEditModalMatch(null);
      setEditCandidateId('');
      setEditComment('');
    }
  };

  const handleOpenContext = (match) => {
    setContextModalMatch(match);
    setContextNote('Please provide isometric line number or specific spool tag for verification.');
  };

  const handleConfirmContext = () => {
    if (contextModalMatch) {
      requestContextMatch(activeProjectId, contextModalMatch.id, contextNote);
      setContextModalMatch(null);
      setContextNote('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <ClipboardCheck size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Planner Validation Queue</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Human-in-the-Loop
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, correct, approve, or reject candidate schedule activity links
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={History}
            onClick={() => navigate(`/projects/${activeProjectId}/audit`)}
          >
            Audit Trail
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/progress`)}
          >
            View Progress Impact
          </Button>
        </div>
      </div>

      {/* Stats & Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
            <span className="text-slate-600">Pending Review:</span>
            <strong className="text-slate-900">{pendingCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
            <span className="text-slate-600">Verified:</span>
            <strong className="text-slate-900">{approvedCount}</strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {['All', 'Needs Review', 'Approved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Review Cards Queue */}
      <div className="space-y-5">
        {filteredMatches.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 text-xs">
            No review items match the selected status filter.
          </Card>
        ) : (
          filteredMatches.map((match) => {
            const isApproved = match.status === 'Approved';
            const isRejected = match.status === 'Rejected';
            const isNeedsReview = match.status === 'Needs Review';
            const selectedCandidate = match.candidates?.find(
              (c) => c.activityId === (match.selectedCandidate || match.candidates[0]?.activityId)
            ) || match.candidates?.[0];

            return (
              <div
                key={match.id}
                className={`bg-white rounded-xl border transition-all p-6 shadow-xs ${
                  isApproved
                    ? 'border-success-200 bg-success-50/10'
                    : isRejected
                    ? 'border-danger-200 bg-danger-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {match.id}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {match.reportName}
                    </span>
                    <span className="text-slate-300">·</span>
                    <Badge
                      variant={
                        isApproved
                          ? 'success'
                          : isNeedsReview
                          ? 'warning'
                          : isRejected
                          ? 'danger'
                          : 'default'
                      }
                      size="sm"
                    >
                      {isApproved ? 'Planner Verified' : match.status}
                    </Badge>
                  </div>

                  {/* Reviewer Stamp */}
                  {match.reviewedBy && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-success-600" />
                      <span>
                        Verified by <strong>{match.reviewedBy}</strong> on {match.reviewedAt?.split('T')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body: Extracted Field Event & Selected Target */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4">
                  {/* Left: Original Event Evidence */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Daily Report Evidence
                    </span>
                    <p className="font-semibold text-slate-900">{match.extractedActivity}</p>
                    <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      "{match.extractedEvent?.evidence}"
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1">
                      <span>Discipline: <strong>{match.extractedEvent?.discipline}</strong></span>
                      <span>·</span>
                      <span>Location: <strong>{match.extractedEvent?.location || 'Unit A'}</strong></span>
                      <span>·</span>
                      <span>Quantity: <strong>{match.extractedEvent?.quantity ? `${match.extractedEvent.quantity} ${match.extractedEvent.unit}` : 'Not Specified'}</strong></span>
                      <span>·</span>
                      <span>Progress: <strong>{match.extractedEvent?.progress || 'Not specified'}</strong></span>
                    </div>
                  </div>

                  {/* Right: AI Candidate Link */}
                  <div className="p-4 bg-primary-50/40 rounded-xl border border-primary-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary-700 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> Target Schedule Activity (L6)
                      </span>
                      <span className="font-mono text-xs font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded">
                        {match.confidence}% Confidence
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-primary-200 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary-700 text-sm">
                          {selectedCandidate?.activityId}
                        </span>
                        <span className="font-bold text-slate-900">{selectedCandidate?.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        {selectedCandidate?.hierarchyPath}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                        {selectedCandidate?.reason}
                      </p>
                    </div>

                    {/* Alternatives selector */}
                    {match.candidates?.length > 1 && isNeedsReview && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Alternative:</span>
                        <select
                          value={match.selectedCandidate || match.candidates[0]?.activityId}
                          onChange={(e) => reassignMatch(activeProjectId, match.id, e.target.value, 'Switched candidate in review queue')}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700"
                        >
                          {match.candidates.map((c) => (
                            <option key={c.activityId} value={c.activityId}>
                              {c.activityId}: {c.name} ({c.confidence}%)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Planner Comment & Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Verified Quantity & Note Input */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 max-w-lg">
                    {isNeedsReview && match.extractedEvent?.quantity && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500">Verified Qty:</span>
                        <input
                          type="number"
                          defaultValue={match.extractedEvent.quantity}
                          onChange={(e) =>
                            setVerifiedQuantities({
                              ...verifiedQuantities,
                              [match.id]: Number(e.target.value),
                            })
                          }
                          className="w-16 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded"
                        />
                        <span className="text-slate-400">{match.extractedEvent.unit}</span>
                      </div>
                    )}

                    <div className="relative flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Add planner note or verification comment..."
                        value={comments[match.id] || match.plannerComment || ''}
                        onChange={(e) =>
                          setComments({ ...comments, [match.id]: e.target.value })
                        }
                        disabled={isApproved || isRejected}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {isNeedsReview ? (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenContext(match)}
                        className="text-slate-600 hover:text-slate-800"
                      >
                        Request Context
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleOpenEdit(match)}
                        icon={Edit2}
                      >
                        Edit / Reassign
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleOpenReject(match)}
                        icon={XCircle}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="success"
                        size="xs"
                        onClick={() => handleApprove(match)}
                        icon={CheckCircle2}
                      >
                        Approve & Verify
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {isApproved && (
                        <span className="text-success-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Schedule Updated (L6-101)
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-danger-700 font-semibold flex items-center gap-1">
                          <XCircle size={14} /> Rejected: {match.rejectReason}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={Boolean(rejectModalMatch)}
        onClose={() => setRejectModalMatch(null)}
        title="Reject Schedule Activity Match"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Please specify why this event cannot be linked to the current baseline schedule.
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-danger-500"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="secondary" size="sm" onClick={() => setRejectModalMatch(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit / Reassign Candidate Modal */}
      <Modal
        isOpen={Boolean(editModalMatch)}
        onClose={() => setEditModalMatch(null)}
        title="Manual Correction / Reassign Activity"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Activity ID (L6)
            </label>
            <input
              type="text"
              value={editCandidateId}
              onChange={(e) => setEditCandidateId(e.target.value)}
              placeholder="e.g. L6-101, L6-102"
              className="w-full p-2.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Planner Justification Note
            </label>
            <textarea
              rows={2}
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Reason for manual reassignment..."
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="secondary" size="sm" onClick={() => setEditModalMatch(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmEdit}>
              Apply Correction
            </Button>
          </div>
        </div>
      </Modal>

      {/* Context Request Modal */}
      <Modal
        isOpen={Boolean(contextModalMatch)}
        onClose={() => setContextModalMatch(null)}
        title="Request Additional Field Clarification"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Flag this event for the site field engineer to provide missing isometric drawings, spool numbers, or unit boundaries.
          </p>
          <textarea
            rows={3}
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="secondary" size="sm" onClick={() => setContextModalMatch(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmContext}>
              Flag for Clarification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
