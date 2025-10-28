/**
 * VERSATIL v6.1 - Git PR Feedback Agent
 *
 * Automatically collects negative user experiences/sentiments about the framework
 * and submits them as Pull Requests to the public GitHub repository.
 *
 * Features:
 * - Sentiment analysis on user interactions
 * - Automatic issue/PR creation for negative feedback
 * - Groups similar feedback into single PRs
 * - Prioritizes critical issues
 * - Links to relevant framework code
 *
 * Purpose: Continuous improvement loop from real user experiences
 */
import { EventEmitter } from 'events';
import type { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
export interface UserFeedback {
    id: string;
    timestamp: number;
    agentId: string;
    taskDescription: string;
    userMessage?: string;
    sentiment: 'positive' | 'neutral' | 'negative' | 'critical';
    sentimentScore: number;
    category: 'bug' | 'ux' | 'performance' | 'documentation' | 'feature_request' | 'other';
    context: {
        filePath?: string;
        errorMessage?: string;
        duration?: number;
        retryCount?: number;
        success: boolean;
    };
    keywords: string[];
    suggestedFix?: string;
}
export interface FeedbackCluster {
    id: string;
    category: string;
    commonKeywords: string[];
    feedbackItems: UserFeedback[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    affectedComponent: string;
    suggestedTitle: string;
    suggestedDescription: string;
}
export interface GitHubPRConfig {
    owner: string;
    repo: string;
    baseBranch: string;
    autoCreateBranch: boolean;
    prLabels: string[];
    assignees?: string[];
}
export interface FeedbackAgentConfig {
    enabled: boolean;
    sentimentThreshold: number;
    minFeedbackForPR: number;
    autoSubmitPR: boolean;
    collectionInterval: number;
    vectorStore?: EnhancedVectorMemoryStore;
    githubConfig: GitHubPRConfig;
}
export declare class GitPRFeedbackAgent extends EventEmitter {
    private config;
    private feedbackQueue;
    private submittedPRs;
    private collectionTimer?;
    private feedbackClusters;
    constructor(config: FeedbackAgentConfig);
    /**
     * Start collecting user feedback
     */
    start(): Promise<void>;
    /**
     * Stop collecting feedback
     */
    stop(): Promise<void>;
    /**
     * Collect feedback from user interaction
     */
    collectFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'sentiment' | 'sentimentScore'>): Promise<UserFeedback>;
    /**
     * Analyze sentiment of feedback
     */
    private analyzeSentiment;
    /**
     * Process feedback queue and create PRs
     */
    private processFeedbackQueue;
    /**
     * Cluster similar feedback into groups
     */
    private clusterFeedback;
    /**
     * Create GitHub PR for feedback cluster
     */
    private createPRForCluster;
    /**
     * Generate proposal markdown file
     */
    private generateProposalFile;
    /**
     * Generate PR body
     */
    private generatePRBody;
    /**
     * Generate sentiment breakdown for PR
     */
    private generateSentimentBreakdown;
    /**
     * Store feedback in RAG for learning
     */
    private storeFeedbackInRAG;
    private mapSentimentToPriority;
    private getPriorityValue;
    private inferComponent;
    private generateClusterTitle;
    private generateClusterDescription;
    /**
     * Get statistics
     */
    getStats(): {
        queuedFeedback: number;
        submittedPRs: number;
        clusters: number;
    };
}
export declare function getGitPRFeedbackAgent(config?: FeedbackAgentConfig): GitPRFeedbackAgent;
