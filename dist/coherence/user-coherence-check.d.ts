/**
 * User Coherence Check Service
 *
 * Validates framework installation health for USERS of VERSATIL framework
 * (not framework developers - that's handled by Guardian's version-manager.ts)
 *
 * PROJECT_CONTEXT ONLY - This service only operates in user projects
 *
 * Checks:
 * - Version alignment (installed vs latest npm)
 * - Installation integrity (files present, structure valid)
 * - Agent configuration (18 agents operational)
 * - MCP server connections (29 tools accessible)
 * - RAG connectivity (GraphRAG + Vector store)
 * - Dependencies health (security, compatibility)
 * - Context detection (PROJECT_CONTEXT vs FRAMEWORK_CONTEXT)
 *
 * @version 7.9.0
 */
export interface CoherenceCheckResult {
    overall_health: number;
    status: 'excellent' | 'good' | 'degraded' | 'critical';
    checks: {
        version: VersionCheck;
        installation: InstallationCheck;
        agents: AgentCheck;
        mcp: MCPCheck;
        rag: RAGCheck;
        dependencies: DependencyCheck;
        context: ContextCheck;
    };
    issues: CoherenceIssue[];
    recommendations: string[];
    auto_fixes_available: AutoFix[];
    timestamp: string;
}
export interface VersionCheck {
    status: 'up_to_date' | 'patch_available' | 'minor_available' | 'major_available' | 'unknown';
    installed_version: string;
    latest_version: string;
    behind_by: {
        major: number;
        minor: number;
        patch: number;
    };
    breaking_changes_since: string[];
    health_score: number;
}
export interface InstallationCheck {
    status: 'valid' | 'partial' | 'corrupted';
    files_present: number;
    files_expected: number;
    critical_missing: string[];
    directory_structure: 'valid' | 'invalid';
    compilation_status: 'current' | 'outdated' | 'missing';
    health_score: number;
}
export interface AgentCheck {
    status: 'operational' | 'degraded' | 'failed';
    operational_agents: number;
    total_agents: number;
    invalid_definitions: string[];
    auto_activation_configured: boolean;
    health_score: number;
}
export interface MCPCheck {
    status: 'operational' | 'degraded' | 'failed';
    tools_accessible: number;
    total_tools: number;
    connection_latency_ms: number;
    server_health: 'all_operational' | 'some_down' | 'all_down';
    health_score: number;
}
export interface RAGCheck {
    status: 'operational' | 'degraded' | 'failed';
    graphrag_status: 'connected' | 'timeout' | 'failed';
    vector_status: 'connected' | 'timeout' | 'failed';
    router_status: 'operational' | 'failed';
    pattern_search_status: 'operational' | 'failed';
    health_score: number;
}
export interface DependencyCheck {
    status: 'healthy' | 'warnings' | 'critical';
    critical_vulnerabilities: number;
    high_vulnerabilities: number;
    peer_dependencies_installed: boolean;
    version_compatibility: 'valid' | 'invalid';
    lock_file_integrity: 'valid' | 'invalid';
    health_score: number;
}
export interface ContextCheck {
    status: 'valid' | 'invalid';
    current_context: 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT' | 'unknown';
    isolation_enforced: boolean;
    configuration_loaded: boolean;
    context_mixing_detected: boolean;
    health_score: number;
}
export interface CoherenceIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: 'version' | 'installation' | 'agents' | 'mcp' | 'rag' | 'dependencies' | 'context';
    description: string;
    impact: string;
    root_cause?: string;
    recommendation: string;
    auto_fix_available: boolean;
    fix_action?: string;
}
export interface AutoFix {
    issue: string;
    action: string;
    confidence: number;
    estimated_duration_seconds: number;
    command?: string;
}
/**
 * User Coherence Check Service
 */
export declare class UserCoherenceCheckService {
    private static instance;
    private projectRoot;
    private constructor();
    static getInstance(projectRoot: string): UserCoherenceCheckService;
    /**
     * Perform full coherence check
     */
    performCoherenceCheck(quick?: boolean): Promise<CoherenceCheckResult>;
    /**
     * Check version alignment (installed vs latest npm)
     */
    private checkVersion;
    /**
     * Check installation integrity
     */
    private checkInstallation;
    /**
     * Check agent configuration
     */
    private checkAgents;
    /**
     * Check MCP server connections
     */
    private checkMCP;
    /**
     * Check RAG connectivity
     */
    private checkRAG;
    /**
     * Check dependencies health
     */
    private checkDependencies;
    /**
     * Check context detection
     */
    private checkContext;
    /**
     * Quick checks (for --quick flag)
     */
    private createQuickMCPCheck;
    private createQuickRAGCheck;
    private createQuickDependencyCheck;
    /**
     * Calculate overall health (weighted average)
     */
    private calculateOverallHealth;
    /**
     * Get health status from score
     */
    private getHealthStatus;
    /**
     * Detect issues from check results
     */
    private detectIssues;
    /**
     * Generate recommendations based on issues
     */
    private generateRecommendations;
    /**
     * Identify auto-fixes available
     */
    private identifyAutoFixes;
    /**
     * Get auto-fix confidence for issue
     */
    private getAutoFixConfidence;
    /**
     * Get estimated duration for fix
     */
    private getEstimatedDuration;
    /**
     * Helper: Count files recursively
     */
    private countFiles;
    /**
     * Apply auto-fixes (for --fix flag)
     */
    applyAutoFixes(autoFixes: AutoFix[]): Promise<{
        success: boolean;
        results: string[];
    }>;
}
/**
 * Get User Coherence Check Service instance
 */
export declare function getUserCoherenceCheckService(projectRoot: string): UserCoherenceCheckService;
