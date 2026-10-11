import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphNode } from './graphrag-store.js';
import { createRecoveryApp } from '../dashboard/graph-recovery-console.js';
import type { Server } from 'node:http';

const backend = vi.hoisted(() => ({
  configurations: [] as any[], collections: new Map<string, Map<string, any>>(), operations: [] as any[], reads: [] as string[],
  failure: '' as string, loadFailure: '' as string, readGate: undefined as undefined | (() => Promise<void>), retry: false, attempts: 0,
  afterDiscard: undefined as undefined | (() => void), beforeCommit: undefined as undefined | (() => void),
}));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  const copy = (value: any): any => {
    if (value instanceof Date) return new Date(value.getTime());
    if (value instanceof actual.Timestamp) return new actual.Timestamp(value.seconds, value.nanoseconds);
    if (Buffer.isBuffer(value)) return Buffer.from(value);
    if (value instanceof Uint8Array) return new Uint8Array(value);
    if (Array.isArray(value)) return value.map(copy);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
    return value;
  };
  const map = (name: string) => {
    if (!backend.collections.has(name)) backend.collections.set(name, new Map());
    return backend.collections.get(name)!;
  };
  const snapshot = (ref: any): any => {
    backend.reads.push(ref.collection + (ref.id ? '/' + ref.id : ''));
    if (!ref.id) {
      if (backend.loadFailure === ref.collection) throw Error('LOAD_FAILED');
      const rows = [...map(ref.collection)].map(([id, data]) => ({ id, data: () => copy(data) }));
      return { size: rows.length, forEach: (fn: any) => rows.forEach(fn) };
    }
    const data = map(ref.collection).get(ref.id);
    return { id: ref.id, exists: data !== undefined, data: () => copy(data) };
  };
  class MockFirestore {
    constructor(configuration: any) { backend.configurations.push(configuration); }
    collection(name: string) {
      return { collection: name, get: async () => snapshot({ collection: name }), doc: (id: string) => ({
        collection: name, id,
        create: async (data: any) => { if (map(name).has(id)) throw Error('ALREADY_EXISTS'); map(name).set(id, copy(data)); },
        set: async (data: any) => { map(name).set(id, copy(data)); backend.operations.push({ ref: { collection: name, id }, data: copy(data), create: false }); },
        update: async (patch: any) => { if (!map(name).has(id)) throw Error('NOT_FOUND'); map(name).set(id, { ...map(name).get(id), ...copy(patch) }); backend.operations.push({ ref: { collection: name, id }, data: copy(patch), update: true }); },
      }) };
    }
    async runTransaction(callback: any) {
      const attempt = async () => {
        backend.attempts++;
        const writes: any[] = [];
        const transaction = {
          get: async (ref: any) => { if (writes.length) throw Error('READ_AFTER_WRITE'); if (!ref.id && backend.readGate) { const gate = backend.readGate; backend.readGate = undefined; await gate(); } return snapshot(ref); },
          create: (ref: any, data: any) => writes.push({ ref, data: copy(data), create: true }),
          set: (ref: any, data: any) => writes.push({ ref, data: copy(data), create: false }),
        };
        const value = await callback(transaction);
        return { value, writes };
      };
      if (backend.retry) { await attempt(); backend.retry = false; backend.afterDiscard?.(); }
      const { value, writes } = await attempt();
      if (writes.length) {
        backend.beforeCommit?.();
        if (backend.failure === 'before') throw Error('KNOWN_BEFORE_COMMIT');
        for (const write of writes) if (write.create && map(write.ref.collection).has(write.ref.id)) throw Error('ALREADY_EXISTS');
        for (const write of writes) { map(write.ref.collection).set(write.ref.id, write.data); backend.operations.push(copy(write)); }
        if (backend.failure === 'after') throw Error('AMBIGUOUS_AFTER_COMMIT');
      }
      return value;
    }
    async terminate() {}
  }
  return { ...actual, Firestore: MockFirestore };
});
const day = 86400000;
let clock = Date.UTC(2026, 9, 8);
const documents = (collection = 'graphrag_nodes') => backend.collections.get(collection)!;
const node = (id: string, extra: Partial<GraphNode> = {}): GraphNode => ({ id, type: 'concept', label: id, properties: {}, connections: [], ...extra });
const pattern = (id: string, lastUsed: any = new Date(clock)): any => node(id, { type: 'pattern', properties: {
  pattern: 'React cache', agent: 'agent-x', category: 'cache', effectiveness: 1, timeSaved: 1,
  tags: [], usageCount: 0, lastUsed,
}, privacy: { isPublic: true }, connections: ['tech_react'] });
const make = () => new GraphRAGStore({ softDeletion: { clock: () => new Date(clock) } });
const seed = () => {
  documents().set('tech_react', node('tech_react', { type: 'technology', connections: ['p', 'shared', 'p', 'unresolved'] }));
  documents().set('p', pattern('p'));
  documents().set('shared', node('shared', { properties: { label: 'keep', when: new Date(clock), bytes: Buffer.from([1, 2]) }, connections: ['p', 'shared'] }));
  documents('graphrag_edges').set('e1', { id: 'e1', source: 'p', target: 'tech_react', relationship: 'uses', weight: 1 });
  documents('graphrag_edges').set('e2', { id: 'e2', source: 'p', target: 'tech_react', relationship: 'uses', weight: .5 });
  documents('graphrag_edges').set('incoming', { id: 'incoming', source: 'shared', target: 'p', relationship: 'uses', weight: .5 });
  documents('graphrag_edges').set('self', { id: 'self', source: 'p', target: 'p', relationship: 'uses', weight: .5 });
};
beforeEach(() => {
  clock = Date.UTC(2026, 9, 8); backend.collections.clear();
  for (const name of ['graphrag_nodes', 'graphrag_edges', 'graphrag_deletions']) backend.collections.set(name, new Map());
  backend.configurations = []; backend.operations = []; backend.reads = []; backend.failure = ''; backend.loadFailure = ''; backend.readGate = undefined; backend.retry = false; backend.attempts = 0; backend.afterDiscard = undefined; backend.beforeCommit = undefined;
});

describe('GraphRAG reversible explicit deletion', () => {
  it('masks a node, all incident edges and visible references without changing any original record', async () => {
    seed(); const originalNodes = structuredClone([...documents()]); const originalEdges = structuredClone([...documents('graphrag_edges')]);
    const store = make(); await store.initialize();
    expect((await store.query({ query: 'React' })).map(x => x.pattern.id)).toContain('p');
    const result = await store.deleteNode('p'); expect(result.outcomes).toEqual([{ id: 'p', outcome: 'masked' }]);
    expect(store.getNode('p')).toBeUndefined(); expect(store.getEdgesForNode('p')).toEqual([]);
    expect(store.getNeighbors('tech_react')).toEqual(['shared', 'unresolved']);
    expect(store.getNeighbors('shared')).toEqual(['shared']);
    expect((await store.query({ query: 'React' })).map(x => x.pattern.id)).not.toContain('p');
    expect(store['bfsTraversal']('tech_react', 3)).not.toContain('p');
    expect(store['findShortestPath']('tech_react', 'p')).toEqual([]);
    expect(await store.findRelatedPatterns('tech_react')).toEqual([]);
    expect((await store.getStatistics()).totalEdges).toBe(0);
    expect(structuredClone([...documents()])).toEqual(originalNodes); expect(structuredClone([...documents('graphrag_edges')])).toEqual(originalEdges);
    const reloaded = make(); await reloaded.initialize(); expect(reloaded.getNode('p')).toBeUndefined();
    await reloaded.restoreNode('p'); expect(reloaded.getNode('p')!.properties.lastUsed).toEqual(new Date(clock));
    expect(reloaded.getNeighbors('tech_react')).toEqual(['p', 'shared', 'p', 'unresolved']);
    expect(reloaded.getEdgesForNode('p')).toHaveLength(4); expect((await reloaded.query({ query: 'React' })).map(x => x.pattern.id)).toContain('p');
  });
  it('masks only one parallel edge, preserves independent traversal links, and reports unknown ownership', async () => {
    seed(); const store = make(); await store.initialize(); const links = store.getNeighbors('p');
    const result = await store.deleteEdge('e1'); expect(result.warnings.join(' ')).toContain('connectionOwnershipUnknown');
    expect(store.getEdge('e1')).toBeUndefined(); expect(store.getEdge('e2')).toBeDefined();
    expect(store.getNeighbors('p')).toEqual(links); expect(store['findShortestPath']('p', 'tech_react')).toEqual(['p', 'tech_react']);
    await store.restoreEdge('e1'); expect(store.getEdge('e1')!.weight).toBe(1);
  });
  it('restoring a node does not unmask an independently deleted edge; restoring that edge does not reveal a deleted endpoint', async () => {
    seed(); const store = make(); await store.deleteEdge('e1'); await store.deleteNode('p');
    await store.restoreEdge('e1'); expect(store.getEdge('e1')).toBeUndefined();
    await store.deleteEdge('e1'); await store.restoreNode('p'); expect(store.getEdge('e1')).toBeUndefined(); expect(store.getEdge('e2')).toBeDefined();
  });
  it.each([-1, 0, 1, day])('restores after guarantee boundary offset%s while retaining original records', async offset => {
    seed(); const store = make(); await store.deleteNode('p'); clock += 30 * day + offset;
    const reloaded = make(); await reloaded.initialize(); expect(reloaded.getNode('p')).toBeUndefined();
    await reloaded.restoreNode('p'); expect(reloaded.getNode('p')).toBeDefined();
    expect(documents().has('p')).toBe(true); expect(documents('graphrag_deletions').has('node_p')).toBe(true);
  });
  it('repeated active deletion preserves the window and redeletion after restore opens a new window', async () => {
    seed(); const store = make(); await store.deleteNode('p'); const first = documents('graphrag_deletions').get('node_p').deletedAt.toMillis();
    clock += day; expect((await store.deleteNode('p')).outcomes[0].outcome).toBe('already-masked'); expect(documents('graphrag_deletions').get('node_p').deletedAt.toMillis()).toBe(first);
    await store.restoreNode('p'); await store.deleteNode('p'); expect(documents('graphrag_deletions').get('node_p').deletedAt.toMillis()).toBe(clock);
  });
  it('absent targets and already visible restore are idempotent without fabricating documents', async () => {
    const store = make(); expect((await store.deleteNode('missing')).outcomes[0].outcome).toBe('absent');
    expect((await store.restoreEdge('missing')).outcomes[0].outcome).toBe('absent'); expect(documents('graphrag_deletions').size).toBe(0);
    documents().set('a', node('a')); expect((await store.restoreNode('a')).outcomes[0].outcome).toBe('already-visible');
  });
  it('requires explicit retention IDs and preserves old, equal, recent, invalid-date and non-pattern evidence', async () => {
    const store = make(); await expect(store.deleteOldPatterns(new Date(clock))).rejects.toThrow('IDs required'); expect(backend.reads).toEqual([]);
    for (const [id, date] of [['old', new Date(clock - 1)], ['equal', Timestamp.fromMillis(clock)], ['recent', new Date(clock + 1)], ['bad', 'not-a-date'], ['invalid-date', new Date(NaN)], ['absent-date', undefined]] as const) {
      const record = pattern(id, date); if (id === 'absent-date') delete record.properties.lastUsed; documents().set(id, record);
    }
    documents().set('keep-entity', node('keep-entity')); documents().set('outside', pattern('outside', new Date(clock - day)));
    const result = await store.deleteOldPatterns(new Date(clock), { ids: ['old', 'equal', 'recent', 'bad', 'invalid-date', 'absent-date', 'keep-entity', 'missing'] });
    expect(result.outcomes).toEqual([{ id: 'old', outcome: 'masked' }, { id: 'equal', outcome: 'masked' }, { id: 'recent', outcome: 'retained-recent' }, { id: 'bad', outcome: 'retained-invalid-date' }, { id: 'invalid-date', outcome: 'retained-invalid-date' }, { id: 'absent-date', outcome: 'retained-invalid-date' }, { id: 'keep-entity', outcome: 'retained-non-pattern' }, { id: 'missing', outcome: 'absent' }]);
    const reloaded = make(); await reloaded.initialize(); expect(reloaded.getNode('old')).toBeUndefined(); expect(reloaded.getNode('equal')).toBeUndefined(); expect(reloaded.getNode('outside')).toBeDefined(); expect(reloaded.getNode('bad')).toBeDefined(); expect(documents().size).toBe(8);
  });
  it.each(['before', 'after'])('preserves actual storage truth after %s commit failure', async failure => {
    seed(); const store = make(); await store.initialize(); backend.failure = failure;
    await expect(store.deleteNode('p')).rejects.toThrow(failure === 'before' ? 'KNOWN_BEFORE_COMMIT' : 'AMBIGUOUS_AFTER_COMMIT');
    expect(() => store.getNode('p')).toThrow('not initialized'); backend.failure = '';
    const reloaded = make(); await reloaded.initialize(); expect(reloaded.getNode('p') === undefined).toBe(failure === 'after'); expect(documents().has('p')).toBe(true);
  });
  it('callback retries publish no intermediate masking and commit one marker', async () => {
    seed(); const store = make(); await store.initialize(); const plan = await store.planSoftDeletion({ kind: 'node', id: 'p' });
    backend.retry = true; backend.afterDiscard = () => { expect(store.getNode('p')).toBeDefined(); expect(documents('graphrag_deletions').size).toBe(0); };
    await store.applySoftDeletion(plan); expect(backend.operations).toHaveLength(1); expect(store.getNode('p')).toBeUndefined();
  });
  it('rechecks all selected records and refuses the entire plan when one target drifts', async () => {
    documents().set('a', pattern('a', new Date(clock - 1))); documents().set('b', pattern('b', new Date(clock - 1)));
    const store = make(); const plan = await store.planOldPatterns({ cutoff: new Date(clock), ids: ['a', 'b'] });
    documents().get('b').properties.lastUsed = new Date(clock + 1); await expect(store.applySoftDeletion(plan)).rejects.toThrow('drift'); expect(documents('graphrag_deletions').size).toBe(0);
  });
  it('bounds the inspectable preview age without using it as the start of restoration', async () => {
    seed(); const store = make(); const plan = await store.planSoftDeletion({ kind: 'node', id: 'p' }); clock += 60001;
    await expect(store.applySoftDeletion(plan)).rejects.toThrow('stale'); expect(documents('graphrag_deletions').size).toBe(0);
    const fresh = await store.planSoftDeletion({ kind: 'node', id: 'p' }); clock += 10; await store.applySoftDeletion(fresh);
    expect(documents('graphrag_deletions').get('node_p').deletedAt.toMillis()).toBe(clock);
  });
  it.each(['graphrag_nodes', 'graphrag_edges', 'graphrag_deletions'])('fails all readers closed after %s reload failure, even previously ready', async collection => {
    seed(); const store = make(); await store.initialize(); backend.loadFailure = collection;
    await expect(store['loadGraph']()).rejects.toThrow('LOAD_FAILED'); expect(() => store.getNode('p')).toThrow('not initialized'); expect(() => store.getEdge('e1')).toThrow('not initialized'); expect(() => store.getNodesByType('pattern')).toThrow('not initialized'); expect(() => store.getNeighbors('tech_react')).toThrow('not initialized');
    await expect(store.query({ query: 'React' })).rejects.toThrow('LOAD_FAILED'); expect(store.isCacheValid()).toBe(false);
  });
  it('rejects malformed persisted masks rather than exposing their target', async () => {
    seed(); documents('graphrag_deletions').set('node_p', { schemaVersion: 1, kind: 'node', id: 'p', active: true, deletedAt: Timestamp.fromMillis(clock), restoreUntil: Timestamp.fromMillis(clock + 1) });
    const store = make(); await expect(store.initialize()).rejects.toThrow('restoration window'); expect(() => store.getNode('p')).toThrow('not initialized');
  });
  it.each(['addNode', 'updateNode', 'batchAddNodes', 'addEdge', 'storePattern', 'incrementUsageCount'])('guards %s targets against authoritative masks before writes', async method => {
    seed(); const store = make(); await store.initialize(); await store.deleteNode('p'); const count = backend.operations.length;
    const actions: Record<string, () => Promise<any>> = {
      addNode: () => store.addNode(pattern('p')), updateNode: () => store.updateNode({ id: 'p', label: 'no' }), batchAddNodes: () => store.batchAddNodes([pattern('new'), pattern('p')]),
      addEdge: () => store.addEdge({ id: 'new-edge', source: 'shared', target: 'p', relationship: 'uses', weight: 1 }), storePattern: () => store.storePattern(pattern('p')), incrementUsageCount: () => store.incrementUsageCount('p'),
    };
    await expect(actions[method]()).rejects.toThrow('soft deleted'); expect(backend.operations).toHaveLength(count); expect(documents().has('new')).toBe(false);
  });
  it('refuses a masked shared extracted entity instead of resurrecting it with storePattern', async () => {
    seed(); const store = make(); await store.deleteNode('tech_react'); const count = backend.operations.length;
    await expect(store.storePattern(pattern('new-pattern'))).rejects.toThrow('soft deleted'); expect(documents().has('new-pattern')).toBe(false); expect(backend.operations).toHaveLength(count);
  });
  it('refuses legacy addPattern before any I/O in admitted mode and never recognizes a mock as permission', async () => {
    const store = make(); await expect(store.addPattern(pattern('p').properties)).rejects.toThrow('legacy addPattern'); expect(backend.reads).toEqual([]); expect(backend.operations).toEqual([]);
    const inactive = new GraphRAGStore(); await expect(inactive.deleteNode('p')).rejects.toThrow('not admitted'); expect(backend.reads).toEqual([]);
  });
  it('clear/close/reload cannot restore masks or alter their timestamps', async () => {
    seed(); const store = make(); await store.deleteNode('p'); const stamp = documents('graphrag_deletions').get('node_p').deletedAt.toMillis();
    store.clearCache(); await store.initialize(); expect(store.getNode('p')).toBeUndefined(); await store.close(); await store.initialize(); expect(store.getNode('p')).toBeUndefined(); expect(documents('graphrag_deletions').get('node_p').deletedAt.toMillis()).toBe(stamp);
  });
  it.each(['', 'bad/id', '.', '__reserved__', 'x'.repeat(1500)])('refuses ID%s and unbounded plans without I/O', async id => {
    await expect(make().deleteNode(id)).rejects.toThrow(); expect(backend.reads).toEqual([]);
  });
  it('refuses missing IDs, 101 targets and invalid cutoff without scanning collections', async () => {
    const store = make(); await expect(store.planOldPatterns({ cutoff: new Date(clock), ids: [] })).rejects.toThrow();
    await expect(store.planOldPatterns({ cutoff: new Date(clock), ids: Array.from({ length: 101 }, (_, i) => 'p' + i) })).rejects.toThrow();
    await expect(store.planOldPatterns({ cutoff: new Date(NaN), ids: ['p'] })).rejects.toThrow(); expect(backend.reads).toEqual([]);
  });
  it('detaches the plan and commits only its authoritative fingerprint, never caller-modified snapshots', async () => {
    seed(); const store = make(); const plan = await store.planSoftDeletion({ kind: 'node', id: 'p' }); (plan.targets[0].original as any).label = 'caller-change';
    await store.applySoftDeletion(plan); expect(documents().get('p').label).toBe('p');
  });
  it('invalidates a genuine query cache and forces recomputation across delete and restore', async () => {
    seed(); const store = make(); await store.initialize(); const calculate = vi.spyOn(store as any, 'extractEntities');
    const before = await store.query({ query: 'React' }); expect(before.map(x => x.pattern.id)).toEqual(['p']); expect(before[0].relevanceScore).toBeGreaterThan(0); expect(before[0].graphPath).toEqual(['tech_react', 'p']);
    expect(await store.query({ query: 'React' })).toEqual(before); expect(calculate).toHaveBeenCalledTimes(1);
    await store.deleteNode('p'); expect((await store.query({ query: 'React' }))).toEqual([]); expect(calculate).toHaveBeenCalledTimes(2);
    await store.restoreNode('p'); expect(await store.query({ query: 'React' })).toEqual(before); expect(await store.query({ query: 'React' })).toEqual(before); expect(calculate).toHaveBeenCalledTimes(3);
  });
  it('retains original Timestamp, Buffer, typed bytes and explicit private metadata through restoration', async () => {
    seed(); const record = documents().get('p'); record.properties.lastUsed = Timestamp.fromMillis(clock);
    record.properties.bytes = Buffer.from([3, 4]); record.properties.typed = new Uint8Array([5, 6]); record.privacy = { isPublic: false, userId: 'owner-marker' };
    const store = make(); await store.deleteNode('p'); await store.restoreNode('p');
    const visible = store.getNode('p')!; expect(visible.privacy).toEqual(record.privacy); expect(visible.properties.lastUsed).toBeInstanceOf(Timestamp);
    visible.properties.bytes[0] = 99; expect(documents().get('p').properties.bytes[0]).toBe(3); expect(store.getNode('p')!.properties.bytes[0]).toBe(3);
    expect(visible.properties.typed).toEqual(new Uint8Array([5, 6]));
  });
  it('guards an orphan active node mask during create and batch even when the document is absent', async () => {
    documents('graphrag_deletions').set('node_orphan', { schemaVersion: 1, kind: 'node', id: 'orphan', active: true, deletedAt: Timestamp.fromMillis(clock), restoreUntil: Timestamp.fromMillis(clock + 30 * day) });
    const store = make(); await expect(store.addNode(node('orphan'))).rejects.toThrow('soft deleted');
    await expect(store.batchAddNodes([node('valid'), node('orphan')])).rejects.toThrow('soft deleted');
    expect(documents().has('valid')).toBe(false); expect(documents().has('orphan')).toBe(false); expect(backend.operations).toEqual([]);
  });
  it('guards an orphan active edge mask and refuses its original ID reuse', async () => {
    seed(); documents('graphrag_deletions').set('edge_orphan', { schemaVersion: 1, kind: 'edge', id: 'orphan', active: true, deletedAt: Timestamp.fromMillis(clock), restoreUntil: Timestamp.fromMillis(clock + 30 * day) });
    await expect(make().addEdge({ id: 'orphan', source: 'shared', target: 'tech_react', relationship: 'uses', weight: 1 })).rejects.toThrow('soft deleted');
    expect(documents('graphrag_edges').has('orphan')).toBe(false);
  });
  it('refuses an oversized explicit plan without any mask or original mutation', async () => {
    for (let i = 0; i < 100; i++) documents().set('p' + i, node('p' + i, { properties: { retained: 'x'.repeat(11000) } }));
    await expect(make().planOldPatterns({ cutoff: new Date(clock), ids: [...documents().keys()] })).rejects.toThrow('size budget');
    expect(backend.operations).toEqual([]); expect(documents().size).toBe(100); expect(documents('graphrag_deletions').size).toBe(0);
  });
  it('admits exactly100 explicit targets in one atomic plan and deduplicates repeated IDs without changing preserved records', async () => {
    for (let i = 0; i < 100; i++) documents().set('p' + i, pattern('p' + i, new Date(clock - 1)));
    const store = make(); const result = await store.deleteOldPatterns(new Date(clock), { ids: [...documents().keys()] });
    expect(result.outcomes).toHaveLength(100); expect(result.outcomes.every(x => x.outcome === 'masked')).toBe(true); expect(documents().size).toBe(100); expect(store.getNodesByType('pattern')).toEqual([]);
    await store.restoreNode('p0'); const plan = await store.planOldPatterns({ cutoff: new Date(clock), ids: ['p0', 'p0'] }); expect(plan.ids).toEqual(['p0']);
  });
  it('private loader return values contain only the effective graph, never masked raw documents', async () => {
    seed(); const store = make(); await store.deleteNode('p');
    const loadedNodes = await store['loadNodesFromFirestore'](); const loadedEdges = await store['loadEdgesFromFirestore']();
    expect(loadedNodes.some(x => x.id === 'p')).toBe(false); expect(loadedEdges).toEqual([]); const entity = loadedNodes.find(x => x.id === 'tech_react')!;
    entity.connections.push('caller-mutates-return'); expect(store.getNeighbors('tech_react')).not.toContain('caller-mutates-return');
  });

  it('refuses a superseded full reload rather than overwriting a newer committed projection', async () => {
    seed(); const store = make(); await store.initialize(); await store['loadSoftGraph']();
    let release!: () => void; let entered!: () => void;
    const entry = new Promise<void>(resolve => { entered = resolve; });
    backend.readGate = async () => { entered(); await new Promise<void>(resolve => { release = resolve; }); };
    const reload = store['loadGraph'](); const rejection = expect(reload).rejects.toThrow('superseded'); await entry;
    try { await store.addNode(node('new-committed')); } finally { release(); }
    await rejection; expect(documents().has('new-committed')).toBe(true); expect(() => store.getNode('new-committed')).toThrow('not initialized');
    await store.initialize(); expect(store.getNode('new-committed')).toBeDefined();
  });

  it.each(['object-to-array', 'date-to-array', 'timestamp-to-array', 'bytes-to-string', 'null-to-undefined'])('rejects exact metadata type drift %s instead of masking a changed authoritative record', async shape => {
    const original: Record<string, any> = { 'object-to-array': {}, 'date-to-array': new Date(clock), 'timestamp-to-array': Timestamp.fromMillis(clock), 'bytes-to-string': Buffer.from([1]), 'null-to-undefined': null };
    const replacements: Record<string, any> = { 'object-to-array': [], 'date-to-array': ['Date', String(clock)], 'timestamp-to-array': ['Timestamp', Math.floor(clock / 1000), 0], 'bytes-to-string': 'AQ==', 'null-to-undefined': undefined };
    documents().set('a', node('a', { properties: { extra: original[shape] } }));
    const store = make(); const plan = await store.planSoftDeletion({ kind: 'node', id: 'a' }); documents().get('a').properties.extra = replacements[shape];
    await expect(store.applySoftDeletion(plan)).rejects.toThrow('drift'); expect(documents('graphrag_deletions').size).toBe(0); expect(backend.operations).toEqual([]);
  });

  it('loads scope-only, undefined-public and unclassified stored markers without imposing writer schema or fabricating public metadata', async () => {
    documents().set('tech_react', node('tech_react', { type: 'technology', connections: ['scope', 'undefined-public', 'unmarked', 'malformed'] }));
    const markers: Record<string, any> = { scope: { userId: 'u' }, 'undefined-public': { userId: 'u', isPublic: undefined }, malformed: { isPublic: 'wrong-type' } };
    for (const id of ['scope', 'undefined-public', 'unmarked', 'malformed']) { const record = pattern(id); if (id === 'unmarked') delete record.privacy; else record.privacy = markers[id]; documents().set(id, record); }
    const store = make(); await store.initialize(); expect(store.getNode('scope')!.privacy).toEqual({ userId: 'u' }); expect(store.getNode('unmarked')!.privacy).toBeUndefined();
    const query = { query: 'React', userId: 'u', includePublic: false };
    expect((await store.query(query)).map(x => x.pattern.id).sort()).toEqual(['scope', 'undefined-public']);
    await store.deleteNode('scope'); expect((await store.query(query)).map(x => x.pattern.id)).toEqual(['undefined-public']);
    await store.restoreNode('scope'); expect((await store.query(query)).map(x => x.pattern.id).sort()).toEqual(['scope', 'undefined-public']);
    expect(documents().get('scope').privacy).toEqual({ userId: 'u' }); expect(documents().get('malformed').privacy).toEqual({ isPublic: 'wrong-type' });
    await expect(store.updateNode({ id: 'scope', label: 'writer-still-strict' })).rejects.toThrow('privacy metadata');
  });

  it('requires an actual own-data mode configuration and never invokes its accessors as admission', () => {
    expect(() => new GraphRAGStore({ softDeletion: null } as any)).toThrow('mode');
    let calls = 0; const options = Object.defineProperty({}, 'softDeletion', { get() { calls++; return {}; } });
    expect(() => new GraphRAGStore(options)).toThrow('accessor'); expect(calls).toBe(0);
    const config = Object.defineProperty({}, 'clock', { get() { calls++; return () => new Date(clock); } });
    expect(() => new GraphRAGStore({ softDeletion: config })).toThrow('clock dependency'); expect(calls).toBe(0);
  });

  it('refuses a retention scope accessor without invoking it or opening storage', async () => {
    let calls = 0; const scope = Object.defineProperty({}, 'ids', { get() { calls++; return ['p']; } });
    await expect(make().deleteOldPatterns(new Date(clock), scope as any)).rejects.toThrow('accessor'); expect(calls).toBe(0); expect(backend.reads).toEqual([]);
  });

});

