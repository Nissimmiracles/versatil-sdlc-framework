/**
 * VERSATIL Framework - Agent Pool
 * Implements agent warm-up pooling for 50% faster activation
 *
 * Features:
 * - Pre-loads 3 instances of each agent type
 * - O(1) agent retrieval from pool
 * - Automatic pool replenishment
 * - Adaptive pool sizing based on usage patterns
 * - Pool statistics tracking (hit rate, allocation time)
 */
import { BaseAgent } from './base-agent.js';
import { EventEmitter } from 'events';
export interface AgentPoolConfig {
    poolSize: number;
    enableAdaptive: boolean;
    warmUpOnInit: boolean;
    minPoolSize: number;
    maxPoolSize: number;
}
export interface PoolStatistics {
    totalRequests: number;
    poolHits: number;
    poolMisses: number;
    hitRate: number;
    averageAllocationTime: number;
    currentPoolSizes: Map<string, number>;
}
export declare class AgentPool extends EventEmitter {
    private warmAgents;
    private config;
    private vectorStore;
    private statistics;
    private allocationTimes;
    constructor(config?: Partial<AgentPoolConfig>);
    /**
     * Initialize agent pool with warm instances
     *
     * LAZY INITIALIZATION:
     * - Does NOT pre-create agents (avoids hanging on agent constructors)
     * - Just marks pool as ready
     * - Agents will be created on-demand on first getAgent() call
     * - Background warming happens asynchronously after first allocation
     */
    initialize(): Promise<void>;
    /**
     * Background warm-up (non-blocking, best-effort)
     */
    private backgroundWarmUp;
    /**
     * Get agent from pool (with fallback to cold start)
     */
    getAgent(type: string): Promise<BaseAgent>;
    /**
     * Release agent back to pool
     */
    releaseAgent(agent: BaseAgent): Promise<void>;
    /**
     * Create new agent instance (with error handling)
     */
    private createAgent;
    /**
     * Warm up agent (pre-load resources, RAG patterns, etc.)
     */
    private warmUpAgent;
    /**
     * Preload agent-specific dependencies
     */
    private preloadAgentDependencies;
    /**
     * Establish connections for agent (RAG, external services)
     */
    private establishConnections;
    /**
     * Clean up agent before returning to pool
     */
    private cleanupAgent;
    /**
     * Replenish pool to target size
     */
    private replenishPool;
    /**
     * Calculate adaptive pool size based on usage patterns
     */
    private calculateAdaptiveSize;
    /**
     * Record allocation time for statistics
     */
    private recordAllocationTime;
    /**
     * Update hit rate statistic
     */
    private updateHitRate;
    /**
     * Get pool statistics
     */
    getStatistics(): PoolStatistics;
    /**
     * Get current pool size for agent type
     */
    getPoolSize(type: string): number;
    /**
     * Clear all pools (with proper cleanup to prevent memory leaks)
     */
    clearAll(): Promise<void>;
    /**
     * Get pool statistics
     */
    getStats(): any;
    /**
     * Shutdown agent pool
     */
    shutdown(): Promise<void>;
}
export declare const globalAgentPool: AgentPool;
