"use strict";
/**
 * RAG Router - Intelligent Query Routing
 *
 * Routes queries to appropriate RAG stores and merges results:
 * - Private RAG first (user's own patterns - highest priority)
 * - Public RAG second (framework patterns - fallback)
 * - Merges and deduplicates results
 * - Privacy-aware filtering
 *
 * Priority Rules:
 * 1. Private patterns ALWAYS prioritized over public
 * 2. User's own solutions preferred over generic ones
 * 3. Deduplication prevents overlap
 * 4. Relevance score tiebreaker within same source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragRouter = exports.RAGRouter = void 0;
exports.getRAGRouter = getRAGRouter;
const public_rag_store_js_1 = require("./public-rag-store.js");
const private_rag_store_js_1 = require("./private-rag-store.js");
const sanitization_policy_js_1 = require("./sanitization-policy.js");
/**
 * RAG Router - Routes queries to public/private stores
 */
class RAGRouter {
    constructor(config = {}) {
        this.config = {
            preferPrivate: config.preferPrivate !== false, // Default true
            includePublic: config.includePublic !== false, // Default true
            deduplicateResults: config.deduplicateResults !== false, // Default true
            maxResults: config.maxResults || 10
        };
        // Initialize stores
        this.publicRAG = public_rag_store_js_1.publicRAGStore;
        this.privateRAG = this.initializePrivateRAG();
        this.logConfiguration();
    }
    /**
     * Initialize Private RAG if configured
     */
    initializePrivateRAG() {
        try {
            const privateStore = (0, private_rag_store_js_1.getPrivateRAGStore)();
            if (privateStore.isConfigured()) {
                console.log(`✅ Private RAG enabled: ${privateStore.getBackend()} backend`);
                return privateStore;
            }
            else {
                console.log('ℹ️  Private RAG not configured (using Public RAG only)');
                return null;
            }
        }
        catch (error) {
            console.log('⚠️  Private RAG initialization failed, using Public RAG only');
            return null;
        }
    }
    /**
     * Log router configuration
     */
    logConfiguration() {
        console.log('🔀 RAG Router initialized:');
        console.log(`   - Public RAG: ${this.config.includePublic ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   - Private RAG: ${this.privateRAG ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   - Priority: ${this.config.preferPrivate ? 'Private first' : 'Public first'}`);
    }
    /**
     * Main query method - routes to appropriate stores
     */
    async query(query) {
        const results = [];
        console.log(`🔍 RAG Router query: "${query.query}"`);
        // Query Private RAG first (highest priority)
        if (this.privateRAG && this.config.preferPrivate) {
            try {
                const privateResults = await this.queryPrivateRAG(query);
                results.push(...privateResults);
                console.log(`   🔒 Private RAG: ${privateResults.length} results`);
            }
            catch (error) {
                console.error(`   ❌ Private RAG error: ${error.message}`);
            }
        }
        // Query Public RAG (fallback or supplement)
        if (this.config.includePublic) {
            try {
                const publicResults = await this.queryPublicRAG(query);
                results.push(...publicResults);
                console.log(`   🌐 Public RAG: ${publicResults.length} results`);
            }
            catch (error) {
                console.error(`   ❌ Public RAG error: ${error.message}`);
            }
        }
        // Merge, deduplicate, and limit results
        const finalResults = this.mergeResults(results, query.limit || this.config.maxResults);
        console.log(`   ✅ Final: ${finalResults.length} results (${this.countBySource(finalResults)})`);
        return finalResults;
    }
    /**
     * Query Private RAG store
     */
    async queryPrivateRAG(query) {
        if (!this.privateRAG)
            return [];
        const results = await this.privateRAG.query(query);
        return results.map(r => ({
            ...r,
            source: 'private',
            priority: 1 // Highest priority
        }));
    }
    /**
     * Query Public RAG store
     */
    async queryPublicRAG(query) {
        const results = await this.publicRAG.query(query);
        return results.map(r => ({
            ...r,
            source: 'public',
            priority: 2 // Lower priority than private
        }));
    }
    /**
     * Merge results with privacy-aware prioritization
     *
     * Rules:
     * 1. Private patterns always ranked higher than public
     * 2. Within same source, sort by relevance score
     * 3. Deduplicate similar patterns (optional)
     * 4. Limit to maxResults
     */
    mergeResults(results, limit) {
        let merged = [...results];
        // Deduplicate if enabled
        if (this.config.deduplicateResults) {
            merged = this.deduplicateResults(merged);
        }
        // Sort by priority (private first), then by relevance score
        merged.sort((a, b) => {
            // Priority first (1 = private, 2 = public)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Then by relevance score (descending)
            return b.relevanceScore - a.relevanceScore;
        });
        // Limit results
        return merged.slice(0, limit);
    }
    /**
     * Deduplicate results by pattern similarity
     *
     * If public and private have similar patterns, keep private only.
     */
    deduplicateResults(results) {
        const deduplicated = [];
        const seenPatterns = new Set();
        for (const result of results) {
            const patternKey = this.getPatternKey(result.pattern);
            // Check if we've seen a similar pattern
            if (seenPatterns.has(patternKey)) {
                // Skip if we already have this pattern
                continue;
            }
            // Add to results and mark as seen
            deduplicated.push(result);
            seenPatterns.add(patternKey);
        }
        const duplicatesRemoved = results.length - deduplicated.length;
        if (duplicatesRemoved > 0) {
            console.log(`   🔄 Removed ${duplicatesRemoved} duplicate patterns`);
        }
        return deduplicated;
    }
    /**
     * Generate unique key for pattern (for deduplication)
     */
    getPatternKey(pattern) {
        const text = `${pattern.properties.pattern || ''} ${pattern.properties.category || ''}`.toLowerCase();
        // Simple hash-like key (not cryptographic)
        return text
            .split(' ')
            .filter(w => w.length > 3) // Filter out small words
            .slice(0, 5) // Take first 5 meaningful words
            .join('_');
    }
    /**
     * Count results by source
     */
    countBySource(results) {
        const private_count = results.filter(r => r.source === 'private').length;
        const public_count = results.filter(r => r.source === 'public').length;
        return `${private_count} private, ${public_count} public`;
    }
    /**
     * Check if Private RAG is available
     */
    hasPrivateRAG() {
        return this.privateRAG !== null && this.privateRAG.isConfigured();
    }
    /**
     * Get router statistics
     */
    async getStats() {
        const stats = {
            publicRAG: { available: true },
            privateRAG: { available: this.hasPrivateRAG() }
        };
        // Get Public RAG stats
        try {
            const publicStats = await this.publicRAG.getStats();
            stats.publicRAG.patterns = publicStats.totalPatterns;
        }
        catch (error) {
            console.error('Failed to get Public RAG stats');
        }
        // Get Private RAG stats
        if (this.privateRAG) {
            try {
                const privateStats = await this.privateRAG.getStats();
                stats.privateRAG.backend = privateStats.backend;
                stats.privateRAG.patterns = privateStats.totalPatterns;
            }
            catch (error) {
                console.error('Failed to get Private RAG stats');
            }
        }
        return stats;
    }
    /**
     * Suggest Private RAG setup if beneficial
     */
    shouldSuggestPrivateRAG(queryResults) {
        // Suggest if:
        // 1. No private RAG configured
        // 2. User has made multiple queries
        // 3. Queries are finding only generic public patterns
        if (this.hasPrivateRAG()) {
            return false; // Already configured
        }
        // Check if results are all public (no project-specific patterns)
        const allPublic = queryResults.every(r => r.source === 'public');
        return allPublic && queryResults.length > 0;
    }
    /**
     * Get suggestion message for Private RAG setup
     */
    getPrivateRAGSuggestion() {
        return `
💡 **Tip: Configure Private RAG for project-specific memory**

You're currently using Public RAG (framework patterns only).
Configure Private RAG to remember YOUR project patterns:

\`\`\`bash
npm run setup:private-rag
\`\`\`

**Benefits:**
- Remembers YOUR business logic and APIs
- Team conventions and architecture decisions
- 40% faster by Feature 5 (compounding engineering)
- 100% privacy (your patterns stay yours)
- Free tier: 1GB = ~10,000 patterns
    `.trim();
    }
    /**
     * Store pattern in appropriate RAG store based on destination
     */
    async storePattern(pattern, destination) {
        switch (destination) {
            case sanitization_policy_js_1.StorageDestination.PUBLIC_ONLY:
                return await this.publicRAG.addPattern(pattern);
            case sanitization_policy_js_1.StorageDestination.PRIVATE_ONLY:
                if (!this.privateRAG) {
                    throw new Error('Private RAG not configured. Run: npm run setup:private-rag');
                }
                return await this.privateRAG.addPattern(pattern);
            case sanitization_policy_js_1.StorageDestination.BOTH:
                // Store in both (public first to apply sanitization)
                const publicId = await this.publicRAG.addPattern(pattern);
                if (this.privateRAG) {
                    await this.privateRAG.addPattern(pattern);
                }
                return publicId;
            default:
                throw new Error(`Unknown storage destination: ${destination}`);
        }
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        return getRAGRouter(config);
    }
}
exports.RAGRouter = RAGRouter;
// Export singleton instance
let routerInstance = null;
function getRAGRouter(config) {
    if (!routerInstance) {
        routerInstance = new RAGRouter(config);
    }
    return routerInstance;
}
exports.ragRouter = getRAGRouter();
