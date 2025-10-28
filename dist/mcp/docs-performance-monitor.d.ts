/**
 * VERSATIL Documentation Performance Monitor
 * Query timing, cache hit rates, and Prometheus metrics export
 */
export interface QueryMetric {
    query: string;
    duration: number;
    cacheHit: boolean;
    timestamp: Date;
    resultCount?: number;
}
export interface IndexBuildMetric {
    duration: number;
    documentCount: number;
    timestamp: Date;
}
export interface PerformanceMetrics {
    totalQueries: number;
    cacheHitRate: number;
    avgQueryDuration: number;
    p50QueryDuration: number;
    p95QueryDuration: number;
    p99QueryDuration: number;
    totalIndexBuilds: number;
    avgIndexBuildDuration: number;
    lastIndexBuild: Date | null;
    startTime: Date;
    uptimeMs: number;
}
export declare class DocsPerformanceMonitor {
    private queryMetrics;
    private indexBuildMetrics;
    private startTime;
    private maxMetrics;
    constructor(options?: {
        maxMetrics?: number;
    });
    /**
     * Track a query execution
     */
    trackQuery(query: string, duration: number, cacheHit: boolean, resultCount?: number): void;
    /**
     * Track an index build
     */
    trackIndexBuild(duration: number, documentCount: number): void;
    /**
     * Calculate percentile from sorted array
     */
    private calculatePercentile;
    /**
     * Get performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Export metrics in Prometheus format
     */
    exportPrometheus(): string;
    /**
     * Get recent queries
     */
    getRecentQueries(limit?: number): QueryMetric[];
    /**
     * Get slowest queries
     */
    getSlowestQueries(limit?: number): QueryMetric[];
    /**
     * Get recent index builds
     */
    getRecentIndexBuilds(limit?: number): IndexBuildMetric[];
    /**
     * Reset all metrics
     */
    reset(): void;
    /**
     * Get query count by time window
     */
    getQueryCountByWindow(windowMs: number): number;
    /**
     * Get cache hit rate by time window
     */
    getCacheHitRateByWindow(windowMs: number): number;
}
