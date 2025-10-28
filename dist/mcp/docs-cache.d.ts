/**
 * VERSATIL Documentation Cache
 * Response caching with ETag support and compression
 */
export interface CacheEntry {
    content: string;
    etag: string;
    timestamp: Date;
    size: number;
    hits: number;
    compressed?: {
        gzip: Buffer;
        brotli: Buffer;
    };
}
export interface CacheOptions {
    maxAge?: number;
    maxEntries?: number;
    enableCompression?: boolean;
}
export interface CacheMetrics {
    totalEntries: number;
    totalSize: number;
    compressedSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
}
export declare class DocsCache {
    private cache;
    private maxAge;
    private maxEntries;
    private enableCompression;
    private metrics;
    constructor(options?: CacheOptions);
    /**
     * Generate ETag for content
     */
    generateETag(content: string): string;
    /**
     * Check if cache entry is valid (optionally validate ETag)
     */
    isCacheValid(key: string, ifNoneMatch?: string): boolean;
    /**
     * Get cached content
     */
    get(key: string, encoding?: 'gzip' | 'br'): string | Buffer | null;
    /**
     * Set cached content with optional compression
     */
    set(key: string, content: string): CacheEntry;
    /**
     * Evict oldest cache entry
     */
    private evictOldest;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache metrics
     */
    getMetrics(): CacheMetrics;
    /**
     * Get cache entry by key
     */
    getEntry(key: string): CacheEntry | null;
    /**
     * Check if cache has key
     */
    has(key: string): boolean;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Compress content (utility function)
     */
    static compress(content: string, encoding: 'gzip' | 'br'): Buffer;
    /**
     * Get compression ratio
     */
    getCompressionRatio(): {
        gzip: number;
        brotli: number;
    };
    /**
     * Reset metrics
     */
    resetMetrics(): void;
}
