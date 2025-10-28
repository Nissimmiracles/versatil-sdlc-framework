/**
 * VERSATIL SDLC Framework - Central Orchestrator
 * Integrates all three new rules into a unified system:
 * 1. Parallel task execution with collision detection
 * 2. Automated stress test generation
 * 3. Daily audit and health check system
 *
 * Features:
 * - Unified command interface
 * - Cross-system coordination
 * - Real-time monitoring and reporting
 * - Automatic scaling and optimization
 * - Enterprise-grade reliability
 */
import { EventEmitter } from 'events';
import { ParallelTaskManager, Task } from '../orchestration/parallel-task-manager.js';
import { AutomatedStressTestGenerator, TargetType } from '../testing/automated-stress-test-generator.js';
import { DailyAuditSystem } from '../audit/daily-audit-system.js';
import { EnhancedOPERAConfigManager } from '../agents/enhanced-opera-config.js';
import { EnvironmentManager } from '../environment/environment-manager.js';
export interface VersatilConfig {
    id: string;
    name: string;
    version: string;
    environment: string;
    rules: RulesConfiguration;
    performance: GlobalPerformanceConfig;
    monitoring: MonitoringConfig;
    notifications: NotificationConfig;
    security: SecurityConfig;
    enabled: boolean;
}
export interface RulesConfiguration {
    rule1_parallel_execution: {
        enabled: boolean;
        global_max_tasks: number;
        auto_scaling: boolean;
        collision_prevention: boolean;
        resource_optimization: boolean;
    };
    rule2_stress_testing: {
        enabled: boolean;
        auto_generation: boolean;
        continuous_execution: boolean;
        performance_baseline: boolean;
        regression_detection: boolean;
    };
    rule3_daily_audit: {
        enabled: boolean;
        frequency: string;
        comprehensive_checks: boolean;
        auto_remediation: boolean;
        compliance_monitoring: boolean;
    };
}
export interface GlobalPerformanceConfig {
    max_system_load: number;
    memory_threshold: number;
    cpu_threshold: number;
    auto_optimization: boolean;
    performance_targets: PerformanceTargets;
}
export interface PerformanceTargets {
    response_time: number;
    throughput: number;
    availability: number;
    error_rate: number;
    test_coverage: number;
}
export interface MonitoringConfig {
    real_time_metrics: boolean;
    dashboard_enabled: boolean;
    alerting_enabled: boolean;
    metrics_retention: number;
    custom_metrics: string[];
}
export interface NotificationConfig {
    channels: NotificationChannel[];
    severity_levels: string[];
    escalation_rules: EscalationRule[];
    templates: NotificationTemplate[];
}
export interface NotificationChannel {
    type: string;
    endpoint: string;
    enabled: boolean;
    filters: string[];
}
export interface EscalationRule {
    condition: string;
    delay: number;
    action: string;
    recipients: string[];
}
export interface NotificationTemplate {
    id: string;
    type: string;
    subject: string;
    body: string;
    variables: string[];
}
export interface SecurityConfig {
    audit_logging: boolean;
    access_control: boolean;
    encryption_enabled: boolean;
    vulnerability_scanning: boolean;
    compliance_checks: string[];
}
export interface VersatilMetrics {
    system: SystemMetrics;
    performance: PerformanceMetrics;
    quality: QualityMetrics;
    rules: RulesMetrics;
    agents: AgentMetrics;
}
export interface SystemMetrics {
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
    active_processes: number;
}
export interface PerformanceMetrics {
    response_time: number;
    throughput: number;
    error_rate: number;
    availability: number;
    concurrent_users: number;
    queue_size: number;
}
export interface QualityMetrics {
    test_coverage: number;
    code_quality: number;
    security_score: number;
    compliance_score: number;
    bug_count: number;
    technical_debt: number;
}
export interface RulesMetrics {
    rule1_tasks_executed: number;
    rule1_collision_rate: number;
    rule2_tests_generated: number;
    rule2_test_success_rate: number;
    rule3_audits_completed: number;
    rule3_issues_found: number;
}
export interface AgentMetrics {
    active_agents: number;
    agent_utilization: Record<string, number>;
    handoff_success_rate: number;
    collaboration_efficiency: number;
    context_preservation_rate: number;
}
export interface OrchestratorStatus {
    status: OperationalStatus;
    version: string;
    uptime: number;
    environment: string;
    rules_active: number;
    agents_active: number;
    current_load: number;
    health_score: number;
    last_audit: Date;
    next_audit: Date;
}
export declare enum OperationalStatus {
    HEALTHY = "healthy",
    WARNING = "warning",
    CRITICAL = "critical",
    MAINTENANCE = "maintenance",
    ERROR = "error"
}
export declare class VersatilOrchestrator extends EventEmitter {
    private config;
    private taskManager;
    private stressTestGenerator;
    private auditSystem;
    private configManager;
    private environmentManager;
    private vectorStore?;
    private metrics;
    private startTime;
    private isRunning;
    private monitoringInterval;
    private useSDKParallelization;
    constructor(config?: Partial<VersatilConfig>);
    /**
     * Start the VERSATIL orchestrator
     */
    start(): Promise<void>;
    /**
     * Stop the orchestrator gracefully
     */
    stop(): Promise<void>;
    /**
     * Execute Rule 1: Parallel task execution with collision detection
     *
     * NEW: Uses Claude SDK native parallelization when useSDKParallelization=true
     * LEGACY: Falls back to custom ParallelTaskManager for backward compatibility
     */
    executeRule1(tasks: Task[]): Promise<Map<string, any>>;
    /**
     * Get RAG context for tasks to enable zero context loss
     */
    private getRAGContext;
    /**
     * Get appropriate MCP tools for tasks based on their types
     */
    private getMCPToolsForTasks;
    /**
     * Convert SDK execution results to legacy format for backward compatibility
     */
    private convertSDKToLegacyResults;
    /**
     * Toggle between SDK and legacy parallelization
     * Useful for A/B testing and gradual migration
     */
    setSDKParallelization(enabled: boolean): void;
    /**
     * Execute Rule 2: Automated stress test generation
     */
    executeRule2(target: {
        type: TargetType;
        identifier: string;
    }, features?: string[]): Promise<any[]>;
    /**
     * Execute Rule 3: Daily audit and health check
     */
    executeRule3(): Promise<any>;
    /**
     * Execute all rules in coordinated fashion
     */
    executeAllRules(options?: {
        rule1_tasks?: Task[];
        rule2_target?: {
            type: TargetType;
            identifier: string;
        };
        rule2_features?: string[];
        force_audit?: boolean;
    }): Promise<any>;
    /**
     * Get current system metrics
     */
    getCurrentMetrics(): VersatilMetrics;
    /**
     * Get orchestrator status
     */
    getStatus(): OrchestratorStatus;
    /**
     * Configure the orchestrator
     */
    configure(updates: Partial<VersatilConfig>): Promise<void>;
    /**
     * Enable a specific rule
     */
    enableRule(ruleNumber: 1 | 2 | 3): Promise<void>;
    /**
     * Disable a specific rule
     */
    disableRule(ruleNumber: 1 | 2 | 3): Promise<void>;
    /**
     * Create default configuration
     */
    private createDefaultConfig;
    /**
     * Initialize metrics structure
     */
    private initializeMetrics;
    /**
     * Setup event handlers for all subsystems
     */
    private setupEventHandlers;
    /**
     * Setup cross-system integration
     */
    private setupCrossSystemIntegration;
    /**
     * Start individual subsystems
     */
    private startTaskManager;
    private startStressTestGenerator;
    private startAuditSystem;
    private startConfigManager;
    /**
     * Stop individual subsystems
     */
    private stopTaskManager;
    private stopStressTestGenerator;
    private stopAuditSystem;
    /**
     * Start monitoring system
     */
    private startMonitoring;
    /**
     * Update system metrics
     */
    private updateMetrics;
    /**
     * Check system health and trigger alerts if needed
     */
    private checkSystemHealth;
    /**
     * Optimize performance based on current metrics
     */
    private optimizePerformance;
    private handleTaskCompletion;
    private handleCollisionDetection;
    private handleStressTestGeneration;
    private handleStressTestExecution;
    private handleAuditCompletion;
    private handleHealthCheckFailure;
    private handleAgentStateChange;
    private handleRuleStateChange;
    private executeInitialAudit;
    private getEnabledRulesCount;
    private calculateParallelEfficiency;
    private calculateSuccessRate;
    private determineOperationalStatus;
    private calculateCurrentLoad;
    private calculateHealthScore;
    private getLastAuditTime;
    private getNextAuditTime;
    private applyConfigurationChanges;
    private handleAuditIssues;
    private createRemediationTasks;
    private getCpuUsage;
    private getMemoryUsage;
    private getAgentUtilization;
    private updateAgentMetrics;
    private scaleDownOperations;
    private scaleUpOperations;
    private optimizeMemoryUsage;
    getTaskManager(): ParallelTaskManager;
    getStressTestGenerator(): AutomatedStressTestGenerator;
    getAuditSystem(): DailyAuditSystem;
    getConfigManager(): EnhancedOPERAConfigManager;
    getEnvironmentManager(): EnvironmentManager;
    getConfig(): VersatilConfig;
    isHealthy(): boolean;
}
export default VersatilOrchestrator;
