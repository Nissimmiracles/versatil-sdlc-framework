/**
 * LRU (Least Recently Used) Cache Implementation
 * Manages memory-efficient caching with automatic eviction
 */
export interface CacheEntry<V> {
    value: V;
    timestamp: number;
    accessCount: number;
}
export interface CacheStats {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    evictions: number;
    hitRate: number;
}
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    private maxAge;
    private stats;
    constructor(maxSize?: number, maxAgeMs?: number);
    /**
     * Get value from cache
     */
    get(key: K): V | undefined;
    /**
     * Set value in cache
     */
    set(key: K, value: V): void;
    /**
     * Check if key exists
     */
    has(key: K): boolean;
    /**
     * Delete key from cache
     */
    delete(key: K): boolean;
    /**
     * Clear all entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get all keys
     */
    keys(): K[];
    /**
     * Get cache size
     */
    get size(): number;
    /**
     * Cleanup expired entries
     */
    cleanup(): void;
    /**
     * Get entries sorted by access count (for analytics)
     */
    getTopEntries(limit?: number): Array<{
        key: K;
        accessCount: number;
    }>;
}
