/**
 * VERSATIL SDLC Framework - Adaptive Learning & Auto-Improvement System
 *
 * This system learns from user interactions and automatically improves
 * the Enhanced OPERA agents based on real usage patterns, feedback, and outcomes.
 */
import { EventEmitter } from 'events';
export interface UserInteraction {
    id: string;
    timestamp: number;
    agentId: string;
    actionType: 'activation' | 'feedback' | 'dismissal' | 'follow_suggestion' | 'ignore_suggestion';
    context: {
        filePath?: string;
        fileType?: string;
        projectType?: string;
        userRole?: string;
        issue?: {
            type: string;
            severity: string;
            wasAccurate: boolean;
            userVerified: boolean;
        };
        suggestion?: {
            id: string;
            type: string;
            wasFollowed: boolean;
            wasHelpful: boolean;
            userRating?: number;
        };
    };
    outcome?: {
        problemSolved: boolean;
        timeToResolution?: number;
        userSatisfaction?: number;
        agentAccuracy?: number;
    };
}
export interface LearningPattern {
    id: string;
    agentId: string;
    pattern: string;
    confidence: number;
    usageCount: number;
    successRate: number;
    context: {
        fileTypes: string[];
        projectTypes: string[];
        commonIssues: string[];
        userPreferences: Record<string, any>;
    };
    recommendations: {
        agentImprovements: string[];
        detectionRules: string[];
        suggestionTypes: string[];
    };
}
export interface AgentAdaptation {
    agentId: string;
    adaptationType: 'detection_rule' | 'suggestion_algorithm' | 'priority_weighting' | 'context_awareness';
    changes: Record<string, any>;
    confidence: number;
    expectedImprovement: number;
    rollbackData?: Record<string, any>;
}
export declare class AdaptiveLearningEngine extends EventEmitter {
    private logger;
    private interactions;
    private patterns;
    private adaptations;
    private learningConfig;
    private dataPath;
    private isLearning;
    constructor();
    /**
     * Start the adaptive learning process
     */
    startLearning(): void;
    /**
     * Stop the learning engine
     */
    stopLearning(): void;
    /**
     * Record a user interaction with an agent
     */
    recordInteraction(interaction: UserInteraction): void;
    /**
     * Analyze user interactions to discover learning patterns
     */
    private analyzePatterns;
    /**
     * Find patterns that lead to successful outcomes
     */
    private findSuccessPatterns;
    /**
     * Find patterns that lead to failed outcomes
     */
    private findFailurePatterns;
    /**
     * Generate adaptive improvements for agents
     */
    private generateAdaptations;
    /**
     * Propose an adaptation to an agent
     */
    private proposeAdaptation;
    /**
     * Apply approved adaptations to agents
     */
    applyAdaptation(agentId: string, adaptationId: string): Promise<boolean>;
    /**
     * Get learning insights for dashboard
     */
    getLearningInsights(): {
        totalInteractions: number;
        patternsDiscovered: number;
        adaptationsProposed: number;
        adaptationsApplied: number;
        topPerformingAgents: Array<{
            agentId: string;
            successRate: number;
        }>;
        recentLearnings: LearningPattern[];
    };
    private initializeLearning;
    private loadLearningData;
    private saveInteraction;
    private handleInteraction;
    private handlePatternDiscovery;
    private groupByFileType;
    private calculateConfidence;
    private calculateSuccessRate;
    private extractProjectTypes;
    private extractCommonIssues;
    private extractUserPreferences;
    private generateAgentImprovements;
    private generateDetectionRules;
    private generateSuggestionTypes;
    private extractFileTypes;
    private generateAntiPatterns;
    private analyzeSuggestionEffectiveness;
    private analyzeDetectionAccuracy;
    private calculateTopPerformingAgents;
    private reinforceSuccessfulBehavior;
    private adjustForFalsePositive;
    private createRollbackData;
    private applyAdaptationChanges;
}
export declare const adaptiveLearning: AdaptiveLearningEngine;
export default adaptiveLearning;
