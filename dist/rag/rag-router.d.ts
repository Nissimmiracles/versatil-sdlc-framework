/**
 * RAG Router - Intelligent Query Routing
 *
 * Routes queries to appropriate RAG stores and merges results:
 * - Private RAG first (user's own patterns - highest priority)
 * - Public RAG second (framework patterns - fallback)
 * - Merges and deduplicates results
 * - Privacy-aware filtering
 *
 * Priority Rules:
 * 1. Private patterns ALWAYS prioritized over public
 * 2. User's own solutions preferred over generic ones
 * 3. Deduplication prevents overlap
 * 4. Relevance score tiebreaker within same source
 */
import { GraphRAGQuery, GraphRAGResult } from '../lib/graphrag-store.js';
import { StorageDestination } from './sanitization-policy.js';
export interface RAGRouterConfig {
    preferPrivate?: boolean;
    includePublic?: boolean;
    deduplicateResults?: boolean;
    maxResults?: number;
}
export interface RAGSearchResult extends GraphRAGResult {
    source: 'public' | 'private';
    priority: number;
}
/**
 * RAG Router - Routes queries to public/private stores
 */
export declare class RAGRouter {
    private publicRAG;
    private privateRAG;
    private config;
    constructor(config?: RAGRouterConfig);
    /**
     * Initialize Private RAG if configured
     */
    private initializePrivateRAG;
    /**
     * Log router configuration
     */
    private logConfiguration;
    /**
     * Main query method - routes to appropriate stores
     */
    query(query: GraphRAGQuery): Promise<RAGSearchResult[]>;
    /**
     * Query Private RAG store
     */
    private queryPrivateRAG;
    /**
     * Query Public RAG store
     */
    private queryPublicRAG;
    /**
     * Merge results with privacy-aware prioritization
     *
     * Rules:
     * 1. Private patterns always ranked higher than public
     * 2. Within same source, sort by relevance score
     * 3. Deduplicate similar patterns (optional)
     * 4. Limit to maxResults
     */
    private mergeResults;
    /**
     * Deduplicate results by pattern similarity
     *
     * If public and private have similar patterns, keep private only.
     */
    private deduplicateResults;
    /**
     * Generate unique key for pattern (for deduplication)
     */
    private getPatternKey;
    /**
     * Count results by source
     */
    private countBySource;
    /**
     * Check if Private RAG is available
     */
    hasPrivateRAG(): boolean;
    /**
     * Get router statistics
     */
    getStats(): Promise<{
        publicRAG: {
            available: boolean;
            patterns?: number;
        };
        privateRAG: {
            available: boolean;
            backend?: string;
            patterns?: number;
        };
        lastQuery?: {
            query: string;
            privateResults: number;
            publicResults: number;
            totalResults: number;
        };
    }>;
    /**
     * Suggest Private RAG setup if beneficial
     */
    shouldSuggestPrivateRAG(queryResults: RAGSearchResult[]): boolean;
    /**
     * Get suggestion message for Private RAG setup
     */
    getPrivateRAGSuggestion(): string;
    /**
     * Store pattern in appropriate RAG store based on destination
     */
    storePattern(pattern: any, destination: StorageDestination): Promise<string>;
    /**
     * Get singleton instance
     */
    static getInstance(config?: RAGRouterConfig): RAGRouter;
}
export declare function getRAGRouter(config?: RAGRouterConfig): RAGRouter;
export declare const ragRouter: RAGRouter;
