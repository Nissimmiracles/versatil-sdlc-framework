/**
 * Guardian Logging System
 *
 * Comprehensive logging for Iris-Guardian with:
 * - File-based persistence (~/.versatil/logs/guardian/)
 * - Structured JSON logs for analysis
 * - Log rotation (daily, max 30 days)
 * - Real-time streaming for monitoring
 * - Activity timeline tracking
 *
 * Log Files:
 * - guardian.log: Main activity log
 * - health-checks.log: Health check results
 * - auto-remediation.log: Auto-fix attempts and results
 * - rag-operations.log: RAG/GraphRAG health monitoring
 * - agent-coordination.log: Agent activation tracking
 * - version-management.log: Release and version activities (FRAMEWORK_CONTEXT only)
 */
/**
 * Log entry
 */
export interface GuardianLogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'health' | 'remediation' | 'rag' | 'agent' | 'version' | 'system';
    context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
    message: string;
    data?: Record<string, any>;
    duration_ms?: number;
}
/**
 * Activity timeline entry
 */
export interface ActivityEntry {
    timestamp: string;
    type: 'health_check' | 'auto_fix' | 'alert' | 'rag_query' | 'agent_activation' | 'version_bump' | 'release';
    status: 'success' | 'warning' | 'error' | 'in_progress';
    description: string;
    details?: Record<string, any>;
}
/**
 * Guardian logger with file persistence (Singleton)
 */
export declare class GuardianLogger {
    private static instance;
    private baseLogger;
    private logsDir;
    private activityTimeline;
    private context;
    private mainLogStream?;
    private healthLogStream?;
    private remediationLogStream?;
    private ragLogStream?;
    private agentLogStream?;
    private versionLogStream?;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(context?: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT'): GuardianLogger;
    /**
     * Initialize log directory structure
     */
    private initializeLogDirectory;
    /**
     * Open log file streams
     */
    private openLogStreams;
    /**
     * Log system start
     */
    private logSystemStart;
    /**
     * Write log entry to appropriate streams
     */
    private writeLog;
    /**
     * Log health check
     */
    logHealthCheck(result: {
        overall_health: number;
        status: string;
        components: Record<string, any>;
        issues: any[];
        duration_ms: number;
    }): void;
    /**
     * Log auto-remediation attempt
     */
    logRemediation(remediation: {
        issue: string;
        action_taken: string;
        success: boolean;
        confidence: number;
        before_state: string;
        after_state: string;
        duration_ms: number;
        learned: boolean;
    }): void;
    /**
     * Log RAG operation
     */
    logRAGOperation(operation: {
        type: 'health_check' | 'query' | 'store' | 'fallback';
        store: 'graphrag' | 'vector' | 'local';
        success: boolean;
        latency_ms: number;
        details?: Record<string, any>;
    }): void;
    /**
     * Log agent coordination
     */
    logAgentActivity(agent: {
        name: string;
        action: 'activated' | 'failed' | 'completed';
        success: boolean;
        duration_ms?: number;
        details?: Record<string, any>;
    }): void;
    /**
     * Log agent activation (alias for logAgentActivity for backward compatibility)
     */
    logAgentActivation(activation: {
        agent: string;
        success: boolean;
        duration_ms: number;
        triggered_by: string;
        context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
    }): void;
    /**
     * Log version management activity (FRAMEWORK_CONTEXT only)
     */
    logVersionActivity(version: {
        type: 'bump_recommended' | 'release_created' | 'changelog_updated' | 'roadmap_updated';
        from_version?: string;
        to_version?: string;
        details?: Record<string, any>;
    }): void;
    /**
     * Log version management (alias for logVersionActivity for backward compatibility)
     */
    logVersionManagement(version: {
        action: string;
        old_version: string;
        new_version: string;
        bump_type?: string;
        features_count?: number;
        fixes_count?: number;
        breaking_changes_count?: number;
        success: boolean;
    }): void;
    /**
     * Add activity to timeline
     */
    private addActivity;
    /**
     * Write activity to timeline file
     */
    private writeActivityTimeline;
    /**
     * Get recent activities
     */
    getRecentActivities(limit?: number): ActivityEntry[];
    /**
     * Get activity timeline (from file for full history)
     */
    getActivityTimeline(limit?: number): ActivityEntry[];
    /**
     * Rotate old logs (keep last 30 days)
     */
    private rotateOldLogs;
    /**
     * Get all log files
     */
    private getAllLogFiles;
    /**
     * Get log file paths
     */
    getLogPaths(): {
        main: string;
        health: string;
        remediation: string;
        rag: string;
        agents: string;
        version?: string;
        timeline: string;
    };
    /**
     * Close log streams (call on shutdown)
     */
    close(): void;
}
