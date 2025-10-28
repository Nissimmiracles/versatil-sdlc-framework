/**
 * Tiered Memory Store
 *
 * Three-tier memory architecture for optimal access speed and storage efficiency:
 * - Hot tier: Last 7 days, in-memory cache, <5ms access
 * - Warm tier: 7-30 days, fast disk, <50ms access
 * - Cold tier: 30+ days, compressed, retrieval-on-demand
 *
 * Enhancement 8 of Context Engineering Suite
 */
export interface MemoryEntry {
    path: string;
    content: string;
    metadata: {
        agentId?: string;
        createdAt: Date;
        lastAccessed: Date;
        accessCount: number;
        size: number;
        tier: 'hot' | 'warm' | 'cold';
    };
}
export interface TierStatistics {
    hot: {
        count: number;
        totalSize: number;
        avgAccessTime: number;
    };
    warm: {
        count: number;
        totalSize: number;
        avgAccessTime: number;
    };
    cold: {
        count: number;
        totalSize: number;
        avgAccessTime: number;
    };
    promotions: {
        hotToWarm: number;
        warmToCold: number;
        coldToHot: number;
    };
}
/**
 * Tiered Memory Store - Optimize access speed and storage efficiency
 *
 * Auto-promotion rules:
 * - Cold → Hot: On access if accessed 3+ times in last day
 * - Warm → Hot: On access if accessed 5+ times in last week
 * - Hot → Warm: Auto-demote after 7 days without access
 * - Warm → Cold: Auto-demote after 30 days without access
 */
export declare class TieredMemoryStore {
    private hotTier;
    private warmTierIndex;
    private coldTierIndex;
    private baseDir;
    private statistics;
    private readonly HOT_TIER_MAX_DAYS;
    private readonly WARM_TIER_MAX_DAYS;
    private readonly HOT_TIER_MAX_SIZE_MB;
    private readonly HOT_TIER_MAX_SIZE_BYTES;
    constructor(baseDir?: string);
    /**
     * Initialize tiered store
     */
    initialize(): Promise<void>;
    /**
     * Store memory entry (auto-assigns to hot tier)
     */
    store(memoryPath: string, content: string, agentId?: string): Promise<void>;
    /**
     * Retrieve memory entry (with auto-promotion)
     */
    retrieve(memoryPath: string): Promise<string | null>;
    /**
     * Delete memory entry from all tiers
     */
    delete(memoryPath: string): Promise<boolean>;
    /**
     * Run tier migration (move entries between tiers based on age/access)
     */
    runMigration(): Promise<{
        hotToWarm: number;
        warmToCold: number;
        coldToWarm: number;
    }>;
    /**
     * Promote entry to hot tier
     */
    private promoteToHot;
    /**
     * Demote entry to warm tier
     */
    private demoteToWarm;
    /**
     * Demote entry to cold tier (with compression)
     */
    private demoteToCold;
    /**
     * Check if entry should be promoted to hot
     */
    private shouldPromoteToHot;
    /**
     * Check if entry should be demoted to warm
     */
    private shouldDemoteToWarm;
    /**
     * Check if entry should be demoted to cold
     */
    private shouldDemoteToCold;
    /**
     * Evict least recently used entry from hot tier
     */
    private evictFromHotTier;
    /**
     * Get hot tier total size
     */
    private getHotTierSize;
    /**
     * Load indexes from disk
     */
    private loadIndexes;
    /**
     * Load hot tier into memory
     */
    private loadHotTier;
    /**
     * Write to tier
     */
    private writeToTier;
    /**
     * Read from tier
     */
    private readFromTier;
    /**
     * Delete from tier
     */
    private deleteFromTier;
    /**
     * Get statistics
     */
    getStatistics(): TierStatistics;
    /**
     * Update average access time
     */
    private updateAvgAccessTime;
    /**
     * Calculate days since date
     */
    private daysSince;
    private fileExists;
    private dateReviver;
}
export declare function getGlobalTieredStore(): TieredMemoryStore;
