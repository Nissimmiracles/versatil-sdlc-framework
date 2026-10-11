/** Existing loading behavior, factored into private collection loaders. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphRAGStore } from './graphrag-store.js';

const fixture = vi.hoisted(() => ({
  nodes: [
    { id: 'fixture-pattern', type: 'pattern', label: 'React fixture',
      properties: { pattern: 'React fixture', agent: 'james-frontend', category: 'ui',
        effectiveness: 0.9, timeSaved: 100, tags: ['react'], usageCount: 0,
        lastUsed: new Date('2026-01-01T00:00:00Z') }, connections: ['fixture-react'] },
    { id: 'fixture-react', type: 'technology', label: 'react',
      properties: {}, connections: ['fixture-pattern'] },
  ],
  edges: [{ id: 'fixture-edge', source: 'fixture-pattern', target: 'fixture-react',
    relationship: 'uses', weight: 0.8 }],
  requests: [] as string[],
  callbacks: [] as string[],
  failCollection: undefined as string | undefined,
  failure: new Error('Synthetic collection fetch failed'),
}));

// Hoisted module mock prevents a real Firestore client or network request.
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  class MockFirestore {
    collection(name: string) {
      const records = name === 'graphrag_nodes' ? fixture.nodes :
        name === 'graphrag_edges' ? fixture.edges : undefined;
      if (!records) throw new Error(`Unexpected collection: ${name}`);
      return {
        get: async () => {
          fixture.requests.push(name);
          if (fixture.failCollection === name) throw fixture.failure;
          const docs = records.map(data => ({ id: data.id, data: () => structuredClone(data) }));
          return {
            docs, size: docs.length, empty: docs.length === 0,
            forEach(callback: (doc: typeof docs[number]) => void, thisArg?: unknown) {
              docs.forEach(doc => {
                fixture.callbacks.push(`${name}:${doc.id}`);
                callback.call(thisArg, doc);
              });
            },
          };
        },
      };
    }
    async terminate() {}
  }
  return { ...actual, Firestore: MockFirestore };
});

beforeEach(() => {
  fixture.requests.length = 0;
  fixture.callbacks.length = 0;
  fixture.failCollection = undefined;
  vi.restoreAllMocks();
});

describe('GraphRAG private collection loading', () => {
  it('loads nonempty nodes and their adjacency without loading edges or marking ready', async () => {
    const store = new GraphRAGStore();
    const nodes = await store['loadNodesFromFirestore']();
    expect(nodes).toEqual(fixture.nodes);
    expect(nodes).toHaveLength(2);
    expect(fixture.requests).toEqual(['graphrag_nodes']);
    expect(fixture.callbacks).toEqual(['graphrag_nodes:fixture-pattern', 'graphrag_nodes:fixture-react']);
    expect([...store['nodes'].values()]).toEqual(fixture.nodes);
    expect(store['adjacencyList'].get('fixture-pattern')).toEqual(['fixture-react']);
    expect(store['adjacencyList'].get('fixture-react')).toEqual(['fixture-pattern']);
    expect(store['edges'].size).toBe(0);
    expect(store['initialized']).toBe(false);
  });

  it('loads a nonempty edge snapshot independently without loading nodes or marking ready', async () => {
    const store = new GraphRAGStore();
    const edges = await store['loadEdgesFromFirestore']();
    expect(edges).toEqual(fixture.edges);
    expect(edges).toHaveLength(1);
    expect(fixture.requests).toEqual(['graphrag_edges']);
    expect(fixture.callbacks).toEqual(['graphrag_edges:fixture-edge']);
    expect(store['edges'].get('fixture-edge')).toEqual(fixture.edges[0]);
    expect(store['nodes'].size).toBe(0);
    expect(store['adjacencyList'].size).toBe(0);
    expect(store['initialized']).toBe(false);
  });

  it('initializes nodes before edges and emits readiness after both caches are populated', async () => {
    const store = new GraphRAGStore();
    const initialized = vi.fn(() => {
      expect(store['initialized']).toBe(true);
      expect(store['nodes'].size).toBe(2);
      expect(store['edges'].size).toBe(1);
    });
    store.on('initialized', initialized);
    await store.initialize();
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
    expect(fixture.callbacks).toEqual([
      'graphrag_nodes:fixture-pattern', 'graphrag_nodes:fixture-react', 'graphrag_edges:fixture-edge',
    ]);
    expect(initialized).toHaveBeenCalledOnce();
    expect(store['initialized']).toBe(true);
  });

  it('does not fetch either collection or emit again when initialized repeatedly', async () => {
    const store = new GraphRAGStore();
    const initialized = vi.fn();
    store.on('initialized', initialized);
    await store.initialize();
    await store.initialize();
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
    expect(fixture.callbacks).toHaveLength(3);
    expect(initialized).toHaveBeenCalledOnce();
    expect(store['nodes'].size).toBe(2);
    expect(store['edges'].size).toBe(1);
  });

  it.each(['graphrag_nodes', 'graphrag_edges'])('propagates a %s fetch failure without marking initialized or emitting readiness', async collection => {
    fixture.failCollection = collection;
    const store = new GraphRAGStore();
    const initialized = vi.fn();
    store.on('initialized', initialized);
    await expect(store.initialize()).rejects.toBe(fixture.failure);
    expect(store['initialized']).toBe(false);
    expect(initialized).not.toHaveBeenCalled();
    expect(store['edges'].size).toBe(0);
    if (collection === 'graphrag_nodes') {
      expect(fixture.requests).toEqual(['graphrag_nodes']);
      expect(store['nodes'].size).toBe(0);
      expect(fixture.callbacks).toEqual([]);
    } else {
      expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
      expect([...store['nodes'].values()]).toEqual(fixture.nodes);
      expect(store['adjacencyList'].get('fixture-pattern')).toEqual(['fixture-react']);
      expect(fixture.callbacks).toHaveLength(2);
    }
  });
});
