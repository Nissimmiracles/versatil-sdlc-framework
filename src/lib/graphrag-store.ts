/**
 * GraphRAG Store - Knowledge Graph-based RAG
 * ✅ NO EMBEDDINGS REQUIRED - Uses entity extraction + graph relationships
 *
 * Benefits over Vector RAG:
 * - No API quota limits
 * - Better semantic understanding via relationships
 * - Explainable results (shows graph paths)
 * - Works offline (no external API calls)
 *
 * Implementation:
 * - Extract entities (agents, technologies, concepts) from patterns
 * - Build knowledge graph with relationships
 * - Query via graph traversal (BFS/DFS)
 * - Rank by graph centrality + path similarity
 */

import { EventEmitter } from 'events';
import { createHash } from 'node:crypto';
import type { Transaction } from '@google-cloud/firestore';
import { Firestore } from '@google-cloud/firestore';
import { Timestamp } from '@google-cloud/firestore/build/src/timestamp.js';
import { validateDocumentData } from '@google-cloud/firestore/build/src/write-batch.js';
import { Serializer } from '@google-cloud/firestore/build/src/serializer.js';

// Graph Node Types
export type NodeType = 'pattern' | 'agent' | 'technology' | 'concept' | 'category';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, any>;
  connections: string[];  // IDs of connected nodes
  centrality?: number;    // PageRank-style centrality score
  privacy?: {             // NEW: Privacy isolation for three-layer context
    userId?: string;      // Pattern belongs to specific user (private)
    teamId?: string;      // Pattern belongs to specific team (shared within team)
    projectId?: string;   // Pattern belongs to specific project (shared within project)
    isPublic: boolean;    // Pattern is framework-level (accessible to all)
  };
}

export interface GraphEdge {
  id: string;
  source: string;  // Node ID
  target: string;  // Node ID
  relationship: string;  // e.g., "uses", "relates_to", "implements"
  weight: number;  // Strength of relationship (0-1)
}

export interface PatternNode extends GraphNode {
  type: 'pattern';
  properties: {
    pattern: string;
    description?: string;
    code?: string;
    examples?: string[];  // Pattern usage examples
    agent: string;
    category: string;
    effectiveness: number;
    timeSaved: number;
    tags: string[];
    usageCount: number;
    lastUsed: Date;
  };
}

export interface GraphRAGQuery {
  query: string;
  limit?: number;
  minRelevance?: number;
  agent?: string;
  category?: string;
  tags?: string[];
  // NEW: Privacy filtering for three-layer context
  userId?: string;      // Query user-specific patterns
  teamId?: string;      // Query team-specific patterns
  projectId?: string;   // Query project-specific patterns
  includePublic?: boolean; // Include framework-level patterns (default: true)
}

export interface GraphRAGResult {
  pattern: PatternNode;
  relevanceScore: number;
  graphPath: string[];  // Path through graph that led to this result
  explanation: string;  // Human-readable explanation of why this matched
}

/**
 * GraphRAG Store using Firestore for persistence
 */
export interface SoftDeletionMarker {
  schemaVersion: 1; kind: 'node' | 'edge'; id: string; active: boolean;
  deletedAt: Timestamp; restoreUntil: Timestamp;
}
export interface SoftDeletionPlan {
  schemaVersion: 1; kind: 'node' | 'edge'; ids: string[]; cutoffMs?: number; createdAt: number;
  fingerprint: string;
  targets: Array<{ id: string; original: GraphNode | GraphEdge | null; marker: SoftDeletionMarker | null; outcome: string }>;
  warnings: string[];
}
export interface SoftDeletionResult {
  outcomes: Array<{ id: string; outcome: string }>; warnings: string[];
  acceptedAt: number; restoreUntil?: number;
}

export interface SoftDeletedTarget {
  kind: 'node' | 'edge'; id: string; label: string;
  deletedAt: string; restorationGuaranteedUntil: string; originalAvailable: boolean;
  relatedMaskedEdgeIds?: string[]; maskedEndpointIds?: string[];
}
export interface GraphRAGStoreOptions {
  softDeletion?: { clock?: () => Date };
  storage?: { projectId: string; databaseId: string };
}

export class GraphRAGStore extends EventEmitter {
  private firestore: Firestore;
  private projectId: string;
  private nodesCollection = 'graphrag_nodes';
  private edgesCollection = 'graphrag_edges';
  private initialized = false;

  // Local serializer for this new node-writer family only, not the older mutation paths.
  private nodeWriteTail: Promise<void> = Promise.resolve();

  // Local result memoization only; not backend freshness, authorization, or a graph read lock.
  private graphRevision = 0n;
  private outstandingGraphMutations = 0;
  private memoizationDisabled = false;
  private queryResultBytes = 0;
  private queryResults = new Map<string, { revision: bigint; result: GraphRAGResult[]; bytes: number }>();

  // In-memory graph cache for fast traversal
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();

  private readonly softMode: boolean;
  private readonly softClock: () => Date;
  private readonly deletionCollection = 'graphrag_deletions';
  private rawNodes = new Map<string, GraphNode>();
  private rawEdges = new Map<string, GraphEdge>();
  private deletions = new Map<string, SoftDeletionMarker>();
  private softProjectionReady = false;

  private deletionKey(kind: 'node' | 'edge', id: string): string {
    this.validateNodeDocumentId(id);
    const key = `${kind}_${id}`;
    this.validateNodeDocumentId(key);
    return key;
  }

  private softNow(): number {
    const date = this.softClock();
    if (!(date instanceof Date) || !Number.isSafeInteger(Date.prototype.getTime.call(date))) throw new Error('Invalid GraphRAG deletion clock');
    return Date.prototype.getTime.call(date);
  }

  private requireSoftMode(): void {
    if (!this.softMode) throw new Error('GraphRAG soft deletion mode is not admitted');
  }

  private parseDeletion(input: unknown, key: string): SoftDeletionMarker {
    const marker = this.cloneCachedValue(input) as SoftDeletionMarker;
    if (!marker || typeof marker !== 'object' || Array.isArray(marker) ||
        marker.schemaVersion !== 1 || !['node', 'edge'].includes(marker.kind) ||
        this.deletionKey(marker.kind, marker.id) !== key || typeof marker.active !== 'boolean' ||
        Object.keys(marker).some(field => !['schemaVersion', 'kind', 'id', 'active', 'deletedAt', 'restoreUntil'].includes(field)) ||
        !(marker.deletedAt instanceof Timestamp) || !(marker.restoreUntil instanceof Timestamp)) {
      throw new Error('Invalid GraphRAG deletion marker');
    }
    const deletedAt = marker.deletedAt.toMillis();
    const restoreUntil = marker.restoreUntil.toMillis();
    if (!Number.isSafeInteger(deletedAt) || restoreUntil - deletedAt !== 30 * 86400000) {
      throw new Error('Invalid GraphRAG restoration window');
    }
    this.validateNodeWriteData(marker);
    return marker;
  }

  private isMasked(kind: 'node' | 'edge', id: string): boolean {
    return this.deletions.get(this.deletionKey(kind, id))?.active === true;
  }

  private publishSoftProjection(): void {
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    const adjacency = new Map<string, string[]>();
    for (const [id, original] of this.rawNodes) {
      if (this.isMasked('node', id)) continue;
      const node = this.cloneCachedValue(original);
      if (!Array.isArray(node.connections)) throw new Error('Invalid GraphRAG projected connections');
      node.connections = node.connections.filter(target => !this.isMasked('node', target));
      nodes.set(id, node);
      adjacency.set(id, [...node.connections]);
    }
    for (const [id, original] of this.rawEdges) {
      if (this.isMasked('edge', id) || this.isMasked('node', original.source) || this.isMasked('node', original.target)) continue;
      edges.set(id, this.cloneCachedValue(original));
    }
    this.nodes = nodes;
    this.edges = edges;
    this.adjacencyList = adjacency;
    this.softProjectionReady = true;
  }

  // Read structural data faithfully; do not impose writer privacy schema on persisted retrieval metadata.
  private prepareLoadedNode(input: GraphNode): GraphNode {
    const node = this.cloneCachedValue(input);
    if (!node || typeof node !== 'object' || Array.isArray(node) ||
        !['pattern', 'agent', 'technology', 'concept', 'category'].includes(node.type) ||
        typeof node.label !== 'string' || !node.properties || typeof node.properties !== 'object' ||
        Array.isArray(node.properties) || ![Object.prototype, null].includes(Object.getPrototypeOf(node.properties)) ||
        !Array.isArray(node.connections)) throw new Error('Invalid GraphRAG persisted node structure');
    this.validateNodeDocumentId(node.id);
    for (const id of node.connections) this.validateNodeDocumentId(id);
    return node;
  }

  private async loadSoftGraph(): Promise<void> {
    this.beginGraphMutation();
    this.softProjectionReady = false;
    const revision = this.graphRevision;
    try {
      const loaded = await this.firestore.runTransaction(async transaction => {
        const nodeSnapshot = await transaction.get(this.firestore.collection(this.nodesCollection));
        const edgeSnapshot = await transaction.get(this.firestore.collection(this.edgesCollection));
        const deletionSnapshot = await transaction.get(this.firestore.collection(this.deletionCollection));
        const nodes = new Map<string, GraphNode>();
        const edges = new Map<string, GraphEdge>();
        const deletions = new Map<string, SoftDeletionMarker>();
        if (nodeSnapshot.size > 10000 || edgeSnapshot.size > 10000 || deletionSnapshot.size > 10000) throw new Error('GraphRAG deletion load budget exceeded');
        nodeSnapshot.forEach(doc => {
          const node = this.prepareLoadedNode(doc.data() as GraphNode);
          if (node.id !== doc.id) throw new Error('GraphRAG persisted node ID mismatch');
          nodes.set(doc.id, node);
        });
        edgeSnapshot.forEach(doc => {
          const edge = this.cloneCachedValue(doc.data()) as GraphEdge;
          if (!edge || edge.id !== doc.id) throw new Error('GraphRAG persisted edge ID mismatch');
          this.validateNodeDocumentId(edge.id);
          this.validateNodeDocumentId(edge.source);
          this.validateNodeDocumentId(edge.target);
          this.validateNodeWriteData(edge);
          edges.set(doc.id, edge);
        });
        deletionSnapshot.forEach(doc => deletions.set(doc.id, this.parseDeletion(doc.data(), doc.id)));
        return { nodes, edges, deletions };
      });
      if (this.graphRevision !== revision) throw new Error('GraphRAG deletion reload was superseded');
      this.rawNodes = loaded.nodes;
      this.rawEdges = loaded.edges;
      this.deletions = loaded.deletions;
      this.publishSoftProjection();
    } catch (error) {
      this.softProjectionReady = false;
      this.initialized = false;
      this.softProjectionReady = false; this.rawNodes.clear(); this.rawEdges.clear(); this.deletions.clear();
      this.nodes.clear(); this.edges.clear(); this.adjacencyList.clear();
      this.disableQueryMemoization();
      throw error;
    } finally {
      this.endGraphMutation();
    }
  }

