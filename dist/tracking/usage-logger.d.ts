/**
 * VERSATIL Usage Logger
 *
 * Automatically logs all agent activations and framework usage
 * to provide real-time visibility and power sentiment tracking.
 *
 * Features:
 * - Auto-log every agent activation
 * - Track task duration and outcome
 * - Calculate time saved vs manual work
 * - Persist to ~/.versatil/logs/usage.log
 */
export interface AgentActivationEvent {
    timestamp: number;
    sessionId: string;
    agentId: string;
    agentName: string;
    taskType: string;
    taskDescription: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    outcome?: {
        success: boolean;
        quality: number;
        timeSaved?: number;
        error?: string;
    };
    context?: {
        filesModified?: string[];
        linesChanged?: number;
        testsGenerated?: number;
        patternsUsed?: string[];
    };
}
export interface SessionMetrics {
    sessionId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    agentActivations: number;
    tasksCompleted: number;
    tasksFailed: number;
    totalTimeSaved: number;
    averageQuality: number;
    impactScore: number;
    agentBreakdown: {
        [agentId: string]: {
            activations: number;
            successRate: number;
            avgDuration: number;
            timeSaved: number;
        };
    };
}
export declare class UsageLogger {
    private logsDir;
    private usageLogPath;
    private currentSessionId;
    private sessionStartTime;
    private activeTasks;
    private sessionEvents;
    constructor();
    /**
     * Initialize logger (create logs directory if needed)
     */
    initialize(): Promise<void>;
    /**
     * Log agent activation (task started)
     */
    logAgentActivation(params: {
        agentId: string;
        agentName: string;
        taskType: string;
        taskDescription: string;
        context?: AgentActivationEvent['context'];
    }): Promise<string>;
    /**
     * Log task completion
     */
    logTaskCompletion(params: {
        taskId: string;
        success: boolean;
        quality?: number;
        context?: AgentActivationEvent['context'];
        error?: string;
    }): Promise<void>;
    /**
     * Get current session metrics
     */
    getSessionMetrics(): SessionMetrics;
    /**
     * Calculate time saved compared to manual work
     */
    private calculateTimeSaved;
    /**
     * Calculate framework impact score (0-10)
     */
    private calculateImpactScore;
    /**
     * Group events by agent
     */
    private groupEventsByAgent;
    /**
     * Append event to log file (JSON lines format)
     */
    private appendToLog;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Generate unique task ID
     */
    private generateTaskId;
    /**
     * Get log file path
     */
    getLogPath(): string;
    /**
     * Get current session ID
     */
    getSessionId(): string;
    /**
     * Read all events from log file
     */
    readLogFile(): Promise<AgentActivationEvent[]>;
    /**
     * Get events for current session only
     */
    getSessionEvents(): Promise<AgentActivationEvent[]>;
}
export declare function getUsageLogger(): UsageLogger;
