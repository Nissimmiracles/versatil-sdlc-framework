/**
 * Iris-Guardian - Meta-Framework Intelligence & System Guardian
 *
 * Dual-Context Operation:
 * - FRAMEWORK_CONTEXT: Framework development (version management, roadmap, releases)
 * - PROJECT_CONTEXT: User projects (framework assistance, configuration, agent monitoring)
 *
 * Core Capabilities:
 * - RAG/GraphRAG health monitoring and ownership
 * - Auto-remediation with confidence-based decision making
 * - Agent coordination and intelligence
 * - Context-aware proactive monitoring
 * - Version management and evolution tracking (framework context only)
 *
 * @version 7.8.0
 */
/**
 * Execution context for Guardian
 */
export type GuardianContext = 'FRAMEWORK_CONTEXT' | 'PROJECT_CONTEXT';
/**
 * Health status levels
 */
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';
/**
 * Guardian health check result
 */
export interface HealthCheckResult {
    overall_health: number;
    status: HealthStatus;
    components: {
        framework: ComponentHealth;
        agents: ComponentHealth;
        rag: ComponentHealth;
        build: ComponentHealth;
        tests: ComponentHealth;
    };
    issues: Issue[];
    timestamp: string;
}
/**
 * Component health
 */
export interface ComponentHealth {
    score: number;
    status: HealthStatus;
    message: string;
    metrics?: Record<string, any>;
}
/**
 * Issue detected by Guardian
 */
export interface Issue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    description: string;
    root_cause?: string;
    confidence?: number;
    auto_fix_available: boolean;
    recommendation: string;
}
/**
 * Auto-remediation result
 */
export interface RemediationResult {
    success: boolean;
    action_taken: string;
    confidence: number;
    before_state: string;
    after_state: string;
    duration_ms: number;
    learned: boolean;
}
/**
 * Context detection result
 */
export interface ContextDetection {
    context: GuardianContext;
    confidence: number;
    evidence: string[];
    paths: {
        current_working_directory: string;
        framework_home?: string;
        project_root?: string;
    };
}
/**
 * Guardian core orchestrator
 */
export declare class IrisGuardian {
    private logger;
    private context;
    private contextDetection;
    private monitoringInterval?;
    private healthHistory;
    constructor();
    /**
     * Detect execution context (FRAMEWORK vs PROJECT)
     */
    private detectContext;
    /**
     * Get current context
     */
    getContext(): GuardianContext;
    /**
     * Get context detection details
     */
    getContextDetection(): ContextDetection;
    /**
     * Resolve user/team/project IDs from git config and project metadata
     * Enables 100% context alignment with user expectations
     */
    private resolveContextIds;
    /**
     * Extract user ID from git config
     */
    private getUserIdFromGit;
    /**
     * Load project metadata containing team/project IDs
     */
    private loadProjectMetadata;
    /**
     * Start background monitoring
     */
    startMonitoring(intervalMinutes?: number): Promise<void>;
    /**
     * Stop background monitoring
     */
    stopMonitoring(): void;
    /**
     * Perform comprehensive health check
     */
    performHealthCheck(): Promise<HealthCheckResult>;
    /**
     * Load context-specific guardian implementation
     */
    private loadContextGuardian;
    /**
     * Check alert thresholds
     */
    private checkAlertThresholds;
    /**
     * Attempt auto-remediation for detected issues
     */
    private attemptAutoRemediation;
    /**
     * Auto-remediate specific issue
     */
    private autoRemediateIssue;
    /**
     * Get health history
     */
    getHealthHistory(limit?: number): HealthCheckResult[];
    /**
     * Get current health status
     */
    getCurrentHealth(): Promise<HealthCheckResult>;
}
/**
 * Get Guardian instance (singleton)
 */
export declare function getGuardian(): IrisGuardian;
/**
 * Initialize and start Guardian monitoring
 */
export declare function initializeGuardian(intervalMinutes?: number): Promise<IrisGuardian>;
