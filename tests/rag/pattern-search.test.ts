/** Real pattern conversion/aggregation with an explicit offline router boundary. */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PatternSearchService } from '../../src/rag/pattern-search.js';
import { getRAGRouter } from '../../src/rag/rag-router.js';
jest.mock('../../src/rag/rag-router.js', () => {
  const router = { query: jest.fn(), shouldSuggestPrivateRAG: jest.fn().mockReturnValue(false), getPrivateRAGSuggestion: jest.fn().mockReturnValue('Fixture suggestion') };
  return { getRAGRouter: () => router };
});
jest.mock('../../src/rag/enhanced-vector-memory-store.js', () => ({ EnhancedVectorMemoryStore: jest.fn().mockImplementation(() => ({ retrieve: jest.fn().mockResolvedValue([]) })) }));
const router = getRAGRouter() as any;
let service: PatternSearchService;
beforeEach(() => { jest.clearAllMocks(); router.query.mockResolvedValue([]); router.shouldSuggestPrivateRAG.mockReturnValue(false); service = new PatternSearchService(); });
const input = (source: string, relevanceScore: number, timeSaved: number) => ({ source, relevanceScore, pattern: { properties: { pattern: `${source}-fixture`, timeSaved, effectiveness: 1, agent: 'marcus-backend', category: 'backend', lastUsed: '2026-01-01T00:00:00Z' } } });
describe('Pattern search router contract', () => {
  it('reports no insight for an empty result corpus', async () => {
    expect(await service.searchSimilarFeatures({ description: 'missing fixture' })).toMatchObject({ patterns: [], total_found: 0, avg_effort: null, avg_confidence: null, sources: 'none', private_count: 0, public_count: 0 });
  });
  it('delegates similarity, limit, agent, and category constraints to the router', async () => {
    await service.searchSimilarFeatures({ description: 'fixture', min_similarity: 0.95, limit: 3, agent: 'marcus-backend', category: 'backend' });
    expect(router.query).toHaveBeenCalledWith({ query: 'fixture', minRelevance: 0.95, limit: 3, agent: 'marcus-backend', category: 'backend' });
  });
  it('converts both public and private results and computes their aggregate effort', async () => {
    router.query.mockResolvedValue([input('private', 0.95, 4), input('public', 0.85, 2)]);
    const result = await service.searchSimilarFeatures({ description: 'fixture' });
    expect(result).toMatchObject({ total_found: 2, avg_effort: 3, avg_confidence: 90, sources: 'both', private_count: 1, public_count: 1 });
    expect(result.patterns.map(value => value.feature_name)).toEqual(['private-fixture', 'public-fixture']);
    expect(result.patterns.map(value => value.similarity_score)).toEqual([0.95, 0.85]);
    expect(result.patterns[0].timestamp).toBe(Date.parse('2026-01-01T00:00:00Z'));
  });
  it('includes a private-store suggestion only when the router requests it', async () => {
    router.shouldSuggestPrivateRAG.mockReturnValue(true);
    expect((await service.searchSimilarFeatures({ description: 'fixture' })).privateRAGSuggestion).toBe('Fixture suggestion');
    expect(router.getPrivateRAGSuggestion).toHaveBeenCalledTimes(1);
  });
});
