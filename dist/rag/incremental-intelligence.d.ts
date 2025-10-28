/**
 * Incremental Intelligence System
 * Framework gets smarter with every interaction
 */
import { EnhancedVectorMemoryStore } from './enhanced-vector-memory-store.js';
import { AgentResponse, AgentActivationContext } from '../agents/core/base-agent.js';
export interface IntelligenceMetrics {
    totalInteractions: number;
    averageQualityScore: number;
    learningRate: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
}
export interface Pattern {
    type: string;
    description: string;
    confidence: number;
    occurrences: number;
}
export declare class IncrementalIntelligence {
    private vectorStore;
    private interactionCount;
    private qualityScores;
    private readonly SYNTHESIS_INTERVAL;
    constructor(vectorStore: EnhancedVectorMemoryStore);
    /**
     * Record interaction and learn from it
     */
    recordInteraction(agentId: string, context: AgentActivationContext, response: AgentResponse, userFeedback?: 'positive' | 'negative' | 'neutral'): Promise<void>;
    /**
     * Calculate quality score for an interaction
     */
    private calculateQualityScore;
    /**
     * Store interaction
     */
    private storeInteraction;
    /**
     * Synthesize learnings from recent interactions
     */
    private synthesizeLearnings;
    /**
     * Query top quality interactions
     */
    private queryTopQualityInteractions;
    /**
     * Extract patterns from interactions
     */
    private extractPatterns;
    /**
     * Increment pattern count
     */
    private incrementPattern;
    /**
     * Extract pattern type from pattern key
     */
    private extractPatternType;
    /**
     * Convert pattern key to human-readable description
     */
    private humanizePattern;
    /**
     * Store meta-learning pattern
     */
    private storeMetaLearning;
    /**
     * Get intelligence metrics
     */
    getMetrics(): IntelligenceMetrics;
    /**
     * Query meta-learnings for agent
     */
    queryMetaLearnings(agentId: string, limit?: number): Promise<any[]>;
    /**
     * Reset intelligence metrics
     */
    reset(): void;
}
