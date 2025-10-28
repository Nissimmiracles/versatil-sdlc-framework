/**
 * VERSATIL SDLC Framework - User Feedback Collection System
 * Collects, analyzes, and routes user feedback for continuous improvement
 */
import { EventEmitter } from 'events';
export interface UserFeedback {
    id: string;
    timestamp: Date;
    userId?: string;
    sessionId: string;
    category: FeedbackCategory;
    type: FeedbackType;
    rating: number;
    message: string;
    context: FeedbackContext;
    metadata: Record<string, any>;
    urgent?: boolean;
    tags?: string[];
    resolution?: FeedbackResolution;
}
export declare enum FeedbackCategory {
    AGENT_PERFORMANCE = "agent_performance",
    USER_EXPERIENCE = "user_experience",
    FEATURE_REQUEST = "feature_request",
    BUG_REPORT = "bug_report",
    DOCUMENTATION = "documentation",
    INTEGRATION = "integration",
    PERFORMANCE = "performance",
    SECURITY = "security"
}
export declare enum FeedbackType {
    PRAISE = "praise",
    COMPLAINT = "complaint",
    SUGGESTION = "suggestion",
    QUESTION = "question",
    BUG = "bug",
    FEATURE = "feature"
}
export interface FeedbackContext {
    agentId?: string;
    projectPath: string;
    projectType?: string;
    ideType?: 'cursor' | 'vscode' | 'claude_desktop';
    frameworkVersion: string;
    operation?: string;
    errorStack?: string;
    userAction?: string;
    systemInfo: {
        platform: string;
        nodeVersion: string;
        timestamp: Date;
    };
}
export interface FeedbackResolution {
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string;
    resolution?: string;
    resolvedAt?: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export declare class VERSATILFeedbackCollector extends EventEmitter {
    private logger;
    private feedbackStorage;
    private feedbackDir;
    private analyticsData;
    constructor(projectPath: string);
    /**
     * Initialize feedback collection system
     */
    private initializeFeedbackSystem;
    /**
     * Collect user feedback
     */
    collectFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Quick feedback collection for common scenarios
     */
    quickFeedback(rating: number, message: string, category?: FeedbackCategory): Promise<string>;
    /**
     * Collect feedback with automatic context detection
     */
    contextualFeedback(rating: number, message: string, agentId?: string, operation?: string): Promise<string>;
    /**
     * Get feedback analytics and insights
     */
    getFeedbackAnalytics(): FeedbackAnalytics;
    /**
     * Get feedback by category
     */
    getFeedbackByCategory(category: FeedbackCategory): UserFeedback[];
    /**
     * Get urgent feedback requiring immediate attention
     */
    getUrgentFeedback(): UserFeedback[];
    /**
     * Generate improvement roadmap based on feedback
     */
    generateImprovementRoadmap(): ImprovementRoadmap;
    /**
     * Export feedback data for external analysis
     */
    exportFeedback(format?: 'json' | 'csv'): Promise<string>;
    private generateFeedbackId;
    private generateSessionId;
    private generateContext;
    private detectCategory;
    private detectType;
    private calculateConfidence;
    private updateAnalytics;
    private handleUrgentFeedback;
    private createIssueInTracker;
    private createGitHubIssue;
    private createJiraIssue;
    private notifyDevelopmentTeam;
    private sendSlackNotification;
    private routeFeedback;
    private calculateRecentTrends;
    private getTopIssues;
    private generateImprovementSuggestions;
    private loadExistingFeedback;
    private setupAutoSave;
    private saveFeedbackData;
    private extractCriticalIssues;
    private prioritizeFeatureRequests;
    private identifyUXImprovements;
    private identifyPerformanceIssues;
    private identifyDocumentationNeeds;
    private convertToCSV;
}
interface FeedbackAnalytics {
    totalFeedback: number;
    categoryBreakdown: Map<string, number>;
    averageRating: number;
    urgentIssues: number;
    trendingTags: Map<string, number>;
    recentTrends?: Array<{
        category: string;
        trend: number;
    }>;
    topIssues?: Array<{
        issue: string;
        count: number;
        severity: string;
    }>;
    improvementSuggestions?: string[];
}
interface ImprovementRoadmap {
    criticalIssues: string[];
    featureRequests: Array<{
        feature: string;
        votes: number;
    }>;
    userExperienceImprovements: string[];
    performanceOptimizations: string[];
    documentationGaps: string[];
}
export type { FeedbackAnalytics, ImprovementRoadmap };