  private async assertUnmasked(transaction: Transaction, targets: Array<{ kind: 'node' | 'edge'; id: string }>): Promise<void> {
    if (!this.softMode) return;
    const seen = new Set<string>();
    for (const target of targets) {
      const key = this.deletionKey(target.kind, target.id);
      if (seen.has(key)) continue;
      seen.add(key);
      const snapshot = await transaction.get(this.firestore.collection(this.deletionCollection).doc(key));
      if (snapshot.exists && this.parseDeletion(snapshot.data(), key).active) throw new Error('GraphRAG write target is soft deleted');
    }
  }

  private deletionEncoding(value: unknown): string {
    const ancestors = new WeakSet<object>();
    const canonical = (item: any): any => {
      if (item === undefined) return ['Undefined'];
      if (item === null) return ['Null'];
      if (typeof item === 'string') return ['String', item];
      if (typeof item === 'boolean') return ['Boolean', item];
      if (typeof item === 'number') return ['Number', Object.is(item, -0) ? '-0' : String(item)];
      if (typeof item !== 'object') throw new Error('Unsupported GraphRAG deletion fingerprint value');
      if (item instanceof Date) return ['Date', String(Date.prototype.getTime.call(item))];
      if (item instanceof Timestamp) return ['Timestamp', item.seconds, item.nanoseconds];
      if (Buffer.isBuffer(item)) return ['Buffer', item.toString('base64')];
      if (item instanceof Uint8Array) return ['Uint8Array', Buffer.from(item).toString('base64')];
      if (ancestors.has(item)) throw new Error('Cyclic GraphRAG deletion fingerprint value');
      ancestors.add(item);
      try {
        if (Reflect.ownKeys(item).some(key => typeof key !== 'string')) throw new Error('Unsupported GraphRAG deletion fingerprint key');
        if (Array.isArray(item)) return ['Array', Array.from({ length: item.length }, (_, index) => Object.prototype.hasOwnProperty.call(item, index) ? canonical(item[index]) : ['Hole'])];
        return ['Object', Object.getPrototypeOf(item) === null ? 'null-prototype' : 'plain', Object.keys(item).sort().map(key => [key, canonical(item[key])])];
      } finally { ancestors.delete(item); }
    };
    return JSON.stringify(canonical(this.cloneCachedValue(value)));
  }

  private deletionFingerprint(value: unknown): string {
    return createHash('sha256').update(this.deletionEncoding(value)).digest('hex');
  }

  private normalizeDeletionDate(value: unknown): number | undefined {
    const result = value instanceof Date ? value.getTime() : value instanceof Timestamp ? value.toMillis() : NaN;
    return Number.isSafeInteger(result) ? result : undefined;
  }

  private validateDeletionRequest(kind: 'node' | 'edge', ids: string[], cutoff?: Date): string[] {
    this.requireSoftMode();
    if (!['node', 'edge'].includes(kind) || !Array.isArray(ids) || ids.length === 0 || ids.length > 100) throw new Error('GraphRAG explicit deletion IDs required, bounded to 100');
    const copied = this.cloneCachedValue(ids);
    for (const id of copied) this.deletionKey(kind, id);
    if (cutoff !== undefined && (!(cutoff instanceof Date) || !Number.isSafeInteger(cutoff.getTime()))) throw new Error('Invalid GraphRAG deletion cutoff');
    return [...new Set(copied)];
  }

  private async inspectDeletionTargets(transaction: Transaction, kind: 'node' | 'edge', ids: string[], cutoff?: number) {
    const targets: Array<{ id: string; original: GraphNode | GraphEdge | null; marker: SoftDeletionMarker | null; outcome: string }> = [];
    for (const id of ids) {
      const key = this.deletionKey(kind, id);
      const ref = this.firestore.collection(kind === 'node' ? this.nodesCollection : this.edgesCollection).doc(id);
      const snapshot = await transaction.get(ref);
      const markerSnapshot = await transaction.get(this.firestore.collection(this.deletionCollection).doc(key));
      const original = snapshot.exists ? this.cloneCachedValue(snapshot.data()) as GraphNode | GraphEdge : null;
      const marker = markerSnapshot.exists ? this.parseDeletion(markerSnapshot.data(), key) : null;
      if (snapshot.exists && !original) throw new Error('Invalid GraphRAG deletion target data');
      if (original && original.id !== id) throw new Error('GraphRAG deletion target ID mismatch');
      if (original && kind === 'node') this.prepareLoadedNode(original as GraphNode);
      let outcome = !original ? 'absent' : marker?.active ? 'already-masked' : 'eligible';
      if (outcome === 'eligible' && cutoff !== undefined) {
        const node = original as GraphNode;
        const date = this.normalizeDeletionDate(node.properties?.lastUsed);
        outcome = node.type !== 'pattern' ? 'retained-non-pattern' : date === undefined ? 'retained-invalid-date' : date > cutoff ? 'retained-recent' : 'eligible';
      }
      targets.push({ id, original, marker, outcome });
    }
    return targets;
  }

  async planSoftDeletion(input: { kind: 'node' | 'edge'; id: string }): Promise<SoftDeletionPlan> {
    const request = this.cloneCachedValue(input);
    return this.planDeletion(request.kind, [request.id]);
  }

  async planOldPatterns(input: { cutoff: Date; ids: string[] }): Promise<SoftDeletionPlan> {
    const request = this.cloneCachedValue(input);
    return this.planDeletion('node', request.ids, request.cutoff);
  }

  private async planDeletion(kind: 'node' | 'edge', inputIds: string[], cutoff?: Date): Promise<SoftDeletionPlan> {
    const ids = this.validateDeletionRequest(kind, inputIds, cutoff);
    const createdAt = this.softNow();
    const cutoffMs = cutoff?.getTime();
    const targets = await this.firestore.runTransaction(transaction => this.inspectDeletionTargets(transaction, kind, ids, cutoffMs));
    if (targets.reduce((sum, target) => sum + (target.original ? Buffer.byteLength(this.deletionEncoding(target.original)) : 0) + (target.marker ? this.nodeWriteDataSize(target.marker) : 0), 0) > 1024 * 1024) throw new Error('GraphRAG deletion plan size budget exceeded');
    return this.cloneCachedValue({ schemaVersion: 1, kind, ids, ...(cutoffMs !== undefined ? { cutoffMs } : {}), createdAt,
      fingerprint: this.deletionFingerprint(targets), targets,
      warnings: kind === 'edge' ? ['connectionOwnershipUnknown: declared traversal connections are preserved'] : [] } as SoftDeletionPlan);
  }

