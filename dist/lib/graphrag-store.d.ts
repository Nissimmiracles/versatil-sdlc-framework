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
export declare class GraphRAGStore extends EventEmitter {
    private firestore;
    private projectId;
    private nodesCollection;
    private edgesCollection;
    private initialized;
    private nodes;
    private edges;
    private adjacencyList;
    constructor();
    initialize(): Promise<void>;
    /**
     * Load graph from Firestore into memory for fast traversal
     */
    private loadGraph;
    /**
     * Add pattern to knowledge graph
     * Extracts entities and creates graph connections
     */
    addPattern(pattern: Omit<PatternNode['properties'], 'lastUsed'> & {
        lastUsed?: Date;
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
    query(query: GraphRAGQuery): Promise<GraphRAGResult[]>;
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
     * Cleanup resources
     */
    close(): Promise<void>;
}
export declare const graphRAGStore: GraphRAGStore;
