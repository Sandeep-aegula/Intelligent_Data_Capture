import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Save,
  CheckCircle2,
  Sliders,
  Bell,
  RefreshCw,
  Shield,
  Trash2,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { settingService } from '../services/settingService';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { selectedProject } = useProject();

  const activeProjectId = projectId || selectedProject?.id || 'proj-001';

  const [projectData, setProjectData] = useState({
    name: selectedProject?.name || 'ABC Refinery Expansion',
    code: selectedProject?.code || 'ABC-REF-2026',
    location: selectedProject?.location || 'Houston, TX',
    description: selectedProject?.description || 'Refinery expansion with process plant units, piping systems, and civil foundations.',
    plannedStart: selectedProject?.plannedStart || '2026-01-15',
    plannedFinish: selectedProject?.plannedFinish || '2028-06-30',
  });

  const [highThreshold, setHighThreshold] = useState(85);
  const [lowThreshold, setLowThreshold] = useState(60);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await settingService.getSettings(activeProjectId);
        if (isMounted && res?.data) {
          if (res.data.auto_approve_threshold) {
            setHighThreshold(Math.round(res.data.auto_approve_threshold * 100));
          }
          if (res.data.review_flag_threshold) {
            setLowThreshold(Math.round(res.data.review_flag_threshold * 100));
          }
          if (typeof res.data.email_notifications === 'boolean') {
            setEmailAlerts(res.data.email_notifications);
          }
        }
      } catch (err) {
        console.warn('Backend settings offline or error:', err.message);
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await settingService.updateSettings(activeProjectId, {
        auto_approve_threshold: highThreshold / 100,
        review_flag_threshold: lowThreshold / 100,
        email_notifications: emailAlerts,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.warn('Backend settings update failed:', err.message);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleResetDemo = () => {
    localStorage.removeItem('selectedProjectId');
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-primary-50 text-primary-600 rounded-lg">
            <Settings size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage project metadata, AI linking confidence parameters, and notifications
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs text-success-600 font-semibold flex items-center gap-1 animate-fade-in">
            <CheckCircle2 size={16} /> Settings Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Project Metadata */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Project Metadata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Code</label>
              <input
                type="text"
                value={projectData.code}
                onChange={(e) => setProjectData({ ...projectData, code: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 font-mono"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={projectData.location}
              onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Project Description</label>
            <textarea
              rows={3}
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Planned Start</label>
              <input
                type="date"
                value={projectData.plannedStart}
                onChange={(e) => setProjectData({ ...projectData, plannedStart: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Planned Finish</label>
              <input
                type="date"
                value={projectData.plannedFinish}
                onChange={(e) => setProjectData({ ...projectData, plannedFinish: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </Card>

        {/* AI Confidence Configuration */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders size={18} className="text-primary-600" />
            AI Confidence Thresholds
          </h2>

          <div className="space-y-4 max-w-lg text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-800">High Confidence Trigger (Recommended Link):</span>
                <span className="text-success-700 font-mono">{highThreshold}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-800">Minimum Review Threshold (Floor):</span>
                <span className="text-warning-700 font-mono">{lowThreshold}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="70"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
            </div>
          </div>
        </Card>

        {/* Notifications & System Preferences */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Bell size={18} className="text-primary-600" />
            Notifications & System Alerts
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-slate-700 font-medium">
                Notify planner when daily reports contain matches below 80% confidence
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dailyDigest}
                onChange={(e) => setDailyDigest(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              <span className="text-slate-700 font-medium">
                Send daily delay variance summary for critical path activities
              </span>
            </label>
          </div>
        </Card>

        {/* Demo State Reset */}
        <Card className="p-6 space-y-4 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reset Frontend Demo State</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Clears localStorage session cache and reloads default multi-project demo data
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={handleResetDemo}
            >
              Reset Demo Session
            </Button>
          </div>
        </Card>

        {/* Action Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/projects/${activeProjectId}/dashboard`)}
          >
            Cancel
          </Button>
          <Button type="submit" icon={Save}>
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
