/** New private stored-score convention; no PageRank, ranking change or authorization claim. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Timestamp } from '@google-cloud/firestore';
import { GraphRAGStore } from './graphrag-store.js';

const fixture = vi.hoisted(() => ({ nodes: [] as any[], requests: [] as string[], writes: 0, terminations: 0 }));
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
    async terminate() { fixture.terminations++; }
  }
  return { ...actual, Firestore: MockFirestore };
});
beforeEach(() => {
  fixture.requests.length = 0;
  fixture.writes = 0;
  fixture.terminations = 0;
  const node = (id: string, centrality?: number) => ({ id, type: 'concept', label: id,
    properties: {}, connections: [], ...(centrality === undefined ? {} : { centrality }) });
  // Insertion order is intentionally different from descending score order.
  fixture.nodes = [node('boundary', 0.7), node('high', 0.8), node('below', 0.69), node('uncomputed')];
  fixture.nodes.push({ ...node('explicit-undefined'), centrality: undefined });
  Object.assign(fixture.nodes[0], {
    properties: { nested: { flags: ['original'] }, tags: ['original'],
      date: new Date('2026-01-01T00:00:00Z'), timestamp: new Timestamp(1700000000, 123456789),
      bytes: Buffer.from([0x10, 0x20]), octets: new Uint8Array([3, 4]) },
    connections: ['high'], privacy: { userId: 'fixture-user', isPublic: false },
  });
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
  expect(fixture.terminations).toBe(0);
}

describe('GraphRAG private stored centrality view convention', () => {
  it('requires explicit initialization without fetching or writing', () => {
    const store = new GraphRAGStore();
    expect(() => store['getHighCentralityNodes'](0.7)).toThrow('GraphRAG cache is not initialized');
    expect(fixture.requests).toEqual([]);
    expect(fixture.writes).toBe(0);
    expect(fixture.terminations).toBe(0);
  });

  it('includes the exact boundary, excludes lower or uncomputed scores and preserves insertion order', async () => {
    const store = await loaded();
    expect(store['getHighCentralityNodes'](0.7).map(node => node.id)).toEqual(['boundary', 'high']);
    expect(store['initialized']).toBe(true);
    expect(fixture.nodes.map(node => node.centrality)).toEqual([0.7, 0.8, 0.69, undefined, undefined]);
    expectNoExtraIO();
  });

  it('uses the supplied threshold for different nonempty results without normalizing its finite range', async () => {
    const store = await loaded();
    expect(store['getHighCentralityNodes'](0.8).map(node => node.id)).toEqual(['high']);
    expect(store['getHighCentralityNodes'](0.69).map(node => node.id)).toEqual(['boundary', 'high', 'below']);
    expect(store['getHighCentralityNodes'](-1).map(node => node.id)).toEqual(['boundary', 'high', 'below']);
    expectNoExtraIO();
  });

  it('returns an honest empty result above the maximum with a nonempty positive control', async () => {
    const store = await loaded();
    expect(store['getHighCentralityNodes'](0.8).map(node => node.id)).toEqual(['high']);
    expect(store['getHighCentralityNodes'](1)).toEqual([]);
    expectNoExtraIO();
  });

  it.each([
    { threshold: undefined }, { threshold: NaN }, { threshold: Infinity }, { threshold: -Infinity },
    { threshold: '0.7' }, { threshold: null }, { threshold: {} }, { threshold: true },
  ])('rejects a missing, malformed or nonfinite threshold without coercion', async ({ threshold }) => {
    const store = await loaded();
    expect(() => store['getHighCentralityNodes'](threshold as number)).toThrow('GraphRAG centrality threshold must be finite');
    expectNoExtraIO();
  });

  it.each([
    { score: NaN }, { score: Infinity }, { score: -Infinity }, { score: '0.8' },
    { score: null }, { score: {} }, { score: true },
  ])('fails explicitly for a present malformed score instead of silently excluding it', async ({ score }) => {
    const store = await loaded();
    fixture.nodes[2].centrality = score;
    expect(() => store['getHighCentralityNodes'](0.7)).toThrow('GraphRAG cached centrality must be finite');
    expectNoExtraIO();
  });

  it('returns detached nested records preserving Date, Timestamp and bytes value semantics', async () => {
    const store = await loaded();
    const selected = store['getHighCentralityNodes'](0.7);
    const copy = selected[0];
    expect(copy.properties.date).toBeInstanceOf(Date);
    expect(copy.properties.timestamp).toBeInstanceOf(Timestamp);
    expect(copy.properties.timestamp.isEqual(fixture.nodes[0].properties.timestamp)).toBe(true);
    expect(copy.properties.timestamp.toMillis()).toBe(fixture.nodes[0].properties.timestamp.toMillis());
    expect(copy.properties.bytes.toString('hex')).toBe('1020');
    expect([...copy.properties.octets]).toEqual([3, 4]);
    copy.centrality = 99;
    copy.label = 'changed';
    copy.properties.nested.flags.push('changed');
    copy.properties.tags.push('changed');
    copy.properties.date.setFullYear(2000);
    (copy.properties.timestamp as any)._seconds = 0;
    (copy.properties.timestamp as any)._nanoseconds = 0;
    copy.properties.bytes[0] = 0xff;
    copy.properties.octets[0] = 99;
    copy.privacy!.userId = 'changed';
    copy.connections.push('changed');
    selected.splice(1, 1);
    const again = store['getHighCentralityNodes'](0.7);
    expect(again.map(node => node.id)).toEqual(['boundary', 'high']);
    expect(again[0].centrality).toBe(0.7);
    expect(again[0].label).toBe('boundary');
    expect(again[0].properties.nested.flags).toEqual(['original']);
    expect(again[0].properties.tags).toEqual(['original']);
    expect(again[0].properties.date.getUTCFullYear()).toBe(2026);
    expect(again[0].properties.timestamp.seconds).toBe(1700000000);
    expect(again[0].properties.timestamp.nanoseconds).toBe(123456789);
    expect(again[0].properties.bytes.toString('hex')).toBe('1020');
    expect([...again[0].properties.octets]).toEqual([3, 4]);
    expect(again[0].privacy!.userId).toBe('fixture-user');
    expect(again[0].connections).toEqual(['high']);
    expectNoExtraIO();
  });

  it('rejects a root centrality accessor before selection without invoking it', async () => {
    const store = await loaded();
    let calls = 0;
    Object.defineProperty(fixture.nodes[2], 'centrality', { get: () => { calls++; return 0; } });
    expect(() => store['getHighCentralityNodes'](0.7)).toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0);
    expectNoExtraIO();
  });

  it('validates nested data before selection even on a node below the threshold', async () => {
    const store = await loaded();
    let calls = 0;
    Object.defineProperty(fixture.nodes[2].properties, 'opaque', { get: () => { calls++; return 'hidden'; } });
    expect(() => store['getHighCentralityNodes'](0.7)).toThrow('Unsupported GraphRAG cached accessor');
    expect(calls).toBe(0);
    expectNoExtraIO();
  });

  it('rejects after clear until explicit reload, then reads the newly loaded scores', async () => {
    const store = await loaded();
    expect(store['getHighCentralityNodes'](0.7).map(node => node.id)).toEqual(['boundary', 'high']);
    store.clearCache();
    expect(() => store['getHighCentralityNodes'](0.7)).toThrow('GraphRAG cache is not initialized');
    expectNoExtraIO();
    fixture.nodes[1].centrality = 0.6;
    await store.initialize();
    expect(store['getHighCentralityNodes'](0.7).map(node => node.id)).toEqual(['boundary']);
    expect(fixture.requests).toEqual(['graphrag_nodes', 'graphrag_edges', 'graphrag_nodes', 'graphrag_edges']);
    expect(fixture.writes).toBe(0);
    expect(fixture.terminations).toBe(0);
  });
});
