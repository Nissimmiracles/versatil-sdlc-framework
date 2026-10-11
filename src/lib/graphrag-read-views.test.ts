/** Trusted cache views only; no retrieval authorization or live SDK-client claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore, type GraphNode, type GraphEdge } from './graphrag-store.js';

const fixture = vi.hoisted(() => ({
  nodes: [] as any[], edges: [] as any[], requests: [] as string[], writes: 0,
}));
vi.mock('@google-cloud/firestore', async importOriginal => {
  // Use the installed Timestamp value class, but never construct its Firestore client.
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  class MockFirestore {
    collection(name: string) {
      const records = name === 'graphrag_nodes' ? fixture.nodes :
        name === 'graphrag_edges' ? fixture.edges : undefined;
      if (!records) throw new Error(`Unexpected collection: ${name}`);
      return {
        get: async () => {
          fixture.requests.push(name);
          const docs = records.map(data => ({ id: data.id, data: () => data }));
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
  fixture.nodes = [
    { id: 'pattern-a', type: 'pattern', label: 'Pattern A',
      properties: { pattern: 'React fixture', agent: 'james-frontend', category: 'ui',
        effectiveness: 0.9, timeSaved: 100, tags: ['react'], usageCount: 1,
        lastUsed: new Date('2026-01-01T00:00:00Z'),
        storedAt: new Timestamp(1700000000, 123456789),
        bytes: Buffer.from([0x10, 0x20, 0x30]), octets: new Uint8Array([4, 5, 6]), nested: { flags: ['original'] } },
      connections: ['tech-react', 'unresolved-id'], privacy: { userId: 'fixture-user', isPublic: false } },
    { id: 'tech-react', type: 'technology', label: 'react', properties: {}, connections: ['pattern-a'] },
    { id: 'unconnected', type: 'concept', label: 'Other', properties: {}, connections: [] },
  ];
  fixture.edges = [
    { id: 'edge-out', source: 'pattern-a', target: 'tech-react', relationship: 'uses', weight: 0.8 },
    { id: 'edge-in', source: 'tech-react', target: 'pattern-a', relationship: 'used_by', weight: 0.7 },
    { id: 'edge-other', source: 'unconnected', target: 'tech-react', relationship: 'related', weight: 0.2 },
  ];
  vi.restoreAllMocks();
});

const methods = [
  ['getNode', 'pattern-a'], ['getEdge', 'edge-out'], ['getNodesByType', 'pattern'],
  ['getEdgesForNode', 'pattern-a'], ['getNeighbors', 'pattern-a'],
] as const;

async function initializedStore() {
  const store = new GraphRAGStore();
  await store.initialize();
  return store;
}
function expectNoExtraIO() {
  expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges']);
  expect(fixture.writes).toBe(0);
}

describe('GraphRAG initialized cache read views', () => {
  it.each(methods)('rejects %s before initialize without fetching or writing', (method, argument) => {
    const store = new GraphRAGStore();
    const invoke = store[method] as (argument: string) => unknown;
    expect(() => invoke.call(store, argument)).toThrow('GraphRAG cache is not initialized');
    expect(fixture.requests).toEqual([]);
    expect(fixture.writes).toBe(0);
  });

  it('gets a real cached node and distinguishes absent keys after initialize', async () => {
    const store = await initializedStore();
    expect(store.getNode('pattern-a')).toEqual(fixture.nodes[0]);
    expect(store.getNode('pattern-a')).not.toBe(fixture.nodes[0]);
    expect(store.getNode('missing-node')).toBeUndefined();
    expectNoExtraIO();
  });

  it('gets a real cached edge and distinguishes absent keys after initialize', async () => {
    const store = await initializedStore();
    expect(store.getEdge('edge-out')).toEqual(fixture.edges[0]);
    expect(store.getEdge('edge-out')).not.toBe(fixture.edges[0]);
    expect(store.getEdge('missing-edge')).toBeUndefined();
    expectNoExtraIO();
  });

  it('filters cached nodes by actual type and returns an honest absent-type result', async () => {
    const store = await initializedStore();
    expect(store.getNodesByType('pattern').map(node => node.id)).toEqual(['pattern-a']);
    expect(store.getNodesByType('technology').map(node => node.id)).toEqual(['tech-react']);
    expect(store.getNodesByType('agent')).toEqual([]);
    expectNoExtraIO();
  });

  it('finds both source and target edges without inventing edges for missing nodes', async () => {
    const store = await initializedStore();
    expect(store.getEdgesForNode('pattern-a').map(edge => edge.id)).toEqual(['edge-out', 'edge-in']);
    expect(store.getEdgesForNode('missing-node')).toEqual([]);
    expectNoExtraIO();
  });

  it('returns copied declared connections including unresolved IDs without fabricating a node', async () => {
    const store = await initializedStore();
    const neighbors = store.getNeighbors('pattern-a');
    expect(neighbors).toEqual(['tech-react', 'unresolved-id']);
    neighbors.push('invented');
    expect(store.getNeighbors('pattern-a')).toEqual(['tech-react', 'unresolved-id']);
    expect(store.getNode('unresolved-id')).toBeUndefined();
    expect(store.getNeighbors('unconnected')).toEqual([]);
    expect(store.getNeighbors('missing-node')).toEqual([]);
    expectNoExtraIO();
  });

  it.each(['getNode', 'getNodesByType'] as const)('detaches nested values, Date and installed Firestore Timestamp from %s', async method => {
    const store = await initializedStore();
    const node: GraphNode = method === 'getNode' ? store.getNode('pattern-a')! : store.getNodesByType('pattern')[0];
    expect(node.properties.lastUsed).toBeInstanceOf(Date);
    expect(node.properties.lastUsed.getTime()).toBe(fixture.nodes[0].properties.lastUsed.getTime());
    const timestamp = node.properties.storedAt as Timestamp;
    expect(timestamp).toBeInstanceOf(Timestamp);
    expect(timestamp.isEqual(fixture.nodes[0].properties.storedAt)).toBe(true);
    expect(timestamp.toDate()).toEqual(fixture.nodes[0].properties.storedAt.toDate());
    expect(timestamp.toMillis()).toBe(fixture.nodes[0].properties.storedAt.toMillis());
    expect(Buffer.isBuffer(node.properties.bytes)).toBe(true);
    expect(node.properties.bytes.toString('hex')).toBe('102030');
    expect(node.properties.bytes.readUInt8(1)).toBe(0x20);
    expect(node.properties.octets).toBeInstanceOf(Uint8Array);
    expect([...node.properties.octets]).toEqual([4, 5, 6]);
    node.properties.bytes[0] = 0xff;
    node.properties.octets[0] = 99;
    node.label = 'changed';
    node.properties.nested.flags.push('changed');
    node.properties.tags.push('changed');
    node.properties.lastUsed.setFullYear(2000);
    (timestamp as any)._seconds = 0;
    (timestamp as any)._nanoseconds = 0;
    node.connections.push('changed');
    node.privacy!.userId = 'changed';
    expect(store.getNode('pattern-a')).toEqual(fixture.nodes[0]);
    expect(fixture.nodes[0].label).toBe('Pattern A');
    expect(fixture.nodes[0].properties.bytes.toString('hex')).toBe('102030');
    expect([...fixture.nodes[0].properties.octets]).toEqual([4, 5, 6]);
    expect(fixture.nodes[0].properties.nested.flags).toEqual(['original']);
    expect(fixture.nodes[0].properties.lastUsed.getUTCFullYear()).toBe(2026);
    expect(fixture.nodes[0].properties.storedAt.seconds).toBe(1700000000);
    expect(fixture.nodes[0].properties.storedAt.nanoseconds).toBe(123456789);
    expect(fixture.nodes[0].privacy.userId).toBe('fixture-user');
    expectNoExtraIO();
  });

  it.each(['getEdge', 'getEdgesForNode'] as const)('detaches edge records returned by %s', async method => {
    const store = await initializedStore();
    const edge: GraphEdge = method === 'getEdge' ? store.getEdge('edge-out')! : store.getEdgesForNode('pattern-a')[0];
    edge.weight = 0;
    edge.source = 'changed';
    expect(store.getEdge('edge-out')).toEqual(fixture.edges[0]);
    expect(fixture.edges[0].weight).toBe(0.8);
    expect(fixture.edges[0].source).toBe('pattern-a');
    expectNoExtraIO();
  });
  it('rejects own accessors without executing them or exposing their shared value', async () => {
    let calls = 0;
    const shared = { writable: true };
    Object.defineProperty(fixture.nodes[0].properties, 'opaque', {
      enumerable: true, get: () => { calls++; return shared; },
    });
    const store = await initializedStore();
    expect(() => store.getNode('pattern-a')).toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0);
    expect(shared).toEqual({ writable: true });
    expectNoExtraIO();
  });

  it('rejects function values without invoking them or exposing their shared value', async () => {
    let calls = 0;
    const shared = { writable: true };
    fixture.nodes[0].properties.opaque = () => { calls++; return shared; };
    const store = await initializedStore();
    expect(() => store.getNode('pattern-a')).toThrow('Unsupported GraphRAG cached value: function');
    expect(calls).toBe(0);
    expect(shared).toEqual({ writable: true });
    expectNoExtraIO();
  });

  it('rejects unsupported classes without invoking their constructor again', async () => {
    let constructions = 0;
    class OpaqueValue { constructor() { constructions++; } }
    fixture.nodes[0].properties.opaque = new OpaqueValue();
    const store = await initializedStore();
    expect(() => store.getNode('pattern-a')).toThrow('Unsupported GraphRAG cached value prototype');
    expect(constructions).toBe(1);
    expectNoExtraIO();
  });

  it('rejects an own accessor on an otherwise supported Date without invoking it', async () => {
    let calls = 0;
    Object.defineProperty(fixture.nodes[0].properties.lastUsed, 'opaque', {
      get: () => { calls++; return 'secret'; },
    });
    const store = await initializedStore();
    expect(() => store.getNode('pattern-a')).toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0);
    expectNoExtraIO();
  });

  it('rejects a bytes conversion function before copying or invoking it', async () => {
    let calls = 0;
    Object.defineProperty(fixture.nodes[0].properties.bytes, 'valueOf', {
      value: () => { calls++; return fixture.nodes[0].properties.bytes; },
    });
    const store = await initializedStore();
    expect(() => store.getNode('pattern-a')).toThrow('Unsupported GraphRAG cached value: function');
    expect(calls).toBe(0);
    expectNoExtraIO();
  });

  it.each([
    ['node type', 'getNodesByType', 'type', 'pattern'],
    ['edge source', 'getEdgesForNode', 'source', 'pattern-a'],
    ['edge target', 'getEdgesForNode', 'target', 'pattern-a'],
    ['node connections', 'getNeighbors', 'connections', 'pattern-a'],
  ] as const)('rejects a %s accessor before inspecting view-selection fields', async (_, method, field, argument) => {
    const store = await initializedStore();
    const record = method === 'getEdgesForNode' ? fixture.edges[0] : fixture.nodes[0];
    let calls = 0;
    Object.defineProperty(record, field, {
      get: () => { calls++; return field === 'connections' ? ['tech-react'] : argument; },
    });
    const invoke = store[method] as (argument: string) => unknown;
    expect(() => invoke.call(store, argument)).toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0);
    expectNoExtraIO();
  });

  it.each([
    { connections: 'tech-react' }, { connections: [1, 'tech-react'] },
    { connections: false }, { connections: 0 },
  ])('rejects malformed declared connections without fabricating neighbor IDs', async ({ connections }) => {
    const store = await initializedStore();
    fixture.nodes[0].connections = connections;
    expect(() => store.getNeighbors('pattern-a')).toThrow('Unsupported GraphRAG cached connections');
    expectNoExtraIO();
  });

});
