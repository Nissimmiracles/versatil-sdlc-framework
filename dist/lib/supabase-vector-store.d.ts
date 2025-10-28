/**
 * VERSATIL SDLC Framework - Production Supabase Vector Store
 *
 * Advanced client-side vector store with:
 * - Dual embedding support (OpenAI + local Transformers.js)
 * - Real-time agent collaboration via Supabase channels
 * - Production-ready pattern storage and retrieval
 * - Seamless integration with existing Enhanced OPERA agents
 */
import { RealtimeChannel } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
export interface CodePattern {
    id?: string;
    agent: string;
    type: string;
    code: string;
    filePath: string;
    language?: string;
    framework?: string;
    score: number;
    metadata: Record<string, any>;
    embedding?: number[];
    created_at?: string;
    similarity?: number;
}
export interface AgentSolution {
    id?: string;
    agent: string;
    problemType: string;
    problem: string;
    solution: string;
    explanation?: string;
    score: number;
    context: Record<string, any>;
    embedding?: number[];
    effectiveness_score?: number;
    metadata?: Record<string, any>;
    created_at?: string;
}
export interface AgentInteraction {
    agent: string;
    problemType: string;
    problem: string;
    solution: string;
    explanation: string;
    score: number;
    context: Record<string, any>;
}
export interface VectorStoreConfig {
    supabaseUrl: string;
    supabaseKey: string;
    openaiKey?: string;
    useLocalEmbeddings?: boolean;
    embeddingModel?: string;
    maxRetries?: number;
    retryDelay?: number;
}
export interface PatternSearchOptions {
    agentName?: string;
    patternType?: string;
    language?: string;
    framework?: string;
    minSimilarity?: number;
    limit?: number;
}
export declare class SupabaseVectorStore extends EventEmitter {
    private supabase;
    private openai?;
    private embeddingModel?;
    private logger;
    private config;
    private learningChannel?;
    private isInitialized;
    constructor(config: VectorStoreConfig);
    /**
     * Initialize embedding provider based on configuration
     */
    private initializeEmbeddingProvider;
    /**
     * Initialize local Transformers.js embeddings
     */
    private initializeLocalEmbeddings;
    /**
     * Generate embeddings for text
     */
    private generateEmbedding;
    /**
     * Add a code pattern to the vector store
     */
    addPattern(pattern: CodePattern): Promise<CodePattern>;
    /**
     * Retrieve similar patterns using vector similarity
     */
    retrieveSimilarPatterns(query: string, options?: PatternSearchOptions): Promise<CodePattern[]>;
    /**
     * Learn from agent interaction and store successful solutions
     */
    learnFromInteraction(interaction: AgentInteraction): Promise<AgentSolution>;
    /**
     * Find solutions for similar problems
     */
    findSimilarSolutions(problem: string, agentName?: string, limit?: number): Promise<AgentSolution[]>;
    /**
     * Setup real-time collaboration between agents
     */
    setupRealtimeCollaboration(): RealtimeChannel;
    /**
     * Subscribe to learning events from other agents
     */
    subscribeToLearning(callback: (event: any) => void): () => void;
    /**
     * Get performance metrics for the vector store
     */
    getPerformanceMetrics(): Promise<any>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    private extractTags;
    private notifyPatternAdded;
    private broadcastLearning;
    private groupByAgent;
    hasExistingData(): Promise<boolean>;
    initialize(): Promise<void>;
    getEmbeddingProvider(): string;
    getFeatures(): string[];
    storeSolution(solution: AgentSolution): Promise<void>;
    addSolution(solution: any): Promise<void>;
    getPatternCount(): Promise<number>;
}
export declare function createSupabaseVectorStore(config: VectorStoreConfig): SupabaseVectorStore;
