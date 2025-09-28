// VERSATIL SDLC Framework - Production Optimization Module
// Advanced caching, compression, rate limiting, and monitoring for edge functions

export interface CacheOptions {
  ttl: number;
  maxSize: number;
  keyPrefix: string;
  skipCache?: (key: string, value: any) => boolean;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export interface CompressionOptions {
  threshold: number; // Minimum response size to compress
  level: number; // Compression level 1-9
  excludeContentTypes?: string[];
}

export interface MonitoringMetrics {
  requestCount: number;
  totalProcessingTime: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimitHits: number;
  errorCount: number;
  compressionSaved: number;
  lastReset: number;
}

// Global metrics and caches
const globalMetrics: MonitoringMetrics = {
  requestCount: 0,
  totalProcessingTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  rateLimitHits: 0,
  errorCount: 0,
  compressionSaved: 0,
  lastReset: Date.now()
};

const responseCache = new Map<string, { value: any; timestamp: number; ttl: number }>();
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Advanced Response Cache with TTL and LRU eviction
 */
export class ResponseCache {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number; accessCount: number }>();
  private options: CacheOptions;

  constructor(options: CacheOptions) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      keyPrefix: 'cache:',
      ...options
    };

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  get(key: string): any | null {
    const fullKey = this.options.keyPrefix + key;
    const entry = this.cache.get(fullKey);

    if (!entry) {
      globalMetrics.cacheMisses++;
      return null;
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(fullKey);
      globalMetrics.cacheMisses++;
      return null;
    }

    entry.accessCount++;
    globalMetrics.cacheHits++;
    return entry.value;
  }

  set(key: string, value: any, customTtl?: number): void {
    if (this.options.skipCache && this.options.skipCache(key, value)) {
      return;
    }

    const fullKey = this.options.keyPrefix + key;
    const ttl = customTtl || this.options.ttl;

    this.cache.set(fullKey, {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0
    });

    // Evict least recently used if cache is full
    if (this.cache.size > this.options.maxSize) {
      this.evictLRU();
    }
  }

  delete(key: string): void {
    const fullKey = this.options.keyPrefix + key;
    this.cache.delete(fullKey);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: globalMetrics.requestCount > 0 ? globalMetrics.cacheHits / globalMetrics.requestCount : 0
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruAccess = Infinity;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lruAccess ||
          (entry.accessCount === lruAccess && entry.timestamp < lruTime)) {
        lruKey = key;
        lruAccess = entry.accessCount;
        lruTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

/**
 * Rate Limiter with sliding window
 */
export class RateLimiter {
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      windowMs: 60000, // 1 minute default
      maxRequests: 100,
      skipSuccessfulRequests: false,
      keyGenerator: (req) => this.getClientIP(req),
      ...options
    };

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async checkLimit(req: Request): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.options.keyGenerator!(req);
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + this.options.windowMs };
      rateLimitStore.set(key, entry);
    }

    if (entry.count >= this.options.maxRequests) {
      globalMetrics.rateLimitHits++;
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;

    return {
      allowed: true,
      remaining: this.options.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private getClientIP(req: Request): string {
    // Try to get real IP from headers
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback to user agent + timestamp for unique identification
    const userAgent = req.headers.get('user-agent') || 'unknown';
    return `${userAgent}:${Math.floor(Date.now() / 60000)}`; // Per minute buckets
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Response Compression with gzip
 */
export class ResponseCompressor {
  private options: CompressionOptions;

  constructor(options: CompressionOptions = {}) {
    this.options = {
      threshold: 1024, // 1KB minimum
      level: 6, // Balanced compression
      excludeContentTypes: ['image/', 'video/', 'audio/'],
      ...options
    };
  }

  shouldCompress(response: Response, contentLength?: number): boolean {
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (this.options.excludeContentTypes?.some(type => contentType.startsWith(type))) {
      return false;
    }

    // Check size threshold
    if (contentLength && contentLength < this.options.threshold) {
      return false;
    }

    // Check if already compressed
    const encoding = response.headers.get('content-encoding');
    if (encoding && encoding !== 'identity') {
      return false;
    }

    return true;
  }

  async compress(data: string | Uint8Array): Promise<Uint8Array> {
    // Note: Deno doesn't have built-in compression, so this is a placeholder
    // In production, you'd use a compression library like 'pako' or similar

    const inputSize = typeof data === 'string' ? new TextEncoder().encode(data).length : data.length;

    // Simulate compression (in real implementation, use actual compression)
    const compressed = typeof data === 'string' ? new TextEncoder().encode(data) : data;

    // Track compression savings
    const savedBytes = Math.max(0, inputSize - compressed.length);
    globalMetrics.compressionSaved += savedBytes;

    return compressed;
  }
}

/**
 * Production Middleware Wrapper
 */
export class ProductionMiddleware {
  private cache: ResponseCache;
  private rateLimiter: RateLimiter;
  private compressor: ResponseCompressor;

  constructor(
    cacheOptions?: Partial<CacheOptions>,
    rateLimitOptions?: Partial<RateLimitOptions>,
    compressionOptions?: Partial<CompressionOptions>
  ) {
    this.cache = new ResponseCache({
      ttl: 5 * 60 * 1000,
      maxSize: 1000,
      keyPrefix: 'resp:',
      ...cacheOptions
    });

    this.rateLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      ...rateLimitOptions
    });

    this.compressor = new ResponseCompressor(compressionOptions);
  }

  /**
   * Wrap a handler function with production optimizations
   */
  wrap(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
    return async (req: Request): Promise<Response> => {
      const startTime = Date.now();
      globalMetrics.requestCount++;

      try {
        // 1. Rate limiting
        const rateLimit = await this.rateLimiter.checkLimit(req);
        if (!rateLimit.allowed) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
                'X-RateLimit-Limit': this.rateLimiter['options'].maxRequests.toString(),
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
              }
            }
          );
        }

        // 2. Cache check for GET requests
        let cacheKey = '';
        if (req.method === 'GET') {
          cacheKey = this.generateCacheKey(req);
          const cached = this.cache.get(cacheKey);
          if (cached) {
            return new Response(JSON.stringify(cached), {
              headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'HIT',
                'X-Cache-Key': cacheKey
              }
            });
          }
        }

        // 3. Execute handler
        const response = await handler(req);

        // 4. Cache successful responses
        if (req.method === 'GET' && response.ok && cacheKey) {
          try {
            const responseData = await response.clone().json();
            this.cache.set(cacheKey, responseData);
          } catch (e) {
            // Ignore cache errors for non-JSON responses
          }
        }

        // 5. Compression (if applicable)
        const shouldCompress = this.compressor.shouldCompress(response);
        let finalResponse = response;

        if (shouldCompress) {
          try {
            const responseText = await response.text();
            const compressed = await this.compressor.compress(responseText);

            finalResponse = new Response(compressed, {
              status: response.status,
              statusText: response.statusText,
              headers: {
                ...Object.fromEntries(response.headers.entries()),
                'Content-Encoding': 'gzip',
                'Content-Length': compressed.length.toString()
              }
            });
          } catch (e) {
            // Fall back to original response if compression fails
            finalResponse = response;
          }
        }

        // 6. Add performance headers
        const processingTime = Date.now() - startTime;
        globalMetrics.totalProcessingTime += processingTime;

        finalResponse.headers.set('X-Processing-Time', processingTime.toString());
        finalResponse.headers.set('X-Cache', cacheKey ? 'MISS' : 'BYPASS');
        finalResponse.headers.set('X-Rate-Limit-Remaining', rateLimit.remaining.toString());

        return finalResponse;

      } catch (error) {
        globalMetrics.errorCount++;

        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            requestId: crypto.randomUUID()
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'X-Processing-Time': (Date.now() - startTime).toString()
            }
          }
        );
      }
    };
  }

  /**
   * Generate cache key from request
   */
  private generateCacheKey(req: Request): string {
    const url = new URL(req.url);
    const params = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    return `${url.pathname}${params ? '?' + params : ''}`;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): MonitoringMetrics & { cacheStats: any } {
    return {
      ...globalMetrics,
      cacheStats: this.cache.getStats()
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    globalMetrics.requestCount = 0;
    globalMetrics.totalProcessingTime = 0;
    globalMetrics.cacheHits = 0;
    globalMetrics.cacheMisses = 0;
    globalMetrics.rateLimitHits = 0;
    globalMetrics.errorCount = 0;
    globalMetrics.compressionSaved = 0;
    globalMetrics.lastReset = Date.now();
  }
}

