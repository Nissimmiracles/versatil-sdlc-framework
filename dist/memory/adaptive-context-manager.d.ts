/**
 * VERSATIL Adaptive Context Manager
 *
 * Dynamically adjusts context clearing threshold based on conversation patterns
 * to optimize prompt cache efficiency and reduce token waste.
 *
 * Research Findings:
 * - Fixed 100k threshold invalidates prompt cache aggressively
 * - Claude docs recommend 30k threshold for better cache efficiency
 * - Adaptive clearing can improve cache hit rates by 25%+
 * - Lower thresholds = more cache reuse but more frequent clears
 * - Higher thresholds = fewer clears but more cache invalidation
 *
 * Optimization Strategy:
 * 1. Start conservative (30k threshold)
 * 2. Monitor cache hit rate after each clear
 * 3. Adjust threshold based on conversation patterns
 * 4. Track tokens per message for pattern detection
 * 5. Consider conversation depth (longer = more aggressive)
 *
 * Integration: Works with ContextStatsTracker and MemoryToolConfig
 */
import { ContextStatsTracker } from './context-stats-tracker.js';
export interface ConversationMetrics {
    cacheHitRate: number;
    tokensPerMessage: number;
    conversationDepth: number;
    clearEvents: number;
    totalTokensProcessed: number;
    avgTokensSavedPerClear: number;
    memoryOperationsRate: number;
}
export interface ThresholdAdjustment {
    previousThreshold: number;
    newThreshold: number;
    reason: string;
    timestamp: Date;
    metrics: ConversationMetrics;
}
export interface AdaptiveConfig {
    minThreshold: number;
    maxThreshold: number;
    targetCacheRate: number;
    aggressiveFactor: number;
    conservativeFactor: number;
}
export declare class AdaptiveContextManager {
    private logger;
    private statsTracker;
    private currentThreshold;
    private adjustmentHistory;
    private config;
    private historyFile;
    private readonly DEFAULT_THRESHOLD;
    private readonly MIN_THRESHOLD;
    private readonly MAX_THRESHOLD;
    private readonly TARGET_CACHE_RATE;
    private readonly AGGRESSIVE_FACTOR;
    private readonly CONSERVATIVE_FACTOR;
    constructor(statsTracker: ContextStatsTracker, config?: Partial<AdaptiveConfig>);
    /**
     * Main entry point: Adjust threshold based on current conversation metrics
     */
    adjustThreshold(metrics: ConversationMetrics): Promise<number>;
    /**
     * Get current threshold recommendation
     */
    getCurrentThreshold(): number;
    /**
     * Get threshold adjustment history
     */
    getAdjustmentHistory(): ThresholdAdjustment[];
    /**
     * Calculate conversation metrics from stats tracker
     */
    calculateMetrics(): Promise<ConversationMetrics>;
    /**
     * Get optimization recommendations
     */
    getRecommendations(): Promise<string[]>;
    /**
     * Generate performance report
     */
    generateReport(): Promise<string>;
    /**
     * Reset to default threshold
     */
    reset(): void;
    /**
     * Load adjustment history from disk
     */
    private loadHistory;
    /**
     * Save adjustment history to disk
     */
    private saveHistory;
}
/**
 * Factory function for AdaptiveContextManager
 */
export declare function createAdaptiveContextManager(statsTracker: ContextStatsTracker, config?: Partial<AdaptiveConfig>): AdaptiveContextManager;
