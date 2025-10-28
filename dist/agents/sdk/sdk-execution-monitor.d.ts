/**
 * VERSATIL SDLC Framework - SDK Execution Monitor
 * Real-time monitoring and performance tracking for Claude SDK parallel execution
 *
 * Features:
 * - Real-time execution metrics
 * - Performance comparison (SDK vs Legacy)
 * - Health monitoring
 * - Metrics export for logging/analysis
 */
export interface ExecutionMetric {
    taskId: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'completed' | 'failed' | 'timeout';
    method: 'SDK' | 'Legacy';
    taskCount?: number;
    error?: string;
}
export interface PerformanceStats {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    medianExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
    successRate: number;
    tasksPerSecond: number;
    sdkVsLegacyComparison: ComparisonMetrics;
}
export interface ComparisonMetrics {
    sdkAverageTime: number;
    legacyAverageTime: number;
    speedupFactor: number;
    sdkSuccessRate: number;
    legacySuccessRate: number;
    recommendation: 'use-sdk' | 'use-legacy' | 'mixed';
}
export interface SDKHealth {
    sdkAvailable: boolean;
    averageResponseTime: number;
    errorRate: number;
    lastExecutionTime: number;
    consecutiveFailures: number;
    recommendSwitchToLegacy: boolean;
    healthScore: number;
}
export interface MetricsReport {
    timestamp: number;
    performanceStats: PerformanceStats;
    sdkHealth: SDKHealth;
    recentExecutions: ExecutionMetric[];
    recommendations: string[];
}
export declare class SDKExecutionMonitor {
    private executionMetrics;
    private readonly MAX_METRICS_STORED;
    private readonly CONSECUTIVE_FAILURES_THRESHOLD;
    private readonly ERROR_RATE_THRESHOLD;
    private consecutiveFailures;
    private lastExecutionTime;
    /**
     * Track SDK execution
     */
    trackExecution(taskId: string, startTime: number, endTime: number, status: 'completed' | 'failed' | 'timeout', method?: 'SDK' | 'Legacy', taskCount?: number, error?: string): void;
    /**
     * Get comprehensive performance statistics
     */
    getPerformanceStats(): PerformanceStats;
    /**
     * Compare SDK vs Legacy performance
     */
    private getComparisonMetrics;
    /**
     * Monitor SDK health
     */
    monitorSDKHealth(): SDKHealth;
    /**
     * Export metrics for logging
     */
    exportMetrics(): MetricsReport;
    /**
     * Reset monitoring statistics
     */
    reset(): void;
    /**
     * Get recent execution history
     */
    getRecentExecutions(limit?: number): ExecutionMetric[];
    private getEmptyStats;
}
export default SDKExecutionMonitor;
