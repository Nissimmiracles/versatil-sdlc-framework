/** Explicit local cache invalidation, without persistence deletion or query-cache claims. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphRAGStore } from './graphrag-store.js';

const fixture = vi.hoisted(() => ({
  nodes: [] as any[], edges: [] as any[], requests: [] as string[], writes: 0,
  deletes: 0, terminations: 0, clients: 0,
  blockedCollection: undefined as string | undefined,
  onBlocked: undefined as (() => void) | undefined,
  release: undefined as (() => void) | undefined,
}));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  class MockFirestore {
    constructor() { fixture.clients++; }
    collection(name: string) {
      const records = name === 'graphrag_nodes' ? fixture.nodes :
        name === 'graphrag_edges' ? fixture.edges : undefined;
      if (!records) throw new Error(`Unexpected collection: ${name}`);
      return {
        get: async () => {
          fixture.requests.push(name);
          if (fixture.blockedCollection === name) {
            const gate = new Promise<void>(resolve => { fixture.release = resolve; });
            fixture.onBlocked?.();
            await gate;
          }
          const docs = records.map(data => ({ id: data.id, data: () => structuredClone(data) }));
          return { docs, empty: docs.length === 0, size: docs.length,
            forEach(callback: (doc: typeof docs[number]) => void, thisArg?: unknown) {
              docs.forEach(doc => callback.call(thisArg, doc));
            } };
        },
        doc: () => ({
          set: () => { fixture.writes++; }, update: () => { fixture.writes++; },
          delete: () => { fixture.deletes++; },
        }),
      };
    }
    async terminate() { fixture.terminations++; }
  }
  return { ...actual, Firestore: MockFirestore };
});

beforeEach(() => {
  fixture.nodes = [
    { id: 'fixture-pattern', type: 'pattern', label: 'Initial fixture',
      properties: { pattern: 'React fixture', agent: 'james-frontend', category: 'ui',
        effectiveness: 0.9, timeSaved: 100, tags: ['react'], usageCount: 0,
        lastUsed: new Date('2026-01-01T00:00:00Z') }, connections: ['fixture-react'] },
    { id: 'fixture-react', type: 'technology', label: 'react', properties: {}, connections: ['fixture-pattern'] },
  ];
  fixture.edges = [{ id: 'fixture-edge', source: 'fixture-pattern', target: 'fixture-react',
    relationship: 'uses', weight: 0.8 }];
  fixture.requests.length = 0;
  fixture.writes = 0;
  fixture.deletes = 0;
  fixture.terminations = 0;
  fixture.clients = 0;
  fixture.blockedCollection = undefined;
  fixture.onBlocked = undefined;
  fixture.release = undefined;
  vi.restoreAllMocks();
});
function expectBackendUntouched() {
  expect(fixture.writes).toBe(0);
  expect(fixture.deletes).toBe(0);
  expect(fixture.terminations).toBe(0);
}

describe('GraphRAG initialized cache lifecycle', () => {
  it('clears all three nonempty maps and readiness without touching backend documents or the client', async () => {
    const store = new GraphRAGStore();
    await store.initialize();
    expect(store['nodes'].size).toBe(2);
    expect(store['edges'].size).toBe(1);
    expect(store['adjacencyList'].size).toBe(2);
    expect(store['initialized']).toBe(true);
    const backend = structuredClone({ nodes: fixture.nodes, edges: fixture.edges });
    const client = store['firestore'];
    store.clearCache();
    expect(store['nodes'].size).toBe(0);
    expect(store['edges'].size).toBe(0);
    expect(store['adjacencyList'].size).toBe(0);
    expect(store['initialized']).toBe(false);
    expect(store['firestore']).toBe(client);
    expect({ nodes: fixture.nodes, edges: fixture.edges }).toEqual(backend);
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
    expect(fixture.clients).toBe(1);
    expectBackendUntouched();
  });

  it('refuses cached reads and another clear until explicitly initialized again', async () => {
    const store = new GraphRAGStore();
    await store.initialize();
    expect(store.getNode('fixture-pattern')!.label).toBe('Initial fixture');
    store.clearCache();
    expect(() => store.getNode('fixture-pattern')).toThrow('GraphRAG cache is not initialized');
    expect(() => store.clearCache()).toThrow('GraphRAG cache is not initialized');
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
    expectBackendUntouched();
  });

  it('reloads fresh persisted data through the same client after clear and explicit initialize', async () => {
    const store = new GraphRAGStore();
    await store.initialize();
    const client = store['firestore'];
    expect(store.getNode('fixture-pattern')!.label).toBe('Initial fixture');
    store.clearCache();
    fixture.nodes[0].label = 'Reloaded fixture';
    fixture.edges[0].weight = 0.5;
    await store.initialize();
    expect(store.getNode('fixture-pattern')!.label).toBe('Reloaded fixture');
    expect(store.getEdge('fixture-edge')!.weight).toBe(0.5);
    expect(store.getNeighbors('fixture-pattern')).toEqual(['fixture-react']);
    expect(store['initialized']).toBe(true);
    expect(store['firestore']).toBe(client);
    expect(fixture.clients).toBe(1);
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges', 'graphrag_nodes', 'graphrag_edges']);
    expectBackendUntouched();
  });

  it('rejects clear before initialization without fetching or changing storage', () => {
    const store = new GraphRAGStore();
    const backend = structuredClone({ nodes: fixture.nodes, edges: fixture.edges });
    expect(() => store.clearCache()).toThrow('GraphRAG cache is not initialized');
    expect(store['nodes'].size).toBe(0);
    expect(store['edges'].size).toBe(0);
    expect(store['adjacencyList'].size).toBe(0);
    expect(fixture.requests).toEqual([]);
    expect({ nodes: fixture.nodes, edges: fixture.edges }).toEqual(backend);
    expectBackendUntouched();
  });

  it('rejects clear during pending initialization without erasing partially loaded nodes', async () => {
    const store = new GraphRAGStore();
    fixture.blockedCollection = 'graphrag_edges';
    const blocked = new Promise<void>(resolve => { fixture.onBlocked = resolve; });
    const initializing = store.initialize();
    await blocked;
    try {
      expect(store['initialized']).toBe(false);
      expect(store['nodes'].size).toBe(2);
      expect(store['adjacencyList'].size).toBe(2);
      expect(store['edges'].size).toBe(0);
      expect(() => store.clearCache()).toThrow('GraphRAG cache is not initialized');
      expect(store['nodes'].size).toBe(2);
      expect(store['adjacencyList'].size).toBe(2);
      expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
      expectBackendUntouched();
    } finally {
      // Release and drain initialization even when a baseline assertion fails.
      fixture.release!();
      await initializing;
    }
    expect(store['initialized']).toBe(true);
    expect(store.getNode('fixture-pattern')!.label).toBe('Initial fixture');
    expect(store.getEdge('fixture-edge')!.source).toBe('fixture-pattern');
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
    expectBackendUntouched();
  });
});
