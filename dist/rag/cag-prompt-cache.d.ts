/**
 * Cache Augmented Generation (CAG) - Prompt Caching Service
 *
 * Wraps Anthropic SDK to enable prompt caching for RAG queries.
 * Achieves 90% cost reduction and 10x faster responses for cached prompts.
 *
 * Benefits:
 * - Cached tokens: $0.03/MTok (vs $0.30/MTok for regular)
 * - 5-10x faster inference on cache hits
 * - Consistent context across agent queries
 *
 * Usage:
 * ```typescript
 * const cagCache = new CAGPromptCache();
 * const response = await cagCache.query({
 *   systemPrompt: "You are Enhanced James...",
 *   ragContext: retrievedDocs,
 *   userQuery: "How do I implement this component?"
 * });
 * ```
 */
import { EventEmitter } from 'events';
export interface CAGConfig {
    apiKey?: string;
    enabled: boolean;
    minPromptSize: number;
    cacheTTL: number;
    strategy: 'static' | 'dynamic' | 'adaptive';
    maxCachedBlocks: number;
    fallbackToNonCached: boolean;
}
export interface CAGQueryRequest {
    systemPrompt: string;
    ragContext: string;
    userQuery: string;
    agentId?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface CAGQueryResponse {
    content: string;
    cacheStatus: 'hit' | 'miss' | 'disabled' | 'error';
    tokenUsage: {
        cacheCreation: number;
        cacheRead: number;
        input: number;
        output: number;
    };
    costSavings: {
        regularCost: number;
        cachedCost: number;
        savings: number;
        savingsPercent: number;
    };
    latency: number;
    model: string;
}
export interface CAGMetrics {
    totalQueries: number;
    cacheHits: number;
    cacheMisses: number;
    cacheErrors: number;
    hitRate: number;
    totalCostSavings: number;
    avgLatency: {
        cached: number;
        uncached: number;
        speedup: number;
    };
    tokensSaved: number;
    byAgent: Map<string, {
        queries: number;
        hits: number;
        savings: number;
    }>;
}
export declare class CAGPromptCache extends EventEmitter {
    private anthropic;
    private config;
    private logger;
    private metrics;
    private initialized;
    private readonly COST_PER_MTOK;
    constructor(config?: Partial<CAGConfig>);
    /**
     * Initialize CAG system
     */
    initialize(): Promise<void>;
    /**
     * Execute RAG query with prompt caching
     */
    query(request: CAGQueryRequest): Promise<CAGQueryResponse>;
    /**
     * Build message structure with cache-control blocks
     *
     * Structure:
     * 1. System prompt (CACHED) - Agent identity, rarely changes
     * 2. RAG context (CACHED) - Retrieved docs, changes per query type
     * 3. User query (NOT CACHED) - Unique each time
     */
    private buildCachedMessages;
    /**
     * Extract token usage from Anthropic response
     */
    private extractTokenUsage;
    /**
     * Determine cache status from token usage
     */
    private determineCacheStatus;
    /**
     * Calculate cost savings from caching
     */
    private calculateCostSavings;
    /**
     * Update metrics after query
     */
    private updateMetrics;
    /**
     * Non-cached query fallback
     */
    private nonCachedQuery;
    /**
     * Test API connection
     */
    private testConnection;
    /**
     * Initialize metrics
     */
    private initializeMetrics;
    /**
     * Get current metrics
     */
    getMetrics(): CAGMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Get configuration
     */
    getConfig(): CAGConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<CAGConfig>): void;
    /**
     * Check if CAG is enabled and operational
     */
    isEnabled(): boolean;
}
export declare const cagPromptCache: CAGPromptCache;
