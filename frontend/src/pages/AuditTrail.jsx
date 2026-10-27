import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function AuditTrail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectAudit } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const auditLogs = projectAudit[activeProjectId] || [];

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Review', 'Capture', 'Schedule', 'Delays', 'Setup'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchCat = categoryFilter === 'All' || log.category === categoryFilter;
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,Action,Category,User,Entity,Details,PreviousValue,NewValue']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.timestamp}","${l.action}","${l.category}","${l.user}","${l.entityId}","${l.details.replace(
                /"/g,
                '""'
              )}","${l.previousValue || ''}","${l.newValue || ''}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ProjectPulse_Audit_${activeProjectId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <History size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Project Audit Trail & Verification Log</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable chronological log of planner approvals, manual overrides, schedule imports, and field reports
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export Audit Log (CSV)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, user, activity, or keyword..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recorded Events ({filteredLogs.length})
          </span>
          <span className="text-xs text-slate-400">Timestamp format: ISO-8601 UTC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Change & Details</th>
                <th className="py-3 px-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isApproval = log.action === 'PLANNER_APPROVAL';
                const isOverride = log.action === 'MATCH_OVERRIDDEN';
                const isRejection = log.action === 'MATCH_REJECTED';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          isApproval
                            ? 'bg-success-50 text-success-700'
                            : isOverride
                            ? 'bg-warning-50 text-warning-700'
                            : isRejection
                            ? 'bg-danger-50 text-danger-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{log.category}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{log.user}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {log.entityId}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="text-slate-800 font-medium leading-relaxed">{log.details}</p>
                      {log.previousValue && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Prev: <span className="line-through">{log.previousValue}</span> → New:{' '}
                          <span className="text-slate-600 font-semibold">{log.newValue}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {log.confidence ? `${log.confidence}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
