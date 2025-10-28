/**
 * VERSATIL OPERA v6.0 - Context Sentinel Agent
 *
 * Guardian of context integrity and token efficiency:
 * - Monitors context window utilization (real-time)
 * - Prevents context loss (zero information loss)
 * - Triggers emergency compaction at 85% usage
 * - Optimizes prompt caching effectiveness
 * - Detects context drift and staleness
 *
 * Critical for production reliability.
 *
 * @module ContextSentinel
 * @version 6.0.0
 */
import { EventEmitter } from 'events';
export interface ContextUsage {
    totalTokens: number;
    maxTokens: number;
    percentage: number;
    breakdown: {
        cachedTokens: number;
        dynamicTokens: number;
        toolOutputTokens: number;
        conversationTokens: number;
    };
    perFlywheel: {
        [flywheel: string]: number;
    };
    cacheHitRate: number;
    wastePercentage: number;
}
export interface ContextRisk {
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: 'high_usage' | 'low_cache_efficiency' | 'high_waste' | 'flywheel_imbalance';
    description: string;
    recommendation: string;
    autoRecoverable: boolean;
}
export interface CompactionResult {
    tokensReclaimed: number;
    newPercentage: number;
    maskedTokens: number;
    summarizedTokens: number;
    pausedFlywheel: string | null;
}
export interface IntegrityCheck {
    passed: boolean;
    lostInformation: string[];
    recommendation: string | null;
}
export interface ContextDashboard {
    usage: ContextUsage;
    risks: ContextRisk[];
    integrityStatus: IntegrityCheck;
    recommendations: string[];
    timestamp: number;
}
export declare class ContextSentinel extends EventEmitter {
    private monitoringInterval;
    private contextHistory;
    private readonly MAX_TOKENS;
    private readonly USABLE_TOKENS;
    private readonly EMERGENCY_THRESHOLD;
    private readonly MONITORING_INTERVAL;
    private readonly HISTORY_RETENTION;
    private readonly CRITICAL_CONTEXT;
    constructor();
    /**
     * Start continuous monitoring
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Run complete context check
     */
    runContextCheck(): Promise<ContextDashboard>;
    /**
     * Measure current context usage
     */
    private measureContextUsage;
    /**
     * Estimate current tokens (simplified)
     */
    private estimateCurrentTokens;
    /**
     * Estimate cache hit rate
     */
    private estimateCacheHitRate;
    /**
     * Estimate waste percentage
     */
    private estimateWastePercentage;
    /**
     * Store usage in history
     */
    private storeUsageHistory;
    /**
     * Detect context risks
     */
    private detectContextRisks;
    /**
     * EMERGENCY COMPACTION
     * Triggered at 85% usage (170K tokens)
     */
    private emergencyCompaction;
    /**
     * Observation Masking
     * Remove stale tool outputs (26-54% token reduction - ACON)
     */
    private observationMasking;
    /**
     * Hierarchical Summarization
     * Summarize at flywheel handoff boundaries
     */
    private hierarchicalSummarization;
    /**
     * Pause lowest-priority flywheel
     */
    private pauseLowestPriorityFlywheel;
    /**
     * Validate context integrity
     * Ensure no critical information lost
     */
    private validateContextIntegrity;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get current context dashboard
     */
    getCurrentContext(): Promise<ContextDashboard>;
    /**
     * Get context usage trend (last 5 minutes)
     */
    getUsageTrend(): {
        increasing: boolean;
        rate: number;
    };
    /**
     * Cleanup
     */
    destroy(): void;
}
