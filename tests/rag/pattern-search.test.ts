/**
 * Pattern Search Service - Integration Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PatternSearchService, PatternSearchQuery } from '../../src/rag/pattern-search.js';

describe('PatternSearchService', () => {
  let service: PatternSearchService;

  beforeEach(() => {
    service = new PatternSearchService();
  });

  it('should return empty result when no patterns found', async () => {
    const query: PatternSearchQuery = {
      description: 'xyz-unique-feature-that-never-existed',
      limit: 5,
      min_similarity: 0.75
    };

    const result = await service.searchSimilarFeatures(query);

    expect(result.patterns).toHaveLength(0);
    expect(result.total_found).toBe(0);
    expect(result.avg_effort).toBeNull();
  });

  it('should apply min_similarity filter', async () => {
    const query: PatternSearchQuery = {
      description: 'user authentication',
      limit: 10,
      min_similarity: 0.95
    };

    const result = await service.searchSimilarFeatures(query);

    result.patterns.forEach(pattern => {
      expect(pattern.similarity_score).toBeGreaterThanOrEqual(0.95);
    });
  });

  it('should limit results correctly', async () => {
    const query: PatternSearchQuery = {
      description: 'authentication',
      limit: 3
    };

    const result = await service.searchSimilarFeatures(query);
    expect(result.patterns.length).toBeLessThanOrEqual(3);
  });
});