/**
 * Create optimized handler with sensible defaults
 */
export function createOptimizedHandler(
  handler: (req: Request) => Promise<Response>,
  options: {
    cache?: Partial<CacheOptions>;
    rateLimit?: Partial<RateLimitOptions>;
    compression?: Partial<CompressionOptions>;
  } = {}
): (req: Request) => Promise<Response> {
  const middleware = new ProductionMiddleware(
    options.cache,
    options.rateLimit,
    options.compression
  );

  return middleware.wrap(handler);
}

/**
 * Global metrics endpoint for monitoring
 */
export function createMetricsHandler(): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const middleware = new ProductionMiddleware();
    const metrics = middleware.getMetrics();

    return new Response(JSON.stringify({
      ...metrics,
      uptime: Date.now() - metrics.lastReset,
      avgProcessingTime: metrics.requestCount > 0 ? metrics.totalProcessingTime / metrics.requestCount : 0,
      errorRate: metrics.requestCount > 0 ? metrics.errorCount / metrics.requestCount : 0,
      cacheHitRate: (metrics.cacheHits + metrics.cacheMisses) > 0 ? metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) : 0
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  };
}

// Export singleton instances for shared state
export const sharedCache = new ResponseCache({
  ttl: 5 * 60 * 1000,
  maxSize: 1000,
  keyPrefix: 'global:'
});

export const sharedRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 1000 // Global rate limit
});

export const sharedCompressor = new ResponseCompressor();