/**
 * VERSATIL SDLC Framework - RAG-Enabled Agent Base Class
 *
 * Extends BaseAgent with direct RAG capabilities, allowing each agent to:
 * - Retrieve domain-specific context from vector memory
 * - Store successful patterns for future learning
 * - Generate context-aware prompts with historical knowledge
 */
import { BaseAgent } from './base-agent.js';
import { contextPriorityResolver } from '../../context/context-priority-resolver.js';
import { cagPromptCache } from '../../rag/cag-prompt-cache.js';
import { cagMetricsTracker } from '../../monitoring/cag-metrics.js';
import { getAgentCAGConfig } from '../../config/cag-config.js';
export class RAGEnabledAgent extends BaseAgent {
    constructor(vectorStore) {
        super();
        this.RAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        this.cacheCleanupInterval = null;
        this.cagEnabled = true; // CAG enabled by default
        this.vectorStore = vectorStore;
        this.ragConfig = this.getDefaultRAGConfig();
        this.ragCache = new Map();
        // Check if CAG is enabled for this agent
        const cagConfig = getAgentCAGConfig(this.id);
        this.cagEnabled = cagConfig?.enabled ?? true;
        // Cleanup expired cache entries every minute (store reference for cleanup)
        // Skip in test environments to prevent timeout issues
        if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
            this.cacheCleanupInterval = setInterval(() => this.cleanupExpiredCache(), 60 * 1000);
        }
    }
    /**
     * Main analysis method with RAG enhancement + Three-Layer Context
     */
    async activate(context) {
        // Level -1: THREE-LAYER CONTEXT RESOLUTION (User > Team > Project > Framework)
        let resolvedContext;
        if (context.userId || context.teamId || context.projectId) {
            try {
                resolvedContext = await contextPriorityResolver.resolveContext({
                    userId: context.userId,
                    teamId: context.teamId,
                    projectId: context.projectId
                });
                // Inject resolved context into agent context
                context.resolvedContext = resolvedContext;
                context.codingPreferences = resolvedContext.codingPreferences;
                console.log(`[${this.id}] Three-layer context resolved:`);
                console.log(`   User: ${context.userId || 'none'}`);
                console.log(`   Team: ${context.teamId || 'none'}`);
                console.log(`   Project: ${context.projectId || 'none'}`);
                console.log(`   User overrides: ${resolvedContext.resolution.userOverrides.length}`);
                console.log(`   Team overrides: ${resolvedContext.resolution.teamOverrides.length}`);
            }
            catch (error) {
                console.warn(`[${this.id}] Failed to resolve three-layer context: ${error.message}`);
            }
        }
        // Level 0: Query RAG BEFORE activation to inject historical context
        let earlyRAGContext;
        if (this.vectorStore) {
            earlyRAGContext = await this.queryRAGBeforeActivation(context);
            // Inject RAG context into prompt for LLM to use
            context.enhancedPrompt = this.injectRAGContextIntoPrompt(context, earlyRAGContext);
        }
        // Level 1: Standard pattern analysis
        const patternAnalysis = await this.runPatternAnalysis(context);
        // Level 2: RAG enhancement (if vector store available)
        let ragContext;
        if (this.vectorStore) {
            ragContext = await this.retrieveRelevantContext(context, patternAnalysis);
        }
        // Level 3: Generate enhanced response
        const enhancedResponse = await this.generateRAGEnhancedResponse(context, patternAnalysis, ragContext);
        // Enrich response with resolved context metadata
        if (resolvedContext && enhancedResponse.context) {
            enhancedResponse.context.resolvedContext = {
                userId: context.userId,
                teamId: context.teamId,
                projectId: context.projectId,
                userOverrides: resolvedContext.resolution.userOverrides.length,
                teamOverrides: resolvedContext.resolution.teamOverrides.length,
                conflicts: resolvedContext.resolution.conflicts.length
            };
        }
        // Level 4: Store successful patterns for learning
        if (this.vectorStore && this.ragConfig.enableLearning) {
            await this.storeNewPatterns(context, patternAnalysis, enhancedResponse);
        }
        return enhancedResponse;
    }
    /**
     * Query RAG BEFORE activation to inject historical context
     * This is the NEW method for Phase 1 - ensures agents see historical patterns
     */
    async queryRAGBeforeActivation(context) {
        if (!this.vectorStore) {
            return this.getEmptyRAGContext();
        }
        const retrievals = {
            similarCode: [],
            previousSolutions: {},
            projectStandards: [],
            agentExpertise: []
        };
        try {
            // 1. Query for similar code patterns (based on file path + content keywords)
            const semanticQuery = this.createSemanticQuery(context.content || '', context.filePath || '');
            const codeQuery = {
                query: semanticQuery,
                queryType: 'semantic',
                agentId: this.id,
                topK: 5,
                filters: {
                    tags: [this.ragConfig.agentDomain, 'pattern'],
                    contentTypes: ['code']
                }
            };
            const codeResult = await this.vectorStore.queryMemories(codeQuery);
            retrievals.similarCode = codeResult.documents || [];
            // 2. Query for project standards
            const standardsQuery = {
                query: `${this.ragConfig.agentDomain} best practices coding standards`,
                queryType: 'semantic',
                agentId: this.id,
                topK: 3,
                filters: {
                    tags: [this.ragConfig.agentDomain, 'standard', 'convention'],
                    contentTypes: ['text']
                }
            };
            const standardsResult = await this.vectorStore.queryMemories(standardsQuery);
            retrievals.projectStandards = standardsResult.documents || [];
            // 3. Query for agent-specific expertise
            const expertiseQuery = {
                query: semanticQuery,
                queryType: 'semantic',
                agentId: this.id,
                topK: 3,
                filters: {
                    tags: [this.id, 'expertise'],
                    contentTypes: ['text', 'code']
                }
            };
            const expertiseResult = await this.vectorStore.queryMemories(expertiseQuery);
            retrievals.agentExpertise = expertiseResult.documents || [];
            console.log(`[${this.id}] RAG pre-activation query: ${retrievals.similarCode.length} code patterns, ${retrievals.projectStandards.length} standards, ${retrievals.agentExpertise.length} expertise`);
        }
        catch (error) {
            console.warn(`RAG pre-activation query failed for ${this.id}:`, error.message);
        }
        return retrievals;
    }
    /**
     * Inject RAG context into prompt BEFORE agent processes
     * This ensures the LLM sees historical patterns and can reference them
     */
    injectRAGContextIntoPrompt(context, ragContext) {
        let enhancedPrompt = context.content || '';
        // Add RAG context section at the beginning
        let ragSection = '\n\n---\n## 🧠 Historical Context from RAG Memory\n\n';
        // 1. Similar code patterns
        if (ragContext.similarCode.length > 0) {
            ragSection += '### Similar Code Patterns from This Project:\n';
            ragContext.similarCode.forEach((pattern, index) => {
                const tags = pattern.metadata?.tags?.join(', ') || 'N/A';
                const score = Math.round((pattern.metadata?.relevanceScore || 0) * 100);
                const preview = pattern.content.slice(0, 300).trim();
                ragSection += `\n**Example ${index + 1}** (${score}% relevance, tags: ${tags}):\n`;
                ragSection += '```\n' + preview + (pattern.content.length > 300 ? '\n...' : '') + '\n```\n';
            });
            ragSection += '\n';
        }
        // 2. Project standards
        if (ragContext.projectStandards.length > 0) {
            ragSection += '### Project Standards & Best Practices:\n';
            ragContext.projectStandards.forEach((standard, index) => {
                const preview = standard.content.slice(0, 200).trim();
                ragSection += `${index + 1}. ${preview}${standard.content.length > 200 ? '...' : ''}\n`;
            });
            ragSection += '\n';
        }
        // 3. Agent expertise
        if (ragContext.agentExpertise.length > 0) {
            ragSection += `### ${this.id} Agent Expertise:\n`;
            ragContext.agentExpertise.forEach((expertise, index) => {
                const preview = expertise.content.slice(0, 200).trim();
                ragSection += `${index + 1}. ${preview}${expertise.content.length > 200 ? '...' : ''}\n`;
            });
            ragSection += '\n';
        }
        // Add instruction to use RAG context
        if (ragContext.similarCode.length > 0 || ragContext.projectStandards.length > 0 || ragContext.agentExpertise.length > 0) {
            ragSection += '**Instructions**: Use the above historical context to:\n';
            ragSection += '- Apply proven patterns from similar code\n';
            ragSection += '- Follow project-specific standards and conventions\n';
            ragSection += '- Build on previous successful solutions\n';
            ragSection += '- Maintain consistency with existing codebase\n';
            ragSection += '\n---\n\n';
        }
        // Prepend RAG context to user's content
        enhancedPrompt = ragSection + enhancedPrompt;
        return enhancedPrompt;
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
     * Now uses CAG (Cache Augmented Generation) for 90% cost reduction and 10x speedup
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
        // Prepare response metadata
        const responseMetadata = {
            analysisScore: analysis.score,
            totalIssues: analysis.patterns.length,
            criticalIssues: analysis.patterns.filter(p => p.severity === 'critical').length,
            ragEnhanced: !!ragContext,
            ragInsights: ragContext ? this.summarizeRAGInsights(ragContext) : undefined,
            generatedPrompt: this.generateRAGEnhancedPrompt(context, analysis, ragContext),
            recommendations: analysis.recommendations,
            summary: analysis.summary
        };
        // If CAG is enabled, use it for LLM-enhanced analysis
        if (this.cagEnabled && ragContext) {
            try {
                const cagResponse = await this.queryWithCAG(context, analysis, ragContext);
                // Add CAG metadata to response
                responseMetadata.cag = {
                    enabled: true,
                    cacheStatus: cagResponse.cacheStatus,
                    costSavings: cagResponse.costSavings.savingsPercent,
                    latency: cagResponse.latency,
                    tokensSaved: cagResponse.tokenUsage.cacheRead
                };
                // If CAG returned useful content, enhance the message
                if (cagResponse.content && cagResponse.content.length > 0) {
                    responseMetadata.cagEnhancedAnalysis = cagResponse.content;
                }
            }
            catch (error) {
                console.warn(`CAG query failed for ${this.id}, continuing without LLM enhancement:`, error.message);
                responseMetadata.cag = { enabled: false, error: error.message };
            }
        }
        return {
            agentId: this.id,
            message,
            suggestions,
            priority: this.calculatePriorityWithRAG(analysis, ragContext),
            handoffTo,
            context: responseMetadata
        };
    }
    /**
     * Query LLM with CAG (Cache Augmented Generation) for enhanced analysis
     * Uses prompt caching to achieve 90% cost reduction and 10x faster responses
     */
    async queryWithCAG(context, analysis, ragContext) {
        // Build system prompt (CACHEABLE - rarely changes)
        const systemPrompt = this.buildCAGSystemPrompt();
        // Build RAG context (CACHEABLE - changes per query type but reusable)
        const ragContextPrompt = this.buildCAGRAGContext(ragContext);
        // Build user query (NOT CACHEABLE - unique each time)
        const userQuery = this.buildCAGUserQuery(context, analysis);
        // Execute CAG query
        const response = await cagPromptCache.query({
            systemPrompt,
            ragContext: ragContextPrompt,
            userQuery,
            agentId: this.id,
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            maxTokens: 4096
        });
        // Record metrics
        cagMetricsTracker.recordQuery(response, this.id);
        return response;
    }
    /**
     * Build system prompt for CAG (CACHEABLE)
     * This rarely changes, so it's cached efficiently
     */
    buildCAGSystemPrompt() {
        const basePrompt = this.getBasePromptTemplate();
        return `${basePrompt}

## Your Task
Analyze the provided code using the retrieved RAG context (similar patterns, project standards, previous solutions) and the current context. Provide:

1. **Assessment**: Brief quality assessment (1-2 sentences)
2. **Key Issues**: List 3-5 most critical issues if any
3. **Recommendations**: 3-5 specific, actionable improvements
4. **RAG Insights**: How the retrieved patterns inform your recommendations

Keep your response concise and actionable.`;
    }
    /**
     * Build RAG context prompt for CAG (CACHEABLE)
     * This is cacheable because similar queries retrieve similar contexts
     */
    buildCAGRAGContext(ragContext) {
        let contextPrompt = '';
        // Similar Code Patterns (cacheable)
        if (ragContext.similarCode.length > 0) {
            contextPrompt += '# Similar Code Patterns\n\n';
            ragContext.similarCode.forEach((pattern, index) => {
                const tags = pattern.metadata?.tags?.join(', ') || 'N/A';
                const score = Math.round((pattern.metadata?.relevanceScore || 0) * 100);
                contextPrompt += `**Pattern ${index + 1}** (${score}% relevance, tags: ${tags}):\n`;
                contextPrompt += '```\n' + pattern.content.slice(0, 500) + (pattern.content.length > 500 ? '\n...' : '') + '\n```\n\n';
            });
        }
        // Previous Solutions (cacheable)
        const solutionEntries = Object.entries(ragContext.previousSolutions).filter(([_, solutions]) => solutions.length > 0);
        if (solutionEntries.length > 0) {
            contextPrompt += '# Previous Solutions\n\n';
            solutionEntries.forEach(([issueType, solutions]) => {
                contextPrompt += `**For ${issueType}**:\n`;
                solutions.slice(0, 3).forEach((solution, idx) => {
                    contextPrompt += `${idx + 1}. ${solution.content.slice(0, 200)}...\n`;
                });
                contextPrompt += '\n';
            });
        }
        // Project Standards (cacheable)
        if (ragContext.projectStandards.length > 0) {
            contextPrompt += '# Project Standards\n\n';
            ragContext.projectStandards.forEach((standard, index) => {
                contextPrompt += `${index + 1}. ${standard.content.slice(0, 150)}...\n`;
            });
            contextPrompt += '\n';
        }
        return contextPrompt || '# No relevant RAG context available';
    }
    /**
     * Build user query for CAG (NOT CACHEABLE)
     * This is unique for each request and should NOT be cached
     */
    buildCAGUserQuery(context, analysis) {
        const language = this.detectLanguage(context.filePath);
        return `# Current Task

Analyze this ${language} file and provide recommendations.

**File**: ${context.filePath}
**Detected Issues**: ${analysis.patterns.length} (${analysis.patterns.filter(p => p.severity === 'critical').length} critical)
**Quality Score**: ${analysis.score}/100

## Code

\`\`\`${language}
${context.content}
\`\`\`

## Analysis Context

${JSON.stringify(analysis.patterns.map(p => ({
            type: p.type,
            severity: p.severity,
            message: p.message,
            line: p.line
        })), null, 2)}

Provide your analysis using the RAG context above as reference.`;
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