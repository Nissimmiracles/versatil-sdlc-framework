/**
 * VERSATIL SDLC Framework - Usage Analytics & User Behavior Tracking
 *
 * Collects real-time usage data from Enhanced OPERA agents to enable
 * continuous learning and improvement based on actual user interactions.
 */
import { EventEmitter } from 'events';
export interface AgentUsageEvent {
    id: string;
    timestamp: number;
    agentId: string;
    eventType: 'activated' | 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_dismissed' | 'issue_reported' | 'false_positive';
    context: {
        filePath?: string;
        fileExtension?: string;
        projectType?: string;
        codebase?: {
            size: 'small' | 'medium' | 'large';
            language: string;
            framework?: string;
        };
        user?: {
            role?: 'junior' | 'mid' | 'senior' | 'lead';
            experience?: number;
            preferences?: Record<string, any>;
        };
    };
    data: {
        issuesDetected?: number;
        suggestionsProvided?: number;
        executionTime?: number;
        qualityScore?: number;
        userFeedback?: {
            helpful: boolean;
            accurate: boolean;
            rating: number;
            comments?: string;
        };
    };
}
export interface UsagePattern {
    id: string;
    agentId: string;
    pattern: {
        fileTypes: string[];
        projectTypes: string[];
        userTypes: string[];
        timePatterns: string[];
    };
    metrics: {
        frequency: number;
        successRate: number;
        userSatisfaction: number;
        averageExecutionTime: number;
    };
    insights: {
        mostEffectiveContext: string;
        commonUserFeedback: string[];
        improvementAreas: string[];
    };
}
export declare class UsageAnalytics extends EventEmitter {
    private logger;
    private events;
    private patterns;
    private isTracking;
    private analysisInterval;
    constructor();
    /**
     * Start usage tracking
     */
    startTracking(): void;
    /**
     * Stop usage tracking
     */
    stopTracking(): void;
    /**
     * Track agent usage event
     */
    trackEvent(event: AgentUsageEvent): void;
    /**
     * Track agent activation with context
     */
    trackAgentActivation(agentId: string, filePath?: string, context?: Record<string, any>): string;
    /**
     * Track suggestion interaction
     */
    trackSuggestion(agentId: string, suggestionType: string, wasAccepted: boolean, userFeedback?: {
        helpful: boolean;
        accurate: boolean;
        rating: number;
        comments?: string;
    }): void;
    /**
     * Track agent performance
     */
    trackPerformance(agentId: string, executionTime: number, issuesDetected: number, qualityScore: number): void;
    /**
     * Track false positive reports
     */
    trackFalsePositive(agentId: string, issueType: string, filePath?: string, userComments?: string): void;
    /**
     * Analyze usage patterns to discover insights
     */
    private analyzeUsagePatterns;
    /**
     * Generate usage pattern from events
     */
    private generateUsagePattern;
    /**
     * Convert usage event to adaptive learning interaction
     */
    private convertToLearningInteraction;
    /**
     * Get usage analytics dashboard data
     */
    getAnalyticsDashboard(): {
        totalEvents: number;
        agentUsage: Array<{
            agentId: string;
            activations: number;
            successRate: number;
        }>;
        topFileTypes: Array<{
            fileType: string;
            usage: number;
        }>;
        userSatisfaction: number;
        commonIssues: string[];
        improvementOpportunities: string[];
    };
    private extractFileExtension;
    private detectProjectType;
    private analyzeCodebase;
    private extractUserInfo;
    private extractUniqueValues;
    private getNestedValue;
    private calculateAverage;
    private extractTimePatterns;
    private findMostEffectiveContext;
    private extractCommonFeedback;
    private identifyImprovementAreas;
    private generateImprovementInsights;
    private getCommonIssues;
    private getImprovementOpportunities;
    private buildEventContext;
    private buildSimpleContext;
    private buildInteractionContext;
}
export declare const usageAnalytics: UsageAnalytics;
export default usageAnalytics;
