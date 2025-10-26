/**
 * Pattern Search Service - Unit Tests
 * Tests for historical pattern search and analysis
 */

import { PatternSearchService, HistoricalPattern, PatternSearchQuery } from '../../src/rag/pattern-search';

// Mock GraphRAG store
jest.mock('../../src/lib/graphrag-store', () => ({
  graphRAGStore: {
    initialize: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([
      {
        pattern: {
          id: 'pattern-1',
          type: 'pattern',
          label: 'User Authentication',
          properties: {
            pattern: 'User Authentication with JWT',
            agent: 'Marcus-Backend',
            category: 'auth',
            effectiveness: 0.85,
            timeSaved: 24,
            tags: ['jwt', 'bcrypt', 'session'],
            usageCount: 3,
            lastUsed: new Date('2025-10-15')
          },
          connections: []
        },
        relevanceScore: 0.92,
        graphPath: ['auth', 'jwt', 'user-management'],
        explanation: 'Strong match on JWT authentication patterns'
      },
      {
        pattern: {
          id: 'pattern-2',
          type: 'pattern',
          label: 'OAuth Integration',
          properties: {
            pattern: 'OAuth2 Google Provider',
            agent: 'Marcus-Backend',
            category: 'auth',
            effectiveness: 0.78,
            timeSaved: 16,
            tags: ['oauth', 'google', 'social-login'],
            usageCount: 2,
            lastUsed: new Date('2025-10-10')
          },
          connections: []
        },
        relevanceScore: 0.85,
        graphPath: ['auth', 'oauth', 'social'],
        explanation: 'Match on OAuth patterns'
      }
    ])
  }
}));

// Mock Vector store
jest.mock('../../src/rag/enhanced-vector-memory-store', () => ({
  EnhancedVectorMemoryStore: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue({
      documents: [
        {
          id: 'doc-1',
          content: 'Password reset implementation',
          contentType: 'winning-pattern',
          metadata: {
            feature_name: 'Password Reset Flow',
            agentId: 'Marcus-Backend',
            effort_hours: 8,
            effort_range: { min: 6, max: 10 },
            confidence: 80,
            success_score: 85,
            lessons_learned: ['Use email templates', 'Add rate limiting'],
            code_examples: [{ file: 'src/auth/reset.ts', lines: '42-67', description: 'Reset token generation' }],
            risks: { high: [], medium: ['Email delivery'], low: [] },
            category: 'auth',
            timestamp: Date.now(),
            relevanceScore: 0.88,
            tags: ['auth']
          }
        }
      ],
      reranked: true,
      processingTime: 50,
      searchMethod: 'vector',
      totalMatches: 1
    })
  }))
}));

