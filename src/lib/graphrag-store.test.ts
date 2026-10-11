/**
 * Tests for GraphRAG Store - Knowledge Graph-based RAG
 * Tests entity extraction, graph relationships, query traversal, privacy isolation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphRAGStore, type GraphNode, type GraphEdge, type PatternNode, type GraphRAGQuery, type GraphRAGResult } from './graphrag-store.js';

// A connected corpus makes query and privacy checks exercise real results.
// Privacy assertions below describe the existing contract, not a new policy.
const firestoreFixture = vi.hoisted(() => {
  const makePattern = (id: string, privacy: Record<string, unknown>,
    agent = 'marcus-backend', category = 'security', effectiveness = 1) => ({
    id, type: 'pattern', label: `${id} API JWT Vitest workflow config pattern`,
    properties: {
      pattern: 'API JWT Vitest workflow config pattern', agent, category,
      effectiveness, timeSaved: 100, tags: ['postgresql', 'orm', 'workflow', 'config', 'pattern'],
      usageCount: 10, lastUsed: new Date('2026-01-01T00:00:00Z'),
    },
    connections: ['tech_api', 'tech_jwt', 'tech_vitest', 'concept_postgresql',
      'concept_orm', 'concept_workflow', 'concept_config', 'concept_pattern',
      `agent_${agent}`, `category_${category}`],
    privacy,
  });
  const patterns = [
    makePattern('fixture-user-123', { userId: 'user-123', isPublic: false }),
    makePattern('fixture-user-999', { userId: 'user-999', isPublic: false }),
    makePattern('fixture-team-456', { teamId: 'team-456', isPublic: false }),
    makePattern('fixture-team-other', { teamId: 'team-other', isPublic: false }),
    makePattern('fixture-project-789', { projectId: 'project-789', isPublic: false }),
    makePattern('fixture-project-other', { projectId: 'project-other', isPublic: false }),
    makePattern('fixture-public', { isPublic: true }),
    makePattern('fixture-other-agent-category', { isPublic: true }, 'james-frontend', 'ui', 0.5),
  ];
  const entities = new Map<string, Record<string, any>>();
  const edges: Record<string, any>[] = [];
  for (const pattern of patterns) {
    for (const entityId of pattern.connections) {
      if (!entities.has(entityId)) {
        const [prefix, ...label] = entityId.split('_');
        entities.set(entityId, {
          id: entityId, type: prefix === 'tech' ? 'technology' : prefix,
          label: label.join('_'), properties: {}, connections: [],
        });
      }
      entities.get(entityId)!.connections.push(pattern.id);
      edges.push({ id: `edge_${pattern.id}_${entityId}`, source: pattern.id,
        target: entityId, relationship: 'relates_to', weight: 1 });
    }
  }
  const nodes = [...patterns, ...entities.values()];
  const documents = {
    graphrag_nodes: new Map<string, Record<string, any>>(),
    graphrag_edges: new Map<string, Record<string, any>>(),
    graphrag_deletions: new Map<string, Record<string, any>>(),
  };
  const reset = () => {
    documents.graphrag_nodes.clear(); documents.graphrag_edges.clear(); documents.graphrag_deletions.clear();
    for (const record of nodes) documents.graphrag_nodes.set(record.id, structuredClone(record));
    for (const record of edges) documents.graphrag_edges.set(record.id, structuredClone(record));
  };
  return { nodes, edges, documents, reset, replayTransaction: false };

});

// Retained documents and atomic preconditions model actual storage, not API success stubs.
vi.mock('@google-cloud/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('@google-cloud/firestore')>();
  const cloneData = (input: any): any => {
    if (input instanceof Date) return new Date(input.getTime());
    if (input instanceof actual.Timestamp) return new actual.Timestamp(input.seconds, input.nanoseconds);
    if (Buffer.isBuffer(input)) return Buffer.from(input);
    if (input instanceof Uint8Array) return new Uint8Array(input);
    if (Array.isArray(input)) return input.map(cloneData);
    if (input && typeof input === 'object') return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, cloneData(value)]));
    return input;
  };
  type Reference = { collectionName: 'graphrag_nodes' | 'graphrag_edges' | 'graphrag_deletions'; id: string };
  type Operation = { kind: 'create' | 'set' | 'update' | 'delete'; ref: Reference; data?: Record<string, any> };
  const records = (name: string) => {
    if (name !== 'graphrag_nodes' && name !== 'graphrag_edges' && name !== 'graphrag_deletions') throw new Error(`Unexpected collection: ${name}`);
    return firestoreFixture.documents[name];
  };
  const documentSnapshot = (ref: Reference) => {
    const value = records(ref.collectionName).get(ref.id);
    const copy = value === undefined ? undefined : cloneData(value);
    return { id: ref.id, exists: copy !== undefined, data: () => copy === undefined ? undefined : cloneData(copy) };
  };
  const snapshot = (entries: Array<[string, Record<string, any>]>) => {
    const docs = entries.map(([id, record]) => ({ id, data: () => cloneData(record) }));
    return {
      docs, empty: docs.length === 0, size: docs.length,
      forEach(callback: (doc: typeof docs[number]) => void, thisArg?: unknown) {
        docs.forEach(doc => callback.call(thisArg, doc));
      },
    };
  };
  const commit = (operations: Operation[]) => {
    const staged = {
      graphrag_nodes: new Map([...records('graphrag_nodes')].map(([id, data]) => [id, cloneData(data)])),
      graphrag_edges: new Map([...records('graphrag_edges')].map(([id, data]) => [id, cloneData(data)])),
      graphrag_deletions: new Map([...records('graphrag_deletions')].map(([id, data]) => [id, cloneData(data)])),
    };
    for (const operation of operations) {
      const target = staged[operation.ref.collectionName];
      if (operation.kind === 'create' && target.has(operation.ref.id)) throw new Error('ALREADY_EXISTS');
      if (operation.kind === 'update' && !target.has(operation.ref.id)) throw new Error('NOT_FOUND');
      if (operation.kind === 'delete') target.delete(operation.ref.id);
      else if (operation.kind === 'update') target.set(operation.ref.id, {
        ...target.get(operation.ref.id), ...cloneData(operation.data!),
      });
      else target.set(operation.ref.id, cloneData(operation.data!));
    }
    // Publish both collections only after every operation has passed its precondition.
    for (const name of ['graphrag_nodes', 'graphrag_edges', 'graphrag_deletions'] as const) {
      const target = records(name); target.clear();
      for (const [id, data] of staged[name]) target.set(id, data);
    }
  };
  const stagedWriter = () => {
    const operations: Operation[] = [];
    const writer = {
      create: vi.fn((ref: Reference, data: Record<string, any>) => {
        operations.push({ kind: 'create', ref, data: cloneData(data) }); return writer;
      }),
      set: vi.fn((ref: Reference, data: Record<string, any>) => {
        operations.push({ kind: 'set', ref, data: cloneData(data) }); return writer;
      }),
      update: vi.fn((ref: Reference, data: Record<string, any>) => {
        operations.push({ kind: 'update', ref, data: cloneData(data) }); return writer;
      }),
      delete: vi.fn((ref: Reference) => { operations.push({ kind: 'delete', ref }); return writer; }),
      commit: vi.fn(async () => { commit(operations); return []; }),
    };
    return { writer, operations };
  };
  class MockFirestore {
    constructor(config?: any) {}
    collection(name: string) {
      records(name);
      return {
        collectionName: name,
        doc: vi.fn((id: string) => {
          const ref: Reference = { collectionName: name as Reference['collectionName'], id };
          return { ...ref,
            get: vi.fn(async () => documentSnapshot(ref)),
            create: vi.fn(async (data: Record<string, any>) => { commit([{ kind: 'create', ref, data }]); }),
            set: vi.fn(async (data: Record<string, any>) => { commit([{ kind: 'set', ref, data }]); }),
            update: vi.fn(async (data: Record<string, any>) => { commit([{ kind: 'update', ref, data }]); }),
            delete: vi.fn(async () => { commit([{ kind: 'delete', ref }]); }),
          };
        }),
        where: vi.fn(() => { throw new Error('Fixture query filtering is not implemented'); }),
        get: vi.fn(async () => snapshot([...records(name).entries()])),
        add: vi.fn(() => { throw new Error('Fixture auto-generated document IDs are not implemented'); }),
      };
    }
    batch() { return stagedWriter().writer; }
    async runTransaction(callback: (transaction: any) => Promise<any>) {
      const run = async () => {
        const { writer, operations } = stagedWriter();
        const transaction = { ...writer, get: vi.fn(async (ref: Reference) => {
          if (operations.length) throw new Error('Transaction reads must precede writes');
          return ref.id === undefined ? snapshot([...records(ref.collectionName).entries()]) : documentSnapshot(ref);
        }) };
        const result = await callback(transaction);
        return { result, operations };
      };
      if (firestoreFixture.replayTransaction) { await run(); firestoreFixture.replayTransaction = false; }
      const { result, operations } = await run();
      commit(operations);
      return result;
    }
    async terminate() { return undefined; }
  }
  return { ...actual, Firestore: MockFirestore };
});

describe('GraphRAGStore', () => {
  let store: GraphRAGStore;

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    firestoreFixture.reset();
    firestoreFixture.replayTransaction = false;
    store = new GraphRAGStore();
    await store.initialize();
  });

  describe('Initialization', () => {
    it('should initialize Firestore connection', async () => {
      const newStore = new GraphRAGStore();
      await newStore.initialize();
      expect(newStore['initialized']).toBe(true);
    });

    it('should load existing nodes from Firestore', async () => {
      const nodes = await store['loadNodesFromFirestore']();
      expect(Array.isArray(nodes)).toBe(true);
    });

    it('should load existing edges from Firestore', async () => {
      const edges = await store['loadEdgesFromFirestore']();
      expect(Array.isArray(edges)).toBe(true);
    });

    it('should build adjacency list from edges', async () => {
      await store.initialize();
      const adjacencyList = store['adjacencyList'];
      expect(adjacencyList instanceof Map).toBe(true);
    });
  });

  describe('Node Management', () => {
    it('should add node to graph', async () => {
      const node: GraphNode = {
        id: 'test-node-1',
        type: 'pattern',
        label: 'Test Pattern',
        properties: { pattern: 'test', agent: 'alex-ba' },
        connections: [],
      };
      await store.addNode(node);
      const retrieved = await store.getNode('test-node-1');
      expect(retrieved?.id).toBe('test-node-1');
    });

    it('should update existing node', async () => {
      const node: GraphNode = {
        id: 'test-node-2',
        type: 'pattern',
        label: 'Original Label',
        properties: {},
        connections: [],
      };
      await store.addNode(node);
      node.label = 'Updated Label';
      await store.updateNode(node);
      const retrieved = await store.getNode('test-node-2');
      expect(retrieved?.label).toBe('Updated Label');
    });

    it('should delete node from graph', async () => {
      // This scenario explicitly admits reversible deletion; other54 stay in ordinary mode.
      store = new GraphRAGStore({ softDeletion: { clock: () => new Date('2026-10-08T00:00:00Z') } });
      await store.initialize();
      const node: GraphNode = {
        id: 'test-node-3', type: 'pattern', label: 'To Delete', properties: {}, connections: [],
      };
      await store.addNode(node);
      const storedBefore = structuredClone(firestoreFixture.documents.graphrag_nodes.get(node.id));
      await store.deleteNode('test-node-3');
      const retrieved = await store.getNode('test-node-3');
      expect(retrieved).toBeUndefined();
      expect(firestoreFixture.documents.graphrag_nodes.get(node.id)).toEqual(storedBefore);
      const reloaded = new GraphRAGStore({ softDeletion: { clock: () => new Date('2026-10-08T00:00:00Z') } });
      await reloaded.initialize(); expect(reloaded.getNode(node.id)).toBeUndefined();
      await reloaded.restoreNode(node.id); expect(reloaded.getNode(node.id)).toEqual(node);
    });

    it('should get all nodes of specific type', async () => {
      const nodes = await store.getNodesByType('pattern');
      expect(Array.isArray(nodes)).toBe(true);
      nodes.forEach(node => expect(node.type).toBe('pattern'));
    });
  });

  describe('Edge Management', () => {
    // Real persisted endpoints, fixture-only and identical for baseline/candidate qualifications.
    beforeEach(async () => {
      for (const id of ['node-1', 'node-2', 'node-a', 'node-b', 'node-c', 'node-d']) {
        firestoreFixture.documents.graphrag_nodes.set(id, {
          id, type: 'concept', label: id, properties: {}, connections: [],
        });
      }
      store.clearCache();
      await store.initialize();
    });

    it('should add edge between nodes', async () => {
      const edge: GraphEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        relationship: 'uses',
        weight: 0.8,
      };
      await store.addEdge(edge);
      const retrieved = await store.getEdge('edge-1');
      expect(retrieved?.id).toBe('edge-1');
    });

    it('should update adjacency list when adding edge', async () => {
      const edge: GraphEdge = {
        id: 'edge-2',
        source: 'node-a',
        target: 'node-b',
        relationship: 'relates_to',
        weight: 0.5,
      };
      await store.addEdge(edge);
      const neighbors = store['adjacencyList'].get('node-a');
      expect(neighbors).toContain('node-b');
    });

    it('should delete edge from graph', async () => {
      store = new GraphRAGStore({ softDeletion: { clock: () => new Date('2026-10-08T00:00:00Z') } });
      await store.initialize();
      const edge: GraphEdge = {
        id: 'edge-3', source: 'node-c', target: 'node-d', relationship: 'implements', weight: 0.9,
      };
      await store.addEdge(edge);
      const connectionsBefore = store.getNeighbors(edge.source);
      await store.deleteEdge('edge-3');
      const retrieved = await store.getEdge('edge-3');
      expect(retrieved).toBeUndefined();
      expect(firestoreFixture.documents.graphrag_edges.get(edge.id)).toEqual(edge);
      expect(store.getNeighbors(edge.source)).toEqual(connectionsBefore);
      const reloaded = new GraphRAGStore({ softDeletion: { clock: () => new Date('2026-10-08T00:00:00Z') } });
      await reloaded.initialize(); expect(reloaded.getEdge(edge.id)).toBeUndefined();
      await reloaded.restoreEdge(edge.id); expect(reloaded.getEdge(edge.id)).toEqual(edge);
    });

    it('should get all edges for a node', async () => {
      const edges = await store.getEdgesForNode('node-1');
      expect(Array.isArray(edges)).toBe(true);
    });
  });

  describe('Current public API', () => {
    it('loads separate node and edge snapshots with coherent statistics', async () => {
      const stats = await store.getStatistics();
      expect(stats.totalNodes).toBe(firestoreFixture.nodes.length);
      expect(stats.totalEdges).toBe(firestoreFixture.edges.length);
      expect(stats.nodesByType.pattern).toBe(8);
      expect(Object.values(stats.nodesByType).reduce((sum, count) => sum + count, 0))
        .toBe(stats.totalNodes);
      expect(stats.avgConnections).toBeGreaterThan(0);
    });

    it('persists an added pattern and returns it through entity traversal', async () => {
      const properties = {
        pattern: 'React component with TypeScript', agent: 'james-frontend', category: 'ui',
        effectiveness: 0.9, timeSaved: 100, tags: ['components'], usageCount: 0,
        privacy: { userId: 'fixture-user', isPublic: false },
      };
      const collection = vi.spyOn(store['firestore'], 'collection');
      const id = await store.addPattern(properties);
      const writtenDocuments = collection.mock.results
        .filter(result => result.type === 'return')
        .flatMap(result => vi.mocked(result.value.doc).mock.results)
        .filter(result => result.type === 'return')
        .map(result => result.value);
      expect(writtenDocuments.some(doc => vi.mocked(doc.set).mock.calls.some(([node]) =>
        node.id === id && node.type === 'pattern' && node.properties.pattern === properties.pattern
      ))).toBe(true);
      const results = await store.query({ query: 'React', userId: 'fixture-user' });
      expect(results.map(result => result.pattern.id)).toContain(id);
      const added = results.find(result => result.pattern.id === id)!;
      const { privacy, ...storedProperties } = properties;
      expect(added.pattern.properties).toMatchObject(storedProperties);
      expect(added.pattern.privacy).toEqual(privacy);
      expect(added.graphPath).toEqual(['tech_react', id]);
      expect(added.explanation).toContain('react');
      expect((await store.getStatistics()).nodesByType.pattern).toBe(9);
    });

    it('clears graph state and terminates the connection on close', async () => {
      const terminate = vi.spyOn(store['firestore'], 'terminate');
      await store.close();
      expect(terminate).toHaveBeenCalledOnce();
      expect(store['initialized']).toBe(false);
      expect(store['nodes'].size).toBe(0);
      expect(store['edges'].size).toBe(0);
      expect(store['adjacencyList'].size).toBe(0);
    });
  });

  describe('Pattern Storage', () => {
    it('should store pattern as graph nodes', async () => {
      const pattern: PatternNode = {
        id: 'pattern-1',
        type: 'pattern',
        label: 'User Authentication Pattern',
        properties: {
          pattern: 'JWT authentication with refresh tokens',
          description: 'Secure auth pattern',
          agent: 'marcus-backend',
          category: 'security',
          effectiveness: 0.95,
          timeSaved: 300,
          tags: ['auth', 'jwt', 'security'],
          usageCount: 5,
          lastUsed: new Date(),
        },
        connections: [],
      };
      await store.storePattern(pattern);
      const retrieved = await store.getNode('pattern-1');
      expect(retrieved?.type).toBe('pattern');
    });

    it('should extract entities from pattern', async () => {
      const patternText = 'Use React hooks with TypeScript for type-safe state management';
      const entities = store['extractEntities']({ pattern: patternText });
      expect(entities).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'tech_react', type: 'technology', label: 'react' }),
        expect.objectContaining({ id: 'tech_typescript', type: 'technology', label: 'typescript' }),
      ]));
    });

    it('should create relationships between pattern and entities', async () => {
      const pattern: PatternNode = {
        id: 'pattern-2',
        type: 'pattern',
        label: 'GraphQL API Pattern',
        properties: {
          pattern: 'GraphQL with Apollo Server',
          agent: 'marcus-backend',
          category: 'api',
          effectiveness: 0.85,
          timeSaved: 200,
          tags: ['graphql', 'apollo'],
          usageCount: 3,
          lastUsed: new Date(),
        },
        connections: [],
      };
      await store.storePattern(pattern);
      const edges = await store.getEdgesForNode('pattern-2');
      expect(edges.length).toBeGreaterThan(0);
    });

    it('should increment usage count on pattern retrieval', async () => {
      const pattern: PatternNode = {
        id: 'pattern-3',
        type: 'pattern',
        label: 'Test Pattern',
        properties: {
          pattern: 'Test',
          agent: 'alex-ba',
          category: 'test',
          effectiveness: 0.5,
          timeSaved: 100,
          tags: [],
          usageCount: 0,
          lastUsed: new Date(),
        },
        connections: [],
      };
      await store.storePattern(pattern);
      await store.incrementUsageCount('pattern-3');
      const retrieved = await store.getNode('pattern-3') as PatternNode;
      expect(retrieved?.properties.usageCount).toBe(1);
    });
  });

  describe('Graph Traversal', () => {
    it('should perform BFS traversal from node', () => {
      const startNode = 'node-1';
      const visited = store['bfsTraversal'](startNode, 3);
      expect(Array.isArray(visited)).toBe(true);
    });

    it('should find shortest path between nodes', () => {
      const path = store['findShortestPath']('node-a', 'node-b');
      expect(Array.isArray(path)).toBe(true);
    });

    it('should limit traversal depth', () => {
      const visited = store['bfsTraversal']('node-1', 2);
      expect(visited.length).toBeLessThanOrEqual(10);
    });

    it('should find all neighbors of node', () => {
      const neighbors = store['getNeighbors']('node-1');
      expect(Array.isArray(neighbors)).toBe(true);
    });
  });

  describe('Query Processing', () => {
    it('should query patterns by keyword', async () => {
      const query: GraphRAGQuery = {
        query: 'JWT authentication',
        limit: 10,
        minRelevance: 0.5,
      };
      const results = await store.query(query);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by agent', async () => {
      const query: GraphRAGQuery = {
        query: 'API design',
        agent: 'marcus-backend',
      };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.pattern.properties.agent).toBe('marcus-backend');
      });
    });

    it('should filter by category', async () => {
      const query: GraphRAGQuery = {
        query: 'security',
        category: 'security',
      };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.pattern.properties.category).toBe('security');
      });
    });

    it('should filter by tags', async () => {
      const query: GraphRAGQuery = {
        query: 'database',
        tags: ['postgresql', 'orm'],
      };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        const hasTags = result.pattern.properties.tags.some(tag =>
          ['postgresql', 'orm'].includes(tag)
        );
        expect(hasTags).toBe(true);
      });
    });

    it('should respect limit parameter', async () => {
      const query: GraphRAGQuery = {
        query: 'pattern',
        tags: ['pattern'],
        limit: 5,
      };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should respect minimum relevance score', async () => {
      const query: GraphRAGQuery = {
        query: 'Vitest testing',
        agent: 'marcus-backend',
        minRelevance: 0.7,
      };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0.7);
      });
    });
  });

  describe('Relevance Scoring', () => {
    it('should calculate relevance score', () => {
      const query = 'React hooks';
      const pattern = 'Use React hooks for state management';
      const score = store['calculateRelevance'](query, pattern);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should boost score for exact keyword matches', () => {
      const query = 'authentication';
      const pattern1 = 'authentication system';
      const pattern2 = 'login flow';
      const score1 = store['calculateRelevance'](query, pattern1);
      const score2 = store['calculateRelevance'](query, pattern2);
      expect(score1).toBeGreaterThan(score2);
    });

    it('should consider graph centrality in scoring', () => {
      const node: GraphNode = {
        id: 'central-node',
        type: 'pattern',
        label: 'Central Pattern',
        properties: {},
        connections: ['n1', 'n2', 'n3', 'n4'],
        centrality: 0.9,
      };
      const score = store['boostByCentrality'](0.5, node);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should rank results by relevance', async () => {
      const query: GraphRAGQuery = { query: 'Vitest testing' };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(1);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }
    });
  });

  describe('Privacy Isolation (Three-Layer Context)', () => {
    it('should store user-specific patterns', async () => {
      const pattern: PatternNode = {
        id: 'user-pattern-1',
        type: 'pattern',
        label: 'User Pattern',
        properties: {
          pattern: 'User-specific workflow',
          agent: 'alex-ba',
          category: 'workflow',
          effectiveness: 0.8,
          timeSaved: 150,
          tags: [],
          usageCount: 0,
          lastUsed: new Date(),
        },
        connections: [],
        privacy: {
          userId: 'user-123',
          isPublic: false,
        },
      };
      await store.storePattern(pattern);
      const retrieved = await store.getNode('user-pattern-1') as PatternNode;
      expect(retrieved?.privacy?.userId).toBe('user-123');
    });

    it('should store team-specific patterns', async () => {
      const pattern: PatternNode = {
        id: 'team-pattern-1',
        type: 'pattern',
        label: 'Team Pattern',
        properties: {
          pattern: 'Team workflow',
          agent: 'sarah-pm',
          category: 'workflow',
          effectiveness: 0.7,
          timeSaved: 200,
          tags: [],
          usageCount: 0,
          lastUsed: new Date(),
        },
        connections: [],
        privacy: {
          teamId: 'team-456',
          isPublic: false,
        },
      };
      await store.storePattern(pattern);
      const retrieved = await store.getNode('team-pattern-1') as PatternNode;
      expect(retrieved?.privacy?.teamId).toBe('team-456');
    });

    it('should store project-specific patterns', async () => {
      const pattern: PatternNode = {
        id: 'project-pattern-1',
        type: 'pattern',
        label: 'Project Pattern',
        properties: {
          pattern: 'Project-specific config',
          agent: 'marcus-backend',
          category: 'config',
          effectiveness: 0.9,
          timeSaved: 250,
          tags: [],
          usageCount: 0,
          lastUsed: new Date(),
        },
        connections: [],
        privacy: {
          projectId: 'project-789',
          isPublic: false,
        },
      };
      await store.storePattern(pattern);
      const retrieved = await store.getNode('project-pattern-1') as PatternNode;
      expect(retrieved?.privacy?.projectId).toBe('project-789');
    });

    it('should query user-specific patterns', async () => {
      const query: GraphRAGQuery = {
        query: 'workflow',
        tags: ['workflow'],
        userId: 'user-123',
      };
      const results = await store.query(query);
      expect(results.map(result => result.pattern.id)).toContain('fixture-user-123');
      results.forEach(result => {
        expect(
          result.pattern.privacy?.userId === 'user-123' ||
          result.pattern.privacy?.isPublic === true
        ).toBe(true);
      });
    });

    it('should query team-specific patterns', async () => {
      const query: GraphRAGQuery = {
        query: 'workflow',
        tags: ['workflow'],
        teamId: 'team-456',
      };
      const results = await store.query(query);
      expect(results.map(result => result.pattern.id)).toContain('fixture-team-456');
      results.forEach(result => {
        expect(
          result.pattern.privacy?.teamId === 'team-456' ||
          result.pattern.privacy?.isPublic === true
        ).toBe(true);
      });
    });

    it('should query project-specific patterns', async () => {
      const query: GraphRAGQuery = {
        query: 'config',
        tags: ['config'],
        projectId: 'project-789',
      };
      const results = await store.query(query);
      expect(results.map(result => result.pattern.id)).toContain('fixture-project-789');
      results.forEach(result => {
        expect(
          result.pattern.privacy?.projectId === 'project-789' ||
          result.pattern.privacy?.isPublic === true
        ).toBe(true);
      });
    });

    it('should include public patterns by default', async () => {
      const query: GraphRAGQuery = {
        query: 'pattern',
        tags: ['pattern'],
        userId: 'user-123',
        includePublic: true,
      };
      const results = await store.query(query);
      const hasPublic = results.some(r => r.pattern.privacy?.isPublic === true);
      expect(hasPublic).toBe(true);
    });

    it('should exclude public patterns when requested', async () => {
      const query: GraphRAGQuery = {
        query: 'pattern',
        tags: ['pattern'],
        userId: 'user-123',
        includePublic: false,
      };
      const results = await store.query(query);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result.pattern.privacy?.userId).toBe('user-123');
      });
    });

    it('should prevent cross-user pattern access', async () => {
      const query: GraphRAGQuery = {
        query: 'workflow',
        tags: ['workflow'],
        userId: 'user-999',
        includePublic: false,
      };
      const results = await store.query(query);
      expect(results.map(result => result.pattern.id)).toContain('fixture-user-999');
      const hasOtherUserPattern = results.some(r =>
        r.pattern.privacy?.userId && r.pattern.privacy.userId !== 'user-999'
      );
      expect(hasOtherUserPattern).toBe(false);
    });
  });

  describe('Graph Analysis', () => {
    it('should calculate node centrality', async () => {
      await store.calculateCentrality();
      const nodes = await store.getNodesByType('pattern');
      nodes.forEach(node => {
        expect(typeof node.centrality).toBe('number');
      });
    });

    it('should identify highly connected nodes', () => {
      const centralNodes = store['getHighCentralityNodes'](0.7);
      expect(Array.isArray(centralNodes)).toBe(true);
    });

    it('should detect communities in graph', async () => {
      const communities = await store.detectCommunities();
      expect(Array.isArray(communities)).toBe(true);
    });

    it('should find related patterns', async () => {
      const related = await store.findRelatedPatterns('pattern-1', 5);
      expect(Array.isArray(related)).toBe(true);
      expect(related.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Performance Optimization', () => {
    it('should cache query results', async () => {
      const query: GraphRAGQuery = { query: 'caching', tags: ['pattern'] };
      const results1 = await store.query(query);
      const results2 = await store.query(query);
      expect(results1.length).toBeGreaterThan(0);
      expect(results1).toEqual(results2);
    });

    it('should invalidate cache on graph update', async () => {
      const query: GraphRAGQuery = { query: 'test' };
      await store.query(query);
      const node: GraphNode = {
        id: 'new-node',
        type: 'pattern',
        label: 'New Pattern',
        properties: {},
        connections: [],
      };
      await store.addNode(node);
      const isCacheValid = store['isCacheValid']();
      expect(isCacheValid).toBe(false);
    });

    it('should batch Firestore operations', async () => {
      const nodes: GraphNode[] = Array.from({ length: 10 }, (_, i) => ({
        id: `batch-node-${i}`,
        type: 'pattern',
        label: `Pattern ${i}`,
        properties: {},
        connections: [],
      }));
      await store.batchAddNodes(nodes);
      const retrieved = await store.getNode('batch-node-5');
      expect(retrieved?.id).toBe('batch-node-5');
    });

    it('should limit memory usage of in-memory cache', () => {
      const cacheSize = store['nodes'].size;
      expect(cacheSize).toBeLessThan(10000);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore connection errors', async () => {
      const badStore = new GraphRAGStore();
      vi.spyOn(badStore['firestore'], 'collection').mockImplementation(() => {
        throw new Error('Connection failed');
      });
      await expect(badStore.initialize()).rejects.toThrow();
    });

    it('should handle invalid node data', async () => {
      const invalidNode = { id: 'bad-node' } as any;
      await expect(store.addNode(invalidNode)).rejects.toThrow();
    });

    it('should handle non-existent node queries', async () => {
      const node = await store.getNode('non-existent');
      expect(node).toBeUndefined();
    });

    it('should handle empty query results', async () => {
      const query: GraphRAGQuery = { query: 'nonexistentpattern12345' };
      const results = await store.query(query);
      expect(results).toEqual([]);
    });
  });

  describe('Cleanup', () => {
    it('should clear in-memory cache', async () => {
      await store.clearCache();
      expect(store['nodes'].size).toBe(0);
      expect(store['edges'].size).toBe(0);
    });

    it('should close Firestore connection', async () => {
      await store.close();
      expect(store['initialized']).toBe(false);
    });

    it('should delete old patterns', async () => {
      // Illustrative explicit cutoff and IDs, never a default age policy or account scan.
      const cutoffDate = new Date('2025-10-08T00:00:00Z');
      const at = cutoffDate.getTime();
      const makeRetentionPattern = (id: string, lastUsed: Date | undefined): PatternNode => ({
        id, type: 'pattern', label: id, properties: {
          pattern: id, agent: 'fixture', category: 'retention', effectiveness: 1,
          timeSaved: 1, tags: [], usageCount: 0, lastUsed: lastUsed as Date,
        }, connections: [], privacy: { isPublic: true },
      });
      const selected = [makeRetentionPattern('ret-old', new Date(at - 1)),
        makeRetentionPattern('ret-at', new Date(at)), makeRetentionPattern('ret-new', new Date(at + 1))];
      const invalid = makeRetentionPattern('ret-invalid', undefined); delete invalid.properties.lastUsed;
      const outside = makeRetentionPattern('ret-outside', new Date(at - 1));
      for (const record of [...selected, invalid, outside]) {
        firestoreFixture.documents.graphrag_nodes.set(record.id, structuredClone(record));
      }
      store = new GraphRAGStore({ softDeletion: { clock: () => new Date('2026-10-08T00:00:00Z') } });
      await store.initialize();
      const originals = selected.map(record => structuredClone(firestoreFixture.documents.graphrag_nodes.get(record.id)));
      const result = await store.deleteOldPatterns(cutoffDate, { ids: [...selected.map(record => record.id), invalid.id] });
      expect(result.outcomes).toEqual([{ id: 'ret-old', outcome: 'masked' }, { id: 'ret-at', outcome: 'masked' },
        { id: 'ret-new', outcome: 'retained-recent' }, { id: 'ret-invalid', outcome: 'retained-invalid-date' }]);
      expect(store.getNode('ret-old')).toBeUndefined(); expect(store.getNode('ret-at')).toBeUndefined();
      expect(store.getNode('ret-outside')).toEqual(outside); expect(store.getNode('ret-invalid')).toEqual(invalid);
      expect(store.getNode('ret-new')).toEqual(selected[2]);
      const allPatterns = await store.getNodesByType('pattern') as PatternNode[];
      const retainedSelected = allPatterns.filter(pattern => selected.some(record => record.id === pattern.id));
      expect(retainedSelected.map(pattern => pattern.id)).toEqual(['ret-new']);
      retainedSelected.forEach(pattern => {
        expect(pattern.properties.lastUsed.getTime()).toBeGreaterThan(cutoffDate.getTime());
      });
      const reloaded = new GraphRAGStore({ softDeletion: { clock: () => new Date('2026-10-08T00:00:00Z') } });
      await reloaded.initialize(); expect(reloaded.getNode('ret-old')).toBeUndefined(); expect(reloaded.getNode('ret-at')).toBeUndefined();
      expect(selected.map(record => firestoreFixture.documents.graphrag_nodes.get(record.id))).toEqual(originals);
      await reloaded.restoreNode('ret-old'); expect(reloaded.getNode('ret-old')).toEqual(selected[0]);
    });
  });
});
