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
import { Timestamp } from '@google-cloud/firestore/build/src/timestamp.js';
export type NodeType = 'pattern' | 'agent' | 'technology' | 'concept' | 'category';
export interface GraphNode {
    id: string;
    type: NodeType;
    label: string;
    properties: Record<string, any>;
    connections: string[];
    centrality?: number;
    privacy?: {
        userId?: string;
        teamId?: string;
        projectId?: string;
        isPublic: boolean;
    };
}
export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    relationship: string;
    weight: number;
}
export interface PatternNode extends GraphNode {
    type: 'pattern';
    properties: {
        pattern: string;
        description?: string;
        code?: string;
        examples?: string[];
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
    userId?: string;
    teamId?: string;
    projectId?: string;
    includePublic?: boolean;
}
export interface GraphRAGResult {
    pattern: PatternNode;
    relevanceScore: number;
    graphPath: string[];
    explanation: string;
}
/**
 * GraphRAG Store using Firestore for persistence
 */
export interface SoftDeletionMarker {
    schemaVersion: 1;
    kind: 'node' | 'edge';
    id: string;
    active: boolean;
    deletedAt: Timestamp;
    restoreUntil: Timestamp;
}
export interface SoftDeletionPlan {
    schemaVersion: 1;
    kind: 'node' | 'edge';
    ids: string[];
    cutoffMs?: number;
    createdAt: number;
    fingerprint: string;
    targets: Array<{
        id: string;
        original: GraphNode | GraphEdge | null;
        marker: SoftDeletionMarker | null;
        outcome: string;
    }>;
    warnings: string[];
}
export interface SoftDeletionResult {
    outcomes: Array<{
        id: string;
        outcome: string;
    }>;
    warnings: string[];
    acceptedAt: number;
    restoreUntil?: number;
}
export interface SoftDeletedTarget {
    kind: 'node' | 'edge';
    id: string;
    label: string;
    deletedAt: string;
    restorationGuaranteedUntil: string;
    originalAvailable: boolean;
    relatedMaskedEdgeIds?: string[];
    maskedEndpointIds?: string[];
}
export interface GraphRAGStoreOptions {
    softDeletion?: {
        clock?: () => Date;
    };
    storage?: {
        projectId: string;
        databaseId: string;
    };
}
export declare class GraphRAGStore extends EventEmitter {
    private firestore;
    private projectId;
    private nodesCollection;
    private edgesCollection;
    private initialized;
    private nodeWriteTail;
    private graphRevision;
    private outstandingGraphMutations;
    private memoizationDisabled;
    private queryResultBytes;
    private queryResults;
    private nodes;
    private edges;
    private adjacencyList;
    private readonly softMode;
    private readonly softClock;
    private readonly deletionCollection;
    private rawNodes;
    private rawEdges;
    private deletions;
    private softProjectionReady;
    private deletionKey;
    private softNow;
    private requireSoftMode;
    private parseDeletion;
    private isMasked;
    private publishSoftProjection;
    private prepareLoadedNode;
    private loadSoftGraph;
    private assertUnmasked;
    private deletionEncoding;
    private deletionFingerprint;
    private normalizeDeletionDate;
    private validateDeletionRequest;
    private inspectDeletionTargets;
    planSoftDeletion(input: {
        kind: 'node' | 'edge';
        id: string;
    }): Promise<SoftDeletionPlan>;
    planOldPatterns(input: {
        cutoff: Date;
        ids: string[];
    }): Promise<SoftDeletionPlan>;
    private planDeletion;
    applySoftDeletion(input: SoftDeletionPlan): Promise<SoftDeletionResult>;
    deleteNode(id: string): Promise<SoftDeletionResult>;
    deleteEdge(id: string): Promise<SoftDeletionResult>;
    deleteOldPatterns(cutoff: Date, scope?: {
        ids: string[];
    }): Promise<SoftDeletionResult>;
    /** Trusted in-process recovery view; metadata selectors do not establish caller authorization. */
    listSoftDeletedTargets(options?: {
        offset?: number;
        limit?: number;
    }): Promise<{
        items: SoftDeletedTarget[];
        total: number;
    }>;
    restoreNode(id: string): Promise<SoftDeletionResult>;
    restoreEdge(id: string): Promise<SoftDeletionResult>;
    private restoreSoftTarget;
    constructor(options?: GraphRAGStoreOptions);
    initialize(): Promise<void>;
    /**
     * Load graph from Firestore into memory for fast traversal
     */
    private loadGraph;
    private loadNodesFromFirestore;
    private loadEdgesFromFirestore;
    addNode(input: GraphNode): Promise<void>;
    updateNode(input: Pick<GraphNode, 'id'> & Partial<Omit<GraphNode, 'id'>>): Promise<void>;
    batchAddNodes(input: GraphNode[]): Promise<void>;
    /** New create-only directed edge convention; both endpoints must exist in persisted storage.
     * Preserve source metadata, add target exactly once, and publish only after the atomic commit.
     * Uses the node-writer queue; older addPattern/clear/close races remain outside that guarantee.
     */
    addEdge(input: GraphEdge): Promise<void>;
    /** Stable caller-ID pattern create. This path alone deliberately links both pattern and entities.
     * Shared entities retain authoritative metadata; explicit pattern privacy is stored, not authorized.
     * Uses the new-writer queue, without claiming safety for older addPattern/clear/close races.
     */
    storePattern(input: PatternNode): Promise<void>;
    /** Explicit durable usage accounting only; reads/query do not become writes and lastUsed is unchanged. */
    incrementUsageCount(id: string): Promise<void>;
    private preparePatternWrite;
    private appendPatternConnections;
    private serializeNodeWrite;
    private publishNodeWrite;
    private invalidateNodeWriteCache;
    private validateNodeDocumentId;
    private prepareNodeWrite;
    private validateNodeWriteData;
    private nodeWriteDataSize;
    /** Trusted in-process whole-cache views; these perform no privacy filtering. */
    getNode(id: string): GraphNode | undefined;
    getEdge(id: string): GraphEdge | undefined;
    getNodesByType(type: NodeType): GraphNode[];
    getEdgesForNode(id: string): GraphEdge[];
    private getHighCentralityNodes;
    /** Returns the loaded node's declared connection IDs, including unresolved IDs. */
    getNeighbors(id: string): string[];
    private bfsTraversal;
    private findShortestPath;
    private calculateRelevance;
    private boostByCentrality;
    private metricSnapshot;
    /** New deterministic PageRank convention. Only complete converged scores are published in memory.
     * Receipt carries the detached source topology/options; reload restores persisted scores.
     * No query-ranking integration, backend writes, or concurrent mutation guarantee is introduced.
     */
    calculateCentrality(input?: {
        damping?: number;
        tolerance?: number;
        maxIterations?: number;
    }): Promise<{
        algorithm: "pagerank";
        converged: true;
        iterations: number;
        options: {
            damping: number;
            tolerance: number;
            maxIterations: number;
        };
        sourceConnections: {
            id: string;
            connections: string[];
        }[];
        scores: {
            id: string;
            centrality: number;
        }[];
    }>;
    /** New bounded deterministic Louvain convention: unweighted undirected projection of unique
     * existing declared links, ignoring original self/dangling links. Local moving + aggregation
     * optimize standard modularity (resolution1); these are structural, not semantic communities.
     */
    detectCommunities(input?: {
        maxPasses?: number;
        maxLevels?: number;
    }): Promise<string[][]>;
    private calculateLouvain;
    /** New structural relatedness convention: existing directed hops <=2, distance/discovery ties,
     * excluding the seed. Returns detached GraphNodes of type pattern, not tenant-filtered results.
     */
    findRelatedPatterns(startId: string, limit?: number): Promise<GraphNode[]>;
    private requireInitializedCache;
    private cloneCachedValue;
    /**
     * Add pattern to knowledge graph
     * Extracts entities and creates graph connections
     */
    addPattern(pattern: Omit<PatternNode['properties'], 'lastUsed'> & {
        lastUsed?: Date;
        privacy?: GraphNode['privacy'];
    }): Promise<string>;
    /**
     * Extract entities from pattern using keyword matching and heuristics
     * NO LLM REQUIRED - uses simple pattern matching
     */
    private extractEntities;
    /**
     * Query knowledge graph using graph traversal
     * Returns patterns ranked by graph centrality and path relevance
     */
    private invalidateQueryResults;
    private beginGraphMutation;
    private endGraphMutation;
    private disableQueryMemoization;
    isCacheValid(): boolean;
    private captureCacheQuery;
    /** Bounded FIFO memoization; only eligible requests gain detached first-call/hit ownership.
     * Unsupported input preserves the legacy calculation/alias result and disables future admission
     * when a nonempty result exposes graph nodes. Unsupported result copying does the same.
     * Never catch calculation errors or alter filtering/ranking/defaults.
     */
    query(query: GraphRAGQuery): Promise<GraphRAGResult[]>;
    private isPatternSelected;
    private computeQuery;
    /**
     * Generate human-readable explanation for why pattern matched
     */
    private generateExplanation;
    /**
     * Get graph statistics
     */
    getStatistics(): Promise<{
        totalNodes: number;
        totalEdges: number;
        nodesByType: Record<NodeType, number>;
        avgConnections: number;
    }>;
    /**
     * Clear only a fully initialized in-memory graph; leave persistence and client intact.
     * Cached getters require reinitialization; query/addPattern/statistics retain their existing auto-initialization.
     * This is not a query-result cache or eviction policy.
     * For sequential idle use, not synchronization with concurrent mutation or close.
     */
    clearCache(): void;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
export declare const graphRAGStore: GraphRAGStore;
