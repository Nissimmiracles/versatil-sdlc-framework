/**
 * Bidirectional RAG Synchronization
 * Agents both query AND update RAG for continuous learning
 */
import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
export interface SyncMetrics {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
}
export declare class BidirectionalRAGSync {
    private vectorStore;
    private metrics;
    constructor(vectorStore: EnhancedVectorMemoryStore);
    /**
     * Sync agent response back to RAG
     * This creates the "learning" part of the intelligence flywheel
     */
    syncAgentResponse(agentId: string, context: AgentActivationContext, response: AgentResponse): Promise<void>;
    /**
     * Store agent response
     */
    private storeResponse;
    /**
     * Store suggestions as patterns
     */
    private storeSuggestions;
    /**
     * Store context metadata for pattern matching
     */
    private storeContextMetadata;
    /**
     * Query for similar past contexts
     */
    querySimilarContexts(context: AgentActivationContext, agentId: string, limit?: number): Promise<any[]>;
    /**
     * Query for successful patterns
     */
    querySuccessfulPatterns(agentId: string, patternType?: string, limit?: number): Promise<any[]>;
    /**
     * Update sync metrics
     */
    private updateMetrics;
    /**
     * Get sync metrics
     */
    getMetrics(): SyncMetrics;
    /**
     * Reset metrics
     */
    resetMetrics(): void;
}
