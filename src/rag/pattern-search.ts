/**
 * Pattern Search Service - CODIFY Phase Integration
 *
 * Queries historical feature implementations from RAG storage (GraphRAG + Supabase Vector Store)
 * to provide historical context, effort estimates, and lessons learned for feature planning.
 *
 * This enables the CODIFY phase of the Compounding Engineering workflow.
 *
 * @example
 * ```typescript
 * const searcher = new PatternSearchService();
 * const result = await searcher.searchSimilarFeatures({
 *   description: "Add user authentication with JWT",
 *   limit: 5,
 *   min_similarity: 0.75
 * });
 *
 * console.log(`Found ${result.patterns.length} similar features`);
 * console.log(`Average effort: ${result.avg_effort} hours`);
 * ```
 */

import { graphRAGStore, GraphRAGQuery, GraphRAGResult } from '../lib/graphrag-store.js';
import { EnhancedVectorMemoryStore, RAGQuery, RAGResult } from './enhanced-vector-memory-store.js';

/**
 * Historical pattern from past feature implementation
 */
export interface HistoricalPattern {
  feature_name: string;
  implementation_path: string;
  effort_hours: number;
  effort_range: { min: number; max: number };
  confidence: number; // 0-100
  success_score: number; // 0-100
  lessons_learned: string[];
  code_examples: Array<{
    file: string;
    lines: string;
    description: string;
  }>;
  risks: {
    high: string[];
    medium: string[];
    low: string[];
  };
  agent: string;
  category: string;
  timestamp: number;
  similarity_score: number; // 0-1
}

/**
 * Query parameters for pattern search
 */
export interface PatternSearchQuery {
  description: string;
  agent?: string;
  category?: string;
  limit?: number; // default: 5
  min_similarity?: number; // default: 0.75
}

/**
 * Search result with aggregated insights
 */
export interface PatternSearchResult {
  patterns: HistoricalPattern[];
  total_found: number;
  search_method: 'graphrag' | 'vector' | 'local' | 'none';
  avg_effort: number | null;
  avg_confidence: number | null;
  consolidated_lessons: string[];
  recommended_approach: string | null;
}

/**
 * Pattern Search Service
 *
 * Searches historical patterns using GraphRAG (preferred) with Vector store fallback.
 * Provides effort estimates, consolidated lessons, and recommendations.
 */
export class PatternSearchService {
  private graphRAG: typeof graphRAGStore | null = null;
  private vectorStore: EnhancedVectorMemoryStore | null = null;
  private initialized = false;

  /**
   * Lazy initialization - only load stores when first search is performed
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try GraphRAG first (preferred - no API quota, works offline)
      this.graphRAG = graphRAGStore;
      await this.graphRAG.initialize();
    } catch (error) {
      console.warn('GraphRAG initialization failed, will use Vector store fallback');
    }

    try {
      // Initialize Vector store as fallback
      this.vectorStore = new EnhancedVectorMemoryStore();
    } catch (error) {
      console.warn('Vector store initialization failed, will use local fallback');
    }

    this.initialized = true;
  }

  /**
   * Search for similar historical features
   *
   * @param query - Search query with description and filters
   * @returns Patterns with aggregated insights
   */
  async searchSimilarFeatures(query: PatternSearchQuery): Promise<PatternSearchResult> {
    await this.initialize();

    const limit = query.limit ?? 5;
    const min_similarity = query.min_similarity ?? 0.75;

    // Try GraphRAG first (preferred)
    let patterns: HistoricalPattern[] = [];
    let searchMethod: 'graphrag' | 'vector' | 'local' | 'none' = 'none';

    if (this.graphRAG) {
      try {
        patterns = await this.searchFromGraphRAG(query, limit, min_similarity);
        if (patterns.length > 0) {
          searchMethod = 'graphrag';
        }
      } catch (error) {
        console.warn('GraphRAG search failed:', error);
      }
    }

    // Fallback to Vector store
    if (patterns.length === 0 && this.vectorStore) {
      try {
        patterns = await this.searchFromVectorStore(query, limit, min_similarity);
        if (patterns.length > 0) {
          searchMethod = 'vector';
        }
      } catch (error) {
        console.warn('Vector store search failed:', error);
      }
    }

    // Last resort: local in-memory search (empty for now, could add bootstrap data)
    if (patterns.length === 0) {
      patterns = await this.searchLocal(query, limit, min_similarity);
      if (patterns.length > 0) {
        searchMethod = 'local';
      }
    }

    // Calculate aggregated insights
    const avg_effort = this.calculateAverageEffort(patterns);
    const avg_confidence = this.calculateAverageConfidence(patterns);
    const consolidated_lessons = this.consolidateLessons(patterns);
    const recommended_approach = this.generateRecommendation(patterns);

    return {
      patterns,
      total_found: patterns.length,
      search_method: searchMethod,
      avg_effort,
      avg_confidence,
      consolidated_lessons,
      recommended_approach
    };
  }

  /**
   * Search using GraphRAG (knowledge graph)
   */
  private async searchFromGraphRAG(
    query: PatternSearchQuery,
    limit: number,
    min_similarity: number
  ): Promise<HistoricalPattern[]> {
    if (!this.graphRAG) return [];

    const graphQuery: GraphRAGQuery = {
      query: query.description,
      limit,
      minRelevance: min_similarity,
      agent: query.agent,
      category: query.category,
      includePublic: true
    };

    const results: GraphRAGResult[] = await this.graphRAG.query(graphQuery);

    return results.map(result => this.convertGraphRAGResult(result));
  }

