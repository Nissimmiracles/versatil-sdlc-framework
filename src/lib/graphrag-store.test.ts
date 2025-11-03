/**
 * Tests for GraphRAG Store - Knowledge Graph-based RAG
 * Tests entity extraction, graph relationships, query traversal, privacy isolation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphRAGStore, type GraphNode, type GraphEdge, type PatternNode, type GraphRAGQuery, type GraphRAGResult } from './graphrag-store.js';

describe('GraphRAGStore', () => {
  let store: GraphRAGStore;

  beforeEach(async () => {
    vi.clearAllMocks();
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
      const node: GraphNode = {
        id: 'test-node-3',
        type: 'pattern',
        label: 'To Delete',
        properties: {},
        connections: [],
      };
      await store.addNode(node);
      await store.deleteNode('test-node-3');
      const retrieved = await store.getNode('test-node-3');
      expect(retrieved).toBeUndefined();
    });

    it('should get all nodes of specific type', async () => {
      const nodes = await store.getNodesByType('pattern');
      expect(Array.isArray(nodes)).toBe(true);
      nodes.forEach(node => expect(node.type).toBe('pattern'));
    });
  });

  describe('Edge Management', () => {
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
      const edge: GraphEdge = {
        id: 'edge-3',
        source: 'node-c',
        target: 'node-d',
        relationship: 'implements',
        weight: 0.9,
      };
      await store.addEdge(edge);
      await store.deleteEdge('edge-3');
      const retrieved = await store.getEdge('edge-3');
      expect(retrieved).toBeUndefined();
    });

    it('should get all edges for a node', async () => {
      const edges = await store.getEdgesForNode('node-1');
      expect(Array.isArray(edges)).toBe(true);
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
      const entities = await store['extractEntities'](patternText);
      expect(entities).toContain('React');
      expect(entities).toContain('TypeScript');
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
        query: 'authentication',
        limit: 10,
        minRelevance: 0.5,
      };
      const results = await store.query(query);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter by agent', async () => {
      const query: GraphRAGQuery = {
        query: 'API design',
        agent: 'marcus-backend',
      };
      const results = await store.query(query);
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
        limit: 5,
      };
      const results = await store.query(query);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should respect minimum relevance score', async () => {
      const query: GraphRAGQuery = {
        query: 'testing',
        minRelevance: 0.7,
      };
      const results = await store.query(query);
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
      const query: GraphRAGQuery = { query: 'testing' };
      const results = await store.query(query);
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
        userId: 'user-123',
      };
      const results = await store.query(query);
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
        teamId: 'team-456',
      };
      const results = await store.query(query);
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
        projectId: 'project-789',
      };
      const results = await store.query(query);
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
        userId: 'user-123',
        includePublic: false,
      };
      const results = await store.query(query);
      results.forEach(result => {
        expect(result.pattern.privacy?.userId).toBe('user-123');
      });
    });

    it('should prevent cross-user pattern access', async () => {
      const query: GraphRAGQuery = {
        query: 'workflow',
        userId: 'user-999',
        includePublic: false,
      };
      const results = await store.query(query);
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
      const query: GraphRAGQuery = { query: 'caching' };
      const results1 = await store.query(query);
      const results2 = await store.query(query);
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
      const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      await store.deleteOldPatterns(cutoffDate);
      const allPatterns = await store.getNodesByType('pattern') as PatternNode[];
      allPatterns.forEach(pattern => {
        expect(pattern.properties.lastUsed.getTime()).toBeGreaterThan(cutoffDate.getTime());
      });
    });
  });
});
