/**
 * VERSATIL Context Drift Detector
 *
 * Detects when conversation context becomes stale, irrelevant, or drifted
 * from the current task, enabling proactive context management.
 *
 * Research Findings:
 * - Long conversations (500k+ tokens) accumulate stale context
 * - File access patterns reveal drift (editing file A, but discussing file B)
 * - Task switches create context misalignment
 * - Obsolete patterns waste tokens (old code examples no longer relevant)
 * - Early drift detection allows targeted clearing vs. blanket clears
 *
 * Drift Indicators:
 * 1. **File Staleness**: Files discussed but not accessed in 50+ messages
 * 2. **Task Switching**: Multiple unrelated topics in short time span
 * 3. **Obsolete Patterns**: Patterns referencing deleted/renamed files
 * 4. **Agent Switching**: Frequent agent changes without completion
 * 5. **Conversation Depth**: Very long conversations (200+ messages)
 *
 * Integration: Works with ContextSentinel for proactive management
 */
import { ContextStatsTracker } from './context-stats-tracker.js';
/**
 * Drift severity levels
 */
export declare enum DriftSeverity {
    NONE = "none",// No drift detected
    LOW = "low",// Minor drift, monitor only
    MEDIUM = "medium",// Moderate drift, suggest clearing
    HIGH = "high",// Significant drift, recommend clearing
    CRITICAL = "critical"
}
/**
 * Drift indicator type
 */
export interface DriftIndicator {
    type: 'file_staleness' | 'task_switch' | 'obsolete_pattern' | 'agent_switch' | 'conversation_depth';
    severity: DriftSeverity;
    description: string;
    affectedFiles?: string[];
    affectedAgents?: string[];
    timestamp: Date;
    recommendation: string;
}
/**
 * Drift detection result
 */
export interface DriftDetectionResult {
    overallSeverity: DriftSeverity;
    driftScore: number;
    indicators: DriftIndicator[];
    recommendations: string[];
    shouldClearContext: boolean;
    tokenWasteEstimate: number;
}
/**
 * Drift detection configuration
 */
export interface DriftDetectionConfig {
    /** Max messages before considering file stale */
    fileStalenessThreshold: number;
    /** Max task switches before flagging drift */
    taskSwitchThreshold: number;
    /** Max conversation depth before flagging */
    conversationDepthThreshold: number;
    /** Enable obsolete pattern detection */
    detectObsoletePatterns: boolean;
    /** Enable agent switch detection */
    detectAgentSwitches: boolean;
}
export declare class ContextDriftDetector {
    private logger;
    private statsTracker;
    private config;
    private fileAccessHistory;
    private taskHistory;
    private agentHistory;
    private conversationMessageCount;
    constructor(statsTracker: ContextStatsTracker, config?: Partial<DriftDetectionConfig>);
    /**
     * Detect context drift and return analysis
     *
     * @param currentTokens - Current input token count
     * @returns Drift detection result with recommendations
     */
    detectDrift(currentTokens: number): Promise<DriftDetectionResult>;
    /**
     * Track file access (called by file operations)
     */
    trackFileAccess(filePath: string): void;
    /**
     * Track task change (called on user prompts)
     */
    trackTask(task: string): void;
    /**
     * Track agent activation
     */
    trackAgentActivation(agentId: string): void;
    /**
     * Track message (called on each user message)
     */
    trackMessage(): void;
    /**
     * Reset drift tracking (called after context clear)
     */
    reset(): void;
    /**
     * Detect file staleness
     */
    private detectFileStaleness;
    /**
     * Detect task switching
     */
    private detectTaskSwitching;
    /**
     * Detect conversation depth
     */
    private detectConversationDepth;
    /**
     * Detect agent switching
     */
    private detectAgentSwitching;
    /**
     * Detect obsolete patterns
     */
    private detectObsoletePatterns;
    /**
     * Calculate overall drift score (0-100)
     */
    private calculateDriftScore;
    /**
     * Calculate overall severity from score
     */
    private calculateOverallSeverity;
    /**
     * Generate recommendations based on drift indicators
     */
    private generateRecommendations;
    /**
     * Estimate wasted tokens from drift
     */
    private estimateTokenWaste;
    /**
     * Generate drift report
     */
    generateReport(result: DriftDetectionResult): string;
}
/**
 * Factory function for ContextDriftDetector
 */
export declare function createContextDriftDetector(statsTracker: ContextStatsTracker, config?: Partial<DriftDetectionConfig>): ContextDriftDetector;
