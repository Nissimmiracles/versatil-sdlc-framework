/**
 * Cache Warmer
 *
 * Pre-populates Claude's prompt cache with frequently accessed patterns
 * Reduces cache misses by pre-seeding common memory files before they're needed
 *
 * Enhancement 7 of Context Engineering Suite
 */
import { type AccessPattern } from './cache-access-tracker.js';
export interface WarmingStrategy {
    name: string;
    description: string;
    shouldWarm: (pattern: AccessPattern) => boolean;
    priority: number;
}
export interface WarmingResult {
    filesWarmed: number;
    totalTokens: number;
    cacheHitRateImprovement: number;
    timeSpent: number;
    filesSkipped: number;
    errors: string[];
}
export interface CacheWarmingConfig {
    enabled: boolean;
    maxFilesToWarm: number;
    maxTokensPerWarm: number;
    strategies: WarmingStrategy[];
    warmOnSessionStart: boolean;
    warmOnAgentActivation: boolean;
    intelligentPrefetch: boolean;
}
/**
 * Cache Warmer - Pre-seeds Claude's cache with frequently accessed patterns
 *
 * Strategies:
 * 1. Frequency-based: Warm most-accessed files
 * 2. Recency-based: Warm recently accessed files
 * 3. Agent-based: Warm files for about-to-activate agents
 * 4. Pattern-based: Warm files matching current work patterns
 */
export declare class CacheWarmer {
    private accessTracker;
    private config;
    private statsDir;
    private lastWarmingTime;
    private cachedContent;
    private readonly DEFAULT_STRATEGIES;
    constructor(config?: Partial<CacheWarmingConfig>, statsDir?: string);
    /**
     * Initialize cache warmer
     */
    initialize(): Promise<void>;
    /**
     * Perform cache warming
     *
     * @param agentId - Optional agent ID for agent-specific warming
     * @returns Result of warming operation
     */
    warm(agentId?: string): Promise<WarmingResult>;
    /**
     * Warm cache for specific agent activation
     */
    warmForAgent(agentId: string): Promise<WarmingResult>;
    /**
     * Intelligent prefetch: Predict what will be needed next
     */
    intelligentPrefetch(currentContext: {
        agentId?: string;
        taskType?: string;
        recentFiles?: string[];
    }): Promise<WarmingResult>;
    /**
     * Select files to warm based on strategies
     */
    private selectFilesToWarm;
    /**
     * Warm specific files
     */
    private warmSpecificFiles;
    /**
     * Predict files that will be needed next based on context
     */
    private predictNeededFiles;
    /**
     * Load memory file content
     */
    private loadMemoryFile;
    /**
     * Save cached content to disk
     */
    private saveCachedContent;
    /**
     * Get current active agent (from environment or context)
     */
    private getCurrentAgent;
    /**
     * Calculate days since date
     */
    private daysSince;
    /**
     * Calculate hours since date
     */
    private hoursSince;
    /**
     * Empty result helper
     */
    private emptyResult;
    /**
     * Get warmed content (for use in context)
     */
    getWarmedContent(): Map<string, {
        content: string;
        tokens: number;
        timestamp: Date;
    }>;
    /**
     * Clear stale cached content (older than 1 hour)
     */
    clearStaleContent(): number;
    /**
     * Get warming statistics
     */
    getStatistics(): {
        lastWarmingTime: Date | null;
        cachedFiles: number;
        totalCachedTokens: number;
        avgFileSize: number;
        oldestCache: Date | null;
    };
    private fileExists;
    private dateReviver;
}
export declare function getGlobalCacheWarmer(): CacheWarmer;
export declare function setGlobalCacheWarmer(warmer: CacheWarmer): void;
