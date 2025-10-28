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
import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { getRAGRouter } from './rag-router.js';
/**
 * Pattern Search Service
 *
 * Searches historical patterns using RAGRouter (public + private).
 * Provides effort estimates, consolidated lessons, and recommendations.
 *
 * v7.7.0: Now routes to Public RAG (framework) and Private RAG (user)
 */
export class PatternSearchService {
    constructor() {
        this.vectorStore = null;
        this.initialized = false;
        // Initialize RAG Router (handles public/private routing)
        this.ragRouter = getRAGRouter();
    }
    /**
     * Lazy initialization - only load fallback stores when first search is performed
     */
    async initialize() {
        if (this.initialized)
            return;
        try {
            // Initialize Vector store as fallback (if RAG Router fails)
            this.vectorStore = new EnhancedVectorMemoryStore();
        }
        catch (error) {
            console.warn('Vector store initialization failed, will use RAG Router only');
        }
        this.initialized = true;
    }
    /**
     * Search for similar historical features
     *
     * @param query - Search query with description and filters
     * @returns Patterns with aggregated insights (from public + private RAG)
     */
    async searchSimilarFeatures(query) {
        await this.initialize();
        const limit = query.limit ?? 5;
        const min_similarity = query.min_similarity ?? 0.75;
        // Use RAG Router (public + private RAG)
        let patterns = [];
        let ragResults = [];
        let searchMethod = 'none';
        try {
            // Query through RAG Router
            ragResults = await this.ragRouter.query({
                query: query.description,
                limit,
                minRelevance: min_similarity,
                agent: query.agent,
                category: query.category
            });
            patterns = ragResults.map(result => this.convertRAGResult(result));
            searchMethod = 'graphrag'; // RAG Router uses GraphRAG internally
        }
        catch (error) {
            console.warn('RAG Router search failed:', error);
            // Fallback to Vector store
            if (this.vectorStore) {
                try {
                    patterns = await this.searchFromVectorStore(query, limit, min_similarity);
                    searchMethod = 'vector';
                }
                catch (vectorError) {
                    console.warn('Vector store search failed:', vectorError);
                }
            }
        }
        // Calculate aggregated insights
        const avg_effort = this.calculateAverageEffort(patterns);
        const avg_confidence = this.calculateAverageConfidence(patterns);
        const consolidated_lessons = this.consolidateLessons(patterns);
        const recommended_approach = this.generateRecommendation(patterns);
        // Calculate source statistics
        const private_count = ragResults.filter(r => r.source === 'private').length;
        const public_count = ragResults.filter(r => r.source === 'public').length;
        const sources = this.determineSources(private_count, public_count);
        // Check if Private RAG suggestion should be shown
        const privateRAGSuggestion = this.ragRouter.shouldSuggestPrivateRAG(ragResults)
            ? this.ragRouter.getPrivateRAGSuggestion()
            : undefined;
        return {
            patterns,
            total_found: patterns.length,
            search_method: searchMethod,
            sources,
            private_count,
            public_count,
            avg_effort,
            avg_confidence,
            consolidated_lessons,
            recommended_approach,
            privateRAGSuggestion
        };
    }
    /**
     * Search using GraphRAG (knowledge graph)
     */
    async searchFromGraphRAG(query, limit, min_similarity) {
        if (!this.ragRouter)
            return [];
        const graphQuery = {
            query: query.description,
            limit,
            minRelevance: min_similarity,
            agent: query.agent,
            category: query.category,
            includePublic: true
        };
        const results = await this.ragRouter.query(graphQuery);
        return results.map(result => this.convertGraphRAGResult(result));
    }
    /**
     * Search using Vector store (semantic similarity)
     */
    async searchFromVectorStore(query, limit, min_similarity) {
        if (!this.vectorStore)
            return [];
        const ragQuery = {
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
            .filter((doc) => (doc.metadata?.relevanceScore ?? 0) >= min_similarity)
            .map((doc) => this.convertVectorStoreResult(doc));
    }
    /**
     * Local in-memory search (fallback when no RAG available)
     */
    async searchLocal(query, limit, min_similarity) {
        // Could bootstrap with example patterns here
        // For now, return empty array
        return [];
    }
    /**
     * Convert GraphRAG result to HistoricalPattern
     */
    convertGraphRAGResult(result) {
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
            lessons_learned: props.tags?.map((tag) => `Learned: ${tag}`) || [],
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
    convertVectorStoreResult(doc) {
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
    calculateAverageEffort(patterns) {
        if (patterns.length === 0)
            return null;
        const total = patterns.reduce((sum, p) => sum + p.effort_hours, 0);
        return Math.round(total / patterns.length);
    }
    /**
     * Calculate average confidence
     */
    calculateAverageConfidence(patterns) {
        if (patterns.length === 0)
            return null;
        const total = patterns.reduce((sum, p) => sum + p.confidence, 0);
        return Math.round(total / patterns.length);
    }
    /**
     * Consolidate lessons learned across patterns
     * Deduplicates and prioritizes by frequency
     */
    consolidateLessons(patterns) {
        if (patterns.length === 0)
            return [];
        const lessonFrequency = new Map();
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
    generateRecommendation(patterns) {
        if (patterns.length === 0)
            return null;
        if (patterns.length === 1) {
            return `Follow similar approach used in ${patterns[0].feature_name}`;
        }
        const avgEffort = this.calculateAverageEffort(patterns);
        const topPattern = patterns[0];
        return `Based on ${patterns.length} similar implementations (avg ${avgEffort}h), ` +
            `recommend following the approach from ${topPattern.feature_name} ` +
            `(${topPattern.similarity_score.toFixed(0)}% similar, ${topPattern.effort_hours}h effort)`;
    }
    /**
     * Convert RAG Router result to HistoricalPattern
     */
    convertRAGResult(result) {
        const pattern = result.pattern;
        return {
            feature_name: pattern.properties.pattern || 'Unknown',
            implementation_path: result.source === 'private' ? '🔒 Private Pattern' : '🌐 Public Pattern',
            effort_hours: pattern.properties.timeSaved || 0,
            effort_range: { min: 0, max: pattern.properties.timeSaved || 0 },
            confidence: Math.round(result.relevanceScore * 100),
            success_score: Math.round(pattern.properties.effectiveness || 0.8) * 100,
            lessons_learned: [],
            code_examples: pattern.properties.code ? [{
                    file: result.source,
                    lines: '1-10',
                    description: pattern.properties.description || ''
                }] : [],
            risks: { high: [], medium: [], low: [] },
            agent: pattern.properties.agent || 'unknown',
            category: pattern.properties.category || 'general',
            timestamp: new Date(pattern.properties.lastUsed).getTime(),
            similarity_score: result.relevanceScore
        };
    }
    /**
     * Determine sources for result
     */
    determineSources(privateCount, publicCount) {
        if (privateCount > 0 && publicCount > 0)
            return 'both';
        if (privateCount > 0)
            return 'private';
        if (publicCount > 0)
            return 'public';
        return 'none';
    }
}
/**
 * Singleton instance
 */
export const patternSearchService = new PatternSearchService();
//# sourceMappingURL=pattern-search.js.map