import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import Login from './pages/Login';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import ProjectSetup from './pages/ProjectSetup';
import ScheduleExplorer from './pages/ScheduleExplorer';
import ScheduleUpload from './pages/ScheduleUpload';
import DailyReports from './pages/DailyReports';
import ReportDetails from './pages/ReportDetails';
import AiExtraction from './pages/AiExtraction';
import AiMatching from './pages/AiMatching';
import PlannerReview from './pages/PlannerReview';
import ProgressTracking from './pages/ProgressTracking';
import DelayAnalysis from './pages/DelayAnalysis';
import KnowledgeBase from './pages/KnowledgeBase';
import AuditTrail from './pages/AuditTrail';
import ProjectSettings from './pages/ProjectSettings';
import NotFound from './pages/NotFound';

// Temporary development mode: authentication disabled, all routes open
function ProtectedRoute({ children }) {
  return children;
}

export default function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          {/* Default landing page is /projects (dev mode) */}
          <Route path="/" element={<Navigate to="/projects" replace />} />

          {/* Demo login retained for future use */}
          <Route path="/login" element={<Login />} />

          {/* Projects List */}
          <Route path="/projects" element={<Projects />} />

          {/* Project-scoped routes under AppShell */}
          <Route path="/projects/:projectId" element={<AppShell />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="setup" element={<ProjectSetup />} />
            <Route path="schedule" element={<ScheduleExplorer />} />
            <Route path="schedule/upload" element={<ScheduleUpload />} />
            <Route path="reports" element={<DailyReports />} />
            <Route path="reports/:reportId" element={<ReportDetails />} />
            <Route path="ai/extraction" element={<AiExtraction />} />
            <Route path="ai/matching" element={<AiMatching />} />
            <Route path="reviews" element={<PlannerReview />} />
            <Route path="progress" element={<ProgressTracking />} />
            <Route path="delays" element={<DelayAnalysis />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="settings" element={<ProjectSettings />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
