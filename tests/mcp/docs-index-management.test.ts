/**
 * Index Management Tests for DocsSearchEngine
 * Tests index building, rebuilding, TTL, and concurrent access
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { DocsSearchEngine } from '../../src/mcp/docs-search-engine.js';
import { createDocsCorpus } from '../fixtures/docs-corpus/create.js';
import { performance } from 'node:perf_hooks';

describe('DocsSearchEngine - Index Management', () => {
  const corpus = createDocsCorpus();
  const projectPath = corpus.root;
  beforeEach(() => {
    // Control Date only; native filesystem and glob scheduling stay active.
    jest.useFakeTimers({ now: new Date('2025-02-01T00:00:00Z'), doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  });
  afterEach(() => jest.useRealTimers());
  afterAll(() => corpus.cleanup());

  describe('Index Building', () => {
    it('uses forward-slash glob syntax for Windows-style paths', async () => {
      const globModule = jest.requireActual<typeof import('glob')>('glob');
      const search = jest.spyOn(globModule, 'glob').mockResolvedValueOnce([]);
      const engine = new DocsSearchEngine(projectPath);
      engine['docsPath'] = 'C:\\fixture\\docs';
      try {
        await engine.buildIndex();
        expect(search).toHaveBeenCalledWith('C:/fixture/docs/**/*.md', { absolute: true });
      } finally { search.mockRestore(); }
    });

    it('should build index on first use', async () => {
      const engine = new DocsSearchEngine(projectPath);

      const metadata = engine.getIndexMetadata();
      expect(metadata.built).toBe(false);

      await engine.buildIndex();

      const metadataAfter = engine.getIndexMetadata();
      expect(metadataAfter.built).toBe(true);
      expect(metadataAfter.documentsCount).toBe(corpus.count);
    });

    it('should not rebuild if index is fresh', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();
      const firstBuild = engine.getIndexMetadata().lastBuild;

      // Try to build again immediately
      await engine.buildIndex();
      const secondBuild = engine.getIndexMetadata().lastBuild;

      // Should be same build (not rebuilt)
      expect(secondBuild).toEqual(firstBuild);
    });

    it('should build within reasonable time', async () => {
      const engine = new DocsSearchEngine(projectPath);

      const start = performance.now();
      await engine.buildIndex();
      const duration = performance.now() - start;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Index Rebuilding', () => {
    it('should force rebuild when requested', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();
      const firstBuild = engine.getIndexMetadata().lastBuild;

      // Wait a moment
      jest.setSystemTime(Date.now() + 100);

      // Force rebuild
      await engine.rebuildIndex();
      const secondBuild = engine.getIndexMetadata().lastBuild;

      // Should have new build time
      expect(secondBuild!.getTime()).toBeGreaterThan(firstBuild!.getTime());
    });

    it('should clear old index on rebuild', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();
      const firstCount = engine.getIndexMetadata().documentsCount;

      await engine.rebuildIndex();
      const secondCount = engine.getIndexMetadata().documentsCount;

      // Should have same count (all docs reindexed)
      expect(secondCount).toBeGreaterThan(0);
      expect(secondCount).toBe(firstCount);
    });
  });

  describe('Index Freshness (TTL)', () => {
    it('should detect stale index', async () => {
      const engine = new DocsSearchEngine(projectPath, {
        indexTTL: 100, // 100ms TTL for testing
      });

      await engine.buildIndex();
      expect(engine.isIndexStale()).toBe(false);
      jest.setSystemTime(Date.now() + 99);
      expect(engine.isIndexStale()).toBe(false);
      jest.setSystemTime(Date.now() + 1);

      expect(engine.isIndexStale()).toBe(true);
    });

    it('should rebuild stale index automatically', async () => {
      const engine = new DocsSearchEngine(projectPath, {
        indexTTL: 100, // 100ms TTL
      });

      await engine.buildIndex();
      const firstBuild = engine.getIndexMetadata().lastBuild;

      // Wait for TTL to expire
      jest.setSystemTime(Date.now() + 150);

      // Next build should detect staleness and rebuild
      await engine.buildIndex();
      const secondBuild = engine.getIndexMetadata().lastBuild;

      expect(secondBuild!.getTime()).toBeGreaterThan(firstBuild!.getTime());
    });

    it('should include TTL in metadata', () => {
      const engine = new DocsSearchEngine(projectPath, {
        indexTTL: 5 * 60 * 1000,
      });

      const metadata = engine.getIndexMetadata();
      expect(metadata.ttlMs).toBe(5 * 60 * 1000);
    });
  });

  describe('Concurrent Index Building', () => {
    it('should handle concurrent build requests', async () => {
      const engine = new DocsSearchEngine(projectPath);

      // Trigger 3 builds simultaneously
      const builds = Promise.all([
        engine.buildIndex(),
        engine.buildIndex(),
        engine.buildIndex(),
      ]);

      await builds;

      // Should complete without errors
      const metadata = engine.getIndexMetadata();
      expect(metadata.built).toBe(true);
    });

    it('should not duplicate index entries from concurrent builds', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await Promise.all([
        engine.buildIndex(),
        engine.buildIndex(),
      ]);

      const index = await engine.getIndex();
      const paths = index.map(doc => doc.relativePath);

      // Check for duplicates
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    });
  });

  describe('Index Metadata', () => {
    it('should provide accurate metadata before build', () => {
      const engine = new DocsSearchEngine(projectPath);

      const metadata = engine.getIndexMetadata();
      expect(metadata.built).toBe(false);
      expect(metadata.lastBuild).toBeNull();
      expect(metadata.isStale).toBe(true);
      expect(metadata.documentsCount).toBe(0);
    });

    it('should provide accurate metadata after build', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();

      const metadata = engine.getIndexMetadata();
      expect(metadata.built).toBe(true);
      expect(metadata.lastBuild).toBeInstanceOf(Date);
      expect(metadata.isStale).toBe(false);
      expect(metadata.documentsCount).toBeGreaterThan(0);
    });

    it('should track document count accurately', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();

      const metadata = engine.getIndexMetadata();
      const index = await engine.getIndex();

      expect(metadata.documentsCount).toBe(index.length);
    });
  });

  describe('Performance', () => {
    it('should search efficiently with built index', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();

      const start = performance.now();
      await engine.search('agent workflow');
      const duration = performance.now() - start;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple searches efficiently', async () => {
      const engine = new DocsSearchEngine(projectPath);

      await engine.buildIndex();

      const start = performance.now();
      await Promise.all([
        engine.search('maria'),
        engine.search('james'),
        engine.search('marcus'),
        engine.search('workflow'),
        engine.search('testing'),
      ]);
      const duration = performance.now() - start;

      // All 5 searches should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
