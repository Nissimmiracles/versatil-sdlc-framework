/**
 * VERSATIL v6.1 - Intelligent Feedback Detector
 *
 * Automatically detects negative user experiences WITHOUT requiring slash commands.
 * Uses passive monitoring, pattern detection, and sentiment analysis.
 *
 * Detection Methods:
 * 1. Passive Monitoring - Detect frustration patterns automatically
 * 2. Active Prompts - Ask for feedback at key moments
 * 3. Sentiment Analysis - Analyze user messages for negative sentiment
 * 4. Behavioral Signals - Track rejection patterns (immediate edits, retries, etc.)
 */
import { EventEmitter } from 'events';
export interface FrustrationPattern {
    userId?: string;
    agentId: string;
    taskType: string;
    retryCount: number;
    consecutiveFailures: number;
    avgExecutionTime: number;
    lastErrorTimestamp: number;
    rejectionSignals: number;
}
export interface DetectorConfig {
    enabled: boolean;
    retryThreshold: number;
    executionTimeThreshold: number;
    errorSpikeThreshold: number;
    rejectionSignalThreshold: number;
    activeFeedbackPrompts: boolean;
}
export declare class IntelligentFeedbackDetector extends EventEmitter {
    private config;
    private frustrationPatterns;
    private recentInteractions;
    constructor(config?: Partial<DetectorConfig>);
    /**
     * Monitor agent activation for frustration patterns
     */
    monitorAgentActivation(event: {
        agentId: string;
        taskType: string;
        success: boolean;
        duration: number;
        errorMessage?: string;
        userId?: string;
    }): Promise<void>;
    /**
     * Monitor user edits after agent response (rejection signal)
     */
    monitorUserEdit(event: {
        filePath: string;
        agentId?: string;
        timeSinceAgentResponse: number;
        userId?: string;
    }): Promise<void>;
    /**
     * Check for frustration triggers and collect feedback
     */
    private checkFrustrationTriggers;
    /**
     * Trigger feedback collection
     */
    private triggerFeedbackCollection;
    /**
     * Show active feedback prompt to user
     */
    private showFeedbackPrompt;
    /**
     * Generate suggested fix based on trigger
     */
    private generateSuggestedFix;
    /**
     * Analyze sentiment of user message
     */
    analyzeSentiment(message: string): Promise<{
        sentiment: 'positive' | 'neutral' | 'negative' | 'critical';
        score: number;
        keywords: string[];
    }>;
    /**
     * Reset patterns for user/agent
     */
    resetPattern(userId: string | undefined, agentId: string): void;
    /**
     * Get statistics
     */
    getStats(): {
        activePatterns: number;
        recentInteractions: number;
        recentErrors: number;
    };
}
export declare function getIntelligentFeedbackDetector(config?: Partial<DetectorConfig>): IntelligentFeedbackDetector;
