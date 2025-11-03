/**
 * VERSATIL SDLC Framework - Semantic Similarity Service Tests
 * Priority 2: Guardian Component Testing (Batch 7 - Final)
 *
 * Test Coverage:
 * - Text similarity calculation
 * - Error deduplication
 * - Pattern matching
 * - Vector embedding comparison
 * - Fuzzy matching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SemanticSimilarityService } from './semantic-similarity-service.js';

describe('SemanticSimilarityService', () => {
  let service: SemanticSimilarityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = SemanticSimilarityService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SemanticSimilarityService.getInstance();
      const instance2 = SemanticSimilarityService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Text Similarity Calculation', () => {
    it('should calculate similarity between identical texts', () => {
      const text1 = 'Cannot find module "lodash"';
      const text2 = 'Cannot find module "lodash"';

      const similarity = service.calculateSimilarity(text1, text2);
      expect(similarity).toBe(1.0);
    });

    it('should calculate similarity between similar texts', () => {
      const text1 = 'Cannot find module "lodash"';
      const text2 = 'Cannot find module "axios"';

      const similarity = service.calculateSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.7);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should return low similarity for different texts', () => {
      const text1 = 'Cannot find module "lodash"';
      const text2 = 'Syntax error at line 10';

      const similarity = service.calculateSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.3);
    });

    it('should handle case insensitivity', () => {
      const text1 = 'ERROR: Cannot Find Module';
      const text2 = 'error: cannot find module';

      const similarity = service.calculateSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.9);
    });
  });

  describe('Error Deduplication', () => {
    it('should deduplicate identical errors', () => {
      const errors = [
        { message: 'TypeError: Cannot read property' },
        { message: 'TypeError: Cannot read property' },
        { message: 'SyntaxError: Unexpected token' }
      ];

      const deduplicated = service.deduplicateErrors(errors);
      expect(deduplicated.length).toBe(2);
    });

    it('should group similar errors', () => {
      const errors = [
        { message: 'Cannot find module "lodash"' },
        { message: 'Cannot find module "axios"' },
        { message: 'Cannot find module "react"' }
      ];

      const grouped = service.groupSimilarErrors(errors, 0.8);
      expect(grouped.length).toBe(1); // All grouped together
      expect(grouped[0].count).toBe(3);
    });

    it('should preserve unique errors', () => {
      const errors = [
        { message: 'TypeError: null is not an object' },
        { message: 'SyntaxError: Unexpected token' },
        { message: 'ReferenceError: x is not defined' }
      ];

      const deduplicated = service.deduplicateErrors(errors);
      expect(deduplicated.length).toBe(3);
    });

    it('should use configurable similarity threshold', () => {
      const errors = [
        { message: 'Cannot find module "lodash"' },
        { message: 'Cannot find module "axios"' }
      ];

      const strictDedupe = service.groupSimilarErrors(errors, 0.95);
      const looseDedupe = service.groupSimilarErrors(errors, 0.7);

      expect(looseDedupe.length).toBeLessThanOrEqual(strictDedupe.length);
    });
  });

  describe('Pattern Matching', () => {
    it('should match error patterns', () => {
      const error = 'Cannot find module "lodash"';
      const pattern = 'Cannot find module "*"';

      const matches = service.matchesPattern(error, pattern);
      expect(matches).toBe(true);
    });

    it('should extract pattern variables', () => {
      const error = 'TypeError: Cannot read property "foo" of undefined';
      const pattern = 'TypeError: Cannot read property "*" of undefined';

      const variables = service.extractPatternVariables(error, pattern);
      expect(variables).toContain('foo');
    });

    it('should support regex patterns', () => {
      const error = 'Error at line 42';
      const pattern = /Error at line \d+/;

      const matches = service.matchesPattern(error, pattern);
      expect(matches).toBe(true);
    });

    it('should find best matching pattern', () => {
      const error = 'Cannot find module "lodash"';
      const patterns = [
        'Cannot find module "*"',
        'Module not found: *',
        'Syntax error'
      ];

      const bestMatch = service.findBestMatchingPattern(error, patterns);
      expect(bestMatch).toBe('Cannot find module "*"');
    });
  });

  describe('Vector Embedding Comparison', () => {
    it('should generate embeddings for text', async () => {
      const text = 'Cannot find module "lodash"';

      const embedding = await service.generateEmbedding(text);
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });

    it('should calculate cosine similarity between embeddings', () => {
      const embedding1 = [0.1, 0.2, 0.3];
      const embedding2 = [0.15, 0.25, 0.35];

      const similarity = service.cosineSimilarity(embedding1, embedding2);
      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should find similar texts using embeddings', async () => {
      const query = 'Cannot find module';
      const candidates = [
        'Cannot find module "lodash"',
        'Module not found',
        'Syntax error'
      ];

      const similar = await service.findSimilarTexts(query, candidates, 0.8);
      expect(similar.length).toBeGreaterThan(0);
    });

    it('should cache embeddings for performance', async () => {
      const text = 'Repeated text for caching';

      await service.generateEmbedding(text);
      const startTime = Date.now();
      await service.generateEmbedding(text);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be fast from cache
    });
  });

  describe('Fuzzy Matching', () => {
    it('should match with typos', () => {
      const text1 = 'Cannot find module';
      const text2 = 'Canot find modul'; // typos

      const similarity = service.fuzzyMatch(text1, text2);
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should handle different word orders', () => {
      const text1 = 'read property cannot';
      const text2 = 'cannot read property';

      const similarity = service.fuzzyMatch(text1, text2, { orderInvariant: true });
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should calculate Levenshtein distance', () => {
      const text1 = 'kitten';
      const text2 = 'sitting';

      const distance = service.levenshteinDistance(text1, text2);
      expect(distance).toBe(3);
    });

    it('should normalize strings before comparison', () => {
      const text1 = '  Cannot   find  module  ';
      const text2 = 'Cannot find module';

      const similarity = service.fuzzyMatch(text1, text2);
      expect(similarity).toBeGreaterThan(0.95);
    });
  });

  describe('Similarity Metrics', () => {
    it('should calculate Jaccard similarity', () => {
      const set1 = new Set(['Cannot', 'find', 'module']);
      const set2 = new Set(['Cannot', 'find', 'package']);

      const similarity = service.jaccardSimilarity(set1, set2);
      expect(similarity).toBeCloseTo(0.5); // 2 common / 4 total
    });

    it('should calculate token overlap', () => {
      const text1 = 'Cannot find module lodash';
      const text2 = 'Cannot find module axios';

      const overlap = service.tokenOverlap(text1, text2);
      expect(overlap).toBeCloseTo(0.75); // 3 out of 4 tokens match
    });

    it('should calculate n-gram similarity', () => {
      const text1 = 'Cannot find';
      const text2 = 'Cannot locate';

      const similarity = service.ngramSimilarity(text1, text2, 2);
      expect(typeof similarity).toBe('number');
    });
  });

  describe('Batch Operations', () => {
    it('should compare multiple texts efficiently', async () => {
      const texts = [
        'Error 1',
        'Error 2',
        'Error 3',
        'Error 4'
      ];

      const similarities = await service.compareAll(texts);
      expect(similarities).toHaveLength(texts.length);
    });

    it('should find clusters of similar texts', async () => {
      const texts = [
        'Cannot find module "lodash"',
        'Cannot find module "axios"',
        'Syntax error at line 10',
        'Syntax error at line 20'
      ];

      const clusters = await service.clusterSimilarTexts(texts, 0.8);
      expect(clusters.length).toBe(2); // 2 clusters
    });

    it('should rank texts by similarity to query', async () => {
      const query = 'Cannot find module';
      const texts = [
        'Cannot find module "lodash"',
        'Syntax error',
        'Module not found',
        'Unexpected token'
      ];

      const ranked = await service.rankBySimilarity(query, texts);
      expect(ranked[0].text).toContain('lodash');
    });
  });

  describe('Configuration', () => {
    it('should configure similarity algorithm', () => {
      service.setSimilarityAlgorithm('cosine');
      expect(service.getSimilarityAlgorithm()).toBe('cosine');

      service.setSimilarityAlgorithm('jaccard');
      expect(service.getSimilarityAlgorithm()).toBe('jaccard');
    });

    it('should configure threshold', () => {
      service.setSimilarityThreshold(0.85);
      expect(service.getSimilarityThreshold()).toBe(0.85);
    });

    it('should enable/disable caching', () => {
      service.setCachingEnabled(false);
      expect(service.isCachingEnabled()).toBe(false);

      service.setCachingEnabled(true);
      expect(service.isCachingEnabled()).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle large text comparisons', () => {
      const largeText1 = 'word '.repeat(10000);
      const largeText2 = 'word '.repeat(10000);

      const startTime = Date.now();
      service.calculateSimilarity(largeText1, largeText2);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should clear cache', () => {
      service.clearCache();
      const cacheSize = service.getCacheSize();
      expect(cacheSize).toBe(0);
    });

    it('should limit cache size', async () => {
      service.setMaxCacheSize(10);

      for (let i = 0; i < 20; i++) {
        await service.generateEmbedding(`text ${i}`);
      }

      const cacheSize = service.getCacheSize();
      expect(cacheSize).toBeLessThanOrEqual(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const similarity = service.calculateSimilarity('', '');
      expect(typeof similarity).toBe('number');
    });

    it('should handle null or undefined', () => {
      expect(() => service.calculateSimilarity(null as any, 'text')).not.toThrow();
      expect(() => service.calculateSimilarity('text', undefined as any)).not.toThrow();
    });

    it('should handle special characters', () => {
      const text1 = 'Error: !@#$%^&*()';
      const text2 = 'Error: !@#$%^&*()';

      const similarity = service.calculateSimilarity(text1, text2);
      expect(similarity).toBe(1.0);
    });

    it('should handle unicode characters', () => {
      const text1 = 'エラー: モジュールが見つかりません';
      const text2 = 'エラー: モジュールが見つかりません';

      const similarity = service.calculateSimilarity(text1, text2);
      expect(similarity).toBe(1.0);
    });
  });
});
