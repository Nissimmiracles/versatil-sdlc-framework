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
 * Rate limit entry
 */
interface RateLimitEntry {
  tokens: number;
  lastRefill: Date;
  resetTime: Date;
}

/**
 * Rate Limiter using Token Bucket algorithm
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'ratelimit',
      ...config,
    };
    this.limits = new Map();

    // Start automatic cleanup
    this.startCleanup();
  }

  /**
   * Check if a request is allowed
   */
  check(key: string): RateLimitResult {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const now = new Date();

    // Get or create entry
    let entry = this.limits.get(fullKey);
    if (!entry) {
      entry = this.createEntry(now);
      this.limits.set(fullKey, entry);
    }

    // Refill tokens based on time passed
    this.refillTokens(entry, now);

    // Check if request is allowed
    if (entry.tokens > 0) {
      entry.tokens--;
      return {
        allowed: true,
        remaining: Math.floor(entry.tokens),
        resetTime: entry.resetTime,
      };
    } else {
      const retryAfter = Math.ceil(
        (entry.resetTime.getTime() - now.getTime()) / 1000
      );
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      };
    }
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): RateLimitResult {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const entry = this.limits.get(fullKey);
    const now = new Date();

    if (!entry) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: new Date(now.getTime() + this.config.windowMs),
      };
    }

    this.refillTokens(entry, now);

    return {
      allowed: entry.tokens > 0,
      remaining: Math.floor(entry.tokens),
      resetTime: entry.resetTime,
      retryAfter: entry.tokens === 0
        ? Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000)
        : undefined,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    this.limits.delete(fullKey);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Get number of tracked keys
   */
  getKeyCount(): number {
    return this.limits.size;
  }

  /**
   * Destroy rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }

  /**
   * Private: Create new rate limit entry
   */
  private createEntry(now: Date): RateLimitEntry {
    return {
      tokens: this.config.maxRequests,
      lastRefill: now,
      resetTime: new Date(now.getTime() + this.config.windowMs),
    };
  }

  /**
   * Private: Refill tokens based on time passed
   */
  private refillTokens(entry: RateLimitEntry, now: Date): void {
    const timePassed = now.getTime() - entry.lastRefill.getTime();
    const windowMs = this.config.windowMs;

    if (timePassed >= windowMs) {
      // Full refill if window has passed
      entry.tokens = this.config.maxRequests;
      entry.lastRefill = now;
      entry.resetTime = new Date(now.getTime() + windowMs);
    } else {
      // Partial refill based on time passed
      const refillRate = this.config.maxRequests / windowMs;
      const tokensToAdd = timePassed * refillRate;
      entry.tokens = Math.min(
        entry.tokens + tokensToAdd,
        this.config.maxRequests
      );
      entry.lastRefill = now;
    }
  }

  /**
   * Private: Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Private: Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.limits.entries()) {
      // Remove entries that haven't been used in 2x the window time
      const expiryTime = entry.resetTime.getTime() + this.config.windowMs;
      if (now.getTime() > expiryTime) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.limits.delete(key));
  }
}

/**
 * Multi-tier rate limiter with different limits per tier
 */
export class MultiTierRateLimiter {
  private limiters: Map<string, RateLimiter>;

  constructor() {
    this.limiters = new Map();
  }

  /**
   * Add a rate limit tier
   */
  addTier(name: string, config: RateLimitConfig): void {
    this.limiters.set(name, new RateLimiter(config));
  }

  /**
   * Check rate limit for a specific tier
   */
  check(tier: string, key: string): RateLimitResult {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Rate limit tier '${tier}' not found`);
    }
    return limiter.check(key);
  }

  /**
   * Get status for a specific tier
   */
  getStatus(tier: string, key: string): RateLimitResult {
    const limiter = this.limiters.get(tier);
    if (!limiter) {
      throw new Error(`Rate limit tier '${tier}' not found`);
    }
    return limiter.getStatus(key);
  }

  /**
   * Reset rate limit for a key in a specific tier
   */
  reset(tier: string, key: string): void {
    const limiter = this.limiters.get(tier);
    if (limiter) {
      limiter.reset(key);
    }
  }

  /**
   * Clear all rate limits in all tiers
   */
  clear(): void {
    this.limiters.forEach(limiter => limiter.clear());
  }

  /**
   * Get all tier names
   */
  getTiers(): string[] {
    return Array.from(this.limiters.keys());
  }

  /**
   * Destroy all rate limiters
   */
  destroy(): void {
    this.limiters.forEach(limiter => limiter.destroy());
    this.limiters.clear();
  }
}

/**
 * Helper to create standard rate limit tiers
 */
export function createStandardTiers(): MultiTierRateLimiter {
  const limiter = new MultiTierRateLimiter();

  // Anonymous users: 10 requests per minute
  limiter.addTier('anonymous', {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'anon',
  });

  // Authenticated users: 100 requests per minute
  limiter.addTier('authenticated', {
    maxRequests: 100,
    windowMs: 60 * 1000,
    keyPrefix: 'auth',
  });

  // Premium users: 1000 requests per minute
  limiter.addTier('premium', {
    maxRequests: 1000,
    windowMs: 60 * 1000,
    keyPrefix: 'premium',
  });

  return limiter;
}

/**
 * Helper to format rate limit result for HTTP headers
 */
export function formatRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toISOString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Helper to create rate limit error message
 */
export function createRateLimitError(result: RateLimitResult): string {
  if (result.allowed) {
    return '';
  }

  const retryAfter = result.retryAfter || 0;
  const minutes = Math.ceil(retryAfter / 60);

  if (minutes > 1) {
    return `Rate limit exceeded. Try again in ${minutes} minutes.`;
  } else if (retryAfter > 1) {
    return `Rate limit exceeded. Try again in ${retryAfter} seconds.`;
  } else {
    return 'Rate limit exceeded. Try again shortly.';
  }
}