  async applySoftDeletion(input: SoftDeletionPlan): Promise<SoftDeletionResult> {
    const plan = this.cloneCachedValue(input);
    const ids = this.validateDeletionRequest(plan.kind, plan.ids, plan.cutoffMs === undefined ? undefined : new Date(plan.cutoffMs));
    const acceptedAt = this.softNow();
    if (plan.schemaVersion !== 1 || !Number.isSafeInteger(plan.createdAt) || acceptedAt < plan.createdAt || acceptedAt - plan.createdAt > 60000 || typeof plan.fingerprint !== 'string') throw new Error('GraphRAG deletion preview is stale or invalid');
    // Local preview admission TTL of 60s; restoration begins at acceptedAt, never at preview creation.
    const restoreUntil = acceptedAt + 30 * 86400000;
    const now = Timestamp.fromMillis(acceptedAt); const until = Timestamp.fromMillis(restoreUntil);
    return this.serializeNodeWrite(async () => {
      try {
        const committed = await this.firestore.runTransaction(async transaction => {
          const targets = await this.inspectDeletionTargets(transaction, plan.kind, ids, plan.cutoffMs);
          if (this.deletionFingerprint(targets) !== plan.fingerprint) throw new Error('GraphRAG deletion preview target drift');
          const markers = targets.filter(target => target.outcome === 'eligible').map(target => ({ schemaVersion: 1, kind: plan.kind, id: target.id, active: true, deletedAt: now, restoreUntil: until } as SoftDeletionMarker));
          for (const marker of markers) this.validateNodeWriteData(marker);
          if (markers.reduce((sum, marker) => sum + this.nodeWriteDataSize(marker), 0) > 1024 * 1024) throw new Error('GraphRAG deletion transaction size budget exceeded');
          for (const marker of markers) transaction.set(this.firestore.collection(this.deletionCollection).doc(this.deletionKey(marker.kind, marker.id)), marker);
          return { targets, markers };
        });
        this.invalidateNodeWriteCache();
        await this.initialize();
        return { outcomes: committed.targets.map(({ id, outcome }) => ({ id, outcome: outcome === 'eligible' ? 'masked' : outcome })), warnings: plan.kind === 'edge' ? ['connectionOwnershipUnknown: declared traversal connections are preserved'] : [], acceptedAt, ...(committed.markers.length ? { restoreUntil } : {}) };
      } catch (error) {
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  async deleteNode(id: string): Promise<SoftDeletionResult> {
    return this.applySoftDeletion(await this.planSoftDeletion({ kind: 'node', id }));
  }

  async deleteEdge(id: string): Promise<SoftDeletionResult> {
    return this.applySoftDeletion(await this.planSoftDeletion({ kind: 'edge', id }));
  }

  async deleteOldPatterns(cutoff: Date, scope?: { ids: string[] }): Promise<SoftDeletionResult> {
    if (!scope) throw new Error('GraphRAG explicit retention IDs required');
    const request = this.cloneCachedValue(scope);
    return this.applySoftDeletion(await this.planOldPatterns({ cutoff, ids: request.ids }));
  }

  /** Trusted in-process recovery view; metadata selectors do not establish caller authorization. */
  async listSoftDeletedTargets(options: { offset?: number; limit?: number } = {}): Promise<{ items: SoftDeletedTarget[]; total: number }> {
    this.requireSoftMode();
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(options)) ||
        Reflect.ownKeys(options).some(key => key !== 'offset' && key !== 'limit')) throw new Error('Invalid GraphRAG recovery pagination');
    const read = (key: 'offset' | 'limit', fallback: number): number => {
      const descriptor = Object.getOwnPropertyDescriptor(options, key);
      if (descriptor && !('value' in descriptor)) throw new Error('Invalid GraphRAG recovery pagination accessor');
      return descriptor?.value === undefined ? fallback : descriptor.value;
    };
    const offset = read('offset', 0); const limit = read('limit', 50);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid GraphRAG recovery pagination bounds');
    return this.serializeNodeWrite(async () => {
      // Always observe a fresh consistent source transaction, even with a healthy query cache.
      await this.loadSoftGraph();
      const markers = [...this.deletions.values()].filter(marker => marker.active)
        .sort((a, b) => a.deletedAt.toMillis() - b.deletedAt.toMillis() || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const items = markers.slice(offset, offset + limit).map(marker => {
        const original = marker.kind === 'node' ? this.rawNodes.get(marker.id) : this.rawEdges.get(marker.id);
        const item: SoftDeletedTarget = {
          kind: marker.kind, id: marker.id,
          label: marker.kind === 'node' && original ? (original as GraphNode).label : marker.id,
          deletedAt: new Date(marker.deletedAt.toMillis()).toISOString(),
          restorationGuaranteedUntil: new Date(marker.restoreUntil.toMillis()).toISOString(),
          originalAvailable: original !== undefined
        };
        if (marker.kind === 'node') {
          const incident = [...this.rawEdges.values()].filter(edge => edge.source === marker.id || edge.target === marker.id);
          // Includes virtual masks induced by this endpoint, without inventing edge markers.
          item.relatedMaskedEdgeIds = incident.map(edge => edge.id).sort();
        } else {
          const edge = original as GraphEdge | undefined;
          item.maskedEndpointIds = edge ? [...new Set([edge.source, edge.target].filter(id => this.isMasked('node', id)))].sort() : [];
        }
        return item;
      });
      return { items, total: markers.length };
    });
  }

  async restoreNode(id: string): Promise<SoftDeletionResult> { return this.restoreSoftTarget('node', id); }
  async restoreEdge(id: string): Promise<SoftDeletionResult> { return this.restoreSoftTarget('edge', id); }

  private async restoreSoftTarget(kind: 'node' | 'edge', id: string): Promise<SoftDeletionResult> {
    this.requireSoftMode(); const key = this.deletionKey(kind, id); const acceptedAt = this.softNow();
    return this.serializeNodeWrite(async () => {
      try {
        const outcome = await this.firestore.runTransaction(async transaction => {
          const original = await transaction.get(this.firestore.collection(kind === 'node' ? this.nodesCollection : this.edgesCollection).doc(id));
          const ref = this.firestore.collection(this.deletionCollection).doc(key);
          const snapshot = await transaction.get(ref);
          if (!original.exists) return 'absent';
          if (original.data()?.id !== id) throw new Error('GraphRAG restoration target ID mismatch');
          if (!snapshot.exists) return 'already-visible';
          const marker = this.parseDeletion(snapshot.data(), key);
          if (!marker.active) return 'already-visible';
          transaction.set(ref, { ...marker, active: false });
          return 'restored';
        });
        this.invalidateNodeWriteCache(); await this.initialize();
        return { outcomes: [{ id, outcome }], warnings: kind === 'edge' ? ['connectionOwnershipUnknown: declared traversal connections are preserved'] : [], acceptedAt };
      } catch (error) { this.invalidateNodeWriteCache(); throw error; }
    });
  }

  constructor(options: GraphRAGStoreOptions = {}) {
    super();
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(options))) throw new Error('Invalid GraphRAG store options');
    const mode = Object.getOwnPropertyDescriptor(options, 'softDeletion');
    if (mode && !('value' in mode)) throw new Error('Invalid GraphRAG deletion mode accessor');
    const config = mode?.value;
    if (config !== undefined && (!config || typeof config !== 'object' || Array.isArray(config) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(config)) ||
        Reflect.ownKeys(config).some(key => key !== 'clock'))) throw new Error('Invalid GraphRAG deletion mode');
    const clock = config === undefined ? undefined : Object.getOwnPropertyDescriptor(config, 'clock');
    if (clock && (!('value' in clock) || (clock.value !== undefined && typeof clock.value !== 'function'))) throw new Error('Invalid GraphRAG deletion clock dependency');
    this.softMode = config !== undefined;
    this.softClock = clock?.value ?? (() => new Date());
    const storageDescriptor = Object.getOwnPropertyDescriptor(options, 'storage');
    if (storageDescriptor && !('value' in storageDescriptor)) throw new Error('Invalid GraphRAG storage accessor');
    const storage = storageDescriptor?.value;
    let databaseId = 'versatil-rag';
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'centering-vine-454613-b3';
    if (storage !== undefined) {
      if (!storage || typeof storage !== 'object' || Array.isArray(storage) ||
          ![Object.prototype, null].includes(Object.getPrototypeOf(storage)) ||
          Reflect.ownKeys(storage).some(key => !['projectId', 'databaseId'].includes(key as string))) throw new Error('Invalid GraphRAG storage configuration');
      const project = Object.getOwnPropertyDescriptor(storage, 'projectId');
      const database = Object.getOwnPropertyDescriptor(storage, 'databaseId');
      const validIdentifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
      if (!project || !('value' in project) || !validIdentifier(project.value) ||
          !database || !('value' in database) || !(validIdentifier(database.value) || database.value === '(default)')) throw new Error('Invalid GraphRAG storage identifiers');
      this.projectId = project.value;
      databaseId = database.value;
    }
    this.firestore = new Firestore({ projectId: this.projectId, databaseId });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.beginGraphMutation();
    try {
      console.log(`🔧 Initializing GraphRAG Store (${this.projectId})...`);

      try {
        // Load existing graph from Firestore into memory
        await this.loadGraph();

        this.initialized = true;
        console.log('✅ GraphRAG Store initialized successfully');
        this.emit('initialized');
      } catch (error: any) {
        if (this.softMode) this.invalidateNodeWriteCache();
        console.error('❌ GraphRAG initialization failed:', error.message);
        throw error;
      }
    } finally {
      this.endGraphMutation();
    }
  }

  /**
   * Load graph from Firestore into memory for fast traversal
   */
  private async loadGraph(): Promise<void> {
    if (this.softMode) return this.loadSoftGraph();
    const wasInitialized = this.initialized;
    this.beginGraphMutation();
    try {
      await this.loadNodesFromFirestore(true);
      await this.loadEdgesFromFirestore(true);

      console.log(`📊 Loaded ${this.nodes.size} nodes and ${this.edges.size} edges`);
    } catch (error) {
      // Preserve legacy partial maps/readiness, but never memoize a failed loaded-graph reload.
      if (wasInitialized) this.disableQueryMemoization();
      throw error;
    } finally {
      this.endGraphMutation();
    }
  }

  private async loadNodesFromFirestore(internalLoad = false): Promise<GraphNode[]> {
    if (this.softMode) { await this.loadSoftGraph(); this.requireInitializedCache(); return [...this.nodes.values()].map(node => this.cloneCachedValue(node)); }
    // Only loadGraph discards returned aliases; this flag is bookkeeping, not authorization.
    if (!internalLoad) this.disableQueryMemoization();
    this.beginGraphMutation();
    try {
      const loaded: GraphNode[] = [];
      const nodesSnapshot = await this.firestore.collection(this.nodesCollection).get();
      nodesSnapshot.forEach(doc => {
        const node = doc.data() as GraphNode;
        this.nodes.set(node.id, node);
        this.adjacencyList.set(node.id, node.connections || []);
        loaded.push(node);
      });
      return loaded;
    } finally {
      this.endGraphMutation();
    }
  }

  private async loadEdgesFromFirestore(internalLoad = false): Promise<GraphEdge[]> {
    if (this.softMode) { await this.loadSoftGraph(); this.requireInitializedCache(); return [...this.edges.values()].map(edge => this.cloneCachedValue(edge)); }
    if (!internalLoad) this.disableQueryMemoization();
    this.beginGraphMutation();
    try {
      const loaded: GraphEdge[] = [];
      const edgesSnapshot = await this.firestore.collection(this.edgesCollection).get();
      edgesSnapshot.forEach(doc => {
        const edge = doc.data() as GraphEdge;
        this.edges.set(edge.id, edge);
        loaded.push(edge);
      });
      return loaded;
    } finally {
      this.endGraphMutation();
    }
  }

