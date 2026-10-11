/** Storage shape only: no query authorization or live Firestore claims. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GraphRAGStore, type GraphNode } from './graphrag-store.js';

const persisted = vi.hoisted(() => ({
  nodes: new Map<string, Record<string, any>>(),
  edges: new Map<string, Record<string, any>>(),
  writes: [] as Array<{ collection: string; id: string; data: Record<string, any> }>,
}));

// Registered before importing GraphRAGStore; no SDK connection is constructed.
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  class MockFirestore {
    collection(name: string) {
      const records = name === 'graphrag_nodes' ? persisted.nodes :
        name === 'graphrag_edges' ? persisted.edges : undefined;
      if (!records) throw new Error(`Unexpected collection: ${name}`);
      return {
        get: async () => {
          const docs = [...records.values()].map(data => ({ data: () => structuredClone(data) }));
          return {
            docs, size: docs.length, empty: docs.length === 0,
            forEach(callback: (doc: typeof docs[number]) => void, thisArg?: unknown) {
              docs.forEach(doc => callback.call(thisArg, doc));
            },
          };
        },
        doc: (id: string) => ({
          set: async (data: Record<string, any>) => {
            const copy = structuredClone(data);
            records.set(id, copy);
            persisted.writes.push({ collection: name, id, data: copy });
          },
          update: async (data: Record<string, any>) => {
            const existing = records.get(id);
            if (!existing) throw new Error(`Cannot update missing document: ${id}`);
            records.set(id, { ...existing, ...structuredClone(data) });
          },
        }),
      };
    }
    async terminate() {}
  }
  return { ...actual, Firestore: MockFirestore };
});

const properties = () => ({
  pattern: 'React TypeScript component', description: 'Explicit storage fixture',
  code: 'const component = true;', examples: ['component example'],
  agent: 'james-frontend', category: 'ui', effectiveness: 0.9, timeSaved: 100,
  tags: ['components'], usageCount: 2, lastUsed: new Date('2026-01-01T00:00:00Z'),
});

beforeEach(() => {
  persisted.nodes.clear();
  persisted.edges.clear();
  persisted.writes.length = 0;
  vi.restoreAllMocks();
});

describe('GraphRAG explicit privacy storage', () => {
  it.each([
    ['public', { isPublic: true }],
    ['private user', { userId: 'fixture-user', isPublic: false }],
    ['private team', { teamId: 'fixture-team', isPublic: false }],
    ['private project', { projectId: 'fixture-project', isPublic: false }],
  ] as Array<[string, NonNullable<GraphNode['privacy']>]>)('preserves %s at the node level through persistence and reload', async (_, privacy) => {
    const input = { ...properties(), privacy };
    const original = structuredClone(input);
    Object.freeze(privacy);
    Object.freeze(input);
    const store = new GraphRAGStore();
    const id = await store.addPattern(input);
    const write = persisted.writes.find(entry => entry.collection === 'graphrag_nodes' && entry.id === id);
    expect(write).toBeDefined();
    expect(write!.data.privacy).toEqual(privacy);
    expect(write!.data.properties).toEqual(originalWithoutPrivacy(original));
    expect(write!.data.properties).not.toHaveProperty('privacy');
    expect(store['nodes'].get(id)).toEqual(write!.data);
    expect(store['nodes'].get(id)!.privacy).not.toBe(privacy);
    expect(input).toEqual(original);

    await store.close();
    const reloaded = new GraphRAGStore();
    await reloaded.initialize();
    expect(reloaded['nodes'].get(id)).toEqual(write!.data);
    expect(reloaded['nodes'].get(id)!.privacy).toEqual(privacy);
    expect(reloaded['nodes'].get(id)!.properties).not.toHaveProperty('privacy');
    expect(reloaded['nodes'].get(id)!.connections.length).toBeGreaterThan(0);
    expect((await reloaded.getStatistics()).totalEdges).toBe(persisted.edges.size);
    await reloaded.close();
  });

  it('keeps a legacy pattern without a marker unchanged', async () => {
    const input = properties();
    const original = structuredClone(input);
    const store = new GraphRAGStore();
    const id = await store.addPattern(input);
    const write = persisted.writes.find(entry => entry.collection === 'graphrag_nodes' && entry.id === id);
    expect(write).toBeDefined();
    expect(write!.data).not.toHaveProperty('privacy');
    expect(write!.data.properties).toEqual(original);
    expect(store['nodes'].get(id)).not.toHaveProperty('privacy');
    expect(input).toEqual(original);
    await store.close();
    const reloaded = new GraphRAGStore();
    await reloaded.initialize();
    expect(reloaded['nodes'].get(id)).toEqual(write!.data);
    expect(reloaded['nodes'].get(id)).not.toHaveProperty('privacy');
    await reloaded.close();
  });

  it('does not infer a marker from an explicitly undefined privacy input', async () => {
    const input = { ...properties(), privacy: undefined };
    const original = structuredClone(input);
    const store = new GraphRAGStore();
    const id = await store.addPattern(input);
    const write = persisted.writes.find(entry => entry.collection === 'graphrag_nodes' && entry.id === id);
    expect(write).toBeDefined();
    expect(write!.data).not.toHaveProperty('privacy');
    expect(write!.data.properties).not.toHaveProperty('privacy');
    expect(write!.data.properties).toEqual(originalWithoutPrivacy(original));
    expect(input).toEqual(original);
    await store.close();
  });
});

function originalWithoutPrivacy<T extends { privacy?: GraphNode['privacy'] }>(input: T) {
  const { privacy, ...rest } = input;
  return rest;
}
