/**
 * VERSATIL Documentation Search Engine
 * Provides fast, indexed search across all framework documentation
 */
import { CacheOptions } from './docs-cache.js';
import { DocsProgressTracker, ProgressCallback } from './docs-progress-tracker.js';
import { ResultStream, StreamOptions } from './docs-streaming.js';
import { SuggestionsEngine, Suggestion, SuggestionOptions } from './docs-suggestions.js';
export interface DocumentMetadata {
    filePath: string;
    relativePath: string;
    title: string;
    category: DocCategory;
    size: number;
    lastModified: Date;
    keywords: string[];
}
export interface SearchResult {
    document: DocumentMetadata;
    excerpt: string;
    relevanceScore: number;
    matchCount: number;
}
export interface AgentDoc {
    agentId: string;
    name: string;
    role: string;
    capabilities: string[];
    triggers: string[];
    filePatterns: string[];
    examples: string[];
    integration: string[];
}
export interface WorkflowDoc {
    workflowType: string;
    name: string;
    description: string;
    phases: WorkflowPhase[];
    timeSavings: string;
    examples: string[];
}
export interface WorkflowPhase {
    name: string;
    duration: string;
    agents: string[];
    activities: string[];
}
export type DocCategory = 'agents' | 'workflows' | 'rules' | 'mcp' | 'guides' | 'troubleshooting' | 'quick-reference' | 'architecture' | 'testing' | 'security' | 'completion' | 'all';
export declare class DocsSearchEngine {
    private docsPath;
    private projectPath;
    private documentIndex;
    private indexBuilt;
    private lastIndexBuild;
    private indexBuildPromise;
    private maxFileSize;
    private indexTTL;
    private cache;
    private performanceMonitor;
    private memoryTracker;
    private progressTracker;
    private streamManager;
    private suggestionsEngine;
    constructor(projectPath: string, options?: {
        maxFileSize?: number;
        indexTTL?: number;
        cacheOptions?: CacheOptions;
        enablePerformanceMonitoring?: boolean;
        enableMemoryTracking?: boolean;
        enableProgressTracking?: boolean;
        enableStreaming?: boolean;
        enableSuggestions?: boolean;
    });
    /**
     * Build search index from all documentation files
     * @param force - Force rebuild even if index is fresh
     * @param onProgress - Optional progress callback
     */
    buildIndex(force?: boolean, onProgress?: ProgressCallback): Promise<void>;
    /**
     * Force rebuild of documentation index
     */
    rebuildIndex(): Promise<void>;
    /**
     * Check if index is stale (older than TTL)
     */
    isIndexStale(): boolean;
    /**
     * Get index metadata
     */
    getIndexMetadata(): {
        built: boolean;
        lastBuild: Date | null;
        isStale: boolean;
        documentsCount: number;
        ttlMs: number;
    };
    /**
     * Search documentation with keyword matching (with performance tracking)
     */
    search(query: string, category?: DocCategory): Promise<SearchResult[]>;
    /**
     * Search with streaming results (incremental delivery)
     * @returns Stream ID and stream object for consuming results
     */
    searchStreaming(query: string, category?: DocCategory, options?: StreamOptions): Promise<{
        streamId: string;
        stream: ResultStream<SearchResult>;
    }>;
    /**
     * Get stream by ID
     */
    getStream(streamId: string): ResultStream<SearchResult> | undefined;
    /**
     * Remove completed stream
     */
    removeStream(streamId: string): void;
    /**
     * Cleanup completed streams
     */
    cleanupStreams(): void;
    /**
     * Get streaming statistics
     */
    getStreamingStatistics(): {
        totalStreams: number;
        activeStreams: number;
        completedStreams: number;
    };
    /**
     * Get complete document content with security validation and caching
     */
    getDocument(relativePath: string, options?: {
        bypassCache?: boolean;
    }): Promise<string>;
    /**
     * Get all documents in a category
     */
    getDocumentsByCategory(category: DocCategory): Promise<DocumentMetadata[]>;
    /**
     * Get documentation index (all documents)
     */
    getIndex(): Promise<DocumentMetadata[]>;
    /**
     * Extract title from markdown content
     */
    private extractTitle;
    /**
     * Determine document category from path
     */
    private determineCategory;
    /**
     * Extract keywords from document
     */
    private extractKeywords;
    /**
     * Extract relevant excerpt around query terms
     */
    extractExcerpt(content: string, queryTerms: string[], contextLines?: number): string;
    /**
     * Get cache metrics
     */
    getCacheMetrics(): import("./docs-cache.js").CacheMetrics;
    /**
     * Get ETag for document (for HTTP 304 support)
     */
    getDocumentETag(relativePath: string): string | null;
    /**
     * Check if cached document is still valid
     */
    isCacheValid(relativePath: string, ifNoneMatch?: string): boolean;
    /**
     * Clear document cache
     */
    clearCache(): void;
    /**
     * Get compression ratio
     */
    getCompressionRatio(): {
        gzip: number;
        brotli: number;
    };
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): import("./docs-performance-monitor.js").PerformanceMetrics;
    /**
     * Export performance metrics in Prometheus format
     */
    exportPrometheusMetrics(): string;
    /**
     * Get recent queries for monitoring
     */
    getRecentQueries(limit?: number): import("./docs-performance-monitor.js").QueryMetric[];
    /**
     * Get slowest queries for optimization
     */
    getSlowestQueries(limit?: number): import("./docs-performance-monitor.js").QueryMetric[];
    /**
     * Estimate index size in bytes
     * @private
     */
    private estimateIndexSize;
    /**
     * Get current memory usage
     */
    getMemoryUsage(): import("./docs-memory-tracker.js").MemoryUsage;
    /**
     * Get memory warnings based on thresholds
     */
    getMemoryWarnings(): import("./docs-memory-tracker.js").MemoryWarning[];
    /**
     * Get memory statistics
     */
    getMemoryStats(): {
        avgHeapUsed: number;
        maxHeapUsed: number;
        minHeapUsed: number;
        currentGrowthRate: number | null;
        totalSnapshots: number;
    };
    /**
     * Get memory time series data
     */
    getMemoryTimeSeries(duration?: number): import("./docs-memory-tracker.js").MemorySnapshot[];
    /**
     * Get formatted memory usage summary
     */
    getMemoryUsageSummary(): string;
    /**
     * Get progress tracker for manual operations
     */
    getProgressTracker(): DocsProgressTracker;
    /**
     * Get active operations with progress
     */
    getActiveOperations(): import("./docs-progress-tracker.js").ProgressOperation[];
    /**
     * Get progress for a specific operation
     */
    getOperationProgress(operationId: string): import("./docs-progress-tracker.js").ProgressEvent;
    /**
     * Subscribe to progress updates for buildIndex
     */
    subscribeToProgress(operationId: string, callback: ProgressCallback): void;
    /**
     * Unsubscribe from progress updates
     */
    unsubscribeFromProgress(operationId: string, callback: ProgressCallback): void;
    /**
     * Get search suggestions for a query
     */
    getSuggestions(query: string, options?: SuggestionOptions): Suggestion[];
    /**
     * Get suggestions engine for direct access
     */
    getSuggestionsEngine(): SuggestionsEngine;
    /**
     * Get suggestion statistics
     */
    getSuggestionStatistics(): {
        totalTerms: number;
        totalOccurrences: number;
        averageFrequency: number;
        relatedTermsCount: number;
    };
}