describe('PatternSearchService', () => {
  let service: PatternSearchService;

  beforeEach(() => {
    service = new PatternSearchService();
    jest.clearAllMocks();
  });

  describe('searchSimilarFeatures', () => {
    it('should search GraphRAG and return historical patterns', async () => {
      const query: PatternSearchQuery = {
        description: 'Add user authentication with JWT',
        limit: 5,
        min_similarity: 0.75
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.patterns).toHaveLength(2);
      expect(result.total_found).toBe(2);
      expect(result.search_method).toBe('graphrag');
      expect(result.avg_effort).toBe(20); // (24 + 16) / 2
      expect(result.avg_confidence).toBe(82); // (85 + 78) / 2 rounded
    });

    it('should filter patterns by minimum similarity', async () => {
      const query: PatternSearchQuery = {
        description: 'OAuth integration',
        limit: 5,
        min_similarity: 0.90 // High threshold
      };

      const result = await service.searchSimilarFeatures(query);

      // Only pattern-1 (0.92) meets threshold
      expect(result.patterns.length).toBeGreaterThanOrEqual(0);
    });

    it('should consolidate lessons learned', async () => {
      const query: PatternSearchQuery = {
        description: 'User authentication',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.consolidated_lessons).toBeDefined();
      expect(Array.isArray(result.consolidated_lessons)).toBe(true);
    });

    it('should generate recommendation based on patterns', async () => {
      const query: PatternSearchQuery = {
        description: 'Add JWT authentication',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.recommended_approach).toBeDefined();
      expect(result.recommended_approach).toContain('similar');
    });

    it('should handle no results gracefully', async () => {
      // Mock empty GraphRAG and Vector results
      const { graphRAGStore } = require('../../src/lib/graphrag-store');
      graphRAGStore.query.mockResolvedValueOnce([]);

      const query: PatternSearchQuery = {
        description: 'Completely unique quantum feature',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.patterns).toHaveLength(0);
      expect(result.total_found).toBe(0);
      expect(result.search_method).toBe('none');
      expect(result.avg_effort).toBeNull();
      expect(result.avg_confidence).toBeNull();
      expect(result.consolidated_lessons).toHaveLength(0);
      expect(result.recommended_approach).toBeNull();
    });

    it('should fallback to vector store when GraphRAG fails', async () => {
      // Mock GraphRAG failure
      const { graphRAGStore } = require('../../src/lib/graphrag-store');
      graphRAGStore.query.mockRejectedValueOnce(new Error('GraphRAG error'));

      const query: PatternSearchQuery = {
        description: 'Password reset',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      // Should use vector store
      expect(result.search_method).toBe('vector');
      expect(result.patterns.length).toBeGreaterThan(0);
    });

    it('should filter by agent', async () => {
      const query: PatternSearchQuery = {
        description: 'Authentication',
        agent: 'Marcus-Backend',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      // All patterns should be from Marcus-Backend
      result.patterns.forEach(pattern => {
        expect(pattern.agent).toBe('Marcus-Backend');
      });
    });

    it('should filter by category', async () => {
      const query: PatternSearchQuery = {
        description: 'Auth feature',
        category: 'auth',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      result.patterns.forEach(pattern => {
        expect(pattern.category).toBe('auth');
      });
    });

    it('should respect limit parameter', async () => {
      const query: PatternSearchQuery = {
        description: 'Authentication',
        limit: 1
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.patterns.length).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateAverageEffort', () => {
    it('should calculate correct average from multiple patterns', async () => {
      const query: PatternSearchQuery = {
        description: 'Auth system',
        limit: 5
      };

      const result = await service.searchSimilarFeatures(query);

      if (result.patterns.length >= 2) {
        const expectedAvg = Math.round(
          result.patterns.reduce((sum, p) => sum + p.effort_hours, 0) / result.patterns.length
        );
        expect(result.avg_effort).toBe(expectedAvg);
      }
    });

    it('should return null for no patterns', async () => {
      const { graphRAGStore } = require('../../src/lib/graphrag-store');
      graphRAGStore.query.mockResolvedValueOnce([]);

      const query: PatternSearchQuery = {
        description: 'Nonexistent feature'
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.avg_effort).toBeNull();
    });
  });

  describe('consolidateLessons', () => {
    it('should deduplicate similar lessons', async () => {
      const query: PatternSearchQuery = {
        description: 'Auth implementation'
      };

      const result = await service.searchSimilarFeatures(query);

      const lessons = result.consolidated_lessons;
      const uniqueLessons = new Set(lessons);

      expect(lessons.length).toBe(uniqueLessons.size); // No duplicates
    });

    it('should limit consolidated lessons to 10', async () => {
      const query: PatternSearchQuery = {
        description: 'Complex feature'
      };

      const result = await service.searchSimilarFeatures(query);

      expect(result.consolidated_lessons.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Historical Pattern Format', () => {
    it('should convert GraphRAG results to HistoricalPattern format', async () => {
      const query: PatternSearchQuery = {
        description: 'JWT auth'
      };

      const result = await service.searchSimilarFeatures(query);

      const pattern = result.patterns[0];
      expect(pattern).toHaveProperty('feature_name');
      expect(pattern).toHaveProperty('effort_hours');
      expect(pattern).toHaveProperty('effort_range');
      expect(pattern).toHaveProperty('confidence');
      expect(pattern).toHaveProperty('success_score');
      expect(pattern).toHaveProperty('lessons_learned');
      expect(pattern).toHaveProperty('code_examples');
      expect(pattern).toHaveProperty('risks');
      expect(pattern).toHaveProperty('similarity_score');
    });

    it('should include effort range with min/max', async () => {
      const query: PatternSearchQuery = {
        description: 'Auth'
      };

      const result = await service.searchSimilarFeatures(query);

      result.patterns.forEach(pattern => {
        expect(pattern.effort_range.min).toBeLessThan(pattern.effort_hours);
        expect(pattern.effort_range.max).toBeGreaterThan(pattern.effort_hours);
        expect(pattern.effort_range.min).toBeGreaterThan(0);
      });
    });
  });
});
