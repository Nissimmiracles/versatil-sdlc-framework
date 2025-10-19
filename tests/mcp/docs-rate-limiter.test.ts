/**
 * Tests for VERSATIL MCP Documentation Rate Limiter
 * Phase 4.2: Rate Limiting
 */

import {
  RateLimiter,
  MultiTierRateLimiter,
  createStandardTiers,
  formatRateLimitHeaders,
  createRateLimitError,
} from '../../src/mcp/docs-rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe('basic rate limiting', () => {
    it('should allow requests within limit', () => {
      const result1 = limiter.check('user1');
      const result2 = limiter.check('user1');
      const result3 = limiter.check('user1');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should track remaining requests', () => {
      const result1 = limiter.check('user1');
      expect(result1.remaining).toBe(4);

      const result2 = limiter.check('user1');
      expect(result2.remaining).toBe(3);

      const result3 = limiter.check('user1');
      expect(result3.remaining).toBe(2);
    });

    it('should block requests after exceeding limit', () => {
      // Use up all tokens
      for (let i = 0; i < 5; i++) {
        limiter.check('user1');
      }

      // Next request should be blocked
      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should provide retry-after time when blocked', () => {
      // Use up all tokens
      for (let i = 0; i < 5; i++) {
        limiter.check('user1');
      }

      const result = limiter.check('user1');
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should isolate limits per key', () => {
      limiter.check('user1');
      limiter.check('user1');

      const user1Result = limiter.check('user1');
      const user2Result = limiter.check('user2');

      expect(user1Result.remaining).toBe(2); // Used 3 tokens
      expect(user2Result.remaining).toBe(4); // First request
    });
  });

  describe('token refill', () => {
    it('should refill tokens after time window', async () => {
      // Use up all tokens
      for (let i = 0; i < 5; i++) {
        limiter.check('user1');
      }

      // Should be blocked
      let result = limiter.check('user1');
      expect(result.allowed).toBe(false);

      // Wait for window to pass
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be allowed again
      result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should partially refill tokens over time', async () => {
      // Use 3 tokens
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      expect(limiter.getStatus('user1').remaining).toBe(2);

      // Wait for half the window
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should have refilled some tokens
      const status = limiter.getStatus('user1');
      expect(status.remaining).toBeGreaterThan(2);
    });
  });

  describe('status queries', () => {
    it('should get status without consuming tokens', () => {
      const status1 = limiter.getStatus('user1');
      const status2 = limiter.getStatus('user1');

      expect(status1.remaining).toBe(5);
      expect(status2.remaining).toBe(5); // No change
    });

    it('should get status for new key', () => {
      const status = limiter.getStatus('newuser');

      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(5);
      expect(status.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('reset and clear', () => {
    it('should reset rate limit for a key', () => {
      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user1');

      expect(limiter.getStatus('user1').remaining).toBe(2);

      limiter.reset('user1');

      expect(limiter.getStatus('user1').remaining).toBe(5);
    });

    it('should clear all rate limits', () => {
      limiter.check('user1');
      limiter.check('user2');
      limiter.check('user3');

      expect(limiter.getKeyCount()).toBeGreaterThan(0);

      limiter.clear();

      expect(limiter.getKeyCount()).toBe(0);
    });
  });

  describe('key tracking', () => {
    it('should track number of keys', () => {
      expect(limiter.getKeyCount()).toBe(0);

      limiter.check('user1');
      expect(limiter.getKeyCount()).toBe(1);

      limiter.check('user2');
      expect(limiter.getKeyCount()).toBe(2);

      limiter.check('user1'); // Same user
      expect(limiter.getKeyCount()).toBe(2); // No increase
    });
  });
});

describe('MultiTierRateLimiter', () => {
  let limiter: MultiTierRateLimiter;

  beforeEach(() => {
    limiter = new MultiTierRateLimiter();
    limiter.addTier('basic', { maxRequests: 5, windowMs: 1000 });
    limiter.addTier('premium', { maxRequests: 20, windowMs: 1000 });
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe('tier management', () => {
    it('should add and use different tiers', () => {
      const basicResult = limiter.check('basic', 'user1');
      const premiumResult = limiter.check('premium', 'user1');

      expect(basicResult.allowed).toBe(true);
      expect(premiumResult.allowed).toBe(true);
    });

    it('should enforce different limits per tier', () => {
      // Use up basic tier
      for (let i = 0; i < 5; i++) {
        limiter.check('basic', 'user1');
      }

      const basicResult = limiter.check('basic', 'user1');
      const premiumResult = limiter.check('premium', 'user1');

      expect(basicResult.allowed).toBe(false);
      expect(premiumResult.allowed).toBe(true); // Premium still has tokens
    });

    it('should get all tier names', () => {
      const tiers = limiter.getTiers();

      expect(tiers).toContain('basic');
      expect(tiers).toContain('premium');
      expect(tiers).toHaveLength(2);
    });

    it('should throw error for non-existent tier', () => {
      expect(() => {
        limiter.check('nonexistent', 'user1');
      }).toThrow("Rate limit tier 'nonexistent' not found");
    });
  });

  describe('tier isolation', () => {
    it('should isolate keys between tiers', () => {
      limiter.check('basic', 'user1');
      limiter.check('basic', 'user1');

      const basicStatus = limiter.getStatus('basic', 'user1');
      const premiumStatus = limiter.getStatus('premium', 'user1');

      expect(basicStatus.remaining).toBe(3); // Used 2 tokens
      expect(premiumStatus.remaining).toBe(20); // Unused
    });
  });

  describe('reset and clear', () => {
    it('should reset rate limit for specific tier', () => {
      limiter.check('basic', 'user1');
      limiter.check('premium', 'user1');

      limiter.reset('basic', 'user1');

      expect(limiter.getStatus('basic', 'user1').remaining).toBe(5);
      expect(limiter.getStatus('premium', 'user1').remaining).toBe(19);
    });

    it('should clear all tiers', () => {
      limiter.check('basic', 'user1');
      limiter.check('premium', 'user1');

      limiter.clear();

      expect(limiter.getStatus('basic', 'user1').remaining).toBe(5);
      expect(limiter.getStatus('premium', 'user1').remaining).toBe(20);
    });
  });
});

describe('Helper Functions', () => {
  describe('createStandardTiers', () => {
    it('should create standard tier configuration', () => {
      const limiter = createStandardTiers();
      const tiers = limiter.getTiers();

      expect(tiers).toContain('anonymous');
      expect(tiers).toContain('authenticated');
      expect(tiers).toContain('premium');

      limiter.destroy();
    });

    it('should have different limits for each tier', () => {
      const limiter = createStandardTiers();

      const anonStatus = limiter.getStatus('anonymous', 'user1');
      const authStatus = limiter.getStatus('authenticated', 'user1');
      const premiumStatus = limiter.getStatus('premium', 'user1');

      expect(anonStatus.remaining).toBe(10);
      expect(authStatus.remaining).toBe(100);
      expect(premiumStatus.remaining).toBe(1000);

      limiter.destroy();
    });
  });

  describe('formatRateLimitHeaders', () => {
    it('should format headers for allowed request', () => {
      const result = {
        allowed: true,
        remaining: 42,
        resetTime: new Date('2025-01-01T00:00:00Z'),
      };

      const headers = formatRateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('42');
      expect(headers['X-RateLimit-Reset']).toContain('2025-01-01');
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include retry-after for blocked request', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        retryAfter: 30,
      };

      const headers = formatRateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBe('30');
    });
  });

  describe('createRateLimitError', () => {
    it('should return empty string for allowed request', () => {
      const result = {
        allowed: true,
        remaining: 5,
        resetTime: new Date(),
      };

      const error = createRateLimitError(result);

      expect(error).toBe('');
    });

    it('should create error message with seconds', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        retryAfter: 30,
      };

      const error = createRateLimitError(result);

      expect(error).toContain('30 seconds');
    });

    it('should create error message with minutes', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        retryAfter: 120,
      };

      const error = createRateLimitError(result);

      expect(error).toContain('2 minutes');
    });

    it('should create generic error for short wait', () => {
      const result = {
        allowed: false,
        remaining: 0,
        resetTime: new Date(),
        retryAfter: 1,
      };

      const error = createRateLimitError(result);

      expect(error).toContain('shortly');
    });
  });
});
