/** New engineering conventions, kept separate from query ranking, tenant authority and persisted data. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphNode } from './graphrag-store.js';
const fixture = vi.hoisted(() => ({ nodes: [] as GraphNode[], calls: [] as string[], writes: 0, closes: 0 }));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  class MockFirestore {
    collection(name: string) {
      if (!['graphrag_nodes', 'graphrag_edges'].includes(name)) throw new Error(`Unexpected collection ${name}`);
      return { get: async () => {
        fixture.calls.push(name);
        const docs = (name === 'graphrag_nodes' ? fixture.nodes : []).map(node => ({ id: node.id, data: () => node }));
        return { docs, size: docs.length, empty: docs.length === 0,
          forEach(callback: (doc: typeof docs[number]) => void) { docs.forEach(callback); } };
      }, doc: () => { fixture.writes++; throw new Error('Unexpected metric write'); } };
    }
    batch() { fixture.writes++; throw new Error('Unexpected metric batch'); }
    runTransaction() { fixture.writes++; throw new Error('Unexpected metric transaction'); }
    terminate() { fixture.closes++; throw new Error('Unexpected metric close'); }
  }
  return { ...actual, Firestore: MockFirestore };
});
const node = (id: string, connections: string[] = [], type: GraphNode['type'] = 'concept'): GraphNode =>
  ({ id, type, label: id, properties: { nested: { value: 'original' } }, connections, centrality: 0.123 });
beforeEach(() => {
  fixture.nodes = [node('a', ['b']), node('b')];
  fixture.calls = []; fixture.writes = 0; fixture.closes = 0; vi.restoreAllMocks();
});
async function loaded(nodes = fixture.nodes) {
  fixture.nodes = nodes;
  const store = new GraphRAGStore(); await store.initialize(); return store;
}
function noExtraIO() {
  expect(fixture.calls).toEqual(['graphrag_nodes', 'graphrag_edges']);
  expect(fixture.writes).toBe(0); expect(fixture.closes).toBe(0);
}
function scores(receipt: Awaited<ReturnType<GraphRAGStore['calculateCentrality']>>) {
  return Object.fromEntries(receipt.scores.map(entry => [entry.id, entry.centrality]));
}
function modularity(nodes: GraphNode[], groups: string[][]) {
  // Independent original-graph oracle: unique undirected edges, excluding dangling/self links.
  const edges = new Map<string, [string, string]>(); const ids = new Set(nodes.map(n => n.id));
  for (const n of nodes) for (const to of n.connections) if (ids.has(to) && to !== n.id) {
    const pair = [n.id, to].sort() as [string, string]; edges.set(JSON.stringify(pair), pair);
  }
  const m = edges.size;
  if (!m) return 0;
  return groups.reduce((sum, group) => {
    const members = new Set(group); let degree = 0, internal = 0;
    for (const [from, to] of edges.values()) {
      if (members.has(from)) degree++;
      if (members.has(to)) degree++;
      if (members.has(from) && members.has(to)) internal++;
    }
    return sum + internal / m - (degree / (2 * m)) ** 2;
  }, 0);
}

describe('GraphRAG independent lexical helpers', () => {
  it.each([
    ['React hooks', 'Use React hooks', 1], ['React hooks', 'React components', 0.5],
    ['authentication', 'login flow', 0], ['hook', 'hooks', 0], ['React React hooks', 'hooks', 0.5],
    ['ÉTÉ 123', 'été, 123!', 1], ['', 'React', 0], ['!?', 'React', 0], ['React', '', 0],
  ])('uses exact unique query token coverage (%s)', (query, pattern, expected) => {
    const store = new GraphRAGStore(); expect(store['calculateRelevance'](query, pattern)).toBe(expected);
    expect(fixture.calls).toEqual([]); expect(fixture.writes).toBe(0);
  });
  it.each([null, undefined, 12, {}, []])('rejects non-string relevance input without coercion', input => {
    const store = new GraphRAGStore();
    expect(() => store['calculateRelevance'](input as string, 'React')).toThrow('inputs must be strings');
    expect(() => store['calculateRelevance']('React', input as string)).toThrow('inputs must be strings');
    expect(fixture.calls).toEqual([]);
  });
  it('boosts bounded scores monotonically with exact boundary values and no graph reads', () => {
    const store = new GraphRAGStore();
    expect([0, 0.5, 0.9, 1].map(centrality => store['boostByCentrality'](0.5, { ...node('x'), centrality })))
      .toEqual([0.5, 0.75, 0.95, 1]);
    expect(store['boostByCentrality'](1, node('x'))).toBe(1);
    const absent = node('x'); delete absent.centrality;
    expect(store['boostByCentrality'](0.5, absent)).toBe(0.5);
    expect(fixture.calls).toEqual([]);
  });
  it.each([-1, 1.1, NaN, Infinity, '0.5', null])('rejects malformed boost inputs', value => {
    const store = new GraphRAGStore();
    expect(() => store['boostByCentrality'](value as number, node('x'))).toThrow('base score');
    expect(() => store['boostByCentrality'](0.5, { ...node('x'), centrality: value as number })).toThrow('boost centrality');
    expect(fixture.calls).toEqual([]);
  });
  it('refuses a score getter without executing it', () => {
    const store = new GraphRAGStore(); const input = node('x'); let invoked = 0;
    Object.defineProperty(input, 'centrality', { get() { invoked++; return 0.8; }, enumerable: true });
    expect(() => store['boostByCentrality'](0.5, input)).toThrow('Unsupported GraphRAG cached accessor');
    expect(invoked).toBe(0); expect(fixture.calls).toEqual([]);
  });
});

describe('GraphRAG bounded PageRank projection', () => {
  it('uses incoming probability and redistributes dangling mass: A20/57 B37/57', async () => {
    const store = await loaded(); const receipt = await store.calculateCentrality(); const values = scores(receipt);
    expect(values.a).toBeCloseTo(20 / 57, 9); expect(values.b).toBeCloseTo(37 / 57, 9);
    expect(values.a + values.b).toBeCloseTo(1, 12);
    expect(store.getNode('a')!.centrality).toBe(values.a); expect(store.getNode('b')!.centrality).toBe(values.b);
    expect(receipt.algorithm).toBe('pagerank'); expect(receipt.converged).toBe(true);
    expect(receipt.iterations).toBeGreaterThan(1); expect(receipt.iterations).toBeLessThanOrEqual(200);
    expect(receipt.sourceConnections).toEqual([{ id: 'a', connections: ['b'] }, { id: 'b', connections: [] }]);
    expect(fixture.nodes.map(n => n.centrality)).toEqual([0.123, 0.123]); noExtraIO();
  });
  it('handles cycles, valid self-links, duplicate links and dangling IDs without inventing vertices', async () => {
    const store = await loaded([node('a', ['b', 'b', 'missing']), node('b', ['a'])]);
    expect(scores(await store.calculateCentrality())).toEqual({ a: 0.5, b: 0.5 });
    const singleton = await loaded([node('solo', ['solo', 'missing'])]);
    expect(scores(await singleton.calculateCentrality())).toEqual({ solo: 1 });
    expect(fixture.writes).toBe(0);
  });
  it('keeps isolated vertices positive and all mass normalized; damping0 is uniform', async () => {
    const store = await loaded([node('a', ['b']), node('b'), node('isolated')]);
    const values = Object.values(scores(await store.calculateCentrality()));
    expect(values.every(v => v > 0)).toBe(true); expect(values.reduce((a, b) => a + b)).toBeCloseTo(1, 12);
    expect(scores(await store.calculateCentrality({ damping: 0 }))).toEqual({ a: 1 / 3, b: 1 / 3, isolated: 1 / 3 });
    noExtraIO();
  });
  it('is stable by ID under insertion permutation while output order follows that insertion', async () => {
    const first = await loaded(); const a = scores(await first.calculateCentrality());
    const second = await loaded([node('b'), node('a', ['b'])]); const receipt = await second.calculateCentrality();
    expect(receipt.scores.map(n => n.id)).toEqual(['b', 'a']);
    expect(scores(receipt).a).toBeCloseTo(a.a, 12); expect(scores(receipt).b).toBeCloseTo(a.b, 12);
    expect(fixture.writes).toBe(0);
  });
  it('edge reversal changes the nonsymmetric score order', async () => {
    const store = await loaded([node('a'), node('b', ['a'])]); const result = scores(await store.calculateCentrality());
    expect(result.a).toBeCloseTo(37 / 57, 9); expect(result.b).toBeCloseTo(20 / 57, 9); noExtraIO();
  });
  it('empty graphs converge without fabricated scores', async () => {
    const store = await loaded([]); const receipt = await store.calculateCentrality();
    expect(receipt.scores).toEqual([]); expect(receipt.iterations).toBe(0); noExtraIO();
  });
  it('nonconvergence rejects without partial publication or backend mutation', async () => {
    const store = await loaded();
    await expect(store.calculateCentrality({ maxIterations: 1, tolerance: 1e-12 })).rejects.toThrow('did not converge');
    expect(store.getNode('a')!.centrality).toBe(0.123); expect(store.getNode('b')!.centrality).toBe(0.123); noExtraIO();
  });
  it.each([{ damping: 1 }, { damping: -1 }, { damping: NaN }, { tolerance: 0 }, { tolerance: Infinity },
    { maxIterations: 0 }, { maxIterations: 1.1 }, { maxIterations: 10001 }, { unknown: 1 }])('rejects invalid PageRank options', async options => {
      const store = await loaded(); await expect(store.calculateCentrality(options as any)).rejects.toThrow('PageRank options');
      expect(store.getNode('a')!.centrality).toBe(0.123); noExtraIO();
    });
  it('detaches Date/Timestamp/bytes and returned provenance while publishing only to memory', async () => {
    const initial = node('a', ['b']); initial.properties = { date: new Date(1000), timestamp: new Timestamp(3, 5),
      bytes: Buffer.from([1, 2]), octets: new Uint8Array([3, 4]), nested: { value: 'original' } };
    const store = await loaded([initial, node('b')]); const receipt = await store.calculateCentrality();
    receipt.sourceConnections[0].connections.push('invented'); receipt.scores[0].centrality = -9;
    const cached = store.getNode('a')!; cached.properties.bytes[0] = 99; cached.properties.date.setTime(999);
    cached.properties.nested.value = 'edited'; cached.properties.octets[0] = 99;
    expect(store.getNode('a')!.properties.bytes.toString('hex')).toBe('0102');
    expect(store.getNode('a')!.properties.date.getTime()).toBe(1000);
    expect(store.getNode('a')!.properties.timestamp.isEqual(new Timestamp(3, 5))).toBe(true);
    expect(store.getNode('a')!.properties.octets[0]).toBe(3);
    expect(store.getNode('a')!.centrality).toBeCloseTo(20 / 57, 9);
    expect(initial.centrality).toBe(0.123); expect(initial.properties.nested.value).toBe('original'); noExtraIO();
  });
  it('a later invalid snapshot leaves earlier valid centrality unchanged and never calls getters', async () => {
    const store = await loaded(); let invoked = 0;
    Object.defineProperty(store['nodes'].get('b')!, 'connections', { enumerable: true,
      get() { invoked++; return ['a']; } });
    await expect(store.calculateCentrality()).rejects.toThrow('Unsupported GraphRAG cached accessor');
    expect(invoked).toBe(0); expect(store['nodes'].get('a')!.centrality).toBe(0.123); noExtraIO();
  });
  it.each([{ connections: ['b', 12] }, { connections: new Array(1) }])('rejects malformed or sparse connections atomically', async ({ connections }) => {
    const store = await loaded(); store['nodes'].get('b')!.connections = connections as string[];
    await expect(store.calculateCentrality()).rejects.toThrow('metric connections');
    expect(store['nodes'].get('a')!.centrality).toBe(0.123); noExtraIO();
  });
  it('requires explicit initialization and reinitialization after clear', async () => {
    const unready = new GraphRAGStore(); await expect(unready.calculateCentrality()).rejects.toThrow('not initialized');
    expect(fixture.calls).toEqual([]);
    const store = await loaded(); store.clearCache(); await expect(store.calculateCentrality()).rejects.toThrow('not initialized');
    noExtraIO();
  });
});

function triangles() { return [node('a', ['b', 'c']), node('b', ['c']), node('c', ['d']),
  node('d', ['e', 'f']), node('e', ['f']), node('f')]; }
describe('GraphRAG bounded deterministic Louvain communities', () => {
  it('finds two dense triangles joined by one bridge, unlike one weak component', async () => {
    const nodes = triangles(); const store = await loaded(nodes); const groups = await store.detectCommunities();
    expect(groups).toEqual([['a', 'b', 'c'], ['d', 'e', 'f']]);
    expect(modularity(nodes, groups)).toBeCloseTo(5 / 14, 12);
    expect(modularity(nodes, [nodes.map(n => n.id)])).toBe(0); noExtraIO();
  });
  it('requires aggregation to improve cycle12 pair local optima and checks final original-graph quality', async () => {
    const nodes = Array.from({ length: 12 }, (_, i) => node(`v${i}`, [`v${(i + 1) % 12}`]));
    const store = await loaded(nodes); const receipt = store['calculateLouvain'](store['metricSnapshot'](), 100, 128);
    expect(receipt.levels[0].groups.map(g => g.length)).toEqual([2, 2, 2, 2, 2, 2]);
    expect(receipt.levels[0].modularity).toBeCloseTo(1 / 3, 12);
    expect(receipt.levels[1].modularity).toBeGreaterThan(receipt.levels[0].modularity);
    expect(receipt.groups).toEqual([['v0', 'v1', 'v2', 'v3'], ['v4', 'v5', 'v6', 'v7'], ['v8', 'v9', 'v10', 'v11']]);
    expect(receipt.modularity).toBeCloseTo(5 / 12, 12);
    expect(modularity(nodes, receipt.groups)).toBeCloseTo(receipt.modularity, 12);
    expect(await store.detectCommunities()).toEqual(receipt.groups); noExtraIO();
  });
  it('projects direction symmetrically and ignores duplicate/dangling/original self links', async () => {
    const original = triangles(); const store = await loaded(original);
    const expected = await store.detectCommunities(); const reversed = original.map(n => node(n.id));
    for (const n of original) for (const to of n.connections) reversed.find(r => r.id === to)!.connections.push(n.id);
    reversed[0].connections.push('a', 'missing', 'b', 'b');
    const reverseStore = await loaded(reversed); expect(await reverseStore.detectCommunities()).toEqual(expected);
    expect(fixture.writes).toBe(0);
  });
  it('includes isolated singletons, preserves stable insertion tie order and returns detached IDs', async () => {
    const store = await loaded([node('z'), ...triangles(), node('last')]);
    const groups = await store.detectCommunities(); expect(groups).toEqual([['z'], ['a', 'b', 'c'], ['d', 'e', 'f'], ['last']]);
    groups[1][0] = 'invented'; expect((await store.detectCommunities())[1][0]).toBe('a'); noExtraIO();
  });
  it('edgeless and empty graphs have singleton partitions and zero modularity', async () => {
    const store = await loaded([node('a', ['missing', 'a']), node('b')]);
    const receipt = store['calculateLouvain'](store['metricSnapshot'](), 100, 128);
    expect(receipt.groups).toEqual([['a'], ['b']]); expect(receipt.modularity).toBe(0);
    const empty = await loaded([]); expect(await empty.detectCommunities()).toEqual([]); expect(fixture.writes).toBe(0);
  });
  it.each([{ maxPasses: 1 }, { maxLevels: 1 }])('reports budget nonconvergence without changing graph', async options => {
    const store = await loaded(triangles()); const before = store.getNode('a');
    await expect(store.detectCommunities(options as any)).rejects.toThrow('did not converge');
    expect(store.getNode('a')).toEqual(before); noExtraIO();
  });
  it.each([{ maxPasses: 0 }, { maxPasses: 1.5 }, { maxPasses: 1001 }, { maxLevels: 0 }, { maxLevels: 129 }, { x: 1 }])('rejects invalid Louvain options', async options => {
      const store = await loaded(); await expect(store.detectCommunities(options as any)).rejects.toThrow('Louvain options'); noExtraIO();
    });
  it('refuses a label getter before topology selection and without executing it', async () => {
    const store = await loaded(); let invoked = 0;
    Object.defineProperty(store['nodes'].get('b')!, 'label', { enumerable: true, get() { invoked++; return 'b'; } });
    await expect(store.detectCommunities()).rejects.toThrow('Unsupported GraphRAG cached accessor');
    expect(invoked).toBe(0); noExtraIO();
  });
  it('requires an initialized cache rather than auto fetching', async () => {
    const store = new GraphRAGStore(); await expect(store.detectCommunities()).rejects.toThrow('not initialized');
    expect(fixture.calls).toEqual([]); expect(fixture.writes).toBe(0);
  });
});

describe('GraphRAG directed depth2 related patterns', () => {
  const patterns = () => [node('seed', ['bridge', 'direct', 'bridge', 'missing'], 'pattern'),
    node('bridge', ['second', 'tie', 'seed']), node('direct', ['third'], 'pattern'),
    { ...node('second', ['fourth'], 'pattern'), privacy: { userId: 'fixture-user', isPublic: false } },
    node('tie', [], 'pattern'), node('third', [], 'pattern'), node('fourth', [], 'pattern'), node('disconnected', ['seed'], 'pattern')];
  it('returns existing patterns by shortest discovery distance, preserving metadata and excluding seed/depth3/reverse nodes', async () => {
    const store = await loaded(patterns()); const result = await store.findRelatedPatterns('seed');
    expect(result.map(n => n.id)).toEqual(['direct', 'second', 'tie', 'third']);
    expect(result[1].privacy).toEqual({ userId: 'fixture-user', isPublic: false });
    expect(result.map(n => n.id)).not.toContain('fourth'); expect(result.map(n => n.id)).not.toContain('disconnected'); noExtraIO();
  });
  it.each([[0, []], [1, ['direct']], [2, ['direct', 'second']], [5, ['direct', 'second', 'tie', 'third']]])('uses second argument as result limit, not depth (%s)', async (limit, expected) => {
      const store = await loaded(patterns()); expect((await store.findRelatedPatterns('seed', limit as number)).map(n => n.id)).toEqual(expected);
      expect((await store.findRelatedPatterns('seed', 1)).map(n => n.id)).toEqual(['direct']); noExtraIO();
    });
  it('missing/nonpattern seeds return empty with a real positive seed control', async () => {
    const store = await loaded(patterns()); expect(await store.findRelatedPatterns('missing')).toEqual([]);
    expect(await store.findRelatedPatterns('bridge')).toEqual([]); expect((await store.findRelatedPatterns('seed')).length).toBe(4); noExtraIO();
  });
  it('returned nested metadata and connections are detached from cache and original corpus', async () => {
    const store = await loaded(patterns()); const result = await store.findRelatedPatterns('seed');
    result[0].connections.push('invented'); result[0].properties.nested.value = 'edited'; result[1].privacy!.userId = 'other';
    const again = await store.findRelatedPatterns('seed'); expect(again[0].connections).toEqual(['third']);
    expect(again[0].properties.nested.value).toBe('original'); expect(again[1].privacy!.userId).toBe('fixture-user'); noExtraIO();
  });
  it.each([-1, 1.5, 10001, NaN, Infinity])('rejects invalid related-pattern limits', async limit => {
    const store = await loaded(patterns()); await expect(store.findRelatedPatterns('seed', limit)).rejects.toThrow('arguments'); noExtraIO();
  });
  it('validates all snapshot accessors even on disconnected nodes without invoking them', async () => {
    const store = await loaded(patterns()); let invoked = 0;
    Object.defineProperty(store['nodes'].get('disconnected')!, 'type', { enumerable: true, get() { invoked++; return 'pattern'; } });
    await expect(store.findRelatedPatterns('seed')).rejects.toThrow('Unsupported GraphRAG cached accessor');
    expect(invoked).toBe(0); noExtraIO();
  });
  it('requires explicit initialization and reinitialization after clear', async () => {
    const fresh = new GraphRAGStore(); await expect(fresh.findRelatedPatterns('seed')).rejects.toThrow('not initialized');
    expect(fixture.calls).toEqual([]); const store = await loaded(patterns()); store.clearCache();
    await expect(store.findRelatedPatterns('seed')).rejects.toThrow('not initialized'); noExtraIO();
  });
});
