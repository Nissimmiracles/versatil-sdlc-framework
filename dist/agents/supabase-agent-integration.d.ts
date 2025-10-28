/**
 * VERSATIL SDLC Framework - Supabase Agent Integration Layer
 *
 * Bridges existing RAG-enabled agents with the new Supabase Vector Store,
 * providing seamless integration, learning capabilities, and real-time collaboration.
 */
import { RAGEnabledAgent } from './core/rag-enabled-agent.js';
import { AgentActivationContext } from './core/base-agent.js';
export interface SupabaseRAGConfig {
    supabaseUrl: string;
    supabaseKey: string;
    openaiKey?: string;
    useLocalEmbeddings?: boolean;
    enableLearning?: boolean;
    enableCollaboration?: boolean;
    patternQualityThreshold?: number;
    solutionEffectivenessThreshold?: number;
    embeddingModel?: string;
    maxRetries?: number;
    retryDelay?: number;
}
export interface SupabaseRAGInsights {
    patternsFound: number;
    solutionsFound: number;
    avgPatternQuality: number;
    avgSolutionEffectiveness: number;
    embeddingProvider: 'openai' | 'local';
    collaborationActive: boolean;
    learningEnabled: boolean;
}
/**
 * Enhanced agent wrapper that integrates with Supabase Vector Store
 */
export declare class SupabaseRAGAgent {
    private agent;
    private supabaseStore;
    private logger;
    private config;
    private learningSubscription?;
    private patternCache;
    private isInitialized;
    constructor(agent: RAGEnabledAgent, config: SupabaseRAGConfig);
    /**
     * Initialize Supabase integration
     */
    private initialize;
    /**
     * Enhanced activate method with Supabase RAG integration
     */
    activate(context: AgentActivationContext): Promise<any>;
    /**
     * Enhance RAG context with Supabase patterns and solutions
     */
    private enhanceWithSupabaseRAG;
    /**
     * Retrieve similar patterns from Supabase
     */
    private retrieveSimilarPatterns;
    /**
     * Find relevant solutions for the current analysis
     */
    private findRelevantSolutions;
    /**
     * Learn from successful interactions
     */
    private learnFromSuccess;
    /**
     * Setup real-time collaboration with other agents
     */
    private setupCollaboration;
    /**
     * Handle collaboration events from other agents
     */
    private handleCollaborationEvent;
    /**
     * Get comprehensive insights about Supabase RAG performance
     */
    private getSupabaseInsights;
    /**
     * Get agent-specific performance summary
     */
    getAgentPerformance(): Promise<any>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    private buildPatternQuery;
    private detectLanguage;
    private detectFramework;
    private convertPatternsToMemoryDocuments;
    private convertSolutionsToMemoryDocuments;
    private groupSolutionsByType;
    private cachePatterns;
}
export declare function createSupabaseEnhancedAgent(agent: RAGEnabledAgent, config: SupabaseRAGConfig): SupabaseRAGAgent;