  async addNode(input: GraphNode): Promise<void> {
    const node = this.prepareNodeWrite(input);
    return this.serializeNodeWrite(async () => {
      await this.initialize();
      try {
        if (this.softMode) {
          await this.firestore.runTransaction(async transaction => {
            await this.assertUnmasked(transaction, [{ kind: 'node', id: node.id }]);
            const ref = this.firestore.collection(this.nodesCollection).doc(node.id);
            if ((await transaction.get(ref)).exists) throw new Error('GraphRAG node already exists');
            transaction.create(ref, node);
          });
        } else await this.firestore.collection(this.nodesCollection).doc(node.id).create(node);
        this.publishNodeWrite(node);
      } catch (error) {
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  // Supplied top-level fields replace those fields. Properties are replaced, not deep merged.
  // ID and type are immutable; explicit metadata is stored as supplied, not interpreted as authority.
  async updateNode(input: Pick<GraphNode, 'id'> & Partial<Omit<GraphNode, 'id'>>): Promise<void> {
    const patch = this.cloneCachedValue(input);
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid GraphRAG node update');
    this.validateNodeDocumentId(patch.id);
    const allowed = ['id', 'type', 'label', 'properties', 'connections', 'centrality', 'privacy'];
    if (Object.keys(patch).some(key => !allowed.includes(key))) throw new Error('Unsupported GraphRAG node update field');
    this.prepareNodeWrite({ type: 'concept', label: '', properties: {}, connections: [], ...patch });
    this.validateNodeWriteData(patch);
    return this.serializeNodeWrite(async () => {
      await this.initialize();
      try {
        const node = await this.firestore.runTransaction(async transaction => {
          await this.assertUnmasked(transaction, [{ kind: 'node', id: patch.id }]);
          const ref = this.firestore.collection(this.nodesCollection).doc(patch.id);
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists) throw new Error('GraphRAG node does not exist');
          const current = this.prepareNodeWrite(snapshot.data() as GraphNode);
          if (current.id !== patch.id) throw new Error('GraphRAG persisted node ID mismatch');
          if (patch.type !== undefined && patch.type !== current.type) throw new Error('GraphRAG node type is immutable');
          const candidate = this.prepareNodeWrite({ ...current, ...patch });
          transaction.set(ref, candidate);
          return candidate;
        });
        this.publishNodeWrite(node);
      } catch (error) {
        // Even read/validation failure can reveal that the loaded projection was stale.
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  async batchAddNodes(input: GraphNode[]): Promise<void> {
    const detached = this.cloneCachedValue(input);
    if (!Array.isArray(detached) || detached.length === 0 || detached.length > 100) {
      throw new Error('GraphRAG node batch must contain 1 to 100 nodes');
    }
    for (let index = 0; index < detached.length; index++) {
      if (!(index in detached)) throw new Error('Sparse GraphRAG node batch');
    }
    const nodes = detached.map(node => this.prepareNodeWrite(node));
    if (new Set(nodes.map(node => node.id)).size !== nodes.length) throw new Error('Duplicate GraphRAG batch node ID');
    if (nodes.reduce((sum, node) => sum + this.nodeWriteDataSize(node), 0) > 1024 * 1024) {
      throw new Error('GraphRAG local node batch size budget exceeded');
    }
    return this.serializeNodeWrite(async () => {
      await this.initialize();
      try {
        if (this.softMode) {
          await this.firestore.runTransaction(async transaction => {
            await this.assertUnmasked(transaction, nodes.map(node => ({ kind: 'node', id: node.id })));
            const refs = nodes.map(node => this.firestore.collection(this.nodesCollection).doc(node.id));
            for (const ref of refs) if ((await transaction.get(ref)).exists) throw new Error('GraphRAG batch node already exists');
            refs.forEach((ref, index) => transaction.create(ref, nodes[index]));
          });
        } else {
          const batch = this.firestore.batch();
          for (const node of nodes) batch.create(this.firestore.collection(this.nodesCollection).doc(node.id), node);
          await batch.commit();
        }
        for (const node of nodes) this.publishNodeWrite(node);
      } catch (error) {
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  /** New create-only directed edge convention; both endpoints must exist in persisted storage.
   * Preserve source metadata, add target exactly once, and publish only after the atomic commit.
   * Uses the node-writer queue; older addPattern/clear/close races remain outside that guarantee.
   */
  async addEdge(input: GraphEdge): Promise<void> {
    const edge = this.cloneCachedValue(input);
    if (!edge || typeof edge !== 'object' || Array.isArray(edge) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(edge))) throw new Error('Invalid GraphRAG edge');
    for (const id of [edge.id, edge.source, edge.target]) this.validateNodeDocumentId(id);
    if (typeof edge.relationship !== 'string' || !edge.relationship || !Number.isFinite(edge.weight) ||
        edge.weight < 0 || edge.weight > 1) throw new Error('Invalid GraphRAG edge');
    // Same pinned SDK serializer and local64KiB document admission as the node-writer family.
    this.validateNodeWriteData(edge);
    return this.serializeNodeWrite(async () => {
      await this.initialize();
      try {
        const edgeRef = this.firestore.collection(this.edgesCollection).doc(edge.id);
        const sourceRef = this.firestore.collection(this.nodesCollection).doc(edge.source);
        const targetRef = this.firestore.collection(this.nodesCollection).doc(edge.target);
        const committed = await this.firestore.runTransaction(async transaction => {
          await this.assertUnmasked(transaction, [{ kind: 'edge', id: edge.id }, { kind: 'node', id: edge.source }, { kind: 'node', id: edge.target }]);
          const existing = await transaction.get(edgeRef);
          if (existing.exists) throw new Error('GraphRAG edge already exists');
          const sourceSnapshot = await transaction.get(sourceRef);
          const targetSnapshot = edge.source === edge.target ? sourceSnapshot : await transaction.get(targetRef);
          if (!sourceSnapshot.exists || !targetSnapshot.exists) throw new Error('GraphRAG edge endpoint does not exist');
          const source = this.prepareNodeWrite(sourceSnapshot.data() as GraphNode);
          const target = edge.source === edge.target ? source : this.prepareNodeWrite(targetSnapshot.data() as GraphNode);
          if (source.id !== edge.source || target.id !== edge.target) throw new Error('GraphRAG edge endpoint ID mismatch');
          // Only duplicate occurrences of this target are removed; unrelated declared links retain their order.
          let foundTarget = false;
          const connections = source.connections.filter(id => {
            if (id !== edge.target) return true;
            if (foundTarget) return false;
            foundTarget = true;
            return true;
          });
          if (!foundTarget) connections.push(edge.target);
          const changedSource = this.prepareNodeWrite({ ...source, connections });
          // Both records are admitted individually64KiB, total below the existing1MiB local plan budget.
          if (this.nodeWriteDataSize(edge) + this.nodeWriteDataSize(changedSource) > 1024 * 1024) {
            throw new Error('GraphRAG local edge transaction size budget exceeded');
          }
          // All authoritative reads and validation precede these writes. SDK callback retries publish nothing.
          transaction.create(edgeRef, edge);
          transaction.set(sourceRef, changedSource);
          return { source: changedSource, target, edge };
        });
        this.publishNodeWrite(committed.source);
        if (committed.target.id !== committed.source.id) this.publishNodeWrite(committed.target);
        if (this.softMode) { this.rawEdges.set(committed.edge.id, this.cloneCachedValue(committed.edge)); this.publishSoftProjection(); }
        else this.edges.set(committed.edge.id, this.cloneCachedValue(committed.edge));
      } catch (error) {
        // A transport rejection may follow an actual commit; invalidate rather than assert backend rollback.
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  /** Stable caller-ID pattern create. This path alone deliberately links both pattern and entities.
   * Shared entities retain authoritative metadata; explicit pattern privacy is stored, not authorized.
   * Uses the new-writer queue, without claiming safety for older addPattern/clear/close races.
   */
  async storePattern(input: PatternNode): Promise<void> {
    const supplied = this.preparePatternWrite(input);
    // Keep the existing heuristic and first interpretation, but create each extracted ID only once.
    const unique = new Map<string, ReturnType<GraphRAGStore['extractEntities']>[number]>();
    for (const entity of this.extractEntities(supplied.properties)) {
      this.validateNodeDocumentId(entity.id);
      if (entity.id === supplied.id) throw new Error('GraphRAG pattern entity ID collision');
      const previous = unique.get(entity.id);
      if (previous && (previous.type !== entity.type || previous.label !== entity.label ||
          previous.relationship !== entity.relationship || previous.weight !== entity.weight)) {
        throw new Error('GraphRAG conflicting extracted entity ID');
      }
      if (!previous) unique.set(entity.id, entity);
    }
    const extracted = [...unique.values()];
    const edges: GraphEdge[] = extracted.map(entity => ({
      id: `edge_${supplied.id}_${entity.id}`, source: supplied.id, target: entity.id,
      relationship: entity.relationship, weight: entity.weight
    }));
    for (const edge of edges) { this.validateNodeDocumentId(edge.id); this.validateNodeWriteData(edge); }
    // Conservative local bound inherited from the 100-record writer admission, not a cloud quota claim.
    if (1 + extracted.length + edges.length > 100) throw new Error('GraphRAG local pattern write count budget exceeded');
    const pattern = this.preparePatternWrite({ ...supplied,
      connections: this.appendPatternConnections(supplied.connections, extracted.map(entity => entity.id)) });
    return this.serializeNodeWrite(async () => {
      await this.initialize();
      try {
        const patternRef = this.firestore.collection(this.nodesCollection).doc(pattern.id);
        const entityRefs = extracted.map(entity => this.firestore.collection(this.nodesCollection).doc(entity.id));
        const edgeRefs = edges.map(edge => this.firestore.collection(this.edgesCollection).doc(edge.id));
        const committed = await this.firestore.runTransaction(async transaction => {
          await this.assertUnmasked(transaction, [{ kind: 'node', id: pattern.id }, ...extracted.map(entity => ({ kind: 'node' as const, id: entity.id })), ...edges.map(edge => ({ kind: 'edge' as const, id: edge.id }))]);
          const existingPattern = await transaction.get(patternRef);
          if (existingPattern.exists) throw new Error('GraphRAG pattern already exists');
          const snapshots = [];
          for (const ref of entityRefs) snapshots.push(await transaction.get(ref));
          for (const ref of edgeRefs) {
            if ((await transaction.get(ref)).exists) throw new Error('GraphRAG extracted edge already exists');
          }
          const entities = extracted.map((entity, index) => {
            const snapshot = snapshots[index];
            const current = snapshot.exists ? this.prepareNodeWrite(snapshot.data() as GraphNode) : {
              id: entity.id, type: entity.type, label: entity.label, properties: {}, connections: []
            };
            if (current.id !== entity.id || current.type !== entity.type) throw new Error('GraphRAG shared entity ID/type mismatch');
            return this.prepareNodeWrite({ ...current,
              connections: this.appendPatternConnections(current.connections, [pattern.id]) });
          });
          if ([pattern, ...entities, ...edges].reduce((sum, record) => sum + this.nodeWriteDataSize(record), 0) > 1024 * 1024) {
            throw new Error('GraphRAG local pattern transaction size budget exceeded');
          }
          // Every authoritative read and validation precedes writes; retry callbacks publish nothing.
          transaction.create(patternRef, pattern);
          entities.forEach((entity, index) => {
            if (snapshots[index].exists) transaction.set(entityRefs[index], entity);
            else transaction.create(entityRefs[index], entity);
          });
          edges.forEach((edge, index) => transaction.create(edgeRefs[index], edge));
          return { pattern, entities, edges };
        });
        this.publishNodeWrite(committed.pattern);
        for (const entity of committed.entities) this.publishNodeWrite(entity);
        for (const edge of committed.edges) {
          if (this.softMode) this.rawEdges.set(edge.id, this.cloneCachedValue(edge));
          else this.edges.set(edge.id, this.cloneCachedValue(edge));
        }
        if (this.softMode) this.publishSoftProjection();
      } catch (error) {
        // Transport failure can follow a commit; refuse stale cached success, never claim rollback.
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  /** Explicit durable usage accounting only; reads/query do not become writes and lastUsed is unchanged. */
  async incrementUsageCount(id: string): Promise<void> {
    this.validateNodeDocumentId(id);
    return this.serializeNodeWrite(async () => {
      await this.initialize();
      try {
        const ref = this.firestore.collection(this.nodesCollection).doc(id);
        const committed = await this.firestore.runTransaction(async transaction => {
          await this.assertUnmasked(transaction, [{ kind: 'node', id }]);
          const snapshot = await transaction.get(ref);
          if (!snapshot.exists) throw new Error('GraphRAG pattern does not exist');
          const current = this.preparePatternWrite(snapshot.data() as PatternNode);
          if (current.id !== id) throw new Error('GraphRAG persisted pattern ID mismatch');
          if (current.properties.usageCount === Number.MAX_SAFE_INTEGER) throw new Error('GraphRAG usage count overflow');
          const next = this.preparePatternWrite({ ...current,
            properties: { ...current.properties, usageCount: current.properties.usageCount + 1 } });
          transaction.set(ref, next);
          return next;
        });
        this.publishNodeWrite(committed);
      } catch (error) {
        this.invalidateNodeWriteCache();
        throw error;
      }
    });
  }

  private preparePatternWrite(input: PatternNode): PatternNode {
    const node = this.prepareNodeWrite(input);
    const properties = node.properties;
    if (node.type !== 'pattern' || ['pattern', 'agent', 'category'].some(key => typeof properties[key] !== 'string') ||
        !Number.isFinite(properties.effectiveness) || !Number.isFinite(properties.timeSaved) ||
        !Number.isSafeInteger(properties.usageCount) || properties.usageCount < 0 ||
        !Array.isArray(properties.tags) || properties.tags.some((tag: unknown) => typeof tag !== 'string') ||
        ![Date.prototype, Timestamp.prototype].includes(Object.getPrototypeOf(properties.lastUsed ?? {})) ||
        ['description', 'code'].some(key => key in properties && typeof properties[key] !== 'string') ||
        ('examples' in properties && (!Array.isArray(properties.examples) || properties.examples.some((item: unknown) => typeof item !== 'string')))) {
      throw new Error('Invalid GraphRAG complete pattern properties');
    }
    // prepareNodeWrite has already checked supported timestamps, SDK encoding, sparse/undefined values and size.
    return node as PatternNode;
  }

  private appendPatternConnections(existing: string[], additions: string[]): string[] {
    const connections = [...existing];
    const seen = new Set(existing);
    for (const id of additions) if (!seen.has(id)) { connections.push(id); seen.add(id); }
    return connections;
  }

  private serializeNodeWrite<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.nodeWriteTail.then(async () => {
      this.beginGraphMutation();
      try { return await operation(); } finally { this.endGraphMutation(); }
    });
    this.nodeWriteTail = result.then(() => undefined, () => undefined);
    return result;
  }

  private publishNodeWrite(node: GraphNode): void {
    this.beginGraphMutation();
    try {
      const cached = this.cloneCachedValue(node);
      if (this.softMode) { this.rawNodes.set(cached.id, cached); this.publishSoftProjection(); }
      else { this.nodes.set(cached.id, cached); this.adjacencyList.set(cached.id, [...cached.connections]); }
    } finally {
      this.endGraphMutation();
    }
  }

  private invalidateNodeWriteCache(): void {
    this.beginGraphMutation();
    try {
      this.initialized = false;
      this.softProjectionReady = false; this.rawNodes.clear(); this.rawEdges.clear(); this.deletions.clear();
      this.nodes.clear();
      this.edges.clear();
      this.adjacencyList.clear();
    } finally {
      this.endGraphMutation();
    }
  }

  private validateNodeDocumentId(id: unknown): asserts id is string {
    if (typeof id !== 'string' || !id || id.includes('/') || id === '.' || id === '..' ||
      /^__.*__$/.test(id) || Buffer.byteLength(id, 'utf8') > 1500 || Buffer.from(id).toString('utf8') !== id) {
      throw new Error('Invalid GraphRAG document ID');
    }
  }

  private prepareNodeWrite(input: GraphNode): GraphNode {
    const node = this.cloneCachedValue(input);
    if (node === null || typeof node !== 'object' || Array.isArray(node)) throw new Error('Invalid GraphRAG node');
    this.validateNodeDocumentId(node.id);
    if (!['pattern', 'agent', 'technology', 'concept', 'category'].includes(node.type) ||
      typeof node.label !== 'string' || node.properties === null || typeof node.properties !== 'object' ||
      Array.isArray(node.properties) || ![Object.prototype, null].includes(Object.getPrototypeOf(node.properties)) ||
      !Array.isArray(node.connections)) throw new Error('Invalid GraphRAG node');
    for (const id of node.connections) this.validateNodeDocumentId(id);
    if (node.centrality !== undefined && !Number.isFinite(node.centrality)) throw new Error('Invalid GraphRAG node centrality');
    if (node.privacy !== undefined && (node.privacy === null || typeof node.privacy !== 'object' ||
      Array.isArray(node.privacy) || typeof node.privacy.isPublic !== 'boolean' ||
      ['userId', 'teamId', 'projectId'].some(key => key in node.privacy! && typeof (node.privacy as any)[key] !== 'string'))) {
      throw new Error('Invalid GraphRAG explicit privacy metadata');
    }
    this.validateNodeWriteData(node);
    return node;
  }

  private validateNodeWriteData(data: object): void {
    const ancestors = new Set<object>();
    const inspect = (value: any, path: string[] = []) => {
      if (value === undefined) throw new Error('GraphRAG writes cannot contain undefined');
      if (typeof value === 'symbol' || typeof value === 'bigint') throw new Error('Unsupported GraphRAG write primitive');
      if (typeof value === 'string' && Buffer.from(value).toString('utf8') !== value) throw new Error('Invalid GraphRAG UTF-8 string');
      if (value === null || typeof value !== 'object') return;
      const prototype = Object.getPrototypeOf(value);
      if (prototype === Date.prototype) {
        if (!Number.isFinite(value.getTime()) || Reflect.ownKeys(value).length) throw new Error('Invalid GraphRAG Date');
        return;
      }
      if (prototype === Timestamp.prototype) {
        if (Reflect.ownKeys(value).some(key => key !== '_seconds' && key !== '_nanoseconds') ||
          !Number.isInteger(value.seconds) || value.seconds < -62135596800 || value.seconds > 253402300799 ||
          !Number.isInteger(value.nanoseconds) || value.nanoseconds < 0 || value.nanoseconds >= 1e9) {
          throw new Error('Invalid GraphRAG Timestamp');
        }
        return;
      }
      if (prototype === Buffer.prototype || prototype === Uint8Array.prototype) {
        if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key))) {
          throw new Error('Unsupported GraphRAG bytes field');
        }
        return;
      }
      if (ancestors.has(value)) throw new Error('Cyclic GraphRAG write value');
      ancestors.add(value);
      if (Array.isArray(value)) {
        if (value.some(Array.isArray)) throw new Error('Nested GraphRAG arrays are not Firestore values');
        if (Reflect.ownKeys(value).some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key)))) {
          throw new Error('Unsupported GraphRAG array field');
        }
        for (let index = 0; index < value.length; index++) inspect(value[index], [...path, String(index)]);
      } else {
        for (const key of Reflect.ownKeys(value)) {
          if (typeof key !== 'string' || !Object.getOwnPropertyDescriptor(value, key)!.enumerable ||
            /^__.*__$/.test(key) || Buffer.byteLength(key, 'utf8') > 1500 || Buffer.from(key).toString('utf8') !== key ||
            Buffer.byteLength([...path, key].join('.'), 'utf8') + path.length * 2 > 1500) {
            throw new Error('Invalid GraphRAG Firestore field key');
          }
          inspect(value[key], [...path, key]);
        }
      }
      ancestors.delete(value);
    };
    inspect(data);
    validateDocumentData('GraphRAG node', data, false, false);
    if (this.nodeWriteDataSize(data) > 64 * 1024) throw new Error('GraphRAG local node size budget exceeded');
  }

  private nodeWriteDataSize(data: object): number {
    // Pure installed SDK encoding; the reference factory is never allowed to perform I/O.
    const serializer = new Serializer({ _settings: { ignoreUndefinedProperties: false, useBigInt: false },
      doc: () => { throw new Error('Unsupported GraphRAG document reference'); } } as unknown as ConstructorParameters<typeof Serializer>[0]);
    return Buffer.byteLength(JSON.stringify(serializer.encodeFields(data)), 'utf8');
  }

  /** Trusted in-process whole-cache views; these perform no privacy filtering. */
  getNode(id: string): GraphNode | undefined {
    this.requireInitializedCache();
    const node = this.nodes.get(id);
    return node === undefined ? undefined : this.cloneCachedValue(node);
  }

  getEdge(id: string): GraphEdge | undefined {
    this.requireInitializedCache();
    const edge = this.edges.get(id);
    return edge === undefined ? undefined : this.cloneCachedValue(edge);
  }

  getNodesByType(type: NodeType): GraphNode[] {
    this.requireInitializedCache();
    return [...this.nodes.values()].map(node => this.cloneCachedValue(node))
      .filter(node => node.type === type);
  }

  getEdgesForNode(id: string): GraphEdge[] {
    this.requireInitializedCache();
    return [...this.edges.values()].map(edge => this.cloneCachedValue(edge))
      .filter(edge => edge.source === id || edge.target === id);
  }

  // New local convention, not a recovered historical algorithm: select stored
  // finite centrality >= a required finite threshold, preserving insertion order.
  // Missing scores are uncomputed; malformed scores fail without normalization.
  private getHighCentralityNodes(threshold: number): GraphNode[] {
    this.requireInitializedCache();
    if (!Number.isFinite(threshold)) throw new Error('GraphRAG centrality threshold must be finite');
    return [...this.nodes.values()].map(node => this.cloneCachedValue(node)).filter(node => {
      const centrality = node.centrality;
      if (centrality === undefined) return false;
      if (!Number.isFinite(centrality)) throw new Error('GraphRAG cached centrality must be finite');
      return centrality >= threshold;
    });
  }

  /** Returns the loaded node's declared connection IDs, including unresolved IDs. */
  getNeighbors(id: string): string[] {
    this.requireInitializedCache();
    const node = this.nodes.get(id);
    if (node === undefined) return [];
    const connections = this.cloneCachedValue(node).connections;
    if (connections === undefined || connections === null) return [];
    if (!Array.isArray(connections) || connections.some(connection => typeof connection !== 'string')) {
      throw new Error('Unsupported GraphRAG cached connections');
    }
    return connections;
  }

  // Local convention: source depth is zero; connections are directed and ordered.
  // Only existing cached nodes are visited, matching query's declared-connection basis.
  private bfsTraversal(startId: string, maxDepth = 2): string[] {
    this.requireInitializedCache();
    if (typeof startId !== 'string') throw new Error('GraphRAG traversal IDs must be strings');
    if (!Number.isInteger(maxDepth) || maxDepth < 0) {
      throw new Error('GraphRAG maxDepth must be a nonnegative integer');
    }
    if (this.getNode(startId) === undefined) return [];
    const discovered = new Set([startId]);
    const queue = [{ id: startId, depth: 0 }];
    const visited: string[] = [];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      visited.push(current.id);
      if (current.depth >= maxDepth) continue;
      for (const neighbor of this.getNeighbors(current.id)) {
        if (discovered.has(neighbor) || this.getNode(neighbor) === undefined) continue;
        discovered.add(neighbor);
        queue.push({ id: neighbor, depth: current.depth + 1 });
      }
    }
    return visited;
  }

  // Shortest hop path over the same directed connections; no reverse links invented.
  private findShortestPath(startId: string, targetId: string): string[] {
    this.requireInitializedCache();
    if (typeof startId !== 'string' || typeof targetId !== 'string') {
      throw new Error('GraphRAG traversal IDs must be strings');
    }
    if (this.getNode(startId) === undefined || this.getNode(targetId) === undefined) return [];
    if (startId === targetId) return [startId];
    const previous = new Map<string, string | undefined>([[startId, undefined]]);
    const queue = [startId];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      for (const neighbor of this.getNeighbors(current)) {
        if (previous.has(neighbor) || this.getNode(neighbor) === undefined) continue;
        previous.set(neighbor, current);
        if (neighbor === targetId) {
          const path: string[] = [];
          let step: string | undefined = targetId;
          while (step !== undefined) {
            path.push(step);
            step = previous.get(step);
          }
          return path.reverse();
        }
        queue.push(neighbor);
      }
    }
    return [];
  }

  // New local lexical convention, independent of query ranking; exact Unicode tokens only.
  private calculateRelevance(queryText: string, patternText: string): number {
    if (typeof queryText !== 'string' || typeof patternText !== 'string') {
      throw new Error('GraphRAG relevance inputs must be strings');
    }
    const tokens = (text: string) => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
    const query = tokens(queryText);
    const pattern = tokens(patternText);
    return query.size === 0 ? 0 : [...query].filter(token => pattern.has(token)).length / query.size;
  }

  // Pure supplied-score boost, not integrated into query or inferred from connectivity.
  private boostByCentrality(base: number, input: GraphNode): number {
    if (!Number.isFinite(base) || base < 0 || base > 1) throw new Error('GraphRAG base score must be in [0,1]');
    const node = this.cloneCachedValue(input);
    if (!node || typeof node !== 'object' || Array.isArray(node)) throw new Error('Invalid GraphRAG score node');
    const score = node.centrality === undefined ? 0 : node.centrality;
    if (!Number.isFinite(score) || score < 0 || score > 1) throw new Error('GraphRAG boost centrality must be in [0,1]');
    return base + (1 - base) * score;
  }

  // Validate and detach the entire trusted cache before reading selectors or publishing metrics.
  // This is a local structural analysis, not tenant-filtered retrieval or backend freshness proof.
  private metricSnapshot(): GraphNode[] {
    this.requireInitializedCache();
    if (this.nodes.size > 10000) throw new Error('GraphRAG metric node budget exceeded');
    const entries = [...this.nodes.entries()].map(([id, node]) => [id, this.cloneCachedValue(node)] as const);
    let linkCount = 0;
    for (const [id, node] of entries) {
      if (!node || typeof node !== 'object' || Array.isArray(node) || node.id !== id || typeof id !== 'string' || !id ||
          !['pattern', 'agent', 'technology', 'concept', 'category'].includes(node.type) || typeof node.label !== 'string' ||
          !node.properties || typeof node.properties !== 'object' || Array.isArray(node.properties) ||
          ![Object.prototype, null].includes(Object.getPrototypeOf(node.properties)) || !Array.isArray(node.connections)) {
        throw new Error('Invalid GraphRAG metric node');
      }
      for (let i = 0; i < node.connections.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(node.connections, i) || typeof node.connections[i] !== 'string') {
          throw new Error('Invalid GraphRAG metric connections');
        }
      }
      linkCount += node.connections.length;
      if (linkCount > 100000) throw new Error('GraphRAG metric connection budget exceeded');
    }
    return entries.map(([, node]) => node);
  }

  /** New deterministic PageRank convention. Only complete converged scores are published in memory.
   * Receipt carries the detached source topology/options; reload restores persisted scores.
   * No query-ranking integration, backend writes, or concurrent mutation guarantee is introduced.
   */
  async calculateCentrality(input: { damping?: number; tolerance?: number; maxIterations?: number } = {}) {
    const options = this.cloneCachedValue(input);
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        Reflect.ownKeys(options).some(key => !['damping', 'tolerance', 'maxIterations'].includes(String(key)))) {
      throw new Error('Invalid GraphRAG PageRank options');
    }
    const damping = options.damping === undefined ? 0.85 : options.damping;
    const tolerance = options.tolerance === undefined ? 1e-10 : options.tolerance;
    const maxIterations = options.maxIterations === undefined ? 200 : options.maxIterations;
    if (!Number.isFinite(damping) || damping < 0 || damping >= 1 || !Number.isFinite(tolerance) ||
        tolerance <= 0 || tolerance >= 1 || !Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 10000) {
      throw new Error('Invalid GraphRAG PageRank options');
    }
    const nodes = this.metricSnapshot();
    const index = new Map(nodes.map((node, i) => [node.id, i]));
    const links = nodes.map(node => [...new Set(node.connections)].filter(id => index.has(id)).map(id => index.get(id)!));
    if (maxIterations * (nodes.length + links.reduce((sum, row) => sum + row.length, 0)) > 50000000) {
      throw new Error('GraphRAG PageRank work budget exceeded');
    }
    let ranks = nodes.map(() => 1 / nodes.length);
    let iterations = 0;
    let converged = nodes.length === 0;
    while (!converged && iterations < maxIterations) {
      const dangling = ranks.reduce((sum, rank, i) => sum + (links[i].length === 0 ? rank : 0), 0);
      const next = nodes.map(() => (1 - damping) / nodes.length + damping * dangling / nodes.length);
      for (let i = 0; i < links.length; i++) {
        for (const target of links[i]) next[target] += damping * ranks[i] / links[i].length;
      }
      const change = next.reduce((sum, rank, i) => sum + Math.abs(rank - ranks[i]), 0);
      ranks = next;
      iterations++;
      converged = change <= tolerance;
    }
    if (!converged) throw new Error('GraphRAG PageRank did not converge within iteration budget');
    if (ranks.some(score => !Number.isFinite(score) || score < 0)) throw new Error('Invalid GraphRAG PageRank result');
    // Prepare every replacement before publishing, so validation/nonconvergence leaves the cache untouched.
    const published = nodes.map((node, i) => ({ ...node, centrality: ranks[i] }));
    this.beginGraphMutation();
    try { for (const node of published) this.nodes.set(node.id, node); }
    finally { this.endGraphMutation(); }
    return { algorithm: 'pagerank' as const, converged: true as const, iterations,
      options: { damping, tolerance, maxIterations },
      sourceConnections: nodes.map(node => ({ id: node.id, connections: [...node.connections] })),
      scores: ranks.map((centrality, i) => ({ id: nodes[i].id, centrality })) };
  }

  /** New bounded deterministic Louvain convention: unweighted undirected projection of unique
   * existing declared links, ignoring original self/dangling links. Local moving + aggregation
   * optimize standard modularity (resolution1); these are structural, not semantic communities.
   */
  async detectCommunities(input: { maxPasses?: number; maxLevels?: number } = {}): Promise<string[][]> {
    const options = this.cloneCachedValue(input);
    if (!options || typeof options !== 'object' || Array.isArray(options) ||
        Reflect.ownKeys(options).some(key => !['maxPasses', 'maxLevels'].includes(String(key)))) {
      throw new Error('Invalid GraphRAG Louvain options');
    }
    const maxPasses = options.maxPasses === undefined ? 100 : options.maxPasses;
    const maxLevels = options.maxLevels === undefined ? 128 : options.maxLevels;
    if (!Number.isInteger(maxPasses) || maxPasses < 1 || maxPasses > 1000 ||
        !Number.isInteger(maxLevels) || maxLevels < 1 || maxLevels > 128) throw new Error('Invalid GraphRAG Louvain options');
    const nodes = this.metricSnapshot();
    return this.calculateLouvain(nodes, maxPasses, maxLevels).groups;
  }

  // Pure internal receipt includes level quality on the original projection, not backend state.
  private calculateLouvain(nodes: GraphNode[], maxPasses: number, maxLevels: number) {
    if (nodes.length > 128) throw new Error('GraphRAG Louvain node budget exceeded');
    const ids = new Map(nodes.map((node, i) => [node.id, i]));
    let matrix = nodes.map(() => nodes.map(() => 0));
    for (let i = 0; i < nodes.length; i++) {
      for (const id of nodes[i].connections) {
        const j = ids.get(id);
        if (j !== undefined && j !== i) matrix[i][j] = matrix[j][i] = 1;
      }
    }
    const original = matrix.map(row => [...row]);
    const modularity = (groups: number[][]): number => {
      const degrees = original.map(row => row.reduce((sum, weight) => sum + weight, 0));
      const total = degrees.reduce((sum, degree) => sum + degree, 0);
      if (total === 0) return 0;
      return groups.reduce((quality, group) => {
        const internal = group.reduce((sum, i) => sum + group.reduce((subtotal, j) => subtotal + original[i][j], 0), 0);
        const degree = group.reduce((sum, i) => sum + degrees[i], 0);
        return quality + internal / total - (degree / total) ** 2;
      }, 0);
    };
    const levels: Array<{ groups: string[][]; modularity: number }> = [];
    const receipt = (groups: number[][]) => ({
      algorithm: 'louvain' as const, converged: true as const,
      groups: groups.map(group => group.slice().sort((a, b) => a - b).map(i => nodes[i].id)),
      modularity: modularity(groups), levels,
    });
    let members = nodes.map((_, i) => [i]);
    let moves = 0;
    const gainTolerance = 1e-12;
    for (let level = 0; level < maxLevels; level++) {
      const n = matrix.length;
      const degrees = matrix.map(row => row.reduce((sum, weight) => sum + weight, 0));
      const total = degrees.reduce((sum, degree) => sum + degree, 0); // 2m, including aggregated loops twice.
      if (total === 0) return receipt(members);
      const labels = matrix.map((_, i) => i);
      const totals = new Map(degrees.map((degree, i) => [i, degree]));
      let stable = false;
      for (let pass = 0; pass < maxPasses; pass++) {
        let changed = false;
        for (let i = 0; i < n; i++) {
          const own = labels[i];
          const weights = new Map<number, number>();
          for (let j = 0; j < n; j++) {
            if (i !== j && matrix[i][j] !== 0) weights.set(labels[j], (weights.get(labels[j]) || 0) + matrix[i][j]);
          }
          // Existing groups in stable numeric order; a singleton option permits removal from a group.
          const candidates = [...new Set([...weights.keys(), n * (pass + 1) + i])].sort((a, b) => a - b);
          let best = own;
          let bestGain = gainTolerance;
          const k = degrees[i];
          const ownTotal = totals.get(own) || 0;
          for (const target of candidates) {
            if (target === own) continue;
            if (++moves > 2000000) throw new Error('GraphRAG Louvain work budget exceeded');
            const targetTotal = totals.get(target) || 0;
            const gain = 2 * ((weights.get(target) || 0) - (weights.get(own) || 0)) / total -
              ((ownTotal - k) ** 2 + (targetTotal + k) ** 2 - ownTotal ** 2 - targetTotal ** 2) / total ** 2;
            if (gain > bestGain) { best = target; bestGain = gain; }
          }
          if (best !== own) {
            labels[i] = best;
            totals.set(own, ownTotal - k);
            totals.set(best, (totals.get(best) || 0) + k);
            changed = true;
          }
        }
        if (!changed) { stable = true; break; }
      }
      if (!stable) throw new Error('GraphRAG Louvain did not converge within pass budget');
      const groups: number[][] = [];
      const groupIndex = new Map<number, number>();
      for (let i = 0; i < n; i++) {
        if (!groupIndex.has(labels[i])) { groupIndex.set(labels[i], groups.length); groups.push([]); }
        groups[groupIndex.get(labels[i])!].push(i);
      }
      const partition = groups.map(group => group.flatMap(i => members[i]).sort((a, b) => a - b));
      levels.push({ groups: partition.map(group => group.map(i => nodes[i].id)), modularity: modularity(partition) });
      if (groups.length === n) return receipt(members);
      // Aggregation preserves weighted degree/internal self-loop mass; next level can merge local optima.
      const aggregated = groups.map(() => groups.map(() => 0));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        aggregated[groupIndex.get(labels[i])!][groupIndex.get(labels[j])!] += matrix[i][j];
      }
      members = groups.map(group => group.flatMap(i => members[i]).sort((a, b) => a - b));
      matrix = aggregated;
    }
    throw new Error('GraphRAG Louvain did not converge within level budget');
  }

  /** New structural relatedness convention: existing directed hops <=2, distance/discovery ties,
   * excluding the seed. Returns detached GraphNodes of type pattern, not tenant-filtered results.
   */
  async findRelatedPatterns(startId: string, limit = 10): Promise<GraphNode[]> {
    if (typeof startId !== 'string' || !Number.isInteger(limit) || limit < 0 || limit > 10000) {
      throw new Error('Invalid GraphRAG related-pattern arguments');
    }
    const snapshot = this.metricSnapshot();
    const nodes = new Map(snapshot.map(node => [node.id, node]));
    if (!nodes.has(startId) || nodes.get(startId)!.type !== 'pattern' || limit === 0) return [];
    const queue = [{ id: startId, depth: 0 }];
    const visited = new Set([startId]);
    const results: GraphNode[] = [];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      if (current.depth === 2) continue;
      for (const id of nodes.get(current.id)!.connections) {
        if (!nodes.has(id) || visited.has(id)) continue;
        visited.add(id);
        const node = nodes.get(id)!;
        queue.push({ id, depth: current.depth + 1 });
        if (node.type === 'pattern') results.push(node);
      }
    }
    return results.slice(0, limit);
  }

  private requireInitializedCache(): void {
    if (!this.initialized || (this.softMode && !this.softProjectionReady)) throw new Error('GraphRAG cache is not initialized');
  }

  // Only supported data values are cloned. Accessors, functions and opaque classes
  // are rejected, rather than exposing an alias or inventing invalid internal slots.
  private cloneCachedValue<T>(value: T, seen = new WeakMap<object, any>()): T {
    if (typeof value === 'function') throw new Error('Unsupported GraphRAG cached value: function');
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    const prototype = Object.getPrototypeOf(value);
    const supported = prototype === Object.prototype || prototype === null ||
      prototype === Array.prototype || prototype === Date.prototype ||
      prototype === Timestamp.prototype || prototype === Buffer.prototype ||
      prototype === Uint8Array.prototype;
    if (!supported) throw new Error('Unsupported GraphRAG cached value prototype');
    const descriptors = Reflect.ownKeys(value).map(key => [key, Object.getOwnPropertyDescriptor(value, key)!] as const);
    if (descriptors.some(([, descriptor]) => !('value' in descriptor))) {
      throw new Error('Unsupported GraphRAG cached accessor');
    }
    if (descriptors.some(([, descriptor]) => typeof descriptor.value === 'function')) {
      throw new Error('Unsupported GraphRAG cached value: function');
    }
    let copy: any;
    if (prototype === Date.prototype) copy = new Date(Date.prototype.getTime.call(value));
    else if (prototype === Buffer.prototype) copy = Buffer.from(value as unknown as Buffer);
    else if (prototype === Uint8Array.prototype) copy = new Uint8Array(value as unknown as Uint8Array);
    else if (prototype === Array.prototype) copy = [];
    else copy = Object.create(prototype);
    seen.set(value, copy);
    for (const [key, descriptor] of descriptors) {
      descriptor.value = this.cloneCachedValue(descriptor.value, seen);
      Object.defineProperty(copy, key, descriptor);
    }
    return copy;
  }

  /**
   * Add pattern to knowledge graph
   * Extracts entities and creates graph connections
   */
  async addPattern(pattern: Omit<PatternNode['properties'], 'lastUsed'> & {
    lastUsed?: Date;
    privacy?: GraphNode['privacy'];
  }): Promise<string> {
    if (this.softMode) throw new Error('GraphRAG legacy addPattern is not admitted in soft deletion mode');
    // Legacy properties/privacy retain caller tags/Date/nested references. Preserve ownership,
    // but never reuse memoized results after caller-held aliases can escape.
    this.disableQueryMemoization();
    this.beginGraphMutation();
    try {
      await this.initialize();

      const now = new Date();
      const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Privacy belongs to the graph node, not the pattern properties.
      const { privacy, ...properties } = pattern;

      // Create pattern node
      const patternNode: PatternNode = {
        id: patternId,
        type: 'pattern',
        label: pattern.pattern.substring(0, 60),
        properties: {
          ...properties,
          lastUsed: pattern.lastUsed || now
        },
        connections: [],
        ...(privacy !== undefined ? { privacy: { ...privacy } } : {})
      };

      // Extract entities from pattern text
      const entities = this.extractEntities(pattern);

      // Create entity nodes and edges
      const newEdges: GraphEdge[] = [];

      for (const entity of entities) {
        let entityNode = this.nodes.get(entity.id);

        // Create entity node if doesn't exist
        if (!entityNode) {
          entityNode = {
            id: entity.id,
            type: entity.type,
            label: entity.label,
            properties: {},
            connections: []
          };
          this.nodes.set(entity.id, entityNode);

          // Save entity node to Firestore
          await this.firestore.collection(this.nodesCollection).doc(entity.id).set(entityNode);
        }

        // Create edge between pattern and entity
        const edgeId = `edge_${patternId}_${entity.id}`;
        const edge: GraphEdge = {
          id: edgeId,
          source: patternId,
          target: entity.id,
          relationship: entity.relationship,
          weight: entity.weight
        };

        newEdges.push(edge);
        this.edges.set(edgeId, edge);

        // Update connections
        patternNode.connections.push(entity.id);
        entityNode.connections.push(patternId);

        // Save edge to Firestore
        await this.firestore.collection(this.edgesCollection).doc(edgeId).set(edge);

        // Update entity node in Firestore
        await this.firestore.collection(this.nodesCollection).doc(entity.id).update({
          connections: entityNode.connections
        });
      }

      // Save pattern node
      this.nodes.set(patternId, patternNode);
      this.adjacencyList.set(patternId, patternNode.connections);
      await this.firestore.collection(this.nodesCollection).doc(patternId).set(patternNode);

      console.log(`✅ Added pattern to graph: ${pattern.pattern.substring(0, 60)}`);
      console.log(`   Entities extracted: ${entities.length}`);

      return patternId;
    } finally {
      this.endGraphMutation();
    }
  }

  /**
   * Extract entities from pattern using keyword matching and heuristics
   * NO LLM REQUIRED - uses simple pattern matching
   */
  private extractEntities(pattern: any): Array<{
    id: string;
    type: NodeType;
    label: string;
    relationship: string;
    weight: number;
  }> {
    const entities: Array<{
      id: string;
      type: NodeType;
      label: string;
      relationship: string;
      weight: number;
    }> = [];

    const text = `${pattern.pattern} ${pattern.description || ''} ${pattern.code || ''}`.toLowerCase();

    // Extract agent
    if (pattern.agent) {
      entities.push({
        id: `agent_${pattern.agent}`,
        type: 'agent',
        label: pattern.agent,
        relationship: 'owned_by',
        weight: 1.0
      });
    }

    // Extract category
    if (pattern.category) {
      entities.push({
        id: `category_${pattern.category}`,
        type: 'category',
        label: pattern.category,
        relationship: 'belongs_to',
        weight: 1.0
      });
    }

    // Extract technologies (common keywords)
    const technologies = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'node', 'express', 'fastapi',
      'django', 'rails', 'go', 'java', 'spring', 'typescript', 'javascript', 'python',
      'postgresql', 'mysql', 'mongodb', 'firestore', 'supabase', 'docker', 'kubernetes',
      'jest', 'playwright', 'cypress', 'vitest', 'testing-library', 'oauth', 'jwt',
      'graphql', 'rest', 'api', 'websocket', 'sse'
    ];

    for (const tech of technologies) {
      if (text.includes(tech)) {
        entities.push({
          id: `tech_${tech}`,
          type: 'technology',
          label: tech,
          relationship: 'uses',
          weight: 0.8
        });
      }
    }

    // Extract concepts from tags
    for (const tag of pattern.tags || []) {
      entities.push({
        id: `concept_${tag}`,
        type: 'concept',
        label: tag,
        relationship: 'relates_to',
        weight: 0.6
      });
    }

    return entities;
  }

  /**
   * Query knowledge graph using graph traversal
   * Returns patterns ranked by graph centrality and path relevance
   */
  private invalidateQueryResults(): void {
    this.graphRevision++;
    this.queryResults.clear();
    this.queryResultBytes = 0;
  }

  private beginGraphMutation(): void {
    this.invalidateQueryResults();
    this.outstandingGraphMutations++;
  }

  private endGraphMutation(): void {
    this.invalidateQueryResults();
    this.outstandingGraphMutations--;
  }

  // Legacy result aliases can outlive clear/reload. Disable for the instance lifetime, not a revision.
  private disableQueryMemoization(): void {
    this.memoizationDisabled = true;
    this.invalidateQueryResults();
  }

  isCacheValid(): boolean {
    return !this.memoizationDisabled && this.initialized && this.outstandingGraphMutations === 0 &&
      this.queryResults.size > 0 && [...this.queryResults.values()].every(entry => entry.revision === this.graphRevision);
  }

  // Safe own-data inspection only. Not a universal malicious Proxy boundary.
  // A detached snapshot is captured AFTER initialize and used by both key and calculation.
  private captureCacheQuery(input: GraphRAGQuery): { key: string; query: GraphRAGQuery } | undefined {
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(input))) return undefined;
    const fields = ['query', 'agent', 'category', 'tags', 'limit', 'minRelevance',
      'userId', 'teamId', 'projectId', 'includePublic'];
    const descriptors = Object.getOwnPropertyDescriptors(input);
    const ownKeys = Reflect.ownKeys(descriptors);
    if (ownKeys.some(key => typeof key !== 'string' || !fields.includes(key))) return undefined;
    const snapshot: Record<string, any> = {};
    const encoded: any[] = [];
    for (const field of fields) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field);
      if (!descriptor) {
        if (field in input) return undefined; // Relevant inherited selectors retain legacy reads via bypass.
        encoded.push([field, 'absent']);
        continue;
      }
      if (!('value' in descriptor)) return undefined;
      const value = descriptor.value;
      if (value === undefined) { snapshot[field] = undefined; encoded.push([field, 'undefined']); continue; }
      if (field === 'tags') {
        if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > 1000) return undefined;
        const tags = Object.getOwnPropertyDescriptors(value);
        if (Reflect.ownKeys(tags).some(key => typeof key !== 'string' ||
            (key !== 'length' && !/^(0|[1-9][0-9]*)$/.test(key)))) return undefined;
        const copy: string[] = [];
        for (let index = 0; index < value.length; index++) {
          const tag = Object.getOwnPropertyDescriptor(value, String(index));
          if (!tag || !('value' in tag) || typeof tag.value !== 'string' || Buffer.byteLength(tag.value) > 8192) return undefined;
          copy.push(tag.value);
        }
        if (Reflect.ownKeys(tags).length !== value.length + 1) return undefined;
        snapshot[field] = copy;
        encoded.push([field, 'tags', copy]);
      } else if (field === 'limit' || field === 'minRelevance') {
        if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
        snapshot[field] = value;
        encoded.push([field, 'number', Object.is(value, -0) ? '-0' : value]);
      } else if (field === 'includePublic') {
        if (typeof value !== 'boolean') return undefined;
        snapshot[field] = value;
        encoded.push([field, 'boolean', value]);
      } else {
        if (typeof value !== 'string' || Buffer.byteLength(value) > 8192) return undefined;
        snapshot[field] = value;
        encoded.push([field, 'string', value]);
      }
    }
    const key = JSON.stringify(encoded);
    if (Buffer.byteLength(key) > 8192) return undefined;
    return { key, query: snapshot as GraphRAGQuery };
  }

  /** Bounded FIFO memoization; only eligible requests gain detached first-call/hit ownership.
   * Unsupported input preserves the legacy calculation/alias result and disables future admission
   * when a nonempty result exposes graph nodes. Unsupported result copying does the same.
   * Never catch calculation errors or alter filtering/ranking/defaults.
   */
  async query(query: GraphRAGQuery): Promise<GraphRAGResult[]> {
    await this.initialize();
    const captured = this.captureCacheQuery(query);
    const revision = this.graphRevision;
    const ready = !this.memoizationDisabled && this.initialized && this.outstandingGraphMutations === 0;
    if (captured && ready) {
      const cached = this.queryResults.get(captured.key);
      if (cached && cached.revision === revision) return this.cloneCachedValue(cached.result);
    }
    const result = this.computeQuery(captured ? captured.query : query);
    if (!captured) {
      if (result.length > 0) this.disableQueryMemoization();
      return result;
    }
    let detached: GraphRAGResult[];
    try { detached = this.cloneCachedValue(result); }
    catch { this.disableQueryMemoization(); return result; }
    if (!ready || this.memoizationDisabled || !this.initialized || this.outstandingGraphMutations !== 0 || this.graphRevision !== revision) {
      return detached;
    }
    // Serialized byte admission only; no claim of exact JS heap use or Firestore freshness.
    let bytes: number;
    try { bytes = Buffer.byteLength(captured.key) + Buffer.byteLength(JSON.stringify(detached)); }
    catch { return detached; } // Cyclic/BigInt values may be safely detached but are not admitted.
    if (bytes > 65536) return detached;
    while (this.queryResults.size >= 32 || this.queryResultBytes + bytes > 262144) {
      const oldest = this.queryResults.keys().next().value;
      if (oldest === undefined) break;
      this.queryResultBytes -= this.queryResults.get(oldest)!.bytes;
      this.queryResults.delete(oldest);
    }
    const entry = this.cloneCachedValue(detached);
    this.queryResults.set(captured.key, {revision, result: entry, bytes});
    this.queryResultBytes += bytes;
    return detached;
  }

  // Explicit local OR selection, not authenticated identity/tenant authorization.
  // Scope-only historical markers remain readable; missing classification is never made public.
  private isPatternSelected(node: GraphNode, query: GraphRAGQuery): boolean {
    const marker = Object.getOwnPropertyDescriptor(node, 'privacy');
    if (!marker || !('value' in marker)) return false;
    const privacy: unknown = marker.value;
    if (!privacy || typeof privacy !== 'object' || Array.isArray(privacy) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(privacy))) return false;
    let isPublic = false;
    const publicMarker = Object.getOwnPropertyDescriptor(privacy, 'isPublic');
    if (publicMarker) {
      if (!('value' in publicMarker)) return false;
      if (publicMarker.value !== undefined) {
        if (typeof publicMarker.value !== 'boolean') return false;
        isPublic = publicMarker.value;
      }
    }
    const scopes: Array<{ field: 'userId' | 'teamId' | 'projectId'; value: string }> = [];
    for (const field of ['userId', 'teamId', 'projectId'] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(privacy, field);
      if (!descriptor) continue;
      if (!('value' in descriptor)) return false;
      if (descriptor.value === undefined) continue;
      if (typeof descriptor.value !== 'string' || descriptor.value.trim().length === 0) return false;
      scopes.push({ field, value: descriptor.value });
    }
    // Validate all known marker fields before OR selection; audit metadata is not classification.
    return (isPublic && query.includePublic !== false) ||
      scopes.some(scope => typeof query[scope.field] === 'string' && query[scope.field] === scope.value);
  }

  private computeQuery(query: GraphRAGQuery): GraphRAGResult[] {
    // Extract query entities using same logic as pattern extraction
    this.requireInitializedCache();
    const queryEntities = this.extractEntities({
      pattern: query.query,
      description: '',
      agent: query.agent || '',
      category: query.category || '',
      tags: query.tags || []
    });

    console.log(`🔍 GraphRAG Query: "${query.query}"`);
    console.log(`   Query entities: ${queryEntities.map(e => e.label).join(', ')}`);

    // Find all pattern nodes connected to query entities
    const relevantPatterns = new Map<string, {
      pattern: PatternNode;
      paths: string[][];
      score: number;
    }>();

    for (const entity of queryEntities) {
      const entityNode = this.nodes.get(entity.id);
      if (!entityNode) continue;

      // Traverse graph from entity to find connected patterns (BFS with max depth 2)
      const visited = new Set<string>();
      const queue: Array<{ nodeId: string; path: string[]; depth: number }> = [
        { nodeId: entity.id, path: [entity.id], depth: 0 }
      ];

      while (queue.length > 0) {
        const { nodeId, path, depth } = queue.shift()!;

        if (visited.has(nodeId) || depth > 2) continue;
        visited.add(nodeId);

        const node = this.nodes.get(nodeId);
        if (!node) continue;

        // Exclude unclassified or unselected patterns before admission/scoring/limit AND traversal:
        // their IDs/labels must not leak through a classified result's path or explanation.
        if (node.type === 'pattern' && !this.isPatternSelected(node, query)) continue;

        // If we found a pattern node, add to results
        if (node.type === 'pattern') {
          const patternNode = node as PatternNode;

          // Apply filters
          if (query.agent && patternNode.properties.agent !== query.agent) continue;
          if (query.category && patternNode.properties.category !== query.category) continue;

          if (!relevantPatterns.has(nodeId)) {
            relevantPatterns.set(nodeId, {
              pattern: patternNode,
              paths: [],
              score: 0
            });
          }

          const existing = relevantPatterns.get(nodeId)!;
          existing.paths.push(path);

          // Calculate score based on:
          // - Path length (shorter = better)
          // - Entity weight
          // - Pattern effectiveness
          // - Pattern usage count
          const pathScore = 1.0 / (path.length + 1);
          const entityWeight = entity.weight;
          const effectivenessScore = patternNode.properties.effectiveness || 0.5;
          const usageScore = Math.min(patternNode.properties.usageCount / 10, 1.0);

          existing.score = Math.max(
            existing.score,
            pathScore * 0.4 + entityWeight * 0.2 + effectivenessScore * 0.2 + usageScore * 0.2
          );
        }

        // Explore neighbors
        if (depth < 2) {
          for (const neighborId of node.connections || []) {
            if (!visited.has(neighborId)) {
              queue.push({
                nodeId: neighborId,
                path: [...path, neighborId],
                depth: depth + 1
              });
            }
          }
        }
      }
    }

    // Convert to results and sort by score
    const results: GraphRAGResult[] = Array.from(relevantPatterns.values())
      .filter(r => r.score >= (query.minRelevance || 0.3))
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 10)
      .map(r => ({
        pattern: r.pattern,
        relevanceScore: r.score,
        graphPath: r.paths[0] || [],  // Use shortest path
        explanation: this.generateExplanation(r.pattern, r.paths[0] || [], queryEntities)
      }));

    console.log(`   Results: ${results.length} patterns found`);

    return results;
  }

  /**
   * Generate human-readable explanation for why pattern matched
   */
  private generateExplanation(pattern: PatternNode, path: string[], queryEntities: any[]): string {
    const pathLabels = path.map(id => this.nodes.get(id)?.label || id).join(' → ');
    const matchedEntities = queryEntities
      .filter(e => path.includes(e.id))
      .map(e => e.label);

    return `Matched via: ${pathLabels}. Related to: ${matchedEntities.join(', ')}`;
  }

  /**
   * Get graph statistics
   */
  async getStatistics(): Promise<{
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<NodeType, number>;
    avgConnections: number;
  }> {
    await this.initialize();

    this.requireInitializedCache();
    const nodesByType: Record<NodeType, number> = {
      pattern: 0,
      agent: 0,
      technology: 0,
      concept: 0,
      category: 0
    };

    let totalConnections = 0;

    for (const node of this.nodes.values()) {
      nodesByType[node.type]++;
      totalConnections += node.connections.length;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      avgConnections: this.nodes.size > 0 ? totalConnections / this.nodes.size : 0
    };
  }

  /**
   * Clear only a fully initialized in-memory graph; leave persistence and client intact.
   * Cached getters require reinitialization; query/addPattern/statistics retain their existing auto-initialization.
   * This is not a query-result cache or eviction policy.
   * For sequential idle use, not synchronization with concurrent mutation or close.
   */
  clearCache(): void {
    this.requireInitializedCache();
    this.beginGraphMutation();
    try {
      this.softProjectionReady = false; this.rawNodes.clear(); this.rawEdges.clear(); this.deletions.clear();
      this.nodes.clear();
      this.edges.clear();
      this.adjacencyList.clear();
      this.initialized = false;
    } finally {
      this.endGraphMutation();
    }
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    this.beginGraphMutation();
    try {
      await this.firestore.terminate();
      this.initialized = false;
      this.softProjectionReady = false; this.rawNodes.clear(); this.rawEdges.clear(); this.deletions.clear();
      this.nodes.clear();
      this.edges.clear();
      this.adjacencyList.clear();
      console.log('✅ GraphRAG Store closed');
    } finally {
      this.endGraphMutation();
    }
  }
}

// Export singleton instance
export const graphRAGStore = new GraphRAGStore();
