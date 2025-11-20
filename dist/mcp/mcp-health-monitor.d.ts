/**
 * VERSATIL Framework - MCP Health Monitoring
 * Ensures 95%+ MCP reliability with auto-retry and fallbacks
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
    status: 'healthy' | 'degraded' | 'unhealthy';
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
     * Execute MCP action with retry logic
     */
    executeMCPWithRetry(mcpId: string, action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Execute MCP action (to be implemented by actual MCP executors)
     */
    private executeMCP;
    /**
     * Use fallback mechanism for MCP
     */
    private useFallback;
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
    getHealthStatus(mcpId: string): MCPHealth | undefined;
    /**
     * Get health status for all MCPs
     */
    getAllHealthStatus(): MCPHealth[];
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
    getCircuitBreakerStats(): {
        total: number;
        open: number;
        closed: number;
        halfOpen: number;
    };
    /**
     * Generate comprehensive health report
     */
    generateHealthReport(): {
        timestamp: Date;
        overallHealth: number;
        mcps: MCPHealth[];
        circuitBreakers: ReturnType<typeof this.getCircuitBreakerStats>;
        recommendations: string[];
    };
}
export declare const globalMCPHealthMonitor: MCPHealthMonitor;
