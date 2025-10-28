/**
 * VERSATIL Documentation Memory Tracker
 * Memory usage tracking, leak detection, and monitoring
 */
export interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    indexSize: number;
    cacheSize: number;
    estimatedTotal: number;
    timestamp: Date;
}
export interface MemorySnapshot {
    timestamp: Date;
    heapUsed: number;
    indexSize: number;
    cacheSize: number;
}
export interface MemoryWarning {
    type: 'HIGH_USAGE' | 'MEMORY_LEAK' | 'RAPID_GROWTH';
    message: string;
    currentUsage: number;
    threshold: number;
    recommendation: string;
}
export declare class DocsMemoryTracker {
    private snapshots;
    private maxSnapshots;
    private warningThresholds;
    constructor(options?: {
        maxSnapshots?: number;
        warningThresholds?: {
            heapUsagePercent?: number;
            growthRateMbPerMin?: number;
            absoluteLimitMb?: number;
        };
    });
    /**
     * Get current memory usage
     */
    getMemoryUsage(indexSize?: number, cacheSize?: number): MemoryUsage;
    /**
     * Take a snapshot of current memory usage
     */
    takeSnapshot(indexSize?: number, cacheSize?: number): void;
    /**
     * Detect potential memory leaks based on growth rate
     */
    detectMemoryLeaks(): boolean;
    /**
     * Get memory growth rate (MB per minute)
     */
    getMemoryGrowthRate(): number | null;
    /**
     * Get memory warnings based on thresholds
     */
    getMemoryWarnings(currentUsage: MemoryUsage): MemoryWarning[];
    /**
     * Get memory time series (last N snapshots)
     */
    getMemoryTimeSeries(duration?: number): MemorySnapshot[];
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
     * Clear all snapshots
     */
    reset(): void;
    /**
     * Format memory size for display
     */
    static formatBytes(bytes: number): string;
    /**
     * Get memory usage summary as string
     */
    getMemoryUsageSummary(usage: MemoryUsage): string;
}
