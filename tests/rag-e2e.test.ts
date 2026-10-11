/** Isolated router and migration/verifier contract tests. No backend or deployment claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RAGMigrationService } from '../scripts/migrate-to-public-private.js';
import { RAGSeparationVerifier } from '../scripts/verify-rag-separation.js';
import { GraphRAGStore } from '../src/lib/graphrag-store.js';
import { RAGRouter } from '../src/rag/rag-router.js';
const fixtures = vi.hoisted(() => ({ publicQuery: vi.fn(), privateQuery: vi.fn(), publicStore: vi.fn(), privateStore: vi.fn() }));
vi.mock('../src/rag/public-rag-store.js', () => {
  const store = { query: fixtures.publicQuery, store: fixtures.publicStore };
  return { PublicRAGStore: class { constructor() { return store; } }, publicRAGStore: store };
});
vi.mock('../src/rag/private-rag-store.js', () => {
  const store = { query: fixtures.privateQuery, store: fixtures.privateStore, isConfigured: () => true, getBackend: () => 'fixture' };
  return { PrivateRAGStore: class { constructor() { return store; } }, getPrivateRAGStore: () => store };
});
vi.mock('@google-cloud/firestore', async original => ({ ...await original<typeof import('@google-cloud/firestore')>(), Firestore: class {} }));
const pattern = (id: string, description: string, relevanceScore = 0.8) => ({ pattern: { id, type: 'pattern', properties: { pattern: description, description, category: 'testing', agent: 'fixture', tags: [] } }, relevanceScore, connections: [] });
beforeEach(() => {
  vi.resetAllMocks();
  fixtures.publicQuery.mockResolvedValue([pattern('public', 'React component testing')]);
  fixtures.privateQuery.mockResolvedValue([pattern('private', 'Internal company implementation')]);
});
describe('Migration classification and source admission', () => {
  it.each([
    ['React TypeScript component with hooks', 'public'],
    ['Internal company API', 'private'],
    ['Ambiguous opaque thing', 'private'],
    ['React component with a secret credential', 'private']
  ])('classifies %s conservatively', (description, classification) => {
    const result = (new RAGMigrationService() as any).classifyPattern({ id: 'fixture', description });
    expect(result.classification).toBe(classification);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
  it('fails clearly before sink writes when the default source inventory is unsupported', async () => {
    await expect(new RAGMigrationService().migrate({ dryRun: true })).rejects.toThrow('RAG_MIGRATION_SOURCE_ENUMERATION_UNSUPPORTED');
    await expect(new RAGMigrationService().migrate()).rejects.toThrow('authorized inventory API');
    expect(fixtures.publicStore).not.toHaveBeenCalled();
    expect(fixtures.privateStore).not.toHaveBeenCalled();
  });
  it('canonical entity retrieval finds a seeded public node but wildcard does not enumerate it', async () => {
    const graph = new GraphRAGStore();
    // Supplied local cache only: no persisted source, credentials, or identity authority.
    (graph as any).initialized = true;
    const seeded = { ...pattern('seeded', 'React component testing').pattern, label: 'React component testing', connections: [], privacy: { isPublic: true } };
    seeded.properties.effectiveness = 0.9;
    seeded.properties.usageCount = 1;
    (graph as any).nodes.set(seeded.id, seeded);
    const entities = (graph as any).extractEntities({ pattern: 'React', description: '', agent: '', category: '', tags: [] });
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) (graph as any).nodes.set(entity.id, { ...entity, connections: [seeded.id] });
    expect((await graph.query({ query: 'React', minRelevance: 0 })).map(result => result.pattern.id)).toEqual(['seeded']);
    expect(await graph.query({ query: '*', limit: 10000, minRelevance: 0 })).toEqual([]);
  });
  it('dry-runs only an explicit test inventory without claiming default enumeration', async () => {
    const service = new RAGMigrationService();
    vi.spyOn(service as any, 'loadExistingPatterns').mockResolvedValue([
      { id: 'one', description: 'React component testing' },
      { id: 'two', description: 'Internal company implementation' }
    ]);
    const stats = await service.migrate({ dryRun: true });
    expect(stats).toMatchObject({ totalPatterns: 2, publicPatterns: 1, privatePatterns: 1, errors: [] });
    expect(fixtures.publicStore).not.toHaveBeenCalled();
    expect(fixtures.privateStore).not.toHaveBeenCalled();
    expect(service.generateReport()).toContain('Total Patterns:    2');
  });
});
describe('Actual router with explicit backend fixtures', () => {
  it('prioritizes private results even when public relevance is higher', async () => {
    fixtures.privateQuery.mockResolvedValue([pattern('private', 'Internal implementation', 0.4)]);
    fixtures.publicQuery.mockResolvedValue([pattern('public', 'React component', 0.99)]);
    const results = await new RAGRouter().query({ query: 'implementation' });
    expect(results.map(result => result.source)).toEqual(['private', 'public']);
    expect(results.map(result => result.pattern.id)).toEqual(['private', 'public']);
  });
  it('deduplicates shared patterns retaining the private copy', async () => {
    fixtures.privateQuery.mockResolvedValue([pattern('private', 'React component testing')]);
    const results = await new RAGRouter().query({ query: 'component' });
    expect(results).toHaveLength(1);
    expect(results[0].source).toBe('private');
  });
  it('honors public exclusion and query result limits', async () => {
    const results = await new RAGRouter({ includePublic: false }).query({ query: 'implementation', limit: 1 });
    expect(results).toHaveLength(1);
    expect(results[0].source).toBe('private');
    expect(fixtures.publicQuery).not.toHaveBeenCalled();
  });
  it('returns empty results when both backend probes fail', async () => {
    fixtures.publicQuery.mockRejectedValue(new Error('public unavailable'));
    fixtures.privateQuery.mockRejectedValue(new Error('private unavailable'));
    expect(await new RAGRouter().query({ query: 'missing' })).toEqual([]);
  });
});
describe('Separation verifier sampled evidence', () => {
  it.each([
    ['Company proprietary internal API secret', false],
    ['React component rendering guidelines', true]
  ])('checks actual pattern properties: %s', async (description, passed) => {
    fixtures.publicQuery.mockResolvedValue([pattern('sample', description)]);
    const verifier = new RAGSeparationVerifier();
    const report = await verifier.verify({ strict: false });
    expect(report.results.find(result => result.test === 'Public RAG Privacy')?.passed).toBe(passed);
    expect(verifier.generateReport(false)).toContain('VERIFICATION REPORT');
  });
  it.each([[], { results: [] }, [{ malformed: true }]])('does not report clean privacy for missing or malformed evidence %j', async result => {
    fixtures.publicQuery.mockResolvedValue(result);
    const report = await new RAGSeparationVerifier().verify({ strict: false });
    const privacy = report.results.find(result => result.test === 'Public RAG Privacy');
    expect(privacy?.passed).toBe(false);
    expect(privacy?.severity).toBe('critical');
  });
});
