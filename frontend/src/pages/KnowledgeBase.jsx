import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  Calendar,
  User,
  ArrowRight,
  BookMarked,
  X,
  FileText,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export default function KnowledgeBase() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject, projectKnowledge, addKnowledgeArticle } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';
  const articles = projectKnowledge[activeProjectId] || [];

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Best Practices',
    discipline: 'Piping',
    summary: '',
    content: '',
    tags: '',
  });

  const categories = ['All', 'Best Practices', 'Standard Specs', 'Lessons Learned', 'Safety'];

  const filteredArticles = articles.filter((art) => {
    const matchCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.summary.toLowerCase().includes(search.toLowerCase()) ||
      art.discipline.toLowerCase().includes(search.toLowerCase()) ||
      art.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleCreateArticle = (e) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.summary) return;

    addKnowledgeArticle(activeProjectId, {
      title: newArticle.title,
      category: newArticle.category,
      discipline: newArticle.discipline,
      summary: newArticle.summary,
      content: newArticle.content || newArticle.summary,
      tags: newArticle.tags ? newArticle.tags.split(',').map((t) => t.trim()) : [newArticle.discipline],
    });

    setNewArticle({
      title: '',
      category: 'Best Practices',
      discipline: 'Piping',
      summary: '',
      content: '',
      tags: '',
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <BookOpen size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Project Knowledge Base & Protocols</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard installation protocols, lessons learned, and field verification specifications
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/projects/${activeProjectId}/setup`)}
          >
            Project Terminology Dictionary
          </Button>
          <Button icon={Plus} size="sm" onClick={() => setShowAddModal(true)}>
            Add Article
          </Button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search protocols, tags, or disciplines..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-primary-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                  {art.discipline}
                </span>
                <span className="text-[10px] text-slate-400">{art.updatedAt}</span>
              </div>

              <h2 className="text-sm font-bold text-slate-900 mb-2 leading-snug">
                {art.title}
              </h2>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {art.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {art.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-primary-600 font-semibold flex items-center gap-1">
                Read →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Viewer Modal */}
      <Modal
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Knowledge Article'}
        size="lg"
      >
        {selectedArticle && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 text-slate-500">
              <span>Category: <strong>{selectedArticle.category}</strong></span>
              <span>·</span>
              <span>Discipline: <strong>{selectedArticle.discipline}</strong></span>
              <span>·</span>
              <span>Author: <strong>{selectedArticle.author}</strong></span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 italic">
              {selectedArticle.summary}
            </div>

            <div className="whitespace-pre-line text-slate-800 leading-relaxed font-sans pt-2">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-1.5">
              {selectedArticle.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Article Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Knowledge Base Protocol"
        size="lg"
      >
        <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              value={newArticle.title}
              onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
              placeholder="e.g. Hydrotest Verification Checklist"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newArticle.category}
                onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
              >
                <option value="Best Practices">Best Practices</option>
                <option value="Standard Specs">Standard Specs</option>
                <option value="Lessons Learned">Lessons Learned</option>
                <option value="Safety">Safety</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discipline</label>
              <select
                value={newArticle.discipline}
                onChange={(e) => setNewArticle({ ...newArticle, discipline: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
              >
                <option value="Piping">Piping</option>
                <option value="Civil">Civil</option>
                <option value="Structural">Structural</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Instrumentation">Instrumentation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Summary *</label>
            <input
              type="text"
              value={newArticle.summary}
              onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
              placeholder="One-line summary for cards..."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Content / Standard Guidelines</label>
            <textarea
              rows={5}
              value={newArticle.content}
              onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
              placeholder="Full procedural instructions or verification rules..."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={newArticle.tags}
              onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
              placeholder="Piping, Verification, Spools"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Article
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
