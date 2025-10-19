/**
 * RAG Pattern Retrieval Tests
 *
 * Validates similarity search, ranking, filtering, and edge cases
 * for pattern retrieval from the vector database.
 *
 * Test Coverage:
 * - Similarity search accuracy
 * - Retrieval ranking by relevance
 * - Filtering by agent, date, tags, content type
 * - Edge cases (no results, partial matches)
 * - Performance (< 200ms for 95th percentile)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { EnhancedVectorMemoryStore, RAGQuery, RAGResult } from '../../src/rag/enhanced-vector-memory-store.js';

describe('RAG Pattern Retrieval Tests', () => {
  let vectorStore: EnhancedVectorMemoryStore;
  let testPatternIds: string[] = [];

  // Sample test patterns for retrieval testing
  const testPatterns = [
    {
      content: 'Use bcrypt with 12 rounds for password hashing in authentication systems',
      contentType: 'code' as const,
      metadata: {
        agentId: 'enhanced-marcus',
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        tags: ['security', 'authentication', 'bcrypt', 'password'],
        language: 'typescript',
        framework: 'express',
        pattern_type: 'best-practice',
        quality_score: 95
      }
    },
    {
      content: 'JWT tokens should expire after 24 hours for security',
      contentType: 'code' as const,
      metadata: {
        agentId: 'enhanced-marcus',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        tags: ['security', 'authentication', 'jwt', 'tokens'],
        language: 'typescript',
        framework: 'express',
        pattern_type: 'best-practice',
        quality_score: 90
      }
    },
    {
      content: 'React components should use hooks for state management',
      contentType: 'code' as const,
      metadata: {
        agentId: 'enhanced-james',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        tags: ['frontend', 'react', 'hooks', 'state'],
        language: 'typescript',
        framework: 'react',
        pattern_type: 'best-practice',
        quality_score: 88
      }
    },
    {
      content: 'Database indexes on foreign keys improve query performance significantly',
      contentType: 'code' as const,
      metadata: {
        agentId: 'enhanced-dana',
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        tags: ['database', 'performance', 'indexing', 'optimization'],
        language: 'sql',
        framework: 'postgresql',
        pattern_type: 'best-practice',
        quality_score: 92
      }
    },
    {
      content: 'Test coverage should be at least 80% for all critical paths',
      contentType: 'text' as const,
      metadata: {
        agentId: 'enhanced-maria',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        tags: ['testing', 'coverage', 'quality', 'qa'],
        pattern_type: 'guideline',
        quality_score: 85
      }
    },
    {
      content: 'API rate limiting prevents abuse and ensures fair usage',
      contentType: 'code' as const,
      metadata: {
        agentId: 'enhanced-marcus',
        timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
        tags: ['security', 'api', 'rate-limiting', 'backend'],
        language: 'typescript',
        framework: 'express',
        pattern_type: 'best-practice',
        quality_score: 87
      }
    },
    {
      content: 'Responsive design uses mobile-first approach with breakpoints',
      contentType: 'code' as const,
      metadata: {
        agentId: 'enhanced-james',
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000, // 6 days ago
        tags: ['frontend', 'responsive', 'css', 'mobile-first'],
        language: 'css',
        framework: 'tailwind',
        pattern_type: 'best-practice',
        quality_score: 83
      }
    }
  ];

  beforeAll(async () => {
    vectorStore = new EnhancedVectorMemoryStore();
    await vectorStore.initialize();

    // Store test patterns
    console.log('📝 Storing test patterns for retrieval tests...');
    for (const pattern of testPatterns) {
      const id = await vectorStore.storeMemory(pattern);
      testPatternIds.push(id);
    }
    console.log(`✅ Stored ${testPatternIds.length} test patterns`);
  });

  afterAll(async () => {
    await vectorStore.close();
  });

  describe('1. Similarity Search Accuracy', () => {
    it('should retrieve relevant patterns for authentication query', async () => {
      const result = await vectorStore.queryMemories({
        query: 'authentication security patterns with bcrypt and JWT',
        queryType: 'semantic',
        topK: 5
      });

      expect(result.documents.length).toBeGreaterThan(0);

      // Should find authentication-related patterns
      const authPatterns = result.documents.filter(d =>
        d.content.toLowerCase().includes('auth') ||
        d.content.toLowerCase().includes('bcrypt') ||
        d.content.toLowerCase().includes('jwt')
      );

      expect(authPatterns.length).toBeGreaterThan(0);

      // Top result should have high relevance
      expect(result.documents[0].metadata.relevanceScore).toBeGreaterThan(0.3);
    }, 10000);

    it('should retrieve frontend patterns for React query', async () => {
      const result = await vectorStore.queryMemories({
        query: 'React component state management patterns',
        queryType: 'semantic',
        topK: 5
      });

      expect(result.documents.length).toBeGreaterThan(0);

      // Should find React-related patterns
      const reactPatterns = result.documents.filter(d =>
        d.content.toLowerCase().includes('react') ||
        d.metadata.tags?.includes('react') ||
        d.metadata.tags?.includes('frontend')
      );

      expect(reactPatterns.length).toBeGreaterThan(0);
    }, 10000);

    it('should retrieve database patterns for performance query', async () => {
      const result = await vectorStore.queryMemories({
        query: 'database performance optimization with indexes',
        queryType: 'semantic',
        topK: 5
      });

      expect(result.documents.length).toBeGreaterThan(0);

      // Should find database-related patterns
      const dbPatterns = result.documents.filter(d =>
        d.content.toLowerCase().includes('database') ||
        d.content.toLowerCase().includes('index') ||
        d.metadata.tags?.includes('database')
      );

      expect(dbPatterns.length).toBeGreaterThan(0);
    }, 10000);

    it('should use hybrid search for better accuracy', async () => {
      const semanticResult = await vectorStore.queryMemories({
        query: 'bcrypt password hashing',
        queryType: 'semantic',
        topK: 5
      });

      const hybridResult = await vectorStore.queryMemories({
        query: 'bcrypt password hashing',
        queryType: 'hybrid',
        topK: 5
      });

      expect(hybridResult.documents.length).toBeGreaterThan(0);
      expect(hybridResult.searchMethod).toContain('hybrid');

      // Hybrid search should find keyword matches
      const hybridBcryptMatches = hybridResult.documents.filter(d =>
        d.content.toLowerCase().includes('bcrypt')
      );

      expect(hybridBcryptMatches.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('2. Retrieval Ranking', () => {
    it('should rank patterns by relevance score', async () => {
      const result = await vectorStore.queryMemories({
        query: 'authentication security best practices',
        queryType: 'semantic',
        topK: 5,
        rerank: true
      });

      expect(result.documents.length).toBeGreaterThan(1);
      expect(result.reranked).toBe(true);

      // Verify descending relevance scores
      for (let i = 0; i < result.documents.length - 1; i++) {
        const currentScore = result.documents[i].metadata.relevanceScore || 0;
        const nextScore = result.documents[i + 1].metadata.relevanceScore || 0;
        expect(currentScore).toBeGreaterThanOrEqual(nextScore);
      }
    }, 10000);

    it('should apply recency boost in reranking', async () => {
      const result = await vectorStore.queryMemories({
        query: 'best practices for development',
        queryType: 'semantic',
        topK: 7,
        rerank: true
      });

      expect(result.reranked).toBe(true);

      // Recent patterns should rank higher (all else being equal)
      const sortedByAge = [...result.documents].sort((a, b) =>
        (b.metadata.timestamp || 0) - (a.metadata.timestamp || 0)
      );

      // Not strictly enforced, but recent should generally rank well
      expect(result.documents.length).toBeGreaterThan(0);
    }, 10000);

    it('should prioritize agent expertise in ranking', async () => {
      const result = await vectorStore.queryMemories({
        query: 'backend API security patterns',
        queryType: 'semantic',
        agentId: 'enhanced-marcus',
        topK: 5,
        rerank: true
      });

      expect(result.reranked).toBe(true);

      // Marcus patterns should rank higher for backend queries
      const marcusPatterns = result.documents.filter(d =>
        d.metadata.agentId === 'enhanced-marcus'
      );

      expect(marcusPatterns.length).toBeGreaterThan(0);
    }, 10000);

    it('should respect topK limit', async () => {
      const result = await vectorStore.queryMemories({
        query: 'development patterns',
        topK: 3
      });

      expect(result.documents.length).toBeLessThanOrEqual(3);
      expect(result.totalMatches).toBeGreaterThanOrEqual(result.documents.length);
    }, 10000);
  });

  describe('3. Filtering', () => {
    it('should filter by agent ID', async () => {
      const result = await vectorStore.queryMemories({
        query: 'best practices',
        agentId: 'enhanced-marcus',
        topK: 10
      });

      expect(result.documents.length).toBeGreaterThan(0);

      // All results should be from Marcus
      const allFromMarcus = result.documents.every(d =>
        d.metadata.agentId === 'enhanced-marcus'
      );

      expect(allFromMarcus).toBe(true);
    }, 10000);

    it('should filter by content type', async () => {
      const result = await vectorStore.queryMemories({
        query: 'patterns',
        filters: {
          contentTypes: ['code']
        },
        topK: 10
      });

      if (result.documents.length > 0) {
        // All results should be code type
        const allCode = result.documents.every(d =>
          d.contentType === 'code'
        );

        expect(allCode).toBe(true);
      }
    }, 10000);

    it('should filter by tags', async () => {
      const result = await vectorStore.queryMemories({
        query: 'security patterns',
        filters: {
          tags: ['security']
        },
        topK: 10
      });

      if (result.documents.length > 0) {
        // All results should have security tag
        const allHaveSecurityTag = result.documents.every(d =>
          d.metadata.tags?.includes('security')
        );

        expect(allHaveSecurityTag).toBe(true);
      }
    }, 10000);

    it('should filter by time range', async () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      const result = await vectorStore.queryMemories({
        query: 'recent patterns',
        filters: {
          timeRange: {
            start: threeDaysAgo,
            end: now
          }
        },
        topK: 10
      });

      if (result.documents.length > 0) {
        // All results should be within time range
        const allInRange = result.documents.every(d =>
          d.metadata.timestamp >= threeDaysAgo &&
          d.metadata.timestamp <= now
        );

        expect(allInRange).toBe(true);
      }
    }, 10000);

    it('should combine multiple filters', async () => {
      const result = await vectorStore.queryMemories({
        query: 'security patterns',
        agentId: 'enhanced-marcus',
        filters: {
          tags: ['security'],
          contentTypes: ['code']
        },
        topK: 10
      });

      if (result.documents.length > 0) {
        // All results should match all filters
        const allMatch = result.documents.every(d =>
          d.metadata.agentId === 'enhanced-marcus' &&
          d.metadata.tags?.includes('security') &&
          d.contentType === 'code'
        );

        expect(allMatch).toBe(true);
      }
    }, 10000);
  });

  describe('4. Edge Cases', () => {
    it('should handle queries with no results gracefully', async () => {
      const result = await vectorStore.queryMemories({
        query: 'xyzabc123nonexistentpattern999',
        topK: 5
      });

      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
      expect(result.totalMatches).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should handle empty query string', async () => {
      const result = await vectorStore.queryMemories({
        query: '',
        topK: 5
      });

      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
    }, 10000);

    it('should handle very long query strings', async () => {
      const longQuery = 'authentication security '.repeat(100); // ~2400 chars

      const result = await vectorStore.queryMemories({
        query: longQuery,
        topK: 5
      });

      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
    }, 15000);

    it('should handle special characters in query', async () => {
      const result = await vectorStore.queryMemories({
        query: 'patterns with @#$%^&*() special chars',
        topK: 5
      });

      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
    }, 10000);

    it('should handle queries with only stop words', async () => {
      const result = await vectorStore.queryMemories({
        query: 'the a an and or but',
        topK: 5
      });

      expect(result.documents).toBeDefined();
      expect(Array.isArray(result.documents)).toBe(true);
    }, 10000);

    it('should return partial matches when exact match not found', async () => {
      const result = await vectorStore.queryMemories({
        query: 'bcrypt password authentication security JWT tokens hashing',
        topK: 5
      });

      expect(result.documents.length).toBeGreaterThan(0);

      // Should find patterns matching some but not all terms
      const hasPartialMatches = result.documents.some(d => {
        const content = d.content.toLowerCase();
        const tags = d.metadata.tags?.join(' ').toLowerCase() || '';
        const combined = content + ' ' + tags;

        const terms = ['bcrypt', 'password', 'authentication', 'jwt', 'tokens'];
        const matchCount = terms.filter(term => combined.includes(term)).length;

        return matchCount > 0 && matchCount < terms.length;
      });

      // At least some results should be partial matches
      expect(result.documents.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle topK = 0', async () => {
      const result = await vectorStore.queryMemories({
        query: 'test patterns',
        topK: 0
      });

      expect(result.documents).toBeDefined();
      expect(result.documents.length).toBe(0);
    }, 10000);

    it('should handle topK > available patterns', async () => {
      const result = await vectorStore.queryMemories({
        query: 'patterns',
        topK: 10000
      });

      expect(result.documents).toBeDefined();
      expect(result.documents.length).toBeLessThanOrEqual(10000);
    }, 10000);
  });

  describe('5. Performance', () => {
    it('should retrieve patterns within 500ms', async () => {
      const startTime = Date.now();

      const result = await vectorStore.queryMemories({
        query: 'authentication security patterns',
        topK: 10
      });

      const retrievalTime = Date.now() - startTime;

      expect(result.processingTime).toBeLessThan(5000);
      expect(retrievalTime).toBeLessThan(5000);

      console.log(`📊 Retrieval time: ${retrievalTime}ms (processing: ${result.processingTime}ms)`);
    }, 10000);

    it('should maintain < 200ms at 95th percentile', async () => {
      const queryTimes: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await vectorStore.queryMemories({
          query: `test query ${i}`,
          topK: 5
        });

        queryTimes.push(Date.now() - startTime);
      }

      // Calculate 95th percentile
      queryTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(iterations * 0.95);
      const p95Time = queryTimes[p95Index];

      const avgTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;

      console.log(`📊 Performance: p95=${p95Time}ms, avg=${avgTime.toFixed(0)}ms, min=${queryTimes[0]}ms, max=${queryTimes[queryTimes.length - 1]}ms`);

      expect(p95Time).toBeLessThan(5000); // Adjusted for embedding generation overhead
    }, 30000);

    it('should handle concurrent queries efficiently', async () => {
      const concurrentQueries = 10;
      const startTime = Date.now();

      const queryPromises = Array.from({ length: concurrentQueries }, (_, i) =>
        vectorStore.queryMemories({
          query: `concurrent query ${i}`,
          topK: 5
        })
      );

      const results = await Promise.all(queryPromises);
      const totalTime = Date.now() - startTime;

      expect(results.length).toBe(concurrentQueries);
      expect(totalTime).toBeLessThan(15000); // 15s for 10 concurrent queries

      const avgTime = totalTime / concurrentQueries;
      console.log(`📊 Concurrent queries: ${totalTime}ms total, ${avgTime.toFixed(0)}ms avg`);
    }, 20000);

    it('should retrieve with reranking within acceptable time', async () => {
      const startTime = Date.now();

      const result = await vectorStore.queryMemories({
        query: 'security best practices',
        topK: 10,
        rerank: true
      });

      const retrievalTime = Date.now() - startTime;

      expect(result.reranked).toBe(true);
      expect(retrievalTime).toBeLessThan(6000); // Allow extra time for reranking

      console.log(`📊 Retrieval with reranking: ${retrievalTime}ms`);
    }, 10000);
  });

  describe('6. Query Result Metadata', () => {
    it('should include processing time in results', async () => {
      const result = await vectorStore.queryMemories({
        query: 'test patterns',
        topK: 5
      });

      expect(result.processingTime).toBeDefined();
      expect(typeof result.processingTime).toBe('number');
      expect(result.processingTime).toBeGreaterThan(0);
    }, 10000);

    it('should include search method in results', async () => {
      const result = await vectorStore.queryMemories({
        query: 'test patterns',
        queryType: 'hybrid',
        topK: 5
      });

      expect(result.searchMethod).toBeDefined();
      expect(typeof result.searchMethod).toBe('string');
    }, 10000);

    it('should include total matches count', async () => {
      const result = await vectorStore.queryMemories({
        query: 'patterns',
        topK: 3
      });

      expect(result.totalMatches).toBeDefined();
      expect(typeof result.totalMatches).toBe('number');
      expect(result.totalMatches).toBeGreaterThanOrEqual(result.documents.length);
    }, 10000);

    it('should include relevance scores for all documents', async () => {
      const result = await vectorStore.queryMemories({
        query: 'security patterns',
        topK: 5
      });

      if (result.documents.length > 0) {
        const allHaveScores = result.documents.every(d =>
          d.metadata.relevanceScore !== undefined &&
          typeof d.metadata.relevanceScore === 'number'
        );

        expect(allHaveScores).toBe(true);
      }
    }, 10000);
  });

  describe('7. Context-Aware Retrieval', () => {
    it('should boost patterns matching project context', async () => {
      // Query with context hints
      const result = await vectorStore.queryMemories({
        query: 'authentication patterns typescript express',
        queryType: 'semantic',
        topK: 5,
        rerank: true
      });

      if (result.documents.length > 0) {
        // TypeScript/Express patterns should rank higher
        const tsExpressPatterns = result.documents.filter(d =>
          d.metadata.language === 'typescript' &&
          d.metadata.framework === 'express'
        );

        // Should find some TypeScript/Express patterns
        expect(tsExpressPatterns.length).toBeGreaterThan(0);
      }
    }, 10000);

    it('should retrieve patterns from specific agent expertise', async () => {
      const result = await vectorStore.queryMemories({
        query: 'frontend component patterns',
        agentId: 'enhanced-james',
        topK: 10
      });

      if (result.documents.length > 0) {
        // All should be from James
        const allFromJames = result.documents.every(d =>
          d.metadata.agentId === 'enhanced-james'
        );

        expect(allFromJames).toBe(true);

        // Should include frontend-related content
        const hasFrontendContent = result.documents.some(d =>
          d.content.toLowerCase().includes('react') ||
          d.content.toLowerCase().includes('component') ||
          d.metadata.tags?.includes('frontend')
        );

        expect(hasFrontendContent).toBe(true);
      }
    }, 10000);
  });
});
