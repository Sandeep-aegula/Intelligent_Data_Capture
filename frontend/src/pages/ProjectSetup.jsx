import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layers,
  Sliders,
  BookOpen,
  Plus,
  Save,
  CheckCircle2,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { hierarchyDefinitions } from '../mock/knowledge';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export default function ProjectSetup() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectTerms, addTerminologyItem } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const terms = projectTerms[activeProjectId] || [];

  const [activeTab, setActiveTab] = useState('hierarchy'); // hierarchy | terminology | thresholds
  const [levels, setLevels] = useState(hierarchyDefinitions);
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [newTerm, setNewTerm] = useState({
    term: '',
    expansion: '',
    discipline: 'Piping',
    definition: '',
    aliases: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Confidence thresholds
  const [highThreshold, setHighThreshold] = useState(85);
  const [lowThreshold, setLowThreshold] = useState(60);

  const handleSaveLevels = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateTerm = (e) => {
    e.preventDefault();
    if (!newTerm.term || !newTerm.expansion) return;

    addTerminologyItem(activeProjectId, {
      term: newTerm.term,
      expansion: newTerm.expansion,
      discipline: newTerm.discipline,
      definition: newTerm.definition || `${newTerm.expansion} specification`,
      aliases: newTerm.aliases ? newTerm.aliases.split(',').map((s) => s.trim()) : [],
    });

    setNewTerm({ term: '', expansion: '', discipline: 'Piping', definition: '', aliases: '' });
    setShowAddTermModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <Sliders size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Project Setup & Configuration</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure WBS schedule breakdown structure, domain terminology, and AI linking parameters
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-success-600 font-semibold flex items-center gap-1 animate-fade-in">
              <CheckCircle2 size={15} /> Saved successfully
            </span>
          )}
          <Button icon={Save} onClick={handleSaveLevels}>
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'hierarchy'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} />
          L1–L6 Hierarchy Levels
        </button>
        <button
          onClick={() => setActiveTab('terminology')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'terminology'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={16} />
          Project Terminology Dictionary ({terms.length})
        </button>
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'thresholds'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles size={16} />
          AI Matching Thresholds
        </button>
      </div>

      {/* Tab: Hierarchy Levels */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="bg-primary-50/50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
            <Info size={18} className="text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-primary-900 leading-relaxed">
              <strong>Multi-Tiered Schedule Hierarchy (L1–L6):</strong> ProjectPulse AI maps field activity reports to Level 6 (field task activities) while aggregating physical progress up through L5 (Work Package), L4 (Area/System), L3 (Discipline), L2 (Plant Unit), and L1 (Project Capital Baseline).
            </div>
          </div>

          <div className="space-y-3">
            {levels.map((lvl, index) => (
              <div
                key={lvl.level}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 font-bold font-mono text-sm flex items-center justify-center border border-slate-200">
                    {lvl.level}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={lvl.name}
                        onChange={(e) => {
                          const updated = [...levels];
                          updated[index].name = e.target.value;
                          setLevels(updated);
                        }}
                        className="text-sm font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-primary-600 focus:outline-none px-1"
                      />
                      {lvl.level === 'L6' && (
                        <span className="px-2 py-0.5 bg-success-50 text-success-700 text-[10px] font-bold rounded-full">
                          Linking Target
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 px-1 mt-0.5">{lvl.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium">Example:</span>{' '}
                    <span className="font-mono text-slate-700">{lvl.example}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/projects/${activeProjectId}/schedule`)}
            >
              Open Schedule Explorer
            </Button>
            <Button icon={Save} onClick={handleSaveLevels}>
              Save Hierarchy Settings
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Terminology Dictionary */}
      {activeTab === 'terminology' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Project Terminology & Aliases</h2>
              <p className="text-xs text-slate-500">
                Custom abbreviations, site slang, and material codes automatically resolved during AI extraction
              </p>
            </div>
            <Button icon={Plus} size="sm" onClick={() => setShowAddTermModal(true)}>
              Add Term
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Abbreviation / Term</th>
                  <th className="py-3 px-4">Expansion / Full Name</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Known Aliases</th>
                  <th className="py-3 px-4">Definition</th>
                  <th className="py-3 px-4 text-right">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terms.map((term) => (
                  <tr key={term.term} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary-700">
                      {term.term}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {term.expansion}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                        {term.discipline}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {term.aliases?.map((alias) => (
                          <span
                            key={alias}
                            className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600"
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {term.definition}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {term.usageCount}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: AI Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              AI Matching Confidence Calibration
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Configure human-in-the-loop triggers based on fuzzy string ratio and semantic embedding confidence
            </p>

            <div className="space-y-6 max-w-xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
                    High Confidence Threshold (Recommended Auto-link)
                  </label>
                  <span className="text-sm font-mono font-bold text-success-700 bg-success-50 px-2 py-0.5 rounded">
                    {highThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="98"
                  value={highThreshold}
                  onChange={(e) => setHighThreshold(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Matches scoring at or above {highThreshold}% receive highest planner recommendation priority.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
                    Medium Confidence Floor (Requires Human Review)
                  </label>
                  <span className="text-sm font-mono font-bold text-warning-700 bg-warning-50 px-2 py-0.5 rounded">
                    {lowThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="70"
                  value={lowThreshold}
                  onChange={(e) => setLowThreshold(Number(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Matches below {lowThreshold}% are automatically marked "Insufficient Context / Ambiguous".
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <Button icon={Save} onClick={handleSaveLevels}>
                  Save Calibration Parameters
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Term Modal */}
      <Modal
        isOpen={showAddTermModal}
        onClose={() => setShowAddTermModal(false)}
        title="Add Project Terminology / Alias"
      >
        <form onSubmit={handleCreateTerm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Term / Abbreviation *
            </label>
            <input
              type="text"
              value={newTerm.term}
              onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
              placeholder="e.g., CS, MLV, AG"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Expansion / Meaning *
            </label>
            <input
              type="text"
              value={newTerm.expansion}
              onChange={(e) => setNewTerm({ ...newTerm, expansion: e.target.value })}
              placeholder="e.g., Carbon Steel"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discipline
            </label>
            <select
              value={newTerm.discipline}
              onChange={(e) => setNewTerm({ ...newTerm, discipline: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Piping">Piping</option>
              <option value="Civil">Civil</option>
              <option value="Structural">Structural</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Instrumentation">Instrumentation</option>
              <option value="Project Controls">Project Controls</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Known Aliases (comma-separated)
            </label>
            <input
              type="text"
              value={newTerm.aliases}
              onChange={(e) => setNewTerm({ ...newTerm, aliases: e.target.value })}
              placeholder="CS Pipe, Carbon St., C-Steel"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Definition / Context
            </label>
            <textarea
              rows={2}
              value={newTerm.definition}
              onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
              placeholder="Specification or usage details..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="secondary" onClick={() => setShowAddTermModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Term</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
