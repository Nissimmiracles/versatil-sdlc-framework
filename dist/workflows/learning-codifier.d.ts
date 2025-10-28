/**
 * VERSATIL Learning Codifier
 *
 * Stores extracted learnings in Supabase RAG for future retrieval.
 * Implements the "Codify" phase of the EVERY Workflow.
 *
 * Responsibilities:
 * - Store code patterns in vector database
 * - Store lessons learned for future reference
 * - Tag learnings by agent, category, and effectiveness
 * - Create embeddings for similarity search
 * - Update agent memory with insights
 *
 * Integration: Final step in stop hook learning workflow
 */
import { ExtractedLearnings } from './learning-extractor.js';
import { StorageDestination } from '../rag/sanitization-policy.js';
export interface CodificationResult {
    patternsStored: number;
    lessonsStored: number;
    agentMemoriesUpdated: number;
    ragEntriesCreated: number;
    publicPatternsStored?: number;
    privatePatternsStored?: number;
    sanitizedPatterns?: number;
    success: boolean;
    error?: string;
}
export declare class LearningCodifier {
    private logger;
    private vectorStore;
    private ragRouter;
    private sanitizationPolicy;
    constructor();
    /**
     * Initialize vector store connection
     */
    private initializeVectorStore;
    /**
     * Main entry point: Codify learnings to RAG
     * v7.8.0: Now supports Public/Private RAG routing with auto-sanitization
     */
    codifyLearnings(learnings: ExtractedLearnings, storageDestination?: StorageDestination): Promise<CodificationResult>;
    /**
     * Store code patterns in RAG
     * v7.8.0: Now routes to Public/Private RAG with auto-sanitization
     */
    private storeCodePatterns;
    /**
     * Store lessons learned in RAG
     * v7.8.0: Now routes to Public/Private RAG with auto-sanitization
     */
    private storeLessonsLearned;
    /**
     * Update agent memories with insights
     */
    private updateAgentMemories;
    /**
     * Format agent insights for memory storage
     */
    private formatAgentInsights;
    /**
     * Format project knowledge for memory storage
     */
    private formatProjectKnowledge;
    /**
     * Map pattern category to responsible agent
     */
    private mapCategoryToAgent;
}
/**
 * Factory function for LearningCodifier
 */
export declare function createLearningCodifier(): LearningCodifier;
