/**
 * VERSATIL SDLC Framework - Agent Monitor
 * Monitors agent activations, failures, and health
 *
 * Integrates with:
 * - AgentRegistry (src/agents/core/agent-registry.ts)
 * - post-file-edit.ts hook (agent activation failures)
 * - Guardian logger
 *
 * Auto-Remediation Scenarios:
 * 1. Agent not found → Validate agent definition
 * 2. Agent activation failure → Rebuild framework
 * 3. Agent hook failure → Reload hooks
 * 4. Agent timeout → Increase timeout limits
 * 5. Agent missing dependencies → Install dependencies
 */
export interface AgentActivation {
    agent: string;
    timestamp: string;
    success: boolean;
    duration_ms: number;
    error?: string;
    triggered_by?: string;
    context?: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
}
export interface AgentHealth {
    agent: string;
    healthy: boolean;
    activation_count: number;
    failure_count: number;
    success_rate: number;
    avg_duration_ms: number;
    last_activation?: string;
    last_failure?: string;
    issues: string[];
}
export interface AgentMonitorReport {
    overall_health: number;
    status: 'healthy' | 'degraded' | 'critical';
    total_agents: number;
    healthy_agents: number;
    degraded_agents: string[];
    failed_agents: string[];
    activations_24h: number;
    failures_24h: number;
    agents: Record<string, AgentHealth>;
    issues: AgentIssue[];
    recommendations: string[];
    timestamp: string;
}
export interface AgentIssue {
    agent: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggested_fix: string;
    confidence: number;
    auto_fixable: boolean;
}
export interface AgentRemediationResult {
    success: boolean;
    action_taken: string;
    confidence: number;
    duration_ms: number;
    learned: string;
}
/**
 * Agent Monitor - Tracks agent health and performance
 */
export declare class AgentMonitor {
    private static instance;
    private logger;
    private activationHistory;
    private historyFile;
    private maxHistorySize;
    private readonly coreAgents;
    private readonly subAgents;
    private constructor();
    static getInstance(): AgentMonitor;
    /**
     * Track agent activation
     */
    trackAgentActivation(agent: string, success: boolean, duration_ms: number, error?: string, triggered_by?: string, context?: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT'): Promise<void>;
    /**
     * Perform health check on all agents
     */
    performHealthCheck(): Promise<AgentMonitorReport>;
    /**
     * Calculate health metrics for a specific agent
     */
    private calculateAgentHealth;
    /**
     * Determine if we should auto-remediate
     */
    private shouldAutoRemediate;
    /**
     * Remediate agent failure
     */
    remediateAgentFailure(agent: string, error: string): Promise<AgentRemediationResult>;
    /**
     * Check if agent definition is valid
     */
    validateAgentDefinition(agent: string): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Get agent activation statistics
     */
    getAgentStats(agent: string): {
        total_activations: number;
        success_count: number;
        failure_count: number;
        success_rate: number;
        avg_duration_ms: number;
        last_24h_activations: number;
    };
    /**
     * Load activation history from file
     */
    private loadActivationHistory;
    /**
     * Persist activation to file (JSONL format)
     */
    private persistActivation;
    /**
     * Clear activation history (maintenance)
     */
    clearHistory(): void;
    /**
     * Get recent failures for specific agent
     */
    getRecentFailures(agent: string, limit?: number): AgentActivation[];
}
/**
 * Singleton instance
 */
export declare const agentMonitor: AgentMonitor;
