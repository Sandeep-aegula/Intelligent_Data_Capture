import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockProjects } from '../mock/projects';
import { mockReports } from '../mock/reports';
import { mockMatches } from '../mock/matches';
import { mockScheduleHierarchy, getMockScheduleActivities } from '../mock/schedules';
import { mockAuditTrail } from '../mock/audit';
import { mockDelays } from '../mock/delays';
import { mockTerminology, mockKnowledgeArticles } from '../mock/knowledge';

import { projectService } from '../services/projectService';
import { reportService } from '../services/reportService';
import { matchingService } from '../services/matchingService';
import { delayService } from '../services/delayService';
import { auditService } from '../services/auditService';
import { knowledgeService } from '../services/knowledgeService';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Project-scoped state stores
  const [projectReports, setProjectReports] = useState({});
  const [projectMatches, setProjectMatches] = useState({});
  const [projectAudit, setProjectAudit] = useState({});
  const [projectDelays, setProjectDelays] = useState({});
  const [projectTerms, setProjectTerms] = useState({});
  const [projectKnowledge, setProjectKnowledge] = useState({});
  const [customActivities, setCustomActivities] = useState({});

  // Global search modal state
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  useEffect(() => {
    // Initialize projects from live API with mock fallback if offline
    const loadProjects = async () => {
      setLoading(true);
      try {
        const res = await projectService.getProjects();
        const liveList = res?.data;
        if (Array.isArray(liveList) && liveList.length > 0) {
          // Normalize fields for frontend display
          const normalized = liveList.map((p) => ({
            ...p,
            overallProgress: p.overall_progress ?? p.overallProgress ?? 0,
            plannedStartDate: p.planned_start ?? p.plannedStartDate,
            plannedEndDate: p.planned_finish ?? p.plannedEndDate,
            actualStartDate: p.actual_start ?? p.actualStartDate,
          }));
          setProjects(normalized);

          const savedId = localStorage.getItem('selectedProjectId');
          if (savedId && normalized.some((p) => p.id === savedId)) {
            setSelectedProjectId(savedId);
          } else {
            setSelectedProjectId(normalized[0].id);
          }
        } else {
          setProjects(mockProjects);
          setSelectedProjectId(mockProjects[0]?.id);
        }
      } catch (err) {
        console.warn('Backend API offline, falling back to mock projects:', err.message);
        setProjects(mockProjects);
        setSelectedProjectId(mockProjects[0]?.id);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // Fetch live project data whenever selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) return;

    let isMounted = true;
    const fetchProjectData = async () => {
      try {
        const [repRes, matchRes, delayRes, auditRes, termRes, knowRes] = await Promise.allSettled([
          reportService.getReports(selectedProjectId),
          matchingService.getMatches(selectedProjectId),
          delayService.getDelayAnalysis(selectedProjectId),
          auditService.getAuditTrail(selectedProjectId),
          knowledgeService.getTerminology(selectedProjectId),
          knowledgeService.getArticles(selectedProjectId),
        ]);

        if (!isMounted) return;

        if (repRes.status === 'fulfilled' && repRes.value?.data) {
          setProjectReports((prev) => ({ ...prev, [selectedProjectId]: repRes.value.data }));
        } else if (mockReports[selectedProjectId]) {
          setProjectReports((prev) => ({ ...prev, [selectedProjectId]: mockReports[selectedProjectId] }));
        }

        if (matchRes.status === 'fulfilled' && matchRes.value?.data) {
          setProjectMatches((prev) => ({ ...prev, [selectedProjectId]: matchRes.value.data }));
        } else if (mockMatches[selectedProjectId]) {
          setProjectMatches((prev) => ({ ...prev, [selectedProjectId]: mockMatches[selectedProjectId] }));
        }

        if (delayRes.status === 'fulfilled' && delayRes.value?.data) {
          setProjectDelays((prev) => ({ ...prev, [selectedProjectId]: delayRes.value.data }));
        } else if (mockDelays[selectedProjectId]) {
          setProjectDelays((prev) => ({ ...prev, [selectedProjectId]: mockDelays[selectedProjectId] }));
        }

        if (auditRes.status === 'fulfilled' && auditRes.value?.data) {
          setProjectAudit((prev) => ({ ...prev, [selectedProjectId]: auditRes.value.data }));
        } else if (mockAuditTrail[selectedProjectId]) {
          setProjectAudit((prev) => ({ ...prev, [selectedProjectId]: mockAuditTrail[selectedProjectId] }));
        }

        if (termRes.status === 'fulfilled' && termRes.value?.data) {
          setProjectTerms((prev) => ({ ...prev, [selectedProjectId]: termRes.value.data }));
        } else if (mockTerminology[selectedProjectId]) {
          setProjectTerms((prev) => ({ ...prev, [selectedProjectId]: mockTerminology[selectedProjectId] }));
        }

        if (knowRes.status === 'fulfilled' && knowRes.value?.data) {
          setProjectKnowledge((prev) => ({ ...prev, [selectedProjectId]: knowRes.value.data }));
        } else if (mockKnowledgeArticles[selectedProjectId]) {
          setProjectKnowledge((prev) => ({ ...prev, [selectedProjectId]: mockKnowledgeArticles[selectedProjectId] }));
        }
      } catch (e) {
        console.error('Error fetching live project data:', e);
      }
    };

    fetchProjectData();
    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  const selectProject = useCallback((projectOrId) => {
    const id = typeof projectOrId === 'string' ? projectOrId : projectOrId?.id;
    if (id) {
      setSelectedProjectId(id);
      localStorage.setItem('selectedProjectId', id);
    } else {
      setSelectedProjectId(null);
      localStorage.removeItem('selectedProjectId');
    }
  }, []);

  const addProject = useCallback((newProj) => {
    setProjects((prev) => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
    localStorage.setItem('selectedProjectId', newProj.id);

    // Initialize stores for new project
    setProjectReports((prev) => ({ ...prev, [newProj.id]: [] }));
    setProjectMatches((prev) => ({ ...prev, [newProj.id]: [] }));
    setProjectAudit((prev) => ({
      ...prev,
      [newProj.id]: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'PROJECT_CREATED',
          category: 'Setup',
          user: 'John Mitchell',
          entityType: 'Project',
          entityId: newProj.id,
          details: `Created new project "${newProj.name}" (${newProj.code})`,
          previousValue: null,
          newValue: 'Active',
          confidence: null,
        },
      ],
    }));
    setProjectDelays((prev) => ({
      ...prev,
      [newProj.id]: {
        summary: { totalDelayedActivities: 0, criticalPathImpactDays: 0, forecastedDelayCost: '$0', activeMitigationPlans: 0 },
        rootCauses: [],
        items: [],
      },
    }));
    setProjectTerms((prev) => ({ ...prev, [newProj.id]: [] }));
    setProjectKnowledge((prev) => ({ ...prev, [newProj.id]: [] }));
  }, []);

  // Planner actions: Approve Match
  const approveMatch = useCallback(async (projectId, matchId, comment = '', verifiedQty = null) => {
    // Attempt backend persistence
    try {
      await matchingService.approveMatch(projectId, matchId, {
        notes: comment,
        confirmedQuantity: verifiedQty,
      });
    } catch (e) {
      console.warn('Backend match approval failed or offline:', e.message);
    }

    setProjectMatches((prev) => {
      const list = prev[projectId] || [];
      const updated = list.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'Approved',
            reviewer: 'John Mitchell (Planner)',
            reviewedBy: 'John Mitchell (Planner)',
            reviewedAt: new Date().toISOString(),
            plannerComment: comment,
            comments: comment,
            verifiedQuantity: verifiedQty !== null ? verifiedQty : m.extractedEvent?.quantity,
          };
        }
        return m;
      });
      return { ...prev, [projectId]: updated };
    });

    // Add to audit trail
    const matchObj = (projectMatches[projectId] || []).find((m) => m.id === matchId);
    const targetCandidate = matchObj?.candidates?.find((c) => c.activityId === (matchObj.selectedCandidate || matchObj.candidates[0]?.activityId));
    
    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'PLANNER_APPROVAL',
        category: 'Review',
        user: 'John Mitchell',
        entityType: 'Match',
        entityId: matchId,
        details: `Approved schedule link for "${matchObj?.extractedActivity || 'Activity'}" to ${targetCandidate?.activityId || 'Activity'}${comment ? ` — Note: ${comment}` : ''}`,
        previousValue: matchObj?.status || 'Needs Review',
        newValue: 'Approved (Planner Verified)',
        confidence: matchObj?.confidence || null,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });

    // Update project pending count
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId && p.pendingReviews > 0) {
          return { ...p, pendingReviews: p.pendingReviews - 1 };
        }
        return p;
      })
    );
  }, [projectMatches]);

  // Reject Match
  const rejectMatch = useCallback(async (projectId, matchId, reason = '') => {
    try {
      await matchingService.rejectMatch(projectId, matchId, reason);
    } catch (e) {
      console.warn('Backend match rejection failed or offline:', e.message);
    }

    setProjectMatches((prev) => {
      const list = prev[projectId] || [];
      const updated = list.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'Rejected',
            reviewedBy: 'John Mitchell (Planner)',
            reviewedAt: new Date().toISOString(),
            rejectReason: reason,
          };
        }
        return m;
      });
      return { ...prev, [projectId]: updated };
    });

    const matchObj = (projectMatches[projectId] || []).find((m) => m.id === matchId);
    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'MATCH_REJECTED',
        category: 'Review',
        user: 'John Mitchell',
        entityType: 'Match',
        entityId: matchId,
        details: `Rejected candidate match for "${matchObj?.extractedActivity || 'Activity'}". Rationale: ${reason || 'Not applicable to schedule baseline'}`,
        previousValue: matchObj?.status || 'Needs Review',
        newValue: 'Rejected',
        confidence: matchObj?.confidence || null,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId && p.pendingReviews > 0) {
          return { ...p, pendingReviews: p.pendingReviews - 1 };
        }
        return p;
      })
    );
  }, [projectMatches]);

  // Reassign / Change candidate
  const reassignMatch = useCallback(async (projectId, matchId, newActivityId, comment = '') => {
    try {
      await matchingService.reassignMatch(projectId, matchId, newActivityId, comment);
    } catch (e) {
      console.warn('Backend match reassign failed or offline:', e.message);
    }

    setProjectMatches((prev) => {
      const list = prev[projectId] || [];
      const updated = list.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            selectedCandidate: newActivityId,
            status: 'Approved',
            isOverridden: true,
            reviewedBy: 'John Mitchell (Planner)',
            reviewedAt: new Date().toISOString(),
            plannerComment: comment,
          };
        }
        return m;
      });
      return { ...prev, [projectId]: updated };
    });

    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'MATCH_OVERRIDDEN',
        category: 'Review',
        user: 'John Mitchell',
        entityType: 'Match',
        entityId: matchId,
        details: `Reassigned match target to activity ${newActivityId}${comment ? ` — Note: ${comment}` : ''}`,
        previousValue: 'Needs Review',
        newValue: `Linked to ${newActivityId} (Manual Verification)`,
        confidence: 100,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId && p.pendingReviews > 0) {
          return { ...p, pendingReviews: p.pendingReviews - 1 };
        }
        return p;
      })
    );
  }, []);

  // Request Insufficient Context
  const requestContextMatch = useCallback(async (projectId, matchId, note = '') => {
    try {
      await matchingService.requestContext(projectId, matchId, note);
    } catch (e) {
      console.warn('Backend match context request failed or offline:', e.message);
    }

    setProjectMatches((prev) => {
      const list = prev[projectId] || [];
      const updated = list.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'Insufficient Context',
            contextRequestedNote: note,
            reviewedBy: 'John Mitchell (Planner)',
            reviewedAt: new Date().toISOString(),
          };
        }
        return m;
      });
      return { ...prev, [projectId]: updated };
    });

    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'CONTEXT_REQUESTED',
        category: 'Review',
        user: 'John Mitchell',
        entityType: 'Match',
        entityId: matchId,
        details: `Flagged for field clarification: "${note || 'Missing isometric number or specific spool ID'}"`,
        previousValue: 'Needs Review',
        newValue: 'Insufficient Context',
        confidence: null,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });
  }, []);

  // Add Daily Report (file or text)
  const addDailyReport = useCallback((projectId, newReport, extractedEvents = [], matchesGenerated = []) => {
    const reportWithId = {
      ...newReport,
      id: newReport.id || `rpt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setProjectReports((prev) => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [reportWithId, ...list] };
    });

    if (matchesGenerated.length > 0) {
      setProjectMatches((prev) => {
        const list = prev[projectId] || [];
        return { ...prev, [projectId]: [...matchesGenerated, ...list] };
      });
    }

    // Add audit entry
    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'REPORT_UPLOADED',
        category: 'Capture',
        user: 'John Mitchell',
        entityType: 'Daily Report',
        entityId: reportWithId.id,
        details: `Submitted Daily Report #${reportWithId.reportNumber || 'New'} (${reportWithId.sourceType}) — ${extractedEvents.length} events extracted`,
        previousValue: null,
        newValue: 'Processed',
        confidence: null,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });

    // Update project
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            lastReportDate: reportWithId.date,
            pendingReviews: p.pendingReviews + matchesGenerated.filter((m) => m.status === 'Needs Review').length,
          };
        }
        return p;
      })
    );

    return reportWithId;
  }, []);

  // Add Delay item
  const addDelayItem = useCallback(async (projectId, delayItem) => {
    let savedItem = null;
    try {
      const res = await delayService.logDelay(projectId, delayItem);
      savedItem = res?.data;
    } catch (e) {
      console.warn('Backend logDelay failed or offline:', e.message);
    }

    const itemWithId = {
      id: savedItem?.id || `del-${Date.now()}`,
      loggedDate: new Date().toISOString().split('T')[0],
      owner: 'John Mitchell',
      mitigationStatus: 'Under Review',
      ...delayItem,
    };

    setProjectDelays((prev) => {
      const cur = prev[projectId] || { summary: {}, rootCauses: [], items: [] };
      return {
        ...prev,
        [projectId]: {
          ...cur,
          summary: {
            ...cur.summary,
            totalDelayedActivities: (cur.summary?.totalDelayedActivities || 0) + 1,
            activeMitigationPlans: (cur.summary?.activeMitigationPlans || 0) + 1,
          },
          items: [itemWithId, ...(cur.items || [])],
        },
      };
    });

    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'DELAY_LOGGED',
        category: 'Delays',
        user: 'John Mitchell',
        entityType: 'Activity',
        entityId: itemWithId.activityId,
        details: `Logged ${itemWithId.varianceDays}-day delay for ${itemWithId.activityName}. Cause: ${itemWithId.rootCause}`,
        previousValue: 'On Track',
        newValue: `Delayed (+${itemWithId.varianceDays}d)`,
        confidence: null,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });
  }, []);

  // Add Terminology item
  const addTerminologyItem = useCallback(async (projectId, termItem) => {
    try {
      await knowledgeService.addTerminology(projectId, termItem);
    } catch (e) {
      console.warn('Backend addTerminology failed or offline:', e.message);
    }

    const itemWithUsage = { ...termItem, usageCount: 1 };
    setProjectTerms((prev) => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [itemWithUsage, ...list] };
    });

    setProjectAudit((prev) => {
      const logs = prev[projectId] || [];
      const newLog = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'TERMINOLOGY_ADDED',
        category: 'Setup',
        user: 'John Mitchell',
        entityType: 'Terminology',
        entityId: itemWithUsage.term,
        details: `Added project terminology: "${itemWithUsage.term}" = "${itemWithUsage.expansion}"`,
        previousValue: null,
        newValue: 'Added to Dictionary',
        confidence: null,
      };
      return { ...prev, [projectId]: [newLog, ...logs] };
    });
  }, []);

  // Add Knowledge Article
  const addKnowledgeArticle = useCallback((projectId, article) => {
    const itemWithId = {
      id: `kb-${Date.now()}`,
      author: 'John Mitchell',
      updatedAt: new Date().toISOString().split('T')[0],
      ...article,
    };
    setProjectKnowledge((prev) => {
      const list = prev[projectId] || [];
      return { ...prev, [projectId]: [itemWithId, ...list] };
    });
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProject,
        selectedProjectId,
        selectProject,
        addProject,
        loading,
        projectReports,
        projectMatches,
        projectAudit,
        projectDelays,
        projectTerms,
        projectKnowledge,
        customActivities,
        setCustomActivities,
        approveMatch,
        rejectMatch,
        reassignMatch,
        requestContextMatch,
        addDailyReport,
        addDelayItem,
        addTerminologyItem,
        addKnowledgeArticle,
        globalSearchOpen,
        setGlobalSearchOpen,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export default ProjectContext;
