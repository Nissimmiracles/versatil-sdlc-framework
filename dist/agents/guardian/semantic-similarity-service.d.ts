/**
 * VERSATIL SDLC Framework - Semantic Similarity Service
 *
 * Calculate semantic similarity between text strings using embeddings + cosine similarity.
 * Used for vision alignment verification.
 *
 * Part of Guardian's Context Layer Verification (v7.9.0)
 */
export interface SemanticMatch {
    text: string;
    similarity: number;
    isMatch: boolean;
}
export interface SemanticSimilarityResult {
    query: string;
    matches: SemanticMatch[];
    bestMatch: SemanticMatch | null;
    overallAlignment: number;
    threshold: number;
    method: string;
}
export declare class SemanticSimilarityService {
    private vectorStore;
    constructor();
    /**
     * Calculate semantic similarity between a query and multiple candidates
     *
     * @param query - The text to compare (e.g., feature description)
     * @param candidates - Array of texts to compare against (e.g., project goals)
     * @param threshold - Minimum similarity score to consider a match (0-1, default 0.7)
     * @returns Semantic similarity result with matches and overall alignment score
     */
    calculateSimilarity(query: string, candidates: string[], threshold?: number): Promise<SemanticSimilarityResult>;
    /**
     * Get embedding vector for text (uses EnhancedVectorMemoryStore)
     */
    private getEmbedding;
    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Fallback: Simple keyword matching when embeddings unavailable
     */
    private fallbackKeywordMatching;
    /**
     * Fallback: Generate simple bag-of-words embedding
     */
    private fallbackEmbedding;
    /**
     * Simple string hash function
     */
    private simpleHash;
}