describe('Trusted recovery inventory and explicit storage configuration', () => {
  it('lists active markers only with redacted metadata and virtual incident edge annotations', async () => {
    seed(); const store = make(); await store.deleteNode('p'); await store.deleteEdge('e1');
    const result = await store.listSoftDeletedTargets();
    expect(result.total).toBe(2);
    const maskedNode = result.items.find(item => item.kind === 'node')!;
    expect(maskedNode).toEqual({ kind: 'node', id: 'p', label: 'p', originalAvailable: true,
      deletedAt: new Date(clock).toISOString(), restorationGuaranteedUntil: new Date(clock + 30 * day).toISOString(),
      relatedMaskedEdgeIds: ['e1', 'e2', 'incoming', 'self'] });
    expect(result.items.find(item => item.kind === 'edge')).toMatchObject({ id: 'e1', maskedEndpointIds: ['p'], originalAvailable: true });
    expect(JSON.stringify(result)).not.toContain('properties');
    expect(JSON.stringify(result)).not.toContain('React cache');
    await store.restoreEdge('e1');
    expect((await store.listSoftDeletedTargets()).items).toHaveLength(1);
    expect(store.getEdge('e1')).toBeUndefined(); // Endpoint mask remains authoritative.
  });
  it('includes missing original evidence without inventing recovery content', async () => {
    seed(); const store = make(); await store.deleteNode('p'); documents().delete('p');
    const inventory = await store.listSoftDeletedTargets();
    expect(inventory.items[0]).toMatchObject({ id: 'p', label: 'p', originalAvailable: false });
    expect((await store.restoreNode('p')).outcomes).toEqual([{ id: 'p', outcome: 'absent' }]);
    expect((await store.listSoftDeletedTargets()).total).toBe(1);
  });
  it('keeps orphan edge markers discoverable without inventing endpoint information', async () => {
    documents('graphrag_deletions').set('edge_orphan', { schemaVersion: 1, kind: 'edge', id: 'orphan', active: true,
      deletedAt: Timestamp.fromMillis(clock), restoreUntil: Timestamp.fromMillis(clock + 30 * day) });
    const store = make();
    expect((await store.listSoftDeletedTargets()).items).toEqual([{ kind: 'edge', id: 'orphan', label: 'orphan',
      originalAvailable: false, deletedAt: new Date(clock).toISOString(), restorationGuaranteedUntil: new Date(clock + 30 * day).toISOString(), maskedEndpointIds: [] }]);
    expect((await store.restoreEdge('orphan')).outcomes).toEqual([{ id: 'orphan', outcome: 'absent' }]);
    expect(backend.operations).toEqual([]);
  });
  it('applies the default page size and maximum page size without writing source records', async () => {
    for (let index = 0; index < 101; index++) {
      const id = `orphan-${String(index).padStart(3, '0')}`;
      documents('graphrag_deletions').set(`node_${id}`, { schemaVersion: 1, kind: 'node', id, active: true,
        deletedAt: Timestamp.fromMillis(clock), restoreUntil: Timestamp.fromMillis(clock + 30 * day) });
    }
    const store = make();
    expect(await store.listSoftDeletedTargets()).toMatchObject({ total: 101 });
    expect((await store.listSoftDeletedTargets()).items).toHaveLength(50);
    expect((await store.listSoftDeletedTargets({ limit: 100 })).items).toHaveLength(100);
    expect((await store.listSoftDeletedTargets({ offset: 100, limit: 100 })).items.map(item => item.id)).toEqual(['orphan-100']);
    expect(backend.operations).toEqual([]);
  });
  it('retains the original guarantee end while restoration remains possible at J30+1 day', async () => {
    seed(); const store = make(); const deletedAt = clock; await store.deleteNode('p');
    clock += 31 * day;
    const inventory = await store.listSoftDeletedTargets();
    expect(inventory.items[0].restorationGuaranteedUntil).toBe(new Date(deletedAt + 30 * day).toISOString());
    expect(store.getNode('p')).toBeUndefined();
    await store.restoreNode('p'); expect(store.getNode('p')).toBeDefined();
    expect((await store.listSoftDeletedTargets()).total).toBe(0);
    expect(documents().has('p')).toBe(true);
  });
  it('paginates stable active markers and returns detached summaries', async () => {
    seed(); const store = make(); await store.deleteEdge('e2'); await store.deleteNode('p'); await store.deleteEdge('e1');
    const all = await store.listSoftDeletedTargets();
    expect(all.total).toBe(3);
    expect((await store.listSoftDeletedTargets({ offset: 1, limit: 1 })).items).toEqual(all.items.slice(1, 2));
    expect(await store.listSoftDeletedTargets({ offset: 3, limit: 1 })).toEqual({ total: 3, items: [] });
    all.items[0].label = 'mutated';
    expect((await store.listSoftDeletedTargets()).items[0].label).not.toBe('mutated');
  });
  it('reloads latest raw state instead of returning a cached recovery inventory', async () => {
    seed(); const first = make(); await first.initialize(); await first.query({ query: 'React' });
    await make().deleteNode('p');
    expect((await first.listSoftDeletedTargets()).items[0].id).toBe('p');
    expect((await first.query({ query: 'React' })).map(item => item.pattern.id)).not.toContain('p');
    await make().restoreNode('p'); expect((await first.listSoftDeletedTargets()).total).toBe(0);
    expect((await first.query({ query: 'React' })).map(item => item.pattern.id)).toContain('p');
  });
  it('fails closed on inventory load errors and invalidates prior visible/query caches', async () => {
    seed(); const store = make(); await store.initialize(); await store.query({ query: 'React' });
    backend.loadFailure = 'graphrag_deletions';
    await expect(store.listSoftDeletedTargets()).rejects.toThrow('LOAD_FAILED');
    expect(() => store.getNode('p')).toThrow('not initialized');
    expect(store['rawNodes'].size).toBe(0);
    expect(store['queryResults'].size).toBe(0);
  });
  it.each([{ offset: -1 }, { offset: 10001 }, { offset: 0.5 }, { limit: 0 }, { limit: 101 }, { limit: NaN }, { limit: '1' }])('rejects invalid pagination before source reads: %j', async options => {
    await expect(make().listSoftDeletedTargets(options as any)).rejects.toThrow('pagination');
    expect(backend.reads).toEqual([]);
  });
  it('rejects pagination accessors without evaluating them and requires soft mode', async () => {
    const getter = vi.fn(() => 1);
    await expect(make().listSoftDeletedTargets(Object.defineProperty({}, 'limit', { get: getter }))).rejects.toThrow('accessor');
    expect(getter).not.toHaveBeenCalled();
    await expect(new GraphRAGStore().listSoftDeletedTargets()).rejects.toThrow('not admitted');
    expect(backend.reads).toEqual([]);
  });
  it('uses explicit validated storage identifiers without changing old default selection', () => {
    new GraphRAGStore({ storage: { projectId: 'operator-fixture', databaseId: 'recovery-fixture' }, softDeletion: {} });
    expect(backend.configurations.at(-1)).toEqual({ projectId: 'operator-fixture', databaseId: 'recovery-fixture' });
    new GraphRAGStore();
    expect(backend.configurations.at(-1)).toEqual({ projectId: process.env.GOOGLE_CLOUD_PROJECT || 'centering-vine-454613-b3', databaseId: 'versatil-rag' });
    expect(backend.reads).toEqual([]);
  });
  it.each([{ projectId: 'explicit-only' }, { projectId: '', databaseId: 'db' }, { projectId: '../escape', databaseId: 'db' }, { projectId: 'p', databaseId: ' db ' }, { projectId: 'p', databaseId: 'db', extra: true }])('rejects incomplete or malformed explicit storage: %j', storage => {
    expect(() => new GraphRAGStore({ storage: storage as any })).toThrow('storage');
    expect(backend.configurations).toEqual([]);
  });
  it('rejects storage accessors without evaluating them', () => {
    const getter = vi.fn(() => 'project');
    const storage = Object.defineProperty({ databaseId: 'db' }, 'projectId', { get: getter });
    expect(() => new GraphRAGStore({ storage } as any)).toThrow('storage');
    expect(() => new GraphRAGStore(Object.defineProperty({}, 'storage', { get: getter }))).toThrow('accessor');
    expect(getter).not.toHaveBeenCalled(); expect(backend.configurations).toEqual([]);
  });
});

