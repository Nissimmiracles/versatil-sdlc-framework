/**
 * Cross-Agent Learning System
 * Enables agents to learn from each other's successes and failures
 */
import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
export interface AgentInteraction {
    sourceAgent: string;
    targetAgent: string;
    context: string;
    outcome: 'success' | 'failure' | 'initiated';
    timestamp: number;
    metadata?: any;
}
export interface LearningInsight {
    pattern: string;
    confidence: number;
    applicability: string[];
    description: string;
}
export declare class CrossAgentLearning {
    private vectorStore;
    private interactionHistory;
    constructor(vectorStore: EnhancedVectorMemoryStore);
    /**
     * Learn from agent interaction
     */
    learnFromAgentInteraction(sourceAgent: string, targetAgent: string, context: string, outcome: 'success' | 'failure' | 'initiated', metadata?: any): Promise<void>;
    /**
     * Store successful pattern for future use
     */
    private storeSuccessPattern;
    /**
     * Query for similar successful interactions
     */
    querySimilarSuccesses(sourceAgent: string, targetAgent: string, limit?: number): Promise<any[]>;
    /**
     * Get recommended next agent based on history
     */
    getRecommendedNextAgent(currentAgent: string, context: string): Promise<{
        agentId: string;
        confidence: number;
    } | null>;
    /**
     * Extract learning insights from interaction history
     */
    extractLearningInsights(): Promise<LearningInsight[]>;
    /**
     * Get interaction statistics
     */
    getStatistics(): any;
    /**
     * Get statistics by agent pair
     */
    private getAgentPairStatistics;
}
