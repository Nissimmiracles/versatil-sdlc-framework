/**
 * VERSATIL SDLC Framework - RAG-Enabled Agent Base Class
 *
 * Extends BaseAgent with direct RAG capabilities, allowing each agent to:
 * - Retrieve domain-specific context from vector memory
 * - Store successful patterns for future learning
 * - Generate context-aware prompts with historical knowledge
 */
import { BaseAgent } from './base-agent.js';
export class RAGEnabledAgent extends BaseAgent {
    constructor(vectorStore) {
        super();
        this.RAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.cacheCleanupInterval = null;
        this.vectorStore = vectorStore;
        this.ragConfig = this.getDefaultRAGConfig();
        this.ragCache = new Map();
        // Cleanup expired cache entries every minute (store reference for cleanup)
        // Skip in test environments to prevent timeout issues
        if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
            this.cacheCleanupInterval = setInterval(() => this.cleanupExpiredCache(), 60 * 1000);
        }
    }
    /**
     * Main analysis method with RAG enhancement
     */
    async activate(context) {
        // Level 1: Standard pattern analysis
        const patternAnalysis = await this.runPatternAnalysis(context);
        // Level 2: RAG enhancement (if vector store available)
        let ragContext;
        if (this.vectorStore) {
            ragContext = await this.retrieveRelevantContext(context, patternAnalysis);
        }
        // Level 3: Generate enhanced response
        const enhancedResponse = await this.generateRAGEnhancedResponse(context, patternAnalysis, ragContext);
        // Level 4: Store successful patterns for learning
        if (this.vectorStore && this.ragConfig.enableLearning) {
            await this.storeNewPatterns(context, patternAnalysis, enhancedResponse);
        }
        return enhancedResponse;
    }
    /**
     * Retrieve relevant context from vector memory (with caching)
     */
    async retrieveRelevantContext(context, analysis) {
        if (!this.vectorStore) {
            return this.getEmptyRAGContext();
        }
        // Generate cache key from file path and content hash
        const cacheKey = this.generateCacheKey(context);
        // Check cache first (5-minute TTL)
        const cached = this.ragCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.RAG_CACHE_TTL) {
            console.log(`[${this.id}] RAG cache hit for ${context.filePath}`);
            return cached.context;
        }
        const retrievals = {
            similarCode: [],
            previousSolutions: {},
            projectStandards: [],
            agentExpertise: []
        };
        try {
            // 1. Find similar code patterns for this agent's domain
            retrievals.similarCode = await this.retrieveSimilarCodePatterns(context);
            // 2. Find previous solutions for similar issues
            retrievals.previousSolutions = await this.retrievePreviousSolutions(analysis);
            // 3. Get project-specific standards for this domain
            retrievals.projectStandards = await this.retrieveProjectStandards(context);
            // 4. Get agent-specific expertise
            retrievals.agentExpertise = await this.retrieveAgentExpertise(context);
            // Store in cache
            this.ragCache.set(cacheKey, {
                context: retrievals,
                timestamp: Date.now(),
                query: context.filePath || 'unknown'
            });
            console.log(`[${this.id}] RAG cache stored for ${context.filePath}`);
        }
        catch (error) {
            console.warn(`RAG retrieval failed for ${this.id}:`, error.message);
        }
        return retrievals;
    }
    /**
     * Generate cache key from context
     */
    generateCacheKey(context) {
        const filePath = context.filePath || 'unknown';
        const contentHash = this.hashContent(context.content || '');
        return `${this.id}:${filePath}:${contentHash}`;
    }
    /**
     * Simple content hash for cache key
     */
    hashContent(content) {
        let hash = 0;
        for (let i = 0; i < Math.min(content.length, 1000); i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
    /**
     * Cleanup expired cache entries
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let expiredCount = 0;
        for (const [key, entry] of this.ragCache.entries()) {
            if (now - entry.timestamp >= this.RAG_CACHE_TTL) {
                this.ragCache.delete(key);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            console.log(`[${this.id}] Cleaned up ${expiredCount} expired RAG cache entries`);
        }
    }
    /**
     * Clear all cache (useful for testing)
     */
    clearRAGCache() {
        this.ragCache.clear();
        console.log(`[${this.id}] RAG cache cleared`);
    }
    /**
     * Get cache statistics
     */
    getRAGCacheStats() {
        const entries = Array.from(this.ragCache.values());
        return {
            size: entries.length,
            oldest: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
            newest: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
        };
    }
    /**
     * Destroy agent and cleanup resources (prevent memory leaks)
     */
    destroy() {
        // Clear cache cleanup interval
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }
        // Clear cache
        this.ragCache.clear();
        console.log(`[${this.id}] Agent destroyed and resources cleaned up`);
    }
    /**
     * Retrieve similar code patterns based on content and domain
     */
    async retrieveSimilarCodePatterns(context) {
        if (!this.vectorStore)
            return [];
        const query = {
            query: this.createSemanticQuery(context.content, context.filePath),
            queryType: 'semantic',
            agentId: this.id,
            topK: this.ragConfig.maxExamples,
            filters: {
                tags: [this.ragConfig.agentDomain, 'pattern', this.detectLanguage(context.filePath)],
                contentTypes: ['code']
            }
        };
        const result = await this.vectorStore.queryMemories(query);
        return result.documents || [];
    }
    /**
     * Retrieve previous solutions for similar issues
     */
    async retrievePreviousSolutions(analysis) {
        if (!this.vectorStore)
            return {};
        const solutions = {};
        for (const issue of analysis.patterns) {
            const query = {
                query: `${issue.type} ${issue.message}`,
                queryType: 'semantic',
                agentId: this.id,
                topK: 2,
                filters: {
                    tags: [issue.type, 'solution', this.ragConfig.agentDomain],
                    contentTypes: ['text', 'code']
                }
            };
            try {
                const result = await this.vectorStore.queryMemories(query);
                solutions[issue.type] = result.documents || [];
            }
            catch (error) {
                console.warn(`Failed to retrieve solutions for ${issue.type}:`, error.message);
                solutions[issue.type] = [];
            }
        }
        return solutions;
    }
    /**
     * Retrieve project standards specific to this agent's domain
     */
    async retrieveProjectStandards(context) {
        if (!this.vectorStore)
            return [];
        const query = {
            query: `${context.filePath} ${this.ragConfig.agentDomain} standards conventions`,
            queryType: 'semantic',
            agentId: this.id,
            topK: 3,
            filters: {
                tags: [this.ragConfig.agentDomain, 'standard', 'convention'],
                contentTypes: ['text']
            }
        };
        const result = await this.vectorStore.queryMemories(query);
        return result.documents || [];
    }
    /**
     * Retrieve agent-specific expertise and insights
     */
    async retrieveAgentExpertise(context) {
        if (!this.vectorStore)
            return [];
        const query = {
            query: this.createSemanticQuery(context.content, context.filePath),
            queryType: 'semantic',
            agentId: this.id,
            topK: 3,
            filters: {
                tags: [this.id, 'expertise', this.ragConfig.agentDomain],
                contentTypes: ['text', 'code']
            }
        };
        const result = await this.vectorStore.queryMemories(query);
        return result.documents || [];
    }
    /**
     * Generate enhanced response with RAG context
     */
    async generateRAGEnhancedResponse(context, analysis, ragContext) {
        // Convert analysis to suggestions
        const suggestions = analysis.patterns.map(p => ({
            type: p.type,
            description: p.message,
            location: `${context.filePath}:${p.line}`,
            priority: p.severity,
            action: p.suggestion
        }));
        // Enhance suggestions with RAG context
        if (ragContext) {
            this.enhanceSuggestionsWithRAG(suggestions, ragContext);
        }
        // Generate domain-specific handoffs
        const handoffTo = this.generateDomainHandoffs(analysis);
        // Create enhanced message with RAG insights
        const message = this.generateEnhancedMessage(analysis, ragContext);
        return {
            agentId: this.id,
            message,
            suggestions,
            priority: this.calculatePriorityWithRAG(analysis, ragContext),
            handoffTo,
            context: {
                analysisScore: analysis.score,
                totalIssues: analysis.patterns.length,
                criticalIssues: analysis.patterns.filter(p => p.severity === 'critical').length,
                ragEnhanced: !!ragContext,
                ragInsights: ragContext ? this.summarizeRAGInsights(ragContext) : undefined,
                generatedPrompt: this.generateRAGEnhancedPrompt(context, analysis, ragContext),
                recommendations: analysis.recommendations,
                summary: analysis.summary
            }
        };
    }
    /**
     * Generate RAG-enhanced prompt with retrieved context
     */
    generateRAGEnhancedPrompt(context, analysis, ragContext) {
        let prompt = this.getBasePromptTemplate();
        if (ragContext) {
            prompt += '\n## Retrieved Context\n\n';
            // Similar Code Patterns
            if (ragContext.similarCode.length > 0) {
                prompt += '### Similar Code Patterns From This Project:\n';
                ragContext.similarCode.forEach((pattern, index) => {
                    const tags = pattern.metadata?.tags?.join(', ') || 'N/A';
                    const score = Math.round((pattern.metadata?.relevanceScore || 0) * 100);
                    prompt += `Example ${index + 1} (${score}% relevance, tags: ${tags}):\n`;
                    prompt += '```\n' + pattern.content.slice(0, 200) + '...\n```\n\n';
                });
            }
            // Previous Solutions
            const solutionEntries = Object.entries(ragContext.previousSolutions).filter(([_, solutions]) => solutions.length > 0);
            if (solutionEntries.length > 0) {
                prompt += '### Previous Solutions for Similar Issues:\n';
                solutionEntries.forEach(([issueType, solutions]) => {
                    prompt += `For ${issueType}:\n`;
                    solutions.forEach(solution => {
                        prompt += `- ${solution.content.slice(0, 150)}...\n`;
                    });
                    prompt += '\n';
                });
            }
            // Project Standards
            if (ragContext.projectStandards.length > 0) {
                prompt += '### Project Standards:\n';
                ragContext.projectStandards.forEach(standard => {
                    prompt += `- ${standard.content.slice(0, 100)}...\n`;
                });
                prompt += '\n';
            }
        }
        // Current context
        prompt += '## Current Context\n';
        prompt += `File: ${context.filePath}\n`;
        prompt += `Issues Found: ${JSON.stringify(analysis.patterns.map(p => ({ type: p.type, severity: p.severity, message: p.message })), null, 2)}\n\n`;
        // Code to analyze
        prompt += `## Code to Analyze\n`;
        prompt += '```' + this.detectLanguage(context.filePath) + '\n';
        prompt += context.content + '\n';
        prompt += '```\n\n';
        prompt += 'Using the retrieved context above as reference, provide your analysis and recommendations.\n';
        return prompt;
    }
    /**
     * Store successful patterns for future learning
     */
    async storeNewPatterns(context, analysis, response) {
        if (!this.vectorStore)
            return;
        try {
            const language = this.detectLanguage(context.filePath);
            // Store high-quality code patterns (score >= 80)
            if (analysis.score >= 80) {
                const patternDoc = {
                    id: `pattern_${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    content: context.content,
                    contentType: 'code',
                    metadata: {
                        agentId: this.id,
                        timestamp: Date.now(),
                        fileType: context.filePath.split('.').pop() || '',
                        projectContext: 'VERSATIL Framework',
                        tags: [language, this.ragConfig.agentDomain, 'pattern', 'high-quality'],
                        relevanceScore: analysis.score / 100,
                        language,
                        framework: this.detectFramework(context.content)
                    }
                };
                await this.vectorStore.storeMemory(patternDoc);
            }
            // Store successful solutions for detected issues
            for (const suggestion of response.suggestions) {
                if (suggestion.priority !== 'low') {
                    const solutionDoc = {
                        id: `solution_${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        content: suggestion.action,
                        contentType: 'text',
                        metadata: {
                            agentId: this.id,
                            timestamp: Date.now(),
                            projectContext: 'VERSATIL Framework',
                            tags: [language, this.ragConfig.agentDomain, suggestion.type, 'solution'],
                            relevanceScore: suggestion.priority === 'critical' ? 1.0 : suggestion.priority === 'high' ? 0.8 : 0.6,
                            language
                        }
                    };
                    await this.vectorStore.storeMemory(solutionDoc);
                }
            }
        }
        catch (error) {
            console.warn(`Failed to store patterns for ${this.id}:`, error.message);
        }
    }
    // Helper methods
    getEmptyRAGContext() {
        return {
            similarCode: [],
            previousSolutions: {},
            projectStandards: [],
            agentExpertise: []
        };
    }
    createSemanticQuery(content, filePath) {
        // Extract key concepts and create semantic query
        const lines = content.split('\n');
        const keywords = [];
        // Extract function/class names
        const functionMatches = content.match(/(?:function|class|const|let|var)\s+(\w+)/g);
        if (functionMatches) {
            keywords.push(...functionMatches.map(match => match.split(/\s+/)[1]));
        }
        // Add file path context
        const pathParts = filePath.split('/').filter(part => part && !part.includes('.'));
        keywords.push(...pathParts);
        // Create concise semantic query
        const uniqueKeywords = [...new Set(keywords)].filter(k => k && k.length > 2).slice(0, 8);
        return uniqueKeywords.join(' ') || content.slice(0, 150);
    }
    detectLanguage(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const langMap = {
            'js': 'javascript', 'jsx': 'javascriptreact',
            'ts': 'typescript', 'tsx': 'typescriptreact',
            'py': 'python', 'vue': 'vue', 'svelte': 'svelte'
        };
        return langMap[ext] || 'plaintext';
    }
    detectFramework(content) {
        if (content.includes('react') || content.includes('useState'))
            return 'react';
        if (content.includes('vue') || content.includes('Vue'))
            return 'vue';
        if (content.includes('angular'))
            return 'angular';
        if (content.includes('express') || content.includes('app.get'))
            return 'express';
        return '';
    }
    enhanceSuggestionsWithRAG(suggestions, ragContext) {
        // Add RAG-derived suggestions
        if (ragContext.similarCode.length > 0) {
            suggestions.push({
                type: 'rag-pattern',
                description: `Found ${ragContext.similarCode.length} similar patterns in project history`,
                location: 'RAG Context',
                priority: 'info',
                action: 'Review similar implementations for consistency and best practices'
            });
        }
    }
    generateEnhancedMessage(analysis, ragContext) {
        let message = `${this.ragConfig.agentDomain} Analysis Complete: Score ${analysis.score}/100. ${analysis.patterns.length} issues found.`;
        if (ragContext) {
            const ragInsights = [];
            if (ragContext.similarCode.length > 0)
                ragInsights.push(`${ragContext.similarCode.length} similar patterns`);
            if (Object.keys(ragContext.previousSolutions).length > 0)
                ragInsights.push(`solutions for ${Object.keys(ragContext.previousSolutions).length} issue types`);
            if (ragContext.projectStandards.length > 0)
                ragInsights.push(`${ragContext.projectStandards.length} project standards`);
            if (ragInsights.length > 0) {
                message += ` RAG-Enhanced: ${ragInsights.join(', ')}.`;
            }
        }
        return message;
    }
    summarizeRAGInsights(ragContext) {
        return {
            similarPatterns: ragContext.similarCode.length,
            solutionTypes: Object.keys(ragContext.previousSolutions).length,
            projectStandards: ragContext.projectStandards.length,
            expertise: ragContext.agentExpertise.length
        };
    }
    calculatePriorityWithRAG(analysis, ragContext) {
        // Check for critical severity issues first
        const hasCritical = analysis.patterns.some(p => p.severity === 'critical');
        if (hasCritical)
            return 'critical';
        const hasHigh = analysis.patterns.some(p => p.severity === 'high');
        if (hasHigh)
            return 'high';
        // Fall back to score-based priority
        let basePriority = analysis.score < 60 ? 'high' : analysis.score < 80 ? 'medium' : 'low';
        // Boost priority if RAG context shows this is a recurring issue
        if (ragContext && Object.keys(ragContext.previousSolutions).length > 2) {
            if (basePriority === 'low')
                basePriority = 'medium';
            if (basePriority === 'medium')
                basePriority = 'high';
        }
        return basePriority;
    }
}
//# sourceMappingURL=rag-enabled-agent.js.map