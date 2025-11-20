/**
 * VERSATIL SDLC Framework - Semantic Similarity Service
 *
 * Calculate semantic similarity between text strings using embeddings + cosine similarity.
 * Used for vision alignment verification.
 *
 * Part of Guardian's Context Layer Verification (v7.9.0)
 */

import { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';

export interface SemanticMatch {
  text: string;
  similarity: number; // 0-1 (cosine similarity)
  isMatch: boolean; // similarity >= threshold
}

export interface SemanticSimilarityResult {
  query: string;
  matches: SemanticMatch[];
  bestMatch: SemanticMatch | null;
  overallAlignment: number; // 0-100
  threshold: number;
  method: string;
}

export class SemanticSimilarityService {
  private static instance: SemanticSimilarityService;
  private vectorStore: EnhancedVectorMemoryStore;

  constructor() {
    this.vectorStore = new EnhancedVectorMemoryStore();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SemanticSimilarityService {
    if (!SemanticSimilarityService.instance) {
      SemanticSimilarityService.instance = new SemanticSimilarityService();
    }
    return SemanticSimilarityService.instance;
  }

  /**
   * Calculate semantic similarity between a query and multiple candidates
   *
   * @param query - The text to compare (e.g., feature description)
   * @param candidates - Array of texts to compare against (e.g., project goals)
   * @param threshold - Minimum similarity score to consider a match (0-1, default 0.7)
   * @returns Semantic similarity result with matches and overall alignment score
   */
  async calculateSimilarity(
    query: string,
    candidates: string[],
    threshold: number = 0.7
  ): Promise<SemanticSimilarityResult> {
    // Edge case: No candidates
    if (candidates.length === 0) {
      return {
        query,
        matches: [],
        bestMatch: null,
        overallAlignment: 0,
        threshold,
        method: 'no candidates'
      };
    }

    // Edge case: Empty query
    if (!query || query.trim().length === 0) {
      return {
        query,
        matches: candidates.map(text => ({
          text,
          similarity: 0,
          isMatch: false
        })),
        bestMatch: null,
        overallAlignment: 0,
        threshold,
        method: 'empty query'
      };
    }

    try {
      // Initialize vector store if needed
      await this.vectorStore.initialize();

      // Get query embedding
      const queryEmbedding = await this.getEmbedding(query);

      // Calculate similarity for each candidate
      const matches: SemanticMatch[] = [];

      for (const candidate of candidates) {
        const candidateEmbedding = await this.getEmbedding(candidate);
        const similarity = this.cosineSimilarity(queryEmbedding, candidateEmbedding);

        matches.push({
          text: candidate,
          similarity,
          isMatch: similarity >= threshold
        });
      }

      // Sort by similarity (descending)
      matches.sort((a, b) => b.similarity - a.similarity);

      // Find best match
      const bestMatch = matches.length > 0 ? matches[0] : null;

      // Calculate overall alignment
      // Strategy: Average of all matches above threshold, or best match if none above threshold
      const matchesAboveThreshold = matches.filter(m => m.isMatch);
      const overallAlignment = matchesAboveThreshold.length > 0
        ? Math.round((matchesAboveThreshold.reduce((sum, m) => sum + m.similarity, 0) / matchesAboveThreshold.length) * 100)
        : Math.round((bestMatch?.similarity || 0) * 100);

      return {
        query,
        matches,
        bestMatch,
        overallAlignment,
        threshold,
        method: 'cosine similarity + embeddings'
      };
    } catch (error) {
      // Fallback: Keyword matching if embeddings fail
      return this.fallbackKeywordMatching(query, candidates, threshold);
    }
  }

  /**
   * Get embedding vector for text (uses EnhancedVectorMemoryStore)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Store text temporarily to get its embedding
    const tempDoc = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: text,
      contentType: 'text' as const,
      metadata: {
        agentId: 'guardian-semantic-similarity',
        timestamp: Date.now(),
        tags: ['temp']
      }
    };

    // Store memory (this generates embedding)
    await this.vectorStore.storeMemory(tempDoc);

    // Retrieve embedding
    const memories = await this.vectorStore.getAllMemories();
    const stored = memories.find(m => m.id === tempDoc.id);

    if (stored && stored.embedding) {
      return stored.embedding;
    }

    // Fallback: Generate simple embedding (bag of words)
    return this.fallbackEmbedding(text);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error(`Vector length mismatch: ${vec1.length} vs ${vec2.length}`);
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Fallback: Simple keyword matching when embeddings unavailable
   */
  private fallbackKeywordMatching(
    query: string,
    candidates: string[],
    threshold: number
  ): SemanticSimilarityResult {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    const matches: SemanticMatch[] = candidates.map(candidate => {
      const candidateWords = new Set(candidate.toLowerCase().split(/\s+/));

      // Calculate Jaccard similarity
      const queryWordsArray = Array.from(queryWords);
      const candidateWordsArray = Array.from(candidateWords);
      const intersection = new Set(queryWordsArray.filter(w => candidateWords.has(w)));
      const union = new Set([...queryWordsArray, ...candidateWordsArray]);

      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      return {
        text: candidate,
        similarity,
        isMatch: similarity >= threshold
      };
    });

    // Sort by similarity
    matches.sort((a, b) => b.similarity - a.similarity);

    const bestMatch = matches.length > 0 ? matches[0] : null;

    const matchesAboveThreshold = matches.filter(m => m.isMatch);
    const overallAlignment = matchesAboveThreshold.length > 0
      ? Math.round((matchesAboveThreshold.reduce((sum, m) => sum + m.similarity, 0) / matchesAboveThreshold.length) * 100)
      : Math.round((bestMatch?.similarity || 0) * 100);

    return {
      query,
      matches,
      bestMatch,
      overallAlignment,
      threshold,
      method: 'keyword matching (Jaccard similarity) - fallback'
    };
  }

  /**
   * Fallback: Generate simple bag-of-words embedding
   */
  private fallbackEmbedding(text: string): number[] {
    // Simple hash-based embedding (dimension 128)
    const dimension = 128;
    const embedding = new Array(dimension).fill(0);

    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      // Hash word to index
      const hash = this.simpleHash(word);
      const index = Math.abs(hash) % dimension;

      // Increment embedding at hashed position
      embedding[index] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Simple string hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash;
  }
}
