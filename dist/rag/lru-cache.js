/**
 * LRU (Least Recently Used) Cache Implementation
 * Manages memory-efficient caching with automatic eviction
 */
export class LRUCache {
    constructor(maxSize = 1000, maxAgeMs = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.maxAge = maxAgeMs;
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return undefined;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            this.stats.misses++;
            this.stats.evictions++;
            return undefined;
        }
        // Update access stats
        entry.accessCount++;
        entry.timestamp = Date.now();
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);
        this.stats.hits++;
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value) {
        // Check if key exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.stats.evictions++;
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 0
        });
    }
    /**
     * Check if key exists
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        // Check expiration
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete key from cache
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
        };
    }
    /**
     * Get all keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get cache size
     */
    get size() {
        return this.cache.size;
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.maxAge) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
            this.stats.evictions++;
        }
    }
    /**
     * Get entries sorted by access count (for analytics)
     */
    getTopEntries(limit = 10) {
        const entries = Array.from(this.cache.entries());
        return entries
            .sort((a, b) => b[1].accessCount - a[1].accessCount)
            .slice(0, limit)
            .map(([key, entry]) => ({ key, accessCount: entry.accessCount }));
    }
}
//# sourceMappingURL=lru-cache.js.map