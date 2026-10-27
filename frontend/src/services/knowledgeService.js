import api from './api';
import { hierarchyDefinitions } from '../mock/knowledge';

export const knowledgeService = {
  async getTerminology(projectId) {
    const response = await api.get(`/projects/${projectId}/terminology`);
    return {
      data: (response.data || []).map((t) => ({
        id: t.id,
        term: t.term,
        expansion: t.expansion,
        discipline: t.discipline,
        definition: t.definition,
        aliases: t.aliases || [],
        usageCount: t.usage_count || 1,
        isVerified: t.is_verified,
      })),
    };
  },

  async getArticles(projectId) {
    const response = await api.get(`/projects/${projectId}/knowledge-base`);
    return {
      data: (response.data || []).map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        discipline: a.discipline,
        author: a.author,
        summary: a.summary,
        tags: a.tags || [],
        updatedAt: a.created_at ? a.created_at.split('T')[0] : '',
      })),
    };
  },

  async getHierarchyDefinitions() {
    return { data: hierarchyDefinitions };
  },

  async addTerminology(projectId, termData) {
    const payload = {
      standard_term: termData.term,
      definition: termData.expansion || termData.definition,
      discipline: termData.discipline || 'Piping',
      aliases: termData.aliases || [],
      is_verified: true,
    };
    const response = await api.post(`/projects/${projectId}/terminology`, payload);
    return { data: response.data };
  },

  async addArticle(projectId, articleData) {
    const payload = {
      title: articleData.title,
      doc_type: articleData.category || 'Technical Specification',
      content: articleData.content || articleData.summary || 'Content pending',
    };
    const response = await api.post(`/projects/${projectId}/knowledge-base/documents`, payload);
    return { data: response.data };
  },

  async searchKnowledge(projectId, query) {
    const response = await api.post(`/projects/${projectId}/knowledge-base/search`, { query });
    return { data: response.data };
  },
};
