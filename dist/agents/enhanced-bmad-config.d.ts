/**
 * VERSATIL SDLC Framework - Enhanced OPERA Agent Configuration
 * Implements integration with the three new rules:
 * 1. Parallel task execution with collision detection
 * 2. Automated stress test generation
 * 3. Daily audit and health check system
 *
 * Features:
 * - Enhanced agent capabilities
 * - Rule-based automation triggers
 * - Cross-agent collaboration protocols
 * - Performance optimization
 * - Quality assurance integration
 */
import { EventEmitter } from 'events';
import { Priority } from '../orchestration/parallel-task-manager.js';
import { StressTestType, TargetType } from '../testing/automated-stress-test-generator.js';
import { AuditType, CheckCategory } from '../audit/daily-audit-system.js';
export interface EnhancedAgentConfig {
    id: string;
    name: string;
    role: string;
    description: string;
    version: string;
    enabled: boolean;
    auto_activate: boolean;
    patterns: string[];
    keywords: string[];
    tools: string[];
    capabilities: AgentCapabilities;
    rules: AgentRules;
    integration: AgentIntegration;
    performance: PerformanceConfig;
    collaboration: CollaborationConfig;
    configured_at: string;
}
export interface AgentCapabilities {
    parallel_execution: boolean;
    stress_testing: boolean;
    health_monitoring: boolean;
    quality_gates: boolean;
    security_scanning: boolean;
    performance_optimization: boolean;
    automated_testing: boolean;
    continuous_integration: boolean;
    documentation_generation: boolean;
    code_analysis: boolean;
}
export interface AgentRules {
    rule1_parallel_tasks: Rule1Config;
    rule2_stress_testing: Rule2Config;
    rule3_daily_audit: Rule3Config;
    custom_rules: CustomRule[];
}
export interface Rule1Config {
    enabled: boolean;
    max_parallel_tasks: number;
    collision_detection: boolean;
    resource_management: boolean;
    priority_handling: boolean;
    auto_scaling: boolean;
    triggers: Rule1Trigger[];
}
export interface Rule1Trigger {
    pattern: string;
    action: string;
    condition: string;
    parallelism_level: number;
}
export interface Rule2Config {
    enabled: boolean;
    auto_generate_tests: boolean;
    test_types: StressTestType[];
    coverage_threshold: number;
    performance_baseline: boolean;
    chaos_engineering: boolean;
    triggers: Rule2Trigger[];
}
export interface Rule2Trigger {
    event: string;
    test_type: StressTestType;
    target_type: TargetType;
    condition: string;
    priority: Priority;
}
export interface Rule3Config {
    enabled: boolean;
    audit_frequency: string;
    health_check_interval: number;
    alert_thresholds: AlertThresholds;
    compliance_checks: boolean;
    performance_monitoring: boolean;
    security_scanning: boolean;
    triggers: Rule3Trigger[];
}
export interface Rule3Trigger {
    schedule: string;
    audit_type: AuditType;
    check_categories: CheckCategory[];
    notification_level: string;
}
export interface AlertThresholds {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    response_time: number;
    error_rate: number;
    test_coverage: number;
}
export interface CustomRule {
    id: string;
    name: string;
    description: string;
    condition: string;
    action: string;
    priority: Priority;
    enabled: boolean;
}
export interface AgentIntegration {
    task_manager: boolean;
    stress_tester: boolean;
    audit_system: boolean;
    environment_manager: boolean;
    monitoring_dashboard: boolean;
    notification_system: boolean;
    ci_cd_pipeline: boolean;
    version_control: boolean;
}
export interface PerformanceConfig {
    max_concurrent_tasks: number;
    memory_limit: number;
    cpu_limit: number;
    timeout_duration: number;
    retry_attempts: number;
    cache_enabled: boolean;
    optimization_level: OptimizationLevel;
}
export declare enum OptimizationLevel {
    BASIC = "basic",
    STANDARD = "standard",
    AGGRESSIVE = "aggressive",
    EXPERIMENTAL = "experimental"
}
export interface CollaborationConfig {
    handoff_protocols: HandoffProtocol[];
    context_preservation: boolean;
    knowledge_sharing: boolean;
    conflict_resolution: ConflictResolution;
    communication_channels: string[];
}
export interface HandoffProtocol {
    from_agent: string;
    to_agent: string;
    trigger_condition: string;
    context_data: string[];
    validation_required: boolean;
}
export interface ConflictResolution {
    strategy: ConflictStrategy;
    escalation_path: string[];
    timeout_duration: number;
    fallback_agent: string;
}
export declare enum ConflictStrategy {
    PRIORITY_BASED = "priority_based",
    ROUND_ROBIN = "round_robin",
    LOAD_BALANCED = "load_balanced",
    EXPERTISE_BASED = "expertise_based"
}
export declare class EnhancedOPERAConfigManager extends EventEmitter {
    private agentConfigs;
    private taskManager;
    private stressTestGenerator;
    private auditSystem;
    private activeAgents;
    constructor();
    /**
     * Initialize enhanced OPERA agent configurations
     */
    private initializeEnhancedConfigs;
    /**
     * Setup integration between rules and agent systems
     */
    private setupRuleIntegration;
    /**
     * Handle Rule 1 triggers (Parallel Task Execution)
     */
    private handleRule1Trigger;
    /**
     * Handle Rule 2 triggers (Stress Testing)
     */
    private handleRule2Trigger;
    /**
     * Handle Rule 3 triggers (Daily Audit)
     */
    private handleRule3Trigger;
    /**
     * Execute Rule 1 action (Parallel Tasks)
     */
    private executeRule1Action;
    /**
     * Execute Rule 2 action (Stress Testing)
     */
    private executeRule2Action;
    /**
     * Process audit results for Rule 3
     */
    private processAuditResults;
    /**
     * Check for threshold violations in audit results
     */
    private checkThresholdViolations;
    /**
     * Execute corrective actions for violations
     */
    private executeCorrectiveActions;
    private executeParallelTests;
    private executeParallelComponentBuild;
    private executeParallelControllerTests;
    private executeParallelDocumentation;
    private optimizeCpuUsage;
    private optimizeMemoryUsage;
    private optimizeResponseTime;
    private matchesTriggerPattern;
    private matchesStressTestTrigger;
    /**
     * Start configuration monitoring
     */
    private startConfigMonitoring;
    /**
     * Monitor agent performance and adjust configurations
     */
    private monitorAgentPerformance;
    /**
     * Adjust agent configuration based on performance
     */
    private adjustAgentConfiguration;
    /**
     * Get current performance metrics for an agent
     */
    private getCurrentMetrics;
    getAgentConfig(agentId: string): EnhancedAgentConfig | undefined;
    getAllConfigs(): Map<string, EnhancedAgentConfig>;
    updateAgentConfig(agentId: string, updates: Partial<EnhancedAgentConfig>): void;
    enableAgent(agentId: string): void;
    disableAgent(agentId: string): void;
    getActiveAgents(): string[];
    getAgentCapabilities(agentId: string): AgentCapabilities | undefined;
    getAgentRules(agentId: string): AgentRules | undefined;
    enableRule(agentId: string, ruleType: string): void;
    disableRule(agentId: string, ruleType: string): void;
}
export default EnhancedOPERAConfigManager;
