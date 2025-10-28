/**
 * VERSATIL SDLC Framework - Project Guardian
 * Helps users leverage VERSATIL framework in their projects
 *
 * PROJECT_CONTEXT Operations:
 * - Monitor user's project health (their build/tests)
 * - Ensure framework agents activate correctly
 * - Check framework configuration in user project
 * - Monitor user's RAG queries
 * - Suggest framework updates if outdated
 * - Validate user's OPERA workflow
 *
 * This guardian ONLY operates when inside a user's project (has `.versatil-project.json`).
 */
export interface ProjectHealthCheck {
    overall_health: number;
    status: 'healthy' | 'degraded' | 'critical';
    checks: {
        framework_config: HealthCheckResult;
        agent_activation: HealthCheckResult;
        project_build: HealthCheckResult;
        project_tests: HealthCheckResult;
        framework_version: HealthCheckResult;
        rag_usage: HealthCheckResult;
    };
    issues: ProjectIssue[];
    recommendations: string[];
    timestamp: string;
}
export interface HealthCheckResult {
    healthy: boolean;
    score: number;
    latency_ms: number;
    details: Record<string, any>;
    issues: string[];
}
export interface ProjectIssue {
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggested_fix: string;
    confidence: number;
    auto_fixable: boolean;
}
export interface FrameworkConfiguration {
    valid: boolean;
    version: string;
    outdated: boolean;
    latest_version: string;
    agents_configured: string[];
    missing_agents: string[];
    hooks_enabled: boolean;
    skills_available: string[];
}
/**
 * Project Guardian - Helps users leverage VERSATIL
 */
export declare class ProjectGuardian {
    private logger;
    private agentMonitor;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Perform comprehensive project health check
     */
    performHealthCheck(): Promise<ProjectHealthCheck>;
    /**
     * Check framework configuration
     */
    private checkFrameworkConfig;
    /**
     * Check agent activation status
     */
    private checkAgentActivation;
    /**
     * Check project build status
     */
    private checkProjectBuild;
    /**
     * Check project tests
     */
    private checkProjectTests;
    /**
     * Check framework version
     */
    private checkFrameworkVersion;
    /**
     * Check RAG usage
     */
    private checkRAGUsage;
    /**
     * Helper methods
     */
    private getSuggestedFix;
    private getFixConfidence;
    private isAutoFixable;
    private generateRecommendations;
    private compareVersions;
}
