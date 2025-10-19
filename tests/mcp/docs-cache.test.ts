/**
 * Tests for DocsCache - Response caching with ETag support and compression
 */

import { DocsCache } from '../../src/mcp/docs-cache.js';

describe('DocsCache', () => {
  let cache: DocsCache;

  beforeEach(() => {
    cache = new DocsCache({
      maxAge: 1000, // 1 second for testing
      maxEntries: 5,
      enableCompression: true,
    });
  });

  describe('ETag Generation', () => {
    it('should generate consistent ETags for same content', () => {
      const content = '# Test Document\n\nSome content here.';
      const etag1 = cache.generateETag(content);
      const etag2 = cache.generateETag(content);

      expect(etag1).toBe(etag2);
      expect(etag1).toMatch(/^"[a-f0-9]{16}"$/); // 16-char hex hash
    });

    it('should generate different ETags for different content', () => {
      const content1 = '# Document 1';
      const content2 = '# Document 2';

      const etag1 = cache.generateETag(content1);
      const etag2 = cache.generateETag(content2);

      expect(etag1).not.toBe(etag2);
    });
  });

  describe('Cache Set and Get', () => {
    it('should cache and retrieve content', () => {
      const key = 'agents/maria-qa.md';
      const content = '# Maria-QA\n\nQuality Guardian agent.';

      cache.set(key, content);
      const retrieved = cache.get(key);

      expect(retrieved).toBe(content);
    });

    it('should return null for cache miss', () => {
      const retrieved = cache.get('nonexistent.md');

      expect(retrieved).toBeNull();
    });

    it('should store metadata with cache entry', () => {
      const key = 'test.md';
      const content = 'Test content';

      const entry = cache.set(key, content);

      expect(entry.content).toBe(content);
      expect(entry.etag).toBeTruthy();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.size).toBeGreaterThan(0);
      expect(entry.hits).toBe(0);
    });

    it('should track cache hits', () => {
      const key = 'test.md';
      cache.set(key, 'content');

      cache.get(key); // First hit
      cache.get(key); // Second hit

      const entry = cache.getEntry(key);
      expect(entry?.hits).toBe(2);
    });
  });

  describe('Cache Expiration (TTL)', () => {
    it('should expire cache entries after maxAge', async () => {
      const key = 'test.md';
      const content = 'Test content';

      cache.set(key, content);

      // Wait for cache to expire (1 second + buffer)
      await new Promise(resolve => setTimeout(resolve, 1100));

      const retrieved = cache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should not expire fresh cache entries', () => {
      const key = 'test.md';
      const content = 'Test content';

      cache.set(key, content);

      // Immediately retrieve (should still be fresh)
      const retrieved = cache.get(key);
      expect(retrieved).toBe(content);
    });

    it('should validate cache freshness with isCacheValid', async () => {
      const key = 'test.md';
      cache.set(key, 'content');

      // Fresh
      expect(cache.has(key)).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Expired
      expect(cache.has(key)).toBe(false);
    });
  });

  describe('Compression', () => {
    it('should pre-compress content with gzip', () => {
      const key = 'test.md';
      const content = '# Large Document\n\n' + 'Lorem ipsum '.repeat(100);

      const entry = cache.set(key, content);

      expect(entry.compressed).toBeDefined();
      expect(entry.compressed?.gzip).toBeInstanceOf(Buffer);
      expect(entry.compressed!.gzip.length).toBeLessThan(entry.size);
    });

    it('should pre-compress content with brotli', () => {
      const key = 'test.md';
      const content = '# Large Document\n\n' + 'Lorem ipsum '.repeat(100);

      const entry = cache.set(key, content);

      expect(entry.compressed).toBeDefined();
      expect(entry.compressed?.brotli).toBeInstanceOf(Buffer);
      expect(entry.compressed!.brotli.length).toBeLessThan(entry.size);
    });

    it('should retrieve compressed content when requested', () => {
      const key = 'test.md';
      const content = '# Test Document\n\nContent here.';

      cache.set(key, content);

      const gzipCompressed = cache.get(key, 'gzip');
      const brotliCompressed = cache.get(key, 'br');

      expect(gzipCompressed).toBeInstanceOf(Buffer);
      expect(brotliCompressed).toBeInstanceOf(Buffer);
    });

    it('should achieve good compression ratio', () => {
      const content = '# Document\n\n' + 'Repeated content. '.repeat(50);

      cache.set('test1.md', content);
      cache.set('test2.md', content);

      const ratios = cache.getCompressionRatio();

      expect(ratios.gzip).toBeGreaterThan(1.5); // At least 1.5x compression
      expect(ratios.brotli).toBeGreaterThan(1.5);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict oldest entry when cache is full', () => {
      // Fill cache to max (5 entries)
      cache.set('doc1.md', 'Content 1');
      cache.set('doc2.md', 'Content 2');
      cache.set('doc3.md', 'Content 3');
      cache.set('doc4.md', 'Content 4');
      cache.set('doc5.md', 'Content 5');

      expect(cache.size()).toBe(5);

      // Add 6th entry (should evict doc1.md)
      cache.set('doc6.md', 'Content 6');

      expect(cache.size()).toBe(5);
      expect(cache.has('doc1.md')).toBe(false); // Oldest evicted
      expect(cache.has('doc6.md')).toBe(true); // New entry present
    });

    it('should track eviction count in metrics', () => {
      // Fill cache beyond max
      for (let i = 0; i < 10; i++) {
        cache.set(`doc${i}.md`, `Content ${i}`);
      }

      const metrics = cache.getMetrics();

      expect(metrics.evictions).toBe(5); // 10 - 5 (max) = 5 evictions
    });
  });

  describe('Cache Metrics', () => {
    it('should track cache hits and misses', () => {
      cache.set('doc1.md', 'Content 1');

      cache.get('doc1.md'); // Hit
      cache.get('doc1.md'); // Hit
      cache.get('nonexistent.md'); // Miss

      const metrics = cache.getMetrics();

      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('doc1.md', 'Content 1');

      cache.get('doc1.md'); // Hit
      cache.get('doc1.md'); // Hit
      cache.get('doc2.md'); // Miss
      cache.get('doc3.md'); // Miss

      const metrics = cache.getMetrics();

      expect(metrics.hitRate).toBeCloseTo(0.5, 2); // 2 hits / 4 requests = 50%
    });

    it('should report total cache size', () => {
      const content1 = 'Small content';
      const content2 = 'Larger content with more text';

      cache.set('doc1.md', content1);
      cache.set('doc2.md', content2);

      const metrics = cache.getMetrics();

      const expectedSize = Buffer.byteLength(content1, 'utf8') + Buffer.byteLength(content2, 'utf8');
      expect(metrics.totalSize).toBe(expectedSize);
    });

    it('should report compressed size when compression is enabled', () => {
      const content = '# Document\n\n' + 'Some content here. '.repeat(50);

      cache.set('doc1.md', content);

      const metrics = cache.getMetrics();

      expect(metrics.compressedSize).toBeGreaterThan(0);
      expect(metrics.compressedSize).toBeLessThan(metrics.totalSize);
    });

    it('should reset metrics', () => {
      cache.set('doc1.md', 'Content');
      cache.get('doc1.md'); // Hit
      cache.get('missing.md'); // Miss

      cache.resetMetrics();

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
    });
  });

  describe('Cache Clear', () => {
    it('should clear all cache entries', () => {
      cache.set('doc1.md', 'Content 1');
      cache.set('doc2.md', 'Content 2');

      expect(cache.size()).toBe(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('doc1.md')).toBeNull();
      expect(cache.get('doc2.md')).toBeNull();
    });
  });

  describe('ETag Validation (HTTP 304)', () => {
    it('should validate ETag for cache hit', () => {
      const key = 'test.md';
      const content = 'Test content';

      const entry = cache.set(key, content);
      const etag = entry.etag;

      // Validate with matching ETag
      const isValid = cache.isCacheValid(key, etag);
      expect(isValid).toBe(true);
    });

    it('should invalidate with mismatched ETag', () => {
      const key = 'test.md';
      cache.set(key, 'Test content');

      // Validate with different ETag
      const isValid = cache.isCacheValid(key, '"different-etag"');
      expect(isValid).toBe(false);
    });

    it('should increment hits when ETag matches', () => {
      const key = 'test.md';
      const entry = cache.set(key, 'Test content');

      cache.isCacheValid(key, entry.etag); // Should count as hit

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
    });
  });

  describe('Constructor Options', () => {
    it('should respect custom maxAge', async () => {
      const customCache = new DocsCache({ maxAge: 500 }); // 500ms

      customCache.set('test.md', 'Content');

      // Wait for expiration (500ms + buffer)
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(customCache.has('test.md')).toBe(false);
    });

    it('should respect custom maxEntries', () => {
      const customCache = new DocsCache({ maxEntries: 2 });

      customCache.set('doc1.md', 'Content 1');
      customCache.set('doc2.md', 'Content 2');
      customCache.set('doc3.md', 'Content 3'); // Should evict doc1.md

      expect(customCache.size()).toBe(2);
      expect(customCache.has('doc1.md')).toBe(false);
    });

    it('should disable compression when requested', () => {
      const customCache = new DocsCache({ enableCompression: false });

      const entry = customCache.set('test.md', 'Large content '.repeat(50));

      expect(entry.compressed).toBeUndefined();
    });
  });
});
