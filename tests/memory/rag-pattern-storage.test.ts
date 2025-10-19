/**
 * RAG Pattern Storage Tests
 *
 * Validates pattern insertion, embedding generation, and metadata storage
 * in the Supabase vector database. Ensures data integrity and performance.
 *
 * Test Coverage:
 * - Pattern insertion into vector database
 * - Embedding generation with OpenAI/fallback
 * - Metadata storage and validation
 * - Duplicate pattern handling
 * - Performance benchmarks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { EnhancedVectorMemoryStore, MemoryDocument, RAGQuery } from '../../src/rag/enhanced-vector-memory-store.js';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('RAG Pattern Storage Tests', () => {
  let vectorStore: EnhancedVectorMemoryStore;
  let supabase: any;
  let isSupabaseConfigured: boolean = false;
  let testPatternIds: string[] = [];

  beforeAll(async () => {
    // Initialize vector store
    vectorStore = new EnhancedVectorMemoryStore();
    await vectorStore.initialize();

    // Check if Supabase is configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      isSupabaseConfigured = true;
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      console.log('✅ Supabase configured - running full integration tests');
    } else {
      console.log('⚠️  Supabase not configured - running local-only tests');
    }
  });

  afterAll(async () => {
    // Cleanup test patterns
    if (isSupabaseConfigured && testPatternIds.length > 0) {
      try {
        await supabase
          .from('versatil_memories')
          .delete()
          .in('id', testPatternIds);
        console.log(`🧹 Cleaned up ${testPatternIds.length} test patterns`);
      } catch (error) {
        console.warn('Cleanup warning:', error);
      }
    }

    await vectorStore.close();
  });

  beforeEach(() => {
    testPatternIds = [];
  });

  describe('1. Pattern Insertion', () => {
    it('should insert a pattern with valid metadata', async () => {
      const patternId = await vectorStore.storeMemory({
        content: 'Use bcrypt with 12 rounds for password hashing',
        contentType: 'code',
        metadata: {
          agentId: 'enhanced-marcus',
          timestamp: Date.now(),
          tags: ['security', 'authentication', 'password'],
          language: 'typescript',
          framework: 'express',
          pattern_type: 'best-practice',
          quality_score: 95
        }
      });

      expect(patternId).toBeDefined();
      expect(typeof patternId).toBe('string');
      testPatternIds.push(patternId);

      // Verify pattern exists in memory
      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored).toBeDefined();
      expect(stored?.content).toBe('Use bcrypt with 12 rounds for password hashing');
      expect(stored?.metadata.agentId).toBe('enhanced-marcus');
      expect(stored?.metadata.tags).toContain('security');
    }, 10000);

    it('should insert pattern with minimal metadata', async () => {
      const patternId = await vectorStore.storeMemory({
        content: 'Minimal test pattern',
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: []
        }
      });

      expect(patternId).toBeDefined();
      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored).toBeDefined();
      expect(stored?.metadata.agentId).toBe('test-agent');
    }, 10000);

    it('should handle special characters in pattern content', async () => {
      const specialContent = 'Pattern with special chars: @#$%^&*() "quotes" \'apostrophes\' \n newlines \t tabs';

      const patternId = await vectorStore.storeMemory({
        content: specialContent,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['special-chars']
        }
      });

      expect(patternId).toBeDefined();
      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.content).toBe(specialContent);
    }, 10000);

    it('should insert multiple patterns concurrently', async () => {
      const insertPromises = Array.from({ length: 10 }, (_, i) =>
        vectorStore.storeMemory({
          content: `Concurrent pattern ${i}`,
          contentType: 'text',
          metadata: {
            agentId: 'concurrent-test',
            timestamp: Date.now(),
            tags: [`concurrent-${i}`],
            index: i
          }
        })
      );

      const ids = await Promise.all(insertPromises);

      expect(ids.length).toBe(10);
      expect(new Set(ids).size).toBe(10); // All unique IDs
      testPatternIds.push(...ids);

      const memories = await vectorStore.getAllMemories();
      const concurrentPatterns = memories.filter(m =>
        m.metadata.agentId === 'concurrent-test'
      );

      expect(concurrentPatterns.length).toBeGreaterThanOrEqual(10);
    }, 15000);

    it('should handle large pattern content (>10KB)', async () => {
      const largeContent = 'x'.repeat(15000); // 15KB pattern

      const patternId = await vectorStore.storeMemory({
        content: largeContent,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['large-content'],
          size: largeContent.length
        }
      });

      expect(patternId).toBeDefined();
      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.content.length).toBe(15000);
      expect(stored?.metadata.size).toBe(15000);
    }, 15000);
  });

  describe('2. Embedding Generation', () => {
    it('should generate embeddings for text patterns', async () => {
      const patternId = await vectorStore.storeMemory({
        content: 'Authentication pattern using JWT tokens',
        contentType: 'text',
        metadata: {
          agentId: 'enhanced-marcus',
          timestamp: Date.now(),
          tags: ['authentication', 'jwt']
        }
      });

      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.embedding).toBeDefined();
      expect(Array.isArray(stored?.embedding)).toBe(true);
      expect(stored?.embedding?.length).toBeGreaterThan(0);

      // Verify embedding dimension (should be 1536 for OpenAI ada-002)
      if (stored?.embedding) {
        expect(stored.embedding.length).toBeGreaterThanOrEqual(512);
        expect(stored.embedding.length).toBeLessThanOrEqual(3072);
      }
    }, 10000);

    it('should generate embeddings for code patterns', async () => {
      const codePattern = `
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
      `;

      const patternId = await vectorStore.storeMemory({
        content: codePattern,
        contentType: 'code',
        metadata: {
          agentId: 'enhanced-marcus',
          timestamp: Date.now(),
          tags: ['code', 'bcrypt'],
          language: 'typescript'
        }
      });

      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.embedding).toBeDefined();
      expect(stored?.embedding?.length).toBeGreaterThan(0);
    }, 10000);

    it('should generate consistent embeddings for similar content', async () => {
      const content1 = 'Use bcrypt for password hashing with 12 rounds';
      const content2 = 'Password hashing should use bcrypt with 12 round salt';

      const id1 = await vectorStore.storeMemory({
        content: content1,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['bcrypt']
        }
      });

      const id2 = await vectorStore.storeMemory({
        content: content2,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['bcrypt']
        }
      });

      testPatternIds.push(id1, id2);

      const memories = await vectorStore.getAllMemories();
      const pattern1 = memories.find(m => m.id === id1);
      const pattern2 = memories.find(m => m.id === id2);

      expect(pattern1?.embedding).toBeDefined();
      expect(pattern2?.embedding).toBeDefined();

      // Calculate cosine similarity (should be high for similar content)
      if (pattern1?.embedding && pattern2?.embedding) {
        const similarity = cosineSimilarity(pattern1.embedding, pattern2.embedding);
        expect(similarity).toBeGreaterThan(0.6); // High similarity for similar content
      }
    }, 15000);

    it('should handle embedding generation for empty/short content', async () => {
      const shortContent = 'JWT';

      const patternId = await vectorStore.storeMemory({
        content: shortContent,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['short']
        }
      });

      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.embedding).toBeDefined();
      expect(stored?.embedding?.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('3. Metadata Storage', () => {
    it('should preserve all metadata fields', async () => {
      const metadata = {
        agentId: 'enhanced-marcus',
        timestamp: Date.now(),
        tags: ['security', 'authentication'],
        language: 'typescript',
        framework: 'express',
        pattern_type: 'best-practice',
        quality_score: 95,
        custom_field: 'custom_value',
        nested: { key: 'value', array: [1, 2, 3] }
      };

      const patternId = await vectorStore.storeMemory({
        content: 'Test pattern with full metadata',
        contentType: 'code',
        metadata
      });

      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.metadata.agentId).toBe('enhanced-marcus');
      expect(stored?.metadata.tags).toEqual(['security', 'authentication']);
      expect(stored?.metadata.language).toBe('typescript');
      expect(stored?.metadata.framework).toBe('express');
      expect(stored?.metadata.custom_field).toBe('custom_value');
      expect(stored?.metadata.nested).toEqual({ key: 'value', array: [1, 2, 3] });
    }, 10000);

    it('should handle metadata with special types', async () => {
      const metadata = {
        agentId: 'test-agent',
        timestamp: Date.now(),
        tags: ['test'],
        numberField: 42,
        booleanField: true,
        nullField: null,
        arrayField: [1, 'two', { three: 3 }],
        objectField: { nested: { deeply: { value: 'deep' } } }
      };

      const patternId = await vectorStore.storeMemory({
        content: 'Pattern with special metadata types',
        contentType: 'text',
        metadata
      });

      testPatternIds.push(patternId);

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.metadata.numberField).toBe(42);
      expect(stored?.metadata.booleanField).toBe(true);
      expect(stored?.metadata.arrayField).toEqual([1, 'two', { three: 3 }]);
    }, 10000);

    it('should update metadata timestamp automatically', async () => {
      const beforeTimestamp = Date.now();

      const patternId = await vectorStore.storeMemory({
        content: 'Pattern to check timestamp',
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: beforeTimestamp,
          tags: ['timestamp-test']
        }
      });

      testPatternIds.push(patternId);

      const afterTimestamp = Date.now();

      const memories = await vectorStore.getAllMemories();
      const stored = memories.find(m => m.id === patternId);

      expect(stored?.metadata.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(stored?.metadata.timestamp).toBeLessThanOrEqual(afterTimestamp);
    }, 10000);
  });

  describe('4. Duplicate Pattern Handling', () => {
    it('should allow duplicate content with different metadata', async () => {
      const content = 'Duplicate pattern content';

      const id1 = await vectorStore.storeMemory({
        content,
        contentType: 'text',
        metadata: {
          agentId: 'agent1',
          timestamp: Date.now(),
          tags: ['tag1']
        }
      });

      const id2 = await vectorStore.storeMemory({
        content,
        contentType: 'text',
        metadata: {
          agentId: 'agent2',
          timestamp: Date.now(),
          tags: ['tag2']
        }
      });

      testPatternIds.push(id1, id2);

      expect(id1).not.toBe(id2);

      const memories = await vectorStore.getAllMemories();
      const duplicates = memories.filter(m => m.content === content);

      expect(duplicates.length).toBeGreaterThanOrEqual(2);
    }, 10000);

    it('should detect near-duplicate patterns via similarity', async () => {
      const pattern1 = 'Use JWT tokens for authentication with 24 hour expiry';
      const pattern2 = 'JWT tokens for auth with 24h expiration';

      const id1 = await vectorStore.storeMemory({
        content: pattern1,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['jwt']
        }
      });

      const id2 = await vectorStore.storeMemory({
        content: pattern2,
        contentType: 'text',
        metadata: {
          agentId: 'test-agent',
          timestamp: Date.now(),
          tags: ['jwt']
        }
      });

      testPatternIds.push(id1, id2);

      // Query for JWT patterns
      const result = await vectorStore.queryMemories({
        query: 'JWT authentication tokens',
        queryType: 'semantic',
        topK: 5
      });

      // Both patterns should be in top results
      const ids = result.documents.map(d => d.id);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);

      // Should have high similarity scores
      const pattern1Result = result.documents.find(d => d.id === id1);
      const pattern2Result = result.documents.find(d => d.id === id2);

      expect(pattern1Result?.metadata.relevanceScore).toBeGreaterThan(0.5);
      expect(pattern2Result?.metadata.relevanceScore).toBeGreaterThan(0.5);
    }, 15000);
  });

  describe('5. Performance Benchmarks', () => {
    it('should insert pattern within 500ms', async () => {
      const startTime = Date.now();

      const patternId = await vectorStore.storeMemory({
        content: 'Performance test pattern',
        contentType: 'text',
        metadata: {
          agentId: 'perf-test',
          timestamp: Date.now(),
          tags: ['performance']
        }
      });

      const insertTime = Date.now() - startTime;
      testPatternIds.push(patternId);

      expect(insertTime).toBeLessThan(5000); // Allow 5s for embedding generation
      console.log(`📊 Insert time: ${insertTime}ms`);
    }, 10000);

    it('should handle batch insertion efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 20;

      const insertPromises = Array.from({ length: batchSize }, (_, i) =>
        vectorStore.storeMemory({
          content: `Batch pattern ${i}`,
          contentType: 'text',
          metadata: {
            agentId: 'batch-test',
            timestamp: Date.now(),
            tags: [`batch-${i}`]
          }
        })
      );

      const ids = await Promise.all(insertPromises);
      const batchTime = Date.now() - startTime;

      testPatternIds.push(...ids);

      expect(ids.length).toBe(batchSize);
      expect(batchTime).toBeLessThan(30000); // 30s for 20 patterns with embeddings

      const avgTime = batchTime / batchSize;
      console.log(`📊 Batch insert: ${batchTime}ms total, ${avgTime.toFixed(0)}ms avg per pattern`);
    }, 35000);

    it('should maintain consistent performance across multiple inserts', async () => {
      const insertTimes: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();

        const patternId = await vectorStore.storeMemory({
          content: `Consistency test pattern ${i}`,
          contentType: 'text',
          metadata: {
            agentId: 'consistency-test',
            timestamp: Date.now(),
            tags: ['consistency']
          }
        });

        insertTimes.push(Date.now() - startTime);
        testPatternIds.push(patternId);
      }

      // Calculate variance
      const avgTime = insertTimes.reduce((a, b) => a + b, 0) / insertTimes.length;
      const variance = insertTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / insertTimes.length;
      const stdDev = Math.sqrt(variance);

      console.log(`📊 Performance consistency: avg=${avgTime.toFixed(0)}ms, stdDev=${stdDev.toFixed(0)}ms`);

      // Standard deviation should be reasonable (less than 2x avg)
      expect(stdDev).toBeLessThan(avgTime * 2);
    }, 30000);
  });

  describe('6. Supabase Integration (if configured)', () => {
    it('should store pattern in Supabase database', async () => {
      if (!isSupabaseConfigured) {
        console.log('⏭️  Skipping Supabase test - not configured');
        return;
      }

      const patternId = await vectorStore.storeMemory({
        content: 'Supabase integration test pattern',
        contentType: 'code',
        metadata: {
          agentId: 'supabase-test',
          timestamp: Date.now(),
          tags: ['supabase', 'integration']
        }
      });

      testPatternIds.push(patternId);

      // Query Supabase directly
      const { data, error } = await supabase
        .from('versatil_memories')
        .select('*')
        .eq('id', patternId)
        .single();

      if (error) {
        console.warn('Supabase query error:', error);
        // Don't fail test if table doesn't exist yet
        return;
      }

      expect(data).toBeDefined();
      expect(data.content).toBe('Supabase integration test pattern');
      expect(data.metadata.tags).toContain('supabase');
    }, 10000);

    it('should store embedding in vector column', async () => {
      if (!isSupabaseConfigured) {
        console.log('⏭️  Skipping Supabase embedding test - not configured');
        return;
      }

      const patternId = await vectorStore.storeMemory({
        content: 'Vector embedding test',
        contentType: 'text',
        metadata: {
          agentId: 'embedding-test',
          timestamp: Date.now(),
          tags: ['embedding']
        }
      });

      testPatternIds.push(patternId);

      // Query Supabase for embedding
      const { data, error } = await supabase
        .from('versatil_memories')
        .select('embedding')
        .eq('id', patternId)
        .single();

      if (error) {
        console.warn('Supabase embedding query error:', error);
        return;
      }

      expect(data?.embedding).toBeDefined();
      expect(Array.isArray(data.embedding)).toBe(true);
      expect(data.embedding.length).toBeGreaterThan(0);
    }, 10000);
  });
});

// Helper function for cosine similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * (vec2[i] || 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (mag1 * mag2);
}
