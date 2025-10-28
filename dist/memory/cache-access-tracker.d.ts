/**
 * Cache Access Tracker
 *
 * Tracks memory file access patterns to inform cache warming decisions
 * Records: access count, recency, agent usage, context
 *
 * Part of Enhancement 7: Cache Warming Strategy
 */
export interface AccessPattern {
    path: string;
    accessCount: number;
    lastAccessed: Date;
    firstAccessed: Date;
    agentId?: string;
    avgAccessInterval: number;
    recentAccessCount: number;
}
export interface AccessEvent {
    path: string;
    timestamp: Date;
    agentId?: string;
    operation: 'view' | 'create' | 'update';
    context?: string;
}
/**
 * Tracks memory file access patterns for cache warming optimization
 */
export declare class CacheAccessTracker {
    private patterns;
    private recentEvents;
    private statsDir;
    private readonly MAX_RECENT_EVENTS;
    constructor(statsDir?: string);
    /**
     * Initialize tracker and load historical patterns
     */
    initialize(): Promise<void>;
    /**
     * Record an access event
     */
    recordAccess(memoryPath: string, agentId?: string, operation?: AccessEvent['operation'], context?: string): Promise<void>;
    /**
     * Get top N most accessed patterns
     */
    getTopPatterns(limit?: number): Promise<AccessPattern[]>;
    /**
     * Get patterns for specific agent
     */
    getPatternsByAgent(agentId: string): Promise<AccessPattern[]>;
    /**
     * Get patterns accessed recently (last N days)
     */
    getRecentPatterns(days?: number): Promise<AccessPattern[]>;
    /**
     * Get patterns likely to be accessed next
     * Based on: recent access, regular intervals, agent patterns
     */
    predictNextPatterns(currentAgentId?: string): Promise<AccessPattern[]>;
    /**
     * Count recent accesses for a path
     */
    private countRecentAccesses;
    /**
     * Calculate recency score (0-100)
     */
    private recencyScore;
    /**
     * Save patterns and events to disk
     */
    save(): Promise<void>;
    /**
     * Clean up old patterns (not accessed in 90+ days)
     */
    cleanup(): Promise<number>;
    /**
     * Get statistics
     */
    getStatistics(): {
        totalPatterns: number;
        recentEvents: number;
        avgAccessCount: number;
        mostAccessedFile: string | null;
        mostRecentAccess: Date | null;
    };
    private fileExists;
    private dateReviver;
}
export declare function getGlobalAccessTracker(): CacheAccessTracker;
export declare function setGlobalAccessTracker(tracker: CacheAccessTracker): void;
