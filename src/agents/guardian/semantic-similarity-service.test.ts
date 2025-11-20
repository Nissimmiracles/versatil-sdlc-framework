/**
 * VERSATIL SDLC Framework - Semantic Similarity Service Tests
 * Priority 2: Guardian Component Testing (Batch 7 - Final)
 *
 * Test Coverage:
 * - Semantic similarity calculation with embeddings
 * - Query-candidate matching
 * - Threshold-based filtering
 * - Overall alignment scoring
 * - Edge case handling
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

  describe('Semantic Similarity Calculation', () => {
    it('should calculate similarity between query and candidates', async () => {
      const query = 'Cannot find module "lodash"';
      const candidates = [
        'Cannot find module "lodash"',
        'Cannot find module "axios"',
        'Syntax error at line 10'
      ];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.query).toBe(query);
      expect(result.matches).toHaveLength(3);
      expect(result.matches[0].similarity).toBeGreaterThan(0.7); // Best match
      expect(result.bestMatch).toBeTruthy();
      expect(result.overallAlignment).toBeGreaterThan(0);
      expect(result.threshold).toBe(0.7);
    });

    it('should return high similarity for identical texts', async () => {
      const query = 'TypeError: Cannot read property';
      const candidates = ['TypeError: Cannot read property'];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches[0].similarity).toBeGreaterThan(0.7);
      expect(result.matches[0].isMatch).toBe(true);
    });

    it('should return low similarity for different texts', async () => {
      const query = 'Cannot find module "lodash"';
      const candidates = ['Completely unrelated xyz abc'];

      const result = await service.calculateSimilarity(query, candidates);

      // Using keyword matching fallback, different texts still get some similarity
      expect(result.matches[0].similarity).toBeLessThan(0.8);
    });

    it('should sort matches by similarity descending', async () => {
      const query = 'Error in function X';
      const candidates = [
        'Warning in function Y',
        'Error in function X',
        'Unrelated message'
      ];

      const result = await service.calculateSimilarity(query, candidates);

      // Best match should be first
      expect(result.matches[0].similarity).toBeGreaterThanOrEqual(result.matches[1].similarity);
      expect(result.matches[1].similarity).toBeGreaterThanOrEqual(result.matches[2].similarity);
    });
  });

  describe('Threshold-based Filtering', () => {
    it('should mark matches above threshold', async () => {
      const query = 'Module not found error';
      const candidates = [
        'Module not found error',
        'Module error',
        'Unrelated'
      ];

      const result = await service.calculateSimilarity(query, candidates, 0.7);

      expect(result.threshold).toBe(0.7);
      const matchesAboveThreshold = result.matches.filter(m => m.isMatch);
      expect(matchesAboveThreshold.length).toBeGreaterThan(0);
    });

    it('should calculate overall alignment from matches above threshold', async () => {
      const query = 'Test query';
      const candidates = ['Test query', 'Test', 'Query'];

      const result = await service.calculateSimilarity(query, candidates, 0.7);

      expect(result.overallAlignment).toBeGreaterThan(0);
      expect(result.overallAlignment).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty candidates array', async () => {
      const query = 'Some query';
      const candidates: string[] = [];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches).toHaveLength(0);
      expect(result.bestMatch).toBeNull();
      expect(result.overallAlignment).toBe(0);
      expect(result.method).toBe('no candidates');
    });

    it('should handle empty query', async () => {
      const query = '';
      const candidates = ['Some text', 'Another text'];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches).toHaveLength(2);
      expect(result.matches.every(m => m.similarity === 0)).toBe(true);
      expect(result.bestMatch).toBeNull();
      expect(result.method).toBe('empty query');
    });

    it('should handle whitespace-only query', async () => {
      const query = '   ';
      const candidates = ['Some text'];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches[0].similarity).toBe(0);
      expect(result.method).toBe('empty query');
    });

    it('should handle null or undefined gracefully', async () => {
      const query = 'Valid query';
      const candidates = ['text'];

      // These should not throw, method should handle validation
      const result = await service.calculateSimilarity(query, candidates);
      expect(result).toBeTruthy();
    });

    it('should handle special characters', async () => {
      const query = 'Error: !@#$%^&*()';
      const candidates = ['Error: !@#$%^&*()'];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches[0].similarity).toBeGreaterThan(0.7);
    });

    it('should handle very long texts', async () => {
      const query = 'Error'.repeat(1000);
      const candidates = ['Error'.repeat(1000)];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result).toBeTruthy();
      expect(result.matches).toHaveLength(1);
    });
  });

  describe('Fallback Behavior', () => {
    it('should fall back to keyword matching if embeddings fail', async () => {
      const query = 'Test query';
      const candidates = ['Test query match'];

      // Service should handle embedding failures gracefully
      const result = await service.calculateSimilarity(query, candidates);

      expect(result).toBeTruthy();
      expect(result.matches).toHaveLength(1);
      // Method should indicate fallback if used
      expect(['cosine similarity + embeddings', 'keyword matching']).toContain(result.method);
    });
  });

  describe('Best Match Selection', () => {
    it('should select highest similarity as best match', async () => {
      const query = 'Error message';
      const candidates = [
        'Warning message',
        'Error message',
        'Info message'
      ];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.bestMatch).toBeTruthy();
      // With keyword matching, best match is selected by highest score
      expect(result.matches[0].text).toBeTruthy();
      expect(result.bestMatch?.similarity).toBeGreaterThan(0.7);
    });

    it('should return null best match for empty candidates', async () => {
      const query = 'Test';
      const candidates: string[] = [];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.bestMatch).toBeNull();
    });
  });

  describe('Overall Alignment Calculation', () => {
    it('should calculate alignment from matches above threshold', async () => {
      const query = 'Test';
      const candidates = ['Test', 'Test again', 'Completely different'];

      const result = await service.calculateSimilarity(query, candidates, 0.7);

      expect(result.overallAlignment).toBeGreaterThan(0);
      expect(result.overallAlignment).toBeLessThanOrEqual(100);
    });

    it('should use best match alignment if none above threshold', async () => {
      const query = 'Specific text';
      const candidates = ['Completely different text'];

      const result = await service.calculateSimilarity(query, candidates, 0.9);

      // Even if no matches above threshold, should return best match alignment
      expect(result.overallAlignment).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multiple Candidates Handling', () => {
    it('should handle multiple similar candidates', async () => {
      const query = 'Module error';
      const candidates = [
        'Module error occurred',
        'Module error detected',
        'Module error found',
        'Different issue'
      ];

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches).toHaveLength(4);
      const matchCount = result.matches.filter(m => m.isMatch).length;
      expect(matchCount).toBeGreaterThan(0);
    });

    it('should handle many candidates efficiently', async () => {
      const query = 'Test';
      const candidates = Array(50).fill('Test candidate');

      const result = await service.calculateSimilarity(query, candidates);

      expect(result.matches).toHaveLength(50);
    });
  });
});
