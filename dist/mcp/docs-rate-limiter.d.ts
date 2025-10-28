/**
 * Rate Limiter for VERSATIL MCP Documentation Tools
 *
 * Provides rate limiting to protect against abuse:
 * - Token bucket algorithm for smooth rate limiting
 * - Per-user and per-IP rate limiting
 * - Configurable limits and time windows
 * - Automatic cleanup of expired entries
 *
 * Part of Phase 4.2: Rate Limiting
 */
/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyPrefix?: string;
}
/**
 * Rate limit result
 */
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    retryAfter?: number;
}
/**
 * Rate Limiter using Token Bucket algorithm
 */
export declare class RateLimiter {
    private limits;
    private config;
    private cleanupInterval;
    constructor(config: RateLimitConfig);
    /**
     * Check if a request is allowed
     */
    check(key: string): RateLimitResult;
    /**
     * Get current status for a key
     */
    getStatus(key: string): RateLimitResult;
    /**
     * Reset rate limit for a key
     */
    reset(key: string): void;
    /**
     * Clear all rate limits
     */
    clear(): void;
    /**
     * Get number of tracked keys
     */
    getKeyCount(): number;
    /**
     * Destroy rate limiter and cleanup
     */
    destroy(): void;
    /**
     * Private: Create new rate limit entry
     */
    private createEntry;
    /**
     * Private: Refill tokens based on time passed
     */
    private refillTokens;
    /**
     * Private: Start automatic cleanup of expired entries
     */
    private startCleanup;
    /**
     * Private: Clean up expired entries
     */
    private cleanup;
}
/**
 * Multi-tier rate limiter with different limits per tier
 */
export declare class MultiTierRateLimiter {
    private limiters;
    constructor();
    /**
     * Add a rate limit tier
     */
    addTier(name: string, config: RateLimitConfig): void;
    /**
     * Check rate limit for a specific tier
     */
    check(tier: string, key: string): RateLimitResult;
    /**
     * Get status for a specific tier
     */
    getStatus(tier: string, key: string): RateLimitResult;
    /**
     * Reset rate limit for a key in a specific tier
     */
    reset(tier: string, key: string): void;
    /**
     * Clear all rate limits in all tiers
     */
    clear(): void;
    /**
     * Get all tier names
     */
    getTiers(): string[];
    /**
     * Destroy all rate limiters
     */
    destroy(): void;
}
/**
 * Helper to create standard rate limit tiers
 */
export declare function createStandardTiers(): MultiTierRateLimiter;
/**
 * Helper to format rate limit result for HTTP headers
 */
export declare function formatRateLimitHeaders(result: RateLimitResult): Record<string, string>;
/**
 * Helper to create rate limit error message
 */
export declare function createRateLimitError(result: RateLimitResult): string;
