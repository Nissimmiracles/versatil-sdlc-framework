/** Explicit local conventions: ordered directed connections and source hop depth zero. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphRAGStore } from './graphrag-store.js';

const fixture = vi.hoisted(() => ({ nodes: [] as any[], requests: [] as string[], writes: 0 }));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  class MockFirestore {
    collection(name: string) {
      if (name !== 'graphrag_nodes' && name !== 'graphrag_edges') throw new Error(`Unexpected collection: ${name}`);
      return {
        get: async () => {
          fixture.requests.push(name);
          const docs = (name === 'graphrag_nodes' ? fixture.nodes : []).map(data => ({ id: data.id, data: () => data }));
          return { docs, empty: docs.length === 0, size: docs.length,
            forEach(callback: (doc: typeof docs[number]) => void, thisArg?: unknown) {
              docs.forEach(doc => callback.call(thisArg, doc));
            } };
        },
        doc: () => ({ set: () => { fixture.writes++; }, update: () => { fixture.writes++; } }),
      };
    }
    async terminate() {}
  }
  return { ...actual, Firestore: MockFirestore };
});
beforeEach(() => {
  fixture.requests.length = 0;
  fixture.writes = 0;
  // The first branch is longer, so shortest-path must actually use breadth-first order.
  fixture.nodes = [
    ['a', ['b', 'c', 'b', 'dangling']], ['b', ['d', 'a']], ['c', ['e']],
    ['d', ['e']], ['e', ['f']], ['f', []], ['isolated', []],
  ].map(([id, connections]) => ({ id, type: 'concept', label: id, properties: {}, connections }));
  vi.restoreAllMocks();
});
async function loaded() {
  const store = new GraphRAGStore();
  await store.initialize();
  return store;
}
function expectNoExtraIO() {
  expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
  expect(fixture.writes).toBe(0);
}

describe('GraphRAG private initialized-cache traversal', () => {
  it.each(['bfsTraversal', 'findShortestPath'] as const)('rejects %s before initialize without fetching or writing', method => {
    const store = new GraphRAGStore();
    expect(() => method === 'bfsTraversal' ? store['bfsTraversal']('a') : store['findShortestPath']('a', 'e'))
      .toThrow('GraphRAG cache is not initialized');
    expect(fixture.requests).toEqual([]);
    expect(fixture.writes).toBe(0);
  });

  it.each([
    { depth: 0, expected: ['a'] },
    { depth: 1, expected: ['a', 'b', 'c'] },
    { depth: 2, expected: ['a', 'b', 'c', 'd', 'e'] },
    { depth: 3, expected: ['a', 'b', 'c', 'd', 'e', 'f'] },
  ])('visits exact hop depth $depth in declared order without duplicate or cycle visits', async ({ depth, expected }) => {
    const store = await loaded();
    expect(store['bfsTraversal']('a', depth)).toEqual(expected);
    expectNoExtraIO();
  });

  it('uses the explicit default depth two and ignores dangling connection IDs', async () => {
    const store = await loaded();
    expect(store['bfsTraversal']('a')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(store.getNode('dangling')).toBeUndefined();
    expectNoExtraIO();
  });

  it('excludes a real third-hop node at default depth but includes it at depth three', async () => {
    const store = await loaded();
    expect(store.getNode('f')!.id).toBe('f');
    expect(store['bfsTraversal']('a')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(store['bfsTraversal']('a', 3)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(store['findShortestPath']('a', 'f')).toEqual(['a', 'c', 'e', 'f']);
    expectNoExtraIO();
  });

  it('chooses a genuinely shorter route instead of the first longer branch', async () => {
    const store = await loaded();
    expect(store['findShortestPath']('a', 'e')).toEqual(['a', 'c', 'e']);
    expect(store['findShortestPath']('a', 'd')).toEqual(['a', 'b', 'd']);
    expectNoExtraIO();
  });

  it('respects directed links and reports disconnected nodes after a positive path control', async () => {
    const store = await loaded();
    expect(store['findShortestPath']('a', 'e')).toEqual(['a', 'c', 'e']);
    expect(store['findShortestPath']('e', 'a')).toEqual([]);
    expect(store['findShortestPath']('a', 'isolated')).toEqual([]);
    expect(store['bfsTraversal']('isolated')).toEqual(['isolated']);
    expectNoExtraIO();
  });

  it('distinguishes missing start or target IDs from an existing single-node path', async () => {
    const store = await loaded();
    expect(store['findShortestPath']('a', 'a')).toEqual(['a']);
    expect(store['bfsTraversal']('a', 0)).toEqual(['a']);
    expect(store['findShortestPath']('missing', 'e')).toEqual([]);
    expect(store['findShortestPath']('a', 'missing')).toEqual([]);
    expect(store['bfsTraversal']('missing')).toEqual([]);
    expectNoExtraIO();
  });

  it('returns independent ID arrays without modifying authoritative connections', async () => {
    const store = await loaded();
    const traversal = store['bfsTraversal']('a');
    const path = store['findShortestPath']('a', 'e');
    traversal[0] = 'changed';
    path.push('changed');
    expect(store['bfsTraversal']('a')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(store['findShortestPath']('a', 'e')).toEqual(['a', 'c', 'e']);
    expect(fixture.nodes[0].connections).toEqual(['b', 'c', 'b', 'dangling']);
    expectNoExtraIO();
  });

  it.each([-1, 0.5, NaN, Infinity, '2', null])('rejects invalid maxDepth %s rather than coercing it', async depth => {
    const store = await loaded();
    expect(() => store['bfsTraversal']('a', depth as number)).toThrow('GraphRAG maxDepth must be a nonnegative integer');
    expectNoExtraIO();
  });

  it('rejects non-string IDs in both operations rather than coercing them', async () => {
    const store = await loaded();
    expect(() => store['bfsTraversal'](1 as any)).toThrow('GraphRAG traversal IDs must be strings');
    expect(() => store['findShortestPath']('a', 1 as any)).toThrow('GraphRAG traversal IDs must be strings');
    expectNoExtraIO();
  });

  it.each(['bfsTraversal', 'findShortestPath'] as const)('validates encountered nodes through clone guard before %s reads connections', async method => {
    const store = await loaded();
    let calls = 0;
    Object.defineProperty(fixture.nodes[1], 'connections', { get: () => { calls++; return ['d']; } });
    expect(() => method === 'bfsTraversal' ? store['bfsTraversal']('a') : store['findShortestPath']('a', 'e'))
      .toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0);
    expectNoExtraIO();
  });
});
