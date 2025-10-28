/**
 * VERSATIL SDLC Framework - Framework Guardian
 * Manages framework development, releases, and evolution
 *
 * FRAMEWORK_CONTEXT Operations:
 * - Monitor framework codebase (src/, tests/, .claude/)
 * - Manage framework version releases
 * - Track framework evolution and update roadmap
 * - Fix framework TypeScript errors, test failures
 * - Restart framework dev services (Neo4j, Redis)
 * - Monitor framework dependencies
 *
 * This guardian ONLY operates when inside the VERSATIL framework repository.
 */
export interface FrameworkHealthCheck {
    overall_health: number;
    status: 'healthy' | 'degraded' | 'critical';
    checks: {
        build: HealthCheckResult;
        tests: HealthCheckResult;
        typescript: HealthCheckResult;
        dependencies: HealthCheckResult;
        rag_system: HealthCheckResult;
        agents: HealthCheckResult;
        hooks: HealthCheckResult;
        documentation: HealthCheckResult;
    };
    issues: FrameworkIssue[];
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
export interface FrameworkIssue {
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggested_fix: string;
    confidence: number;
    auto_fixable: boolean;
}
export interface FrameworkEvolution {
    current_version: string;
    next_version: string;
    planned_features: string[];
    completed_features: string[];
    roadmap_status: {
        total_milestones: number;
        completed_milestones: number;
        in_progress_milestones: number;
        progress_percentage: number;
    };
    breaking_changes: string[];
    deprecations: string[];
}
/**
 * Framework Guardian - Manages framework development
 */
export declare class FrameworkGuardian {
    private logger;
    private ragMonitor;
    private agentMonitor;
    private frameworkRoot;
    constructor(frameworkRoot: string);
    /**
     * Perform comprehensive framework health check
     */
    performHealthCheck(): Promise<FrameworkHealthCheck>;
    /**
     * Check framework build status
     */
    private checkBuild;
    /**
     * Check framework tests
     */
    private checkTests;
    /**
     * Check TypeScript compilation
     */
    private checkTypeScript;
    /**
     * Check framework dependencies
     */
    private checkDependencies;
    /**
     * Check RAG system health
     */
    private checkRAGSystem;
    /**
     * Check agents health
     */
    private checkAgents;
    /**
     * Check hooks
     */
    private checkHooks;
    /**
     * Check documentation
     */
    private checkDocumentation;
    /**
     * Track framework evolution
     */
    trackEvolution(): Promise<FrameworkEvolution>;
    /**
     * Helper methods
     */
    private getDistSize;
    private getSuggestedFix;
    private getFixConfidence;
    private isAutoFixable;
    private generateRecommendations;
    private parseRoadmapFeatures;
    private calculateRoadmapStatus;
    private parseBreakingChanges;
    private parseDeprecations;
}
