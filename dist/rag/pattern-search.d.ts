/**
 * Pattern Search Service - CODIFY Phase Integration
 *
 * Queries historical feature implementations from RAG storage using RAGRouter.
 * Routes queries to Public RAG (framework patterns) and Private RAG (user patterns).
 * to provide historical context, effort estimates, and lessons learned for feature planning.
 *
 * This enables the CODIFY phase of the Compounding Engineering workflow.
 *
 * **v7.7.0 Update**: Now uses RAGRouter for public/private separation
 * - Private patterns: YOUR project memory (highest priority)
 * - Public patterns: Framework knowledge (fallback)
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
 * console.log(`Sources: ${result.sources}`);  // NEW: 'private', 'public', or 'both'
 * ```
 */
/**
 * Historical pattern from past feature implementation
 */
export interface HistoricalPattern {
    feature_name: string;
    implementation_path: string;
    effort_hours: number;
    effort_range: {
        min: number;
        max: number;
    };
    confidence: number;
    success_score: number;
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
    similarity_score: number;
}
/**
 * Query parameters for pattern search
 */
export interface PatternSearchQuery {
    description: string;
    agent?: string;
    category?: string;
    limit?: number;
    min_similarity?: number;
}
/**
 * Search result with aggregated insights
 */
export interface PatternSearchResult {
    patterns: HistoricalPattern[];
    total_found: number;
    search_method: 'graphrag' | 'vector' | 'local' | 'none';
    sources: 'private' | 'public' | 'both' | 'none';
    private_count: number;
    public_count: number;
    avg_effort: number | null;
    avg_confidence: number | null;
    consolidated_lessons: string[];
    recommended_approach: string | null;
    privateRAGSuggestion?: string;
}
/**
 * Pattern Search Service
 *
 * Searches historical patterns using RAGRouter (public + private).
 * Provides effort estimates, consolidated lessons, and recommendations.
 *
 * v7.7.0: Now routes to Public RAG (framework) and Private RAG (user)
 */
export declare class PatternSearchService {
    private ragRouter;
    private vectorStore;
    private initialized;
    constructor();
    /**
     * Lazy initialization - only load fallback stores when first search is performed
     */
    private initialize;
    /**
     * Search for similar historical features
     *
     * @param query - Search query with description and filters
     * @returns Patterns with aggregated insights (from public + private RAG)
     */
    searchSimilarFeatures(query: PatternSearchQuery): Promise<PatternSearchResult>;
    /**
     * Search using GraphRAG (knowledge graph)
     */
    private searchFromGraphRAG;
    /**
     * Search using Vector store (semantic similarity)
     */
    private searchFromVectorStore;
    /**
     * Local in-memory search (fallback when no RAG available)
     */
    private searchLocal;
    /**
     * Convert GraphRAG result to HistoricalPattern
     */
    private convertGraphRAGResult;
    /**
     * Convert Vector store result to HistoricalPattern
     */
    private convertVectorStoreResult;
    /**
     * Calculate average effort from historical patterns
     */
    private calculateAverageEffort;
    /**
     * Calculate average confidence
     */
    private calculateAverageConfidence;
    /**
     * Consolidate lessons learned across patterns
     * Deduplicates and prioritizes by frequency
     */
    private consolidateLessons;
    /**
     * Generate recommended approach based on patterns
     */
    private generateRecommendation;
    /**
     * Convert RAG Router result to HistoricalPattern
     */
    private convertRAGResult;
    /**
     * Determine sources for result
     */
    private determineSources;
}
/**
 * Singleton instance
 */
export declare const patternSearchService: PatternSearchService;