describe('Recovery HTTP integration with the actual GraphRAG store', () => {
  it('admits the operator capability, restores after J30, and reports actual endpoint-dependent visibility', async () => {
    seed();
    const originals = { nodes: structuredClone([...documents()]), edges: structuredClone([...documents('graphrag_edges')]) };
    const target = { projectId: 'operator-fixture', databaseId: 'recovery-fixture' };
    const store = new GraphRAGStore({ storage: target, softDeletion: { clock: () => new Date(clock) } });
    await store.deleteNode('p'); await store.deleteEdge('e1');
    clock += 31 * day;
    const capability = 'c'.repeat(64);
    let server: Server | undefined;
    try {
      server = await new Promise<Server>((resolve, reject) => {
        const instance = createRecoveryApp({ store, capability, target }).listen(0, '127.0.0.1', () => resolve(instance));
        instance.once('error', reject);
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw Error('Loopback test listener unavailable');
      const url = `http://127.0.0.1:${address.port}`;
      const headers = { 'X-Recovery-Capability': capability, Origin: url, 'Content-Type': 'application/json' };
      const operationCount = backend.operations.length;
      const readCount = backend.reads.length;
      for (const rejectedHeaders of [
        { ...headers, 'X-Recovery-Capability': 'd'.repeat(64) },
        { ...headers, Origin: 'http://untrusted.example' }
      ]) {
        const response = await fetch(url + '/api/recovery/restore', { method: 'POST', headers: rejectedHeaders, body: JSON.stringify({ kind: 'node', id: 'p' }) });
        expect(response.status).toBe(403);
        await response.json();
      }
      const deniedInventory = await fetch(url + '/api/recovery/items');
      expect(deniedInventory.status).toBe(403); await deniedInventory.json();
      expect(backend.operations).toHaveLength(operationCount);
      expect(backend.reads).toHaveLength(readCount);
      expect(documents('graphrag_deletions').get('node_p').active).toBe(true);
      expect(documents('graphrag_deletions').get('edge_e1').active).toBe(true);

      const inventoryResponse = await fetch(url + '/api/recovery/items', { headers });
      expect(inventoryResponse.status).toBe(200);
      const inventory = await inventoryResponse.json();
      expect(inventory).toMatchObject({ total: 2, target, offset: 0, limit: 50 });
      expect(inventory.items.find((item: any) => item.kind === 'edge')).toMatchObject({ id: 'e1', maskedEndpointIds: ['p'] });
      expect(new Date(inventory.items[0].restorationGuaranteedUntil).getTime()).toBeLessThan(clock);
      expect(JSON.stringify(inventory)).not.toContain('React cache');

      const edgeResponse = await fetch(url + '/api/recovery/restore', { method: 'POST', headers, body: JSON.stringify({ kind: 'edge', id: 'e1' }) });
      expect(edgeResponse.status).toBe(200);
      expect(await edgeResponse.json()).toEqual({ kind: 'edge', id: 'e1', outcome: 'restored', visible: false });
      expect(store.getEdge('e1')).toBeUndefined();
      const nodeResponse = await fetch(url + '/api/recovery/restore', { method: 'POST', headers, body: JSON.stringify({ kind: 'node', id: 'p' }) });
      expect(nodeResponse.status).toBe(200);
      expect(await nodeResponse.json()).toEqual({ kind: 'node', id: 'p', outcome: 'restored', visible: true });
      expect(store.getEdge('e1')).toBeDefined();
      const finalResponse = await fetch(url + '/api/recovery/items', { headers });
      expect(finalResponse.status).toBe(200);
      expect(await finalResponse.json()).toMatchObject({ total: 0, items: [] });
      expect(structuredClone([...documents()])).toEqual(originals.nodes);
      expect(structuredClone([...documents('graphrag_edges')])).toEqual(originals.edges);
      expect(backend.operations.every(operation => operation.ref.collection === 'graphrag_deletions')).toBe(true);
    } finally {
      if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    }
  });
});
