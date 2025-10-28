/**
 * VERSATIL Documentation Cache
 * Response caching with ETag support and compression
 */
import { createHash } from 'crypto';
import { gzipSync, brotliCompressSync } from 'zlib';
export class DocsCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes default
        this.maxEntries = options.maxEntries || 100;
        this.enableCompression = options.enableCompression !== false;
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
    }
    /**
     * Generate ETag for content
     */
    generateETag(content) {
        const hash = createHash('sha256');
        hash.update(content);
        return `"${hash.digest('hex').substring(0, 16)}"`;
    }
    /**
     * Check if cache entry is valid (optionally validate ETag)
     */
    isCacheValid(key, ifNoneMatch) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        // Check age
        const now = new Date();
        const age = now.getTime() - entry.timestamp.getTime();
        if (age > this.maxAge) {
            this.cache.delete(key);
            return false;
        }
        // If ETag is provided, must match
        if (ifNoneMatch) {
            const matches = entry.etag === ifNoneMatch;
            if (matches) {
                entry.hits++;
                this.metrics.hits++;
            }
            return matches;
        }
        // No ETag check requested, just check existence + freshness
        return true;
    }
    /**
     * Get cached content
     */
    get(key, encoding) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.metrics.misses++;
            return null;
        }
        // Check if expired
        const now = new Date();
        const age = now.getTime() - entry.timestamp.getTime();
        if (age > this.maxAge) {
            this.cache.delete(key);
            this.metrics.misses++;
            return null;
        }
        // Update metrics
        entry.hits++;
        this.metrics.hits++;
        // Return compressed version if requested
        if (encoding && entry.compressed) {
            if (encoding === 'gzip' && entry.compressed.gzip) {
                return entry.compressed.gzip;
            }
            if (encoding === 'br' && entry.compressed.brotli) {
                return entry.compressed.brotli;
            }
        }
        return entry.content;
    }
    /**
     * Set cached content with optional compression
     */
    set(key, content) {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxEntries) {
            this.evictOldest();
        }
        const etag = this.generateETag(content);
        const timestamp = new Date();
        const entry = {
            content,
            etag,
            timestamp,
            size: Buffer.byteLength(content, 'utf8'),
            hits: 0,
        };
        // Pre-compress if enabled
        if (this.enableCompression) {
            entry.compressed = {
                gzip: gzipSync(content),
                brotli: brotliCompressSync(content),
            };
        }
        this.cache.set(key, entry);
        return entry;
    }
    /**
     * Evict oldest cache entry
     */
    evictOldest() {
        let oldest = null;
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            const timestamp = entry.timestamp.getTime();
            if (timestamp < oldestTime) {
                oldestTime = timestamp;
                oldest = key;
            }
        }
        if (oldest) {
            this.cache.delete(oldest);
            this.metrics.evictions++;
        }
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache metrics
     */
    getMetrics() {
        let totalSize = 0;
        let compressedSize = 0;
        for (const entry of this.cache.values()) {
            totalSize += entry.size;
            if (entry.compressed) {
                compressedSize += entry.compressed.gzip.length;
                compressedSize += entry.compressed.brotli.length;
            }
        }
        const totalRequests = this.metrics.hits + this.metrics.misses;
        const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;
        return {
            totalEntries: this.cache.size,
            totalSize,
            compressedSize,
            hits: this.metrics.hits,
            misses: this.metrics.misses,
            hitRate,
            evictions: this.metrics.evictions,
        };
    }
    /**
     * Get cache entry by key
     */
    getEntry(key) {
        return this.cache.get(key) || null;
    }
    /**
     * Check if cache has key
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        // Check if expired
        const now = new Date();
        const age = now.getTime() - entry.timestamp.getTime();
        if (age > this.maxAge) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Compress content (utility function)
     */
    static compress(content, encoding) {
        if (encoding === 'gzip') {
            return gzipSync(content);
        }
        return brotliCompressSync(content);
    }
    /**
     * Get compression ratio
     */
    getCompressionRatio() {
        let originalSize = 0;
        let gzipSize = 0;
        let brotliSize = 0;
        for (const entry of this.cache.values()) {
            originalSize += entry.size;
            if (entry.compressed) {
                gzipSize += entry.compressed.gzip.length;
                brotliSize += entry.compressed.brotli.length;
            }
        }
        return {
            gzip: originalSize > 0 ? originalSize / gzipSize : 0,
            brotli: originalSize > 0 ? originalSize / brotliSize : 0,
        };
    }
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
    }
}
//# sourceMappingURL=docs-cache.js.map