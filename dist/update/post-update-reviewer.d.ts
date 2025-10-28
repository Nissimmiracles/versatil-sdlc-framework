/**
 * VERSATIL SDLC Framework - Post-Update Reviewer
 * Coordinates multi-agent review after framework updates
 */
export interface HealthCheckResult {
    overallHealth: number;
    agents: AgentHealthStatus[];
    build: BuildStatus;
    tests: TestStatus;
    integrity: IntegrityStatus;
}
export interface AgentHealthStatus {
    name: string;
    operational: boolean;
    activations: number;
    successRate: number;
}
export interface BuildStatus {
    success: boolean;
    errors: number;
    warnings: number;
    duration: number;
}
export interface TestStatus {
    total: number;
    passing: number;
    failing: number;
    coverage: number;
}
export interface IntegrityStatus {
    filesPresent: number;
    filesMissing: string[];
    score: number;
}
export interface AgentReviewResult {
    agent: string;
    status: 'success' | 'warning' | 'error';
    findings: Finding[];
    duration: number;
}
export interface Finding {
    type: 'success' | 'warning' | 'error';
    message: string;
    details?: string;
    recommendation?: string;
}
export interface ProjectAssessment {
    readinessScore: number;
    git: GitStatus;
    dependencies: DependencyStatus;
    environment: EnvironmentStatus;
    buildTests: BuildTestStatus;
}
export interface GitStatus {
    clean: boolean;
    branch: string;
    upToDate: boolean;
    conflicts: number;
}
export interface DependencyStatus {
    installed: boolean;
    vulnerabilities: {
        critical: number;
        high: number;
        moderate: number;
        low: number;
    };
    outdated: number;
}
export interface EnvironmentStatus {
    configured: boolean;
    missingVars: string[];
}
export interface BuildTestStatus {
    buildPassing: boolean;
    testsPassing: number;
    coverage: number;
}
export interface TodoSummary {
    total: number;
    pending: number;
    resolved: number;
    byPriority: {
        p1: number;
        p2: number;
        p3: number;
        p4: number;
    };
    stale: TodoItem[];
    recent: TodoItem[];
}
export interface TodoItem {
    filename: string;
    number: string;
    status: 'pending' | 'resolved';
    priority: 'p1' | 'p2' | 'p3' | 'p4';
    description: string;
    age: number;
}
export interface PostUpdateReviewReport {
    versionUpdate: {
        from: string;
        to: string;
        filesUpdated: number;
        backupLocation: string;
    };
    healthCheck: HealthCheckResult;
    agentReviews: AgentReviewResult[];
    projectAssessment: ProjectAssessment;
    todoSummary: TodoSummary;
    recommendations: string[];
    overallStatus: 'success' | 'warning' | 'error';
    duration: number;
}
export declare class PostUpdateReviewer {
    private versatilHome;
    constructor();
    /**
     * Perform comprehensive post-update review
     */
    performReview(fromVersion: string, toVersion: string, options?: {
        skipReview?: boolean;
        fullReview?: boolean;
        agents?: string[];
    }): Promise<PostUpdateReviewReport>;
    /**
     * Run framework health check (via /monitor)
     */
    private runHealthCheck;
    /**
     * Get agent health status
     */
    private getAgentHealthStatus;
    /**
     * Get build status
     */
    private getBuildStatus;
    /**
     * Get test status
     */
    private getTestStatus;
    /**
     * Get framework integrity status
     */
    private getIntegrityStatus;
    /**
     * Run agent-based reviews (parallel execution)
     */
    private runAgentReviews;
    /**
     * Run single agent review
     */
    private runSingleAgentReview;
    /**
     * Maria-QA review implementation
     */
    private mariaQAReview;
    /**
     * Marcus-Backend review implementation
     */
    private marcusBackendReview;
    /**
     * Victor-Verifier review implementation
     */
    private victorVerifierReview;
    /**
     * Run project assessment
     */
    private runProjectAssessment;
    private assessGit;
    private assessDependencies;
    private assessEnvironment;
    private assessBuildTests;
    /**
     * Analyze todos
     */
    private analyzeTodos;
    /**
     * Generate recommendations based on review results
     */
    private generateRecommendations;
    /**
     * Determine overall status
     */
    private determineOverallStatus;
    /**
     * Get health emoji
     */
    private getHealthEmoji;
    /**
     * Get default health check (fallback)
     */
    private getDefaultHealthCheck;
    /**
     * Create minimal report (when review is skipped)
     */
    private createMinimalReport;
    /**
     * Format report for console output
     */
    formatReport(report: PostUpdateReviewReport): string;
    private getStatusEmoji;
    private getFindingEmoji;
}
/**
 * Default post-update reviewer instance
 */
export declare const defaultPostUpdateReviewer: PostUpdateReviewer;
