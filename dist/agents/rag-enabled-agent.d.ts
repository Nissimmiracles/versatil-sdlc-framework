/**
 * VERSATIL SDLC Framework - RAG-Enabled Agent Base Class
 *
 * Extends BaseAgent with direct RAG capabilities, allowing each agent to:
 * - Retrieve domain-specific context from vector memory
 * - Store successful patterns for future learning
 * - Generate context-aware prompts with historical knowledge
 */
import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent.js';
import { EnhancedVectorMemoryStore, MemoryDocument } from '../rag/enhanced-vector-memory-store.js';
import { AnalysisResult } from '../intelligence/pattern-analyzer.js';
export interface RAGConfig {
    maxExamples: number;
    similarityThreshold: number;
    agentDomain: string;
    enableLearning: boolean;
}
export interface AgentRAGContext {
    similarCode: MemoryDocument[];
    previousSolutions: {
        [issueType: string]: MemoryDocument[];
    };
    projectStandards: MemoryDocument[];
    agentExpertise: MemoryDocument[];
    metadata?: {
        [key: string]: any;
    };
}
export declare abstract class RAGEnabledAgent extends BaseAgent {
    protected vectorStore?: EnhancedVectorMemoryStore;
    protected ragConfig: RAGConfig;
    private ragCache;
    private readonly RAG_CACHE_TTL;
    private cacheCleanupInterval;
    constructor(vectorStore?: EnhancedVectorMemoryStore);
    /**
     * Override this in each agent to define domain-specific RAG configuration
     */
    protected abstract getDefaultRAGConfig(): RAGConfig;
    /**
     * Main analysis method with RAG enhancement
     */
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    /**
     * Run domain-specific pattern analysis - to be implemented by each agent
     */
    protected abstract runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult>;
    /**
     * Retrieve relevant context from vector memory (with caching)
     */
    protected retrieveRelevantContext(context: AgentActivationContext, analysis: AnalysisResult): Promise<AgentRAGContext>;
    /**
     * Generate cache key from context
     */
    private generateCacheKey;
    /**
     * Simple content hash for cache key
     */
    private hashContent;
    /**
     * Cleanup expired cache entries
     */
    private cleanupExpiredCache;
    /**
     * Clear all cache (useful for testing)
     */
    protected clearRAGCache(): void;
    /**
     * Get cache statistics
     */
    protected getRAGCacheStats(): {
        size: number;
        oldest: number | null;
        newest: number | null;
    };
    /**
     * Destroy agent and cleanup resources (prevent memory leaks)
     */
    destroy(): void;
    /**
     * Retrieve similar code patterns based on content and domain
     */
    protected retrieveSimilarCodePatterns(context: AgentActivationContext): Promise<MemoryDocument[]>;
    /**
     * Retrieve previous solutions for similar issues
     */
    protected retrievePreviousSolutions(analysis: AnalysisResult): Promise<{
        [issueType: string]: MemoryDocument[];
    }>;
    /**
     * Retrieve project standards specific to this agent's domain
     */
    protected retrieveProjectStandards(context: AgentActivationContext): Promise<MemoryDocument[]>;
    /**
     * Retrieve agent-specific expertise and insights
     */
    protected retrieveAgentExpertise(context: AgentActivationContext): Promise<MemoryDocument[]>;
    /**
     * Generate enhanced response with RAG context
     */
    protected generateRAGEnhancedResponse(context: AgentActivationContext, analysis: AnalysisResult, ragContext?: AgentRAGContext): Promise<AgentResponse>;
    /**
     * Generate RAG-enhanced prompt with retrieved context
     */
    protected generateRAGEnhancedPrompt(context: AgentActivationContext, analysis: AnalysisResult, ragContext?: AgentRAGContext): string;
    /**
     * Store successful patterns for future learning
     */
    protected storeNewPatterns(context: AgentActivationContext, analysis: AnalysisResult, response: AgentResponse): Promise<void>;
    protected getEmptyRAGContext(): AgentRAGContext;
    protected createSemanticQuery(content: string, filePath: string): string;
    protected detectLanguage(filePath: string): string;
    protected detectFramework(content: string): string;
    protected enhanceSuggestionsWithRAG(suggestions: any[], ragContext: AgentRAGContext): void;
    protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: AgentRAGContext): string;
    protected summarizeRAGInsights(ragContext: AgentRAGContext): any;
    protected calculatePriorityWithRAG(analysis: AnalysisResult, ragContext?: AgentRAGContext): string;
    protected abstract getBasePromptTemplate(): string;
    protected abstract generateDomainHandoffs(analysis: AnalysisResult): string[];
}
