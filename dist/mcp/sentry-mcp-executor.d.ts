/**
 * Sentry MCP Executor
 * ✅ PRODUCTION IMPLEMENTATION - Sentry Error Monitoring Integration
 *
 * Primary Agent: Maria-QA (Quality Assurance & bug tracking)
 * Secondary Agents: Marcus-Backend (production monitoring), Sarah-PM (issue tracking)
 *
 * Features:
 * - Real-time error tracking and monitoring
 * - Issue retrieval and analysis
 * - Stack trace analysis
 * - AI-powered root cause analysis (Seer integration)
 * - Performance monitoring
 * - 16+ tool calls and prompts
 *
 * Official Package:
 * - @sentry/mcp or sentry-mcp-stdio (official Sentry MCP)
 */
export interface MCPExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: {
        operation?: string;
        timestamp?: string;
        issueId?: string;
        projectId?: string;
        [key: string]: any;
    };
}
export declare class SentryMCPExecutor {
    private sentryDsn;
    private sentryAuthToken;
    private sentryOrg;
    private sentryApiUrl;
    private sentryClient;
    constructor();
    /**
     * Execute Sentry MCP action
     * Routes to appropriate Sentry operation based on action type
     */
    executeSentryMCP(action: string, params?: any): Promise<MCPExecutionResult>;
    /**
     * Fetch issue details by ID or URL
     */
    private fetchIssue;
    /**
     * Analyze error with stack trace analysis
     */
    private analyzeError;
    /**
     * List Sentry projects
     */
    private listProjects;
    /**
     * Get issue trends and patterns
     */
    private getIssueTrends;
    /**
     * Trigger Seer AI-powered root cause analysis
     */
    private triggerSeerAnalysis;
    /**
     * Update issue status
     */
    private updateIssueStatus;
    /**
     * Get recent issues
     */
    private getRecentIssues;
    /**
     * Get performance metrics
     */
    private getPerformanceMetrics;
    /**
     * Extract issue ID from Sentry URL
     */
    private extractIssueIdFromUrl;
    /**
     * Get stack trace from Sentry issue (real implementation)
     */
    private getStackTraceFromIssue;
    /**
     * Parse generic JavaScript stack trace string (fallback)
     */
    private parseGenericStackTrace;
    /**
     * Cleanup resources
     */
    close(): Promise<void>;
}
export declare const sentryMCPExecutor: SentryMCPExecutor;
