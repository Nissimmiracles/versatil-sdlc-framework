/**
 * VERSATIL Framework - MCP Health Monitoring
 * Tracks observed MCP execution outcomes with bounded retries and circuit breakers
 *
 * Features:
 * - Health checks for all 11 MCPs
 * - Exponential backoff retry (1s, 2s, 4s)
 * - Graceful degradation with fallbacks
 * - Real-time health status tracking
 * - Circuit breaker pattern
 */
import { EventEmitter } from 'events';
export interface MCPHealth {
    mcpId: string;
    status: 'unknown' | 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    consecutiveFailures: number;
    successRate: number;
    averageLatency: number;
    circuitOpen: boolean;
}
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    latency: number;
    retriesUsed: number;
    usedFallback: boolean;
}
export declare class MCPHealthMonitor extends EventEmitter {
    private healthStatus;
    private retryConfig;
    private monitoringInterval;
    private readonly MCP_IDS;
    constructor(retryConfig?: Partial<RetryConfig>);
    /**
     * Start continuous health monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop health monitoring
     */
    stopMonitoring(): void;
    /**
     * Execute an adapter action once by default. Callers may declare retrySafety as
     * 'read-only' or 'idempotent' only when their adapter has that guarantee.
     * Timeout never permits replay because the original action can remain running.
     */
    private metrics;
    getMetrics(mcpId: string): {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        rejectedRequests: number;
        averageLatency: number;
        lastLatency: number;
    };
    executeMCPWithRetry(mcpId: string, action: string | (() => Promise<any>), params?: any): Promise<MCPExecutionResult>;
    private executeMCP;
    /**
     * Check health of all MCPs
     */
    private checkAllMCPs;
    /**
     * Check health of individual MCP
     */
    private checkMCPHealth;
    /**
     * Record successful MCP execution
     */
    private recordSuccess;
    /**
     * Record failed MCP execution
     */
    private recordFailure;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoffDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Get health status for specific MCP
     */
    getHealthStatus(mcpId: string): MCPHealth | null;
    /**
     * Get health status for all MCPs
     */
    getAllHealthStatus(): Map<string, MCPHealth>;
    /**
     * Get unhealthy MCPs
     */
    getUnhealthyMCPs(): MCPHealth[];
    /**
     * Get overall system health percentage
     */
    getSystemHealthPercentage(): number;
    /**
     * Get overall health status for all MCPs
     */
    getOverallHealth(): Record<string, MCPHealth & {
        healthy: boolean;
    }>;
    /**
     * Check if currently monitoring
     */
    isMonitoring(): boolean;
    /**
     * Open circuit for an MCP (stop sending requests)
     */
    openCircuit(mcpId: string): void;
    /**
     * Close circuit for an MCP (resume sending requests)
     */
    closeCircuit(mcpId: string): void;
    /**
     * Set circuit to half-open (testing recovery)
     */
    halfOpenCircuit(mcpId: string): void;
    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats(mcpId?: string): {
        total: number;
        open: number;
        closed: number;
        halfOpen: number;
        rejectedRequests: number;
    };
    /**
     * Generate comprehensive health report
     */
    generateHealthReport(): {
        timestamp: Date;
        totalMCPs: number;
        healthyCount: number;
        degradedCount: number;
        unhealthyCount: number;
        overallHealth: number;
        mcps: MCPHealth[];
        circuitBreakers: ReturnType<typeof this.getCircuitBreakerStats>;
        recommendations: string[];
    };
    calculateReliabilityScore(): number;
    exportMetricsJSON(): string;
    getSummaryStats(): {
        totalMCPs: number;
        overallHealthScore: number;
        averageLatency: number;
        totalRequests: number;
    };
}
export declare const globalMCPHealthMonitor: MCPHealthMonitor;