  /**
   * Search using Vector store (semantic similarity)
   */
  private async searchFromVectorStore(
    query: PatternSearchQuery,
    limit: number,
    min_similarity: number
  ): Promise<HistoricalPattern[]> {
    if (!this.vectorStore) return [];

    const ragQuery: RAGQuery = {
      query: query.description,
      queryType: 'semantic',
      agentId: query.agent,
      topK: limit,
      rerank: true,
      filters: {
        tags: query.category ? [query.category] : undefined
      }
    };

    const results = await this.vectorStore.queryMemories(ragQuery);

    const documents = results.documents || [];
    return documents
      .filter((doc: any) => (doc.metadata?.relevanceScore ?? 0) >= min_similarity)
      .map((doc: any) => this.convertVectorStoreResult(doc));
  }

  /**
   * Local in-memory search (fallback when no RAG available)
   */
  private async searchLocal(
    query: PatternSearchQuery,
    limit: number,
    min_similarity: number
  ): Promise<HistoricalPattern[]> {
    // Could bootstrap with example patterns here
    // For now, return empty array
    return [];
  }

  /**
   * Convert GraphRAG result to HistoricalPattern
   */
  private convertGraphRAGResult(result: GraphRAGResult): HistoricalPattern {
    const props = result.pattern.properties;

    return {
      feature_name: props.pattern || 'Unknown Feature',
      implementation_path: result.graphPath.join(' → '),
      effort_hours: props.timeSaved || 0,
      effort_range: {
        min: Math.floor((props.timeSaved || 0) * 0.8),
        max: Math.ceil((props.timeSaved || 0) * 1.2)
      },
      confidence: Math.round(props.effectiveness * 100),
      success_score: Math.round(props.effectiveness * 100),
      lessons_learned: props.tags?.map((tag: string) => `Learned: ${tag}`) || [],
      code_examples: props.code ? [{
        file: 'pattern-code.ts',
        lines: '1-100',
        description: props.code
      }] : [],
      risks: {
        high: [],
        medium: [],
        low: []
      },
      agent: props.agent || 'Unknown',
      category: props.category || 'General',
      timestamp: props.lastUsed?.getTime() || Date.now(),
      similarity_score: result.relevanceScore
    };
  }

  /**
   * Convert Vector store result to HistoricalPattern
   */
  private convertVectorStoreResult(doc: any): HistoricalPattern {
    const meta = doc.metadata;

    return {
      feature_name: meta.feature_name || meta.projectContext || 'Unknown Feature',
      implementation_path: meta.implementation_path || 'N/A',
      effort_hours: meta.effort_hours || 0,
      effort_range: meta.effort_range || { min: 0, max: 0 },
      confidence: meta.confidence || 50,
      success_score: meta.success_score || 50,
      lessons_learned: meta.lessons_learned || [],
      code_examples: meta.code_examples || [],
      risks: meta.risks || { high: [], medium: [], low: [] },
      agent: meta.agentId || 'Unknown',
      category: meta.category || meta.tags?.[0] || 'General',
      timestamp: meta.timestamp || Date.now(),
      similarity_score: meta.relevanceScore || 0
    };
  }

  /**
   * Calculate average effort from historical patterns
   */
  private calculateAverageEffort(patterns: HistoricalPattern[]): number | null {
    if (patterns.length === 0) return null;

    const total = patterns.reduce((sum, p) => sum + p.effort_hours, 0);
    return Math.round(total / patterns.length);
  }

  /**
   * Calculate average confidence
   */
  private calculateAverageConfidence(patterns: HistoricalPattern[]): number | null {
    if (patterns.length === 0) return null;

    const total = patterns.reduce((sum, p) => sum + p.confidence, 0);
    return Math.round(total / patterns.length);
  }

  /**
   * Consolidate lessons learned across patterns
   * Deduplicates and prioritizes by frequency
   */
  private consolidateLessons(patterns: HistoricalPattern[]): string[] {
    if (patterns.length === 0) return [];

    const lessonFrequency = new Map<string, number>();

    patterns.forEach(pattern => {
      pattern.lessons_learned.forEach(lesson => {
        const normalized = lesson.toLowerCase().trim();
        lessonFrequency.set(normalized, (lessonFrequency.get(normalized) || 0) + 1);
      });
    });

    // Sort by frequency (most common first)
    return Array.from(lessonFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lesson]) => lesson);
  }

  /**
   * Generate recommended approach based on patterns
   */
  private generateRecommendation(patterns: HistoricalPattern[]): string | null {
    if (patterns.length === 0) return null;
    if (patterns.length === 1) {
      return `Follow similar approach used in ${patterns[0].feature_name}`;
    }

    const avgEffort = this.calculateAverageEffort(patterns);
    const topPattern = patterns[0];

    return `Based on ${patterns.length} similar implementations (avg ${avgEffort}h), ` +
           `recommend following the approach from ${topPattern.feature_name} ` +
           `(${topPattern.similarity_score.toFixed(0)}% similar, ${topPattern.effort_hours}h effort)`;
  }
}

/**
 * Singleton instance
 */
export const patternSearchService = new PatternSearchService();
