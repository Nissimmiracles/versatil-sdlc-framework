/** Retained mocked documents; no live backend or universal SDK concurrency claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphNode } from './graphrag-store.js';

const backend = vi.hoisted(() => ({
  nodes: new Map<string, any>(), requests: [] as string[], creates: 0, batches: 0, transactions: 0,
  deletes: 0, terminations: 0, failure: undefined as 'before' | 'after' | undefined,
  retry: false, callbacks: 0, onCallback: undefined as (() => void) | undefined,
}));
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  // Actual supported value copy, preserving Date/Timestamp/bytes prototypes in fixture storage.
  const copy = (value: any): any => {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (value instanceof actual.Timestamp) return new actual.Timestamp(value.seconds, value.nanoseconds);
    if (Buffer.isBuffer(value)) return Buffer.from(value);
    if (value instanceof Uint8Array) return new Uint8Array(value);
    if (Array.isArray(value)) return value.map(copy);
    return Object.fromEntries(Object.entries(value).map(([key, data]) => [key, copy(data)]));
  };
  const commit = (operations: Array<{ kind: 'create' | 'set'; id: string; data: any }>) => {
    const staged = new Map([...backend.nodes].map(([id, data]) => [id, copy(data)]));
    for (const operation of operations) {
      if (operation.kind === 'create' && staged.has(operation.id)) throw new Error('ALREADY_EXISTS');
      staged.set(operation.id, copy(operation.data));
    }
    if (backend.failure === 'before') throw new Error('KNOWN_BEFORE_COMMIT');
    backend.nodes.clear();
    for (const [id, data] of staged) backend.nodes.set(id, data);
    if (backend.failure === 'after') throw new Error('AMBIGUOUS_AFTER_COMMIT');
  };
  class MockFirestore {
    collection(name: string) {
      if (name !== 'graphrag_nodes' && name !== 'graphrag_edges') throw new Error('Unexpected collection');
      return {
        get: async () => {
          backend.requests.push(name);
          const docs = (name === 'graphrag_nodes' ? [...backend.nodes] : []).map(([id, data]) => ({ id, data: () => copy(data) }));
          return { docs, empty: docs.length === 0, size: docs.length,
            forEach(callback: (doc: typeof docs[number]) => void, thisArg?: unknown) { docs.forEach(doc => callback.call(thisArg, doc)); } };
        },
        doc: (id: string) => ({ id,
          create: async (data: any) => { backend.creates++; commit([{ kind: 'create', id, data }]); },
        }),
      };
    }
    batch() {
      const operations: Array<{ kind: 'create'; id: string; data: any }> = [];
      return {
        create(ref: { id: string }, data: any) { operations.push({ kind: 'create', id: ref.id, data: copy(data) }); return this; },
        async commit() { backend.batches++; commit(operations); },
      };
    }
    async runTransaction(callback: (transaction: any) => Promise<any>) {
      backend.transactions++;
      const run = async () => {
        const operations: Array<{ kind: 'set'; id: string; data: any }> = [];
        const transaction = {
          async get(ref: { id: string }) {
            if (operations.length) throw new Error('Read after transaction write');
            const record = backend.nodes.get(ref.id);
            return { exists: record !== undefined, data: () => copy(record) };
          },
          set(ref: { id: string }, data: any) { operations.push({ kind: 'set', id: ref.id, data: copy(data) }); },
        };
        backend.callbacks++;
        const result = await callback(transaction);
        backend.onCallback?.();
        return { result, operations };
      };
      if (backend.retry) { await run(); backend.retry = false; }
      const { result, operations } = await run();
      commit(operations);
      return result;
    }
    async terminate() { backend.terminations++; }
  }
  return { Firestore: MockFirestore, Timestamp: actual.Timestamp };
});

function node(id = 'new-node'): GraphNode {
  return { id, type: 'concept', label: 'Original', properties: { nested: { keep: true }, tags: ['original'],
    date: new Date('2026-01-01T00:00:00Z'), timestamp: new Timestamp(1700000000, 123456789),
    bytes: Buffer.from([1, 2]), octets: new Uint8Array([3, 4]) },
    connections: ['unresolved'], privacy: { userId: 'fixture-user', isPublic: false } };
}
beforeEach(() => {
  backend.nodes.clear(); backend.requests.length = 0;
  backend.creates = 0; backend.batches = 0; backend.transactions = 0;
  backend.deletes = 0; backend.terminations = 0; backend.failure = undefined;
  backend.retry = false; backend.callbacks = 0; backend.onCallback = undefined; vi.restoreAllMocks();
});
async function reload() { const store = new GraphRAGStore(); await store.initialize(); return store; }
function noWriteIO() {
  expect(backend.requests).toEqual([]);
  expect(backend.creates + backend.batches + backend.transactions).toBe(0);
}

describe('Generic GraphRAG node writes, isolated proposal', () => {
  it('creates an explicit ID with actual persisted values, detached input and new-store reload', async () => {
    const store = new GraphRAGStore(); const input = node();
    await store.addNode(input);
    expect(backend.creates).toBe(1);
    expect(backend.nodes.get(input.id)).toEqual(input);
    expect(store.getNode(input.id)).toEqual(input);
    input.label = 'changed'; input.properties.nested.keep = false; input.connections.push('changed');
    expect(store.getNode('new-node')!.label).toBe('Original');
    expect(store.getNode('new-node')!.properties.nested.keep).toBe(true);
    expect((await reload()).getNode('new-node')).toEqual(store.getNode('new-node'));
    expect(store['adjacencyList'].get('new-node')).toEqual(['unresolved']);
    expect(backend.deletes + backend.terminations).toBe(0);
  });

  it('allows a generic pattern node with base-only properties and no inferred marker', async () => {
    const store = new GraphRAGStore();
    await store.addNode({ id: 'base-pattern', type: 'pattern', label: 'Base', properties: {}, connections: [] });
    expect(store.getNode('base-pattern')!.properties).toEqual({});
    expect(store.getNode('base-pattern')).not.toHaveProperty('privacy');
    expect((await reload()).getNode('base-pattern')).not.toHaveProperty('privacy');
  });

  it('rejects duplicates using authoritative create preconditions even with stale local cache', async () => {
    const store = await reload(); const original = node('existing'); backend.nodes.set('existing', original);
    await expect(store.addNode({ ...node('existing'), label: 'Overwrite' })).rejects.toThrow('ALREADY_EXISTS');
    expect(backend.nodes.get('existing')).toEqual(original);
    expect(() => store.getNode('existing')).toThrow('GraphRAG cache is not initialized');
    await store.initialize(); expect(store.getNode('existing')!.label).toBe('Original');
  });

  it('updates supplied top-level fields using persisted authority and replaces properties without deep merge', async () => {
    const store = new GraphRAGStore(); await store.addNode(node('existing'));
    backend.nodes.get('existing').label = 'Externally changed';
    await store.updateNode({ id: 'existing', properties: { replacement: true }, connections: ['fresh'] });
    expect(store.getNode('existing')!.label).toBe('Externally changed');
    expect(store.getNode('existing')!.properties).toEqual({ replacement: true });
    expect(store.getNode('existing')!.connections).toEqual(['fresh']);
    expect(store.getNode('existing')!.privacy).toEqual({ userId: 'fixture-user', isPublic: false });
    expect(store['adjacencyList'].get('existing')).toEqual(['fresh']);
    expect((await reload()).getNode('existing')).toEqual(store.getNode('existing'));
  });

  it('does not mutate input or publish cache inside a replayed transaction callback', async () => {
    const store = new GraphRAGStore(); await store.addNode(node('existing')); backend.retry = true;
    const patch = Object.freeze({ id: 'existing', label: 'Updated' });
    let observations = 0;
    backend.onCallback = () => {
      observations++;
      expect(store.getNode('existing')!.label).toBe('Original');
      expect(backend.nodes.get('existing').label).toBe('Original');
    };
    await store.updateNode(patch);
    expect(observations).toBe(2);
    expect(backend.callbacks).toBe(2);
    expect(backend.nodes.get('existing').label).toBe('Updated');
    expect(store.getNode('existing')!.label).toBe('Updated');
    expect(patch).toEqual({ id: 'existing', label: 'Updated' });
  });

  it.each(['missing', 'type'] as const)('rejects %s update without creating or changing a backend node', async kind => {
    const store = new GraphRAGStore(); await store.addNode(node('existing'));
    const snapshot = backend.nodes.get('existing');
    await expect(store.updateNode(kind === 'missing' ? { id: 'absent', label: 'X' } : { id: 'existing', type: 'agent' }))
      .rejects.toThrow(kind === 'missing' ? 'GraphRAG node does not exist' : 'GraphRAG node type is immutable');
    expect(backend.nodes.get('existing')).toEqual(snapshot); expect(backend.nodes.size).toBe(1);
    expect(() => store.getNode('existing')).toThrow('GraphRAG cache is not initialized');
  });

  it('creates a real atomic batch and reloads both nodes without chunking', async () => {
    const store = new GraphRAGStore(); await store.batchAddNodes([node('a'), node('b')]);
    expect(backend.batches).toBe(1); expect(backend.creates).toBe(0);
    expect([...backend.nodes.keys()]).toEqual(['a', 'b']);
    const reloaded = await reload(); expect(reloaded.getNode('a')!.label).toBe('Original');
    expect(reloaded.getNode('b')!.label).toBe('Original');
  });

  it('rejects a batch containing a backend duplicate atomically', async () => {
    backend.nodes.set('existing', node('existing')); const store = new GraphRAGStore();
    await expect(store.batchAddNodes([node('fresh'), node('existing')])).rejects.toThrow('ALREADY_EXISTS');
    expect([...backend.nodes.keys()]).toEqual(['existing']);
    expect(() => store.getNode('fresh')).toThrow('GraphRAG cache is not initialized');
  });

  it.each(['create', 'update', 'batch'] as const)('handles known-before and ambiguous-after errors for %s without claiming rollback', async operation => {
    for (const failure of ['before', 'after'] as const) {
      backend.nodes.clear(); backend.failure = undefined;
      const store = new GraphRAGStore(); await store.addNode(node('existing')); backend.failure = failure;
      const write = operation === 'create' ? store.addNode(node('fresh')) :
        operation === 'batch' ? store.batchAddNodes([node('fresh'), node('other')]) :
        store.updateNode({ id: 'existing', label: 'Updated' });
      await expect(write).rejects.toThrow(failure === 'before' ? 'KNOWN_BEFORE_COMMIT' : 'AMBIGUOUS_AFTER_COMMIT');
      expect(store['nodes'].size).toBe(0); expect(store['edges'].size).toBe(0);
      expect(store['adjacencyList'].size).toBe(0);
      expect(() => store.getNode('existing')).toThrow('GraphRAG cache is not initialized');
      backend.failure = undefined; await store.initialize();
      if (operation === 'update') expect(store.getNode('existing')!.label).toBe(failure === 'before' ? 'Original' : 'Updated');
      else {
        expect(store.getNode('fresh') !== undefined).toBe(failure === 'after');
        if (operation === 'batch') expect(store.getNode('other') !== undefined).toBe(failure === 'after');
      }
    }
  });

  it('serializes concurrent calls locally and continues after a failed operation', async () => {
    const store = new GraphRAGStore(); await store.addNode(node('existing'));
    const first = store.updateNode({ id: 'existing', label: 'First' });
    const second = store.updateNode({ id: 'existing', properties: { replacement: true } });
    await Promise.all([first, second]);
    expect(store.getNode('existing')!.label).toBe('First');
    expect(store.getNode('existing')!.properties).toEqual({ replacement: true });
    await expect(store.addNode(node('existing'))).rejects.toThrow('ALREADY_EXISTS');
    await store.addNode(node('recovered')); expect(store.getNode('recovered')!.label).toBe('Original');
  });

  it.each([
    { change: (value: any) => { delete value.label; } },
    { change: (value: any) => { value.type = 'unknown'; } },
    { change: (value: any) => { value.id = '../bad'; } },
    { change: (value: any) => { value.id = '__reserved__'; } },
    { change: (value: any) => { value.properties.nested.bad = undefined; } },
    { change: (value: any) => { value.properties['__reserved__'] = 'bad'; } },
    { change: (value: any) => { value.properties.opaque = new Map(); } },
    { change: (value: any) => { value.properties.nested.loop = value; } },
    { change: (value: any) => { value.properties.date = new Date(NaN); } },
    { change: (value: any) => { value.properties.arrays = [[1]]; } },
    { change: (value: any) => { value.properties.large = 'x'.repeat(70000); } },
  ])('rejects invalid or nonserializable node data before read/write I/O', async ({ change }) => {
    const input = node(); change(input); const store = new GraphRAGStore();
    await expect(store.addNode(input)).rejects.toThrow(); noWriteIO();
  });

  it('rejects a node accessor without invoking it, before any read/write I/O', async () => {
    const input = node(); let calls = 0;
    Object.defineProperty(input, 'label', { get: () => { calls++; return 'Changed'; } });
    const store = new GraphRAGStore();
    await expect(store.addNode(input)).rejects.toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0); expect(input.id).toBe('new-node');
    expect(input.properties.nested.keep).toBe(true); noWriteIO();
  });

  it.each([
    { marker: { userId: 'user', isPublic: false } },
    { marker: { teamId: 'team', isPublic: false } },
    { marker: { projectId: 'project', isPublic: false } },
    { marker: { isPublic: true, auditedAt: '2026-01-01T00:00:00Z', sanitized: true } },
    { marker: undefined },
  ])('retains only supplied marker data at node level through persistence and reload', async ({ marker }) => {
    const input = node();
    if (marker === undefined) delete input.privacy;
    else input.privacy = marker;
    const store = new GraphRAGStore(); await store.addNode(input);
    const cached = store.getNode(input.id)!;
    const loaded = (await reload()).getNode(input.id)!;
    expect(cached).toEqual(backend.nodes.get(input.id)); expect(loaded).toEqual(cached);
    expect(cached.properties).not.toHaveProperty('privacy');
    if (marker === undefined) {
      expect(cached).not.toHaveProperty('privacy'); expect(loaded).not.toHaveProperty('privacy');
    } else {
      expect(cached.privacy).toEqual(marker); expect(loaded.privacy).toEqual(marker);
      expect(cached.privacy).not.toBe(marker);
    }
  });

  it.each([
    { nodes: [] }, { nodes: Array.from({ length: 101 }, (_, index) => node(`id-${index}`)) },
    { nodes: [node('same'), node('same')] },
    { nodes: Array.from({ length: 30 }, (_, index) => ({ ...node(`id-${index}`), properties: { text: 'x'.repeat(40000) } })) },
  ])('rejects invalid batch admission before any I/O', async ({ nodes }) => {
    const store = new GraphRAGStore(); await expect(store.batchAddNodes(nodes)).rejects.toThrow(); noWriteIO();
  });

  it('rejects malformed patches before I/O and validates full merged authoritative records', async () => {
    const store = new GraphRAGStore();
    await expect(store.updateNode({ id: 'existing', properties: { invalid: undefined } })).rejects.toThrow(); noWriteIO();
    backend.nodes.set('existing', { ...node('existing'), properties: { invalid: undefined } });
    await expect(store.updateNode({ id: 'existing', label: 'Updated' })).rejects.toThrow('GraphRAG writes cannot contain undefined');
    expect(backend.nodes.get('existing').label).toBe('Original');
    expect(() => store.getNode('existing')).toThrow('GraphRAG cache is not initialized');
  });
});
