/** Current RAGRouter mapping and aggregation with synthetic provider adapters only. */
import { PatternSearchService } from '../../../src/rag/pattern-search';
import { getRAGRouter } from '../../../src/rag/rag-router';

jest.mock('../../../src/rag/rag-router', () => ({ getRAGRouter: jest.fn() }));
jest.mock('../../../src/rag/enhanced-vector-memory-store', () => ({ EnhancedVectorMemoryStore: jest.fn(() => ({ queryMemories: jest.fn().mockResolvedValue({ documents: [] }) })) }));

const fixturePatterns = [
  { pattern: { id: 'fixture-private', properties: { pattern: 'JWT Authentication', agent: 'marcus', category: 'auth', effectiveness: 0.85, timeSaved: 24, lastUsed: '2025-01-15', code: 'fixture' } }, relevanceScore: 0.92, source: 'private' },
  { pattern: { id: 'fixture-public', properties: { pattern: 'OAuth Integration', agent: 'marcus', category: 'auth', effectiveness: 0.78, timeSaved: 16, lastUsed: '2025-01-10' } }, relevanceScore: 0.85, source: 'public' }
];

describe('PatternSearchService current router contract', () => {
  let router: { query: jest.Mock; shouldSuggestPrivateRAG: jest.Mock; getPrivateRAGSuggestion: jest.Mock };
  let service: PatternSearchService;
  beforeEach(() => {
    router = { query: jest.fn(async (request) => fixturePatterns.filter(result => result.relevanceScore >= request.minRelevance && (!request.category || result.pattern.properties.category === request.category) && (!request.agent || result.pattern.properties.agent === request.agent)).slice(0, request.limit)),
      shouldSuggestPrivateRAG: jest.fn().mockReturnValue(false), getPrivateRAGSuggestion: jest.fn().mockReturnValue('Synthetic private-storage setup suggestion') };
    (getRAGRouter as jest.Mock).mockReturnValue(router);
    service = new PatternSearchService();
  });
  it('passes query filters to the actual router adapter boundary', async () => {
    await service.searchSimilarFeatures({ description: 'JWT auth', agent: 'marcus', category: 'auth', limit: 2, min_similarity: 0.8 });
    expect(router.query).toHaveBeenCalledWith({ query: 'JWT auth', agent: 'marcus', category: 'auth', limit: 2, minRelevance: 0.8 });
  });
  it('aggregates efforts, relevance confidence and private/public provenance', async () => {
    const result = await service.searchSimilarFeatures({ description: 'auth' });
    expect(result).toMatchObject({ total_found: 2, search_method: 'graphrag', sources: 'both', private_count: 1, public_count: 1, avg_effort: 20, avg_confidence: 89 });
    expect(result.patterns[0]).toMatchObject({ feature_name: 'JWT Authentication', effort_hours: 24, confidence: 92, similarity_score: 0.92, agent: 'marcus', category: 'auth', timestamp: Date.parse('2025-01-15') });
  });
  it('preserves the success percentage instead of rounding the fraction first', async () => {
    const result = await service.searchSimilarFeatures({ description: 'auth' });
    expect(result.patterns.map(pattern => pattern.success_score)).toEqual([85, 78]);
  });
  it('preserves an explicit zero success score', async () => {
    router.query.mockResolvedValueOnce([{ ...fixturePatterns[0], pattern: { properties: { ...fixturePatterns[0].pattern.properties, effectiveness: 0 } } }]);
    expect((await service.searchSimilarFeatures({ description: 'zero' })).patterns[0].success_score).toBe(0);
  });
  it('uses the established default only for a null success measurement', async () => {
    router.query.mockResolvedValueOnce([{ ...fixturePatterns[0], pattern: { properties: { ...fixturePatterns[0].pattern.properties, effectiveness: null } } }]);
    expect((await service.searchSimilarFeatures({ description: 'unknown' })).patterns[0].success_score).toBe(80);
  });
  it('returns only admitted fixture records for the requested similarity threshold', async () => {
    const result = await service.searchSimilarFeatures({ description: 'auth', min_similarity: 0.9 });
    expect(result.patterns.map(pattern => pattern.feature_name)).toEqual(['JWT Authentication']);
    expect(result.sources).toBe('private');
  });
  it('propagates an exact limit to the router and aggregates returned admitted records', async () => {
    const result = await service.searchSimilarFeatures({ description: 'auth', limit: 1 });
    expect(result.patterns).toHaveLength(1);
    expect(result.avg_effort).toBe(24);
  });
  it('does not fabricate results for excluded categories', async () => {
    const result = await service.searchSimilarFeatures({ description: 'auth', category: 'database' });
    expect(result).toMatchObject({ patterns: [], total_found: 0, avg_effort: null, avg_confidence: null, sources: 'none', private_count: 0, public_count: 0, recommended_approach: null });
  });
  it('exposes actual sparse historical fields without inventing lessons or risks', async () => {
    const result = await service.searchSimilarFeatures({ description: 'auth' });
    expect(result.patterns[0]).toMatchObject({ effort_range: { min: 0, max: 24 }, lessons_learned: [], risks: { high: [], medium: [], low: [] }, code_examples: [{ file: 'private', lines: '1-10', description: '' }] });
    expect(result.consolidated_lessons).toEqual([]);
    expect(result.recommended_approach).toContain('similar');
  });
  it('uses the vector adapter only when router query rejects', async () => {
    router.query.mockRejectedValueOnce(new Error('Synthetic router unavailable'));
    const result = await service.searchSimilarFeatures({ description: 'auth' });
    expect(result).toMatchObject({ patterns: [], search_method: 'vector', sources: 'none' });
  });
  it('includes private storage setup suggestions only when the router requests them', async () => {
    router.shouldSuggestPrivateRAG.mockReturnValueOnce(true);
    const result = await service.searchSimilarFeatures({ description: 'auth' });
    expect(result.privateRAGSuggestion).toBe('Synthetic private-storage setup suggestion');
    expect(router.shouldSuggestPrivateRAG).toHaveBeenCalledWith(fixturePatterns);
  });
});
