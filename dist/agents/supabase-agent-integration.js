/**
 * VERSATIL SDLC Framework - Supabase Agent Integration Layer
 *
 * Bridges existing RAG-enabled agents with the new Supabase Vector Store,
 * providing seamless integration, learning capabilities, and real-time collaboration.
 */
import { SupabaseVectorStore } from '../lib/supabase-vector-store.js';
import { VERSATILLogger } from '../utils/logger.js';
/**
 * Enhanced agent wrapper that integrates with Supabase Vector Store
 */
export class SupabaseRAGAgent {
    constructor(agent, config) {
        this.patternCache = new Map();
        this.isInitialized = false;
        this.agent = agent;
        this.config = {
            enableLearning: true,
            enableCollaboration: true,
            patternQualityThreshold: 0.7,
            solutionEffectivenessThreshold: 0.6,
            ...config
        };
        this.logger = new VERSATILLogger();
        this.supabaseStore = new SupabaseVectorStore({
            supabaseUrl: config.supabaseUrl,
            supabaseKey: config.supabaseKey,
            openaiKey: config.openaiKey,
            useLocalEmbeddings: config.useLocalEmbeddings
        });
        this.initialize();
    }
    /**
     * Initialize Supabase integration
     */
    async initialize() {
        try {
            // Setup real-time collaboration if enabled
            if (this.config.enableCollaboration) {
                this.setupCollaboration();
            }
            // Wait for vector store initialization
            this.supabaseStore.once('initialized', (event) => {
                this.logger.info('Supabase RAG Agent initialized', {
                    agentId: this.agent.id,
                    embeddingProvider: event.provider,
                    collaboration: this.config.enableCollaboration,
                    learning: this.config.enableLearning
                }, 'supabase-rag-agent');
                this.isInitialized = true;
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize Supabase RAG Agent', {
                error,
                agentId: this.agent.id
            }, 'supabase-rag-agent');
        }
    }
    /**
     * Enhanced activate method with Supabase RAG integration
     */
    async activate(context) {
        try {
            // Get the original analysis
            const originalResult = await this.agent.activate(context);
            // Enhance with Supabase RAG if available
            if (this.isInitialized) {
                const enhancedContext = await this.enhanceWithSupabaseRAG(context, originalResult.analysis);
                const supabaseInsights = await this.getSupabaseInsights(context);
                // Store successful patterns for learning
                if (this.config.enableLearning && originalResult.analysis?.score > 70) {
                    await this.learnFromSuccess(context, originalResult.analysis);
                }
                return {
                    ...originalResult,
                    supabaseRAG: {
                        enhanced: true,
                        insights: supabaseInsights,
                        patternsUsed: enhancedContext.similarCode.length,
                        solutionsUsed: enhancedContext.agentExpertise.length
                    }
                };
            }
            return originalResult;
        }
        catch (error) {
            this.logger.error('Error in Supabase RAG activation', {
                error,
                agentId: this.agent.id
            }, 'supabase-rag-agent');
            return this.agent.activate(context); // Fallback to original agent
        }
    }
    /**
     * Enhance RAG context with Supabase patterns and solutions
     */
    async enhanceWithSupabaseRAG(context, analysis) {
        const enhancedContext = {
            similarCode: [],
            previousSolutions: {},
            projectStandards: [],
            agentExpertise: [],
            metadata: {
                supabaseEnhanced: true,
                timestamp: Date.now()
            }
        };
        try {
            // 1. Retrieve similar code patterns
            const similarPatterns = await this.retrieveSimilarPatterns(context, analysis);
            enhancedContext.similarCode = this.convertPatternsToMemoryDocuments(similarPatterns);
            // 2. Find relevant solutions for detected issues
            const relevantSolutions = await this.findRelevantSolutions(analysis);
            enhancedContext.agentExpertise = this.convertSolutionsToMemoryDocuments(relevantSolutions);
            // 3. Group solutions by problem type
            enhancedContext.previousSolutions = this.groupSolutionsByType(relevantSolutions);
            // 4. Cache results for performance
            this.cachePatterns(context, similarPatterns);
            this.logger.info('Supabase RAG enhancement complete', {
                agentId: this.agent.id,
                patterns: similarPatterns.length,
                solutions: relevantSolutions.length
            }, 'supabase-rag-agent');
        }
        catch (error) {
            this.logger.warn('Supabase RAG enhancement failed, using fallback', {
                error,
                agentId: this.agent.id
            }, 'supabase-rag-agent');
        }
        return enhancedContext;
    }
    /**
     * Retrieve similar patterns from Supabase
     */
    async retrieveSimilarPatterns(context, analysis) {
        const query = this.buildPatternQuery(context, analysis);
        const cacheKey = `${this.agent.id}:${query}`;
        // Check cache first
        if (this.patternCache.has(cacheKey)) {
            return this.patternCache.get(cacheKey);
        }
        const patterns = await this.supabaseStore.retrieveSimilarPatterns(query, {
            agentName: this.agent.id,
            language: this.detectLanguage(context.filePath),
            framework: this.detectFramework(context.content),
            minSimilarity: this.config.patternQualityThreshold,
            limit: 5
        });
        return patterns.filter(p => p.score >= this.config.patternQualityThreshold);
    }
    /**
     * Find relevant solutions for the current analysis
     */
    async findRelevantSolutions(analysis) {
        const solutions = [];
        // Find solutions for each detected pattern/issue
        for (const pattern of analysis.patterns) {
            const problemQuery = `${pattern.type} ${pattern.category} ${pattern.description}`;
            const patternSolutions = await this.supabaseStore.findSimilarSolutions(problemQuery, this.agent.id, 2);
            solutions.push(...patternSolutions.filter(s => s.effectiveness_score >= this.config.solutionEffectivenessThreshold));
        }
        return solutions;
    }
    /**
     * Learn from successful interactions
     */
    async learnFromSuccess(context, analysis) {
        try {
            // Store successful code pattern
            const pattern = {
                agent: this.agent.id,
                type: analysis.patterns[0]?.type || 'general',
                code: context.content,
                filePath: context.filePath,
                language: this.detectLanguage(context.filePath),
                framework: this.detectFramework(context.content),
                score: analysis.score,
                metadata: {
                    analysisPatterns: analysis.patterns.length,
                    context: 'successful-analysis',
                    timestamp: Date.now()
                }
            };
            await this.supabaseStore.addPattern(pattern);
            // Store solution if there were issues resolved
            if (analysis.patterns.length > 0) {
                const interaction = {
                    agent: this.agent.id,
                    problemType: analysis.patterns[0].category,
                    problem: analysis.patterns.map(p => p.description).join('; '),
                    solution: 'Analysis and recommendations provided',
                    explanation: `Successfully analyzed ${analysis.patterns.length} patterns with score ${analysis.score}`,
                    score: analysis.score / 100,
                    context: {
                        filePath: context.filePath,
                        patterns: analysis.patterns.length,
                        analysisType: 'pattern-detection'
                    }
                };
                await this.supabaseStore.learnFromInteraction(interaction);
            }
            this.logger.info('Learning from successful interaction stored', {
                agentId: this.agent.id,
                score: analysis.score,
                patterns: analysis.patterns.length
            }, 'supabase-rag-agent');
        }
        catch (error) {
            this.logger.warn('Failed to store learning interaction', {
                error,
                agentId: this.agent.id
            }, 'supabase-rag-agent');
        }
    }
    /**
     * Setup real-time collaboration with other agents
     */
    setupCollaboration() {
        this.learningSubscription = this.supabaseStore.subscribeToLearning((event) => {
            this.handleCollaborationEvent(event);
        });
        this.logger.info('Real-time collaboration setup', {
            agentId: this.agent.id
        }, 'supabase-rag-agent');
    }
    /**
     * Handle collaboration events from other agents
     */
    handleCollaborationEvent(event) {
        // Invalidate cache when new patterns or solutions are added
        if (event.type === 'new-pattern' || event.type === 'new-solution') {
            this.patternCache.clear();
            this.logger.info('Collaboration event received', {
                agentId: this.agent.id,
                eventType: event.type,
                fromAgent: event.payload?.agent
            }, 'supabase-rag-agent');
        }
    }
    /**
     * Get comprehensive insights about Supabase RAG performance
     */
    async getSupabaseInsights(context) {
        const metrics = await this.supabaseStore.getPerformanceMetrics();
        return {
            patternsFound: metrics?.patterns?.total || 0,
            solutionsFound: metrics?.solutions?.total || 0,
            avgPatternQuality: metrics?.patterns?.avgQuality || 0,
            avgSolutionEffectiveness: metrics?.solutions?.avgEffectiveness || 0,
            embeddingProvider: metrics?.embeddingProvider || 'local',
            collaborationActive: this.config.enableCollaboration,
            learningEnabled: this.config.enableLearning
        };
    }
    /**
     * Get agent-specific performance summary
     */
    async getAgentPerformance() {
        const metrics = await this.supabaseStore.getPerformanceMetrics();
        const agentMetrics = metrics?.patterns?.byAgent?.[this.agent.id] || {};
        return {
            agentId: this.agent.id,
            patterns: agentMetrics.count || 0,
            avgQuality: agentMetrics.avgScore || 0,
            lastUpdate: new Date().toISOString(),
            cacheSize: this.patternCache.size,
            isInitialized: this.isInitialized,
            collaborationActive: !!this.learningSubscription
        };
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.learningSubscription) {
            this.learningSubscription();
        }
        await this.supabaseStore.cleanup();
        this.patternCache.clear();
        this.logger.info('Supabase RAG Agent cleanup complete', {
            agentId: this.agent.id
        }, 'supabase-rag-agent');
    }
    // Helper methods
    buildPatternQuery(context, analysis) {
        const language = this.detectLanguage(context.filePath);
        const framework = this.detectFramework(context.content);
        const patterns = analysis.patterns.map(p => p.type).join(' ');
        return `${language} ${framework} ${patterns} ${this.agent.specialization}`.trim();
    }
    detectLanguage(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const langMap = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust'
        };
        return langMap[ext || ''] || 'unknown';
    }
    detectFramework(content) {
        if (content.includes('React') || content.includes('useState'))
            return 'react';
        if (content.includes('Vue') || content.includes('defineComponent'))
            return 'vue';
        if (content.includes('Svelte'))
            return 'svelte';
        if (content.includes('Express') || content.includes('app.get'))
            return 'express';
        if (content.includes('FastAPI') || content.includes('@app.'))
            return 'fastapi';
        return 'unknown';
    }
    convertPatternsToMemoryDocuments(patterns) {
        return patterns.map(pattern => ({
            id: pattern.id || `pattern-${Date.now()}`,
            content: pattern.code,
            contentType: 'code',
            embedding: pattern.embedding,
            metadata: {
                agentId: pattern.agent,
                timestamp: Date.now(),
                tags: [pattern.type, pattern.language || '', pattern.framework || ''].filter(Boolean),
                relevanceScore: pattern.similarity,
                language: pattern.language,
                framework: pattern.framework,
                patternType: pattern.type,
                qualityScore: pattern.score
            }
        }));
    }
    convertSolutionsToMemoryDocuments(solutions) {
        return solutions.map(solution => ({
            id: solution.id || `solution-${Date.now()}`,
            content: solution.solution,
            contentType: 'code',
            embedding: solution.embedding,
            metadata: {
                agentId: solution.agent,
                timestamp: Date.now(),
                tags: [solution.problemType, 'solution'],
                relevanceScore: solution.score,
                problemType: solution.problemType,
                explanation: solution.explanation,
                effectivenessScore: solution.effectiveness_score
            }
        }));
    }
    groupSolutionsByType(solutions) {
        const grouped = {};
        solutions.forEach(solution => {
            if (!grouped[solution.problemType]) {
                grouped[solution.problemType] = [];
            }
            grouped[solution.problemType].push(this.convertSolutionsToMemoryDocuments([solution])[0]);
        });
        return grouped;
    }
    cachePatterns(context, patterns) {
        const cacheKey = `${this.agent.id}:${context.filePath}`;
        this.patternCache.set(cacheKey, patterns);
        // Limit cache size
        if (this.patternCache.size > 100) {
            const firstKey = this.patternCache.keys().next().value;
            this.patternCache.delete(firstKey);
        }
    }
}
// Factory function for creating Supabase-enhanced agents
export function createSupabaseEnhancedAgent(agent, config) {
    return new SupabaseRAGAgent(agent, config);
}
//# sourceMappingURL=supabase-agent-integration.js.map