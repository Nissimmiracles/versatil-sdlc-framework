/**
 * VERSATIL Framework Efficiency Monitor
 *
 * Comprehensive monitoring system that ensures the framework itself is working
 * efficiently, all agents are performing, and the system is ready for new versions.
 *
 * @module FrameworkEfficiencyMonitor
 * @version 2.0.0
 */
import { EventEmitter } from 'events';
import { IntrospectiveMetaAgent } from '../agents/meta/introspective-meta-agent.js';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
export interface FrameworkMetrics {
    timestamp: number;
    overall_health: number;
    agent_performance: AgentPerformanceMetrics;
    proactive_system: ProactiveSystemMetrics;
    rules_efficiency: RulesEfficiencyMetrics;
    stress_test_results: StressTestResults;
    version_compatibility: VersionCompatibility;
}
export interface AgentPerformanceMetrics {
    maria_qa: AgentStats;
    james_frontend: AgentStats;
    marcus_backend: AgentStats;
    sarah_pm: AgentStats;
    alex_ba: AgentStats;
    dr_ai_ml: AgentStats;
}
export interface AgentStats {
    activation_count: number;
    success_rate: number;
    avg_response_time_ms: number;
    error_count: number;
    last_active: number;
    proactive_triggers: number;
    manual_triggers: number;
    efficiency_score: number;
}
export interface ProactiveSystemMetrics {
    enabled: boolean;
    auto_activations: number;
    false_positives: number;
    false_negatives: number;
    accuracy: number;
    avg_activation_time_ms: number;
    user_satisfaction_score: number;
    slash_command_fallbacks: number;
}
export interface RulesEfficiencyMetrics {
    rule1_parallel_execution: RuleStats;
    rule2_stress_testing: RuleStats;
    rule3_daily_audit: RuleStats;
    rule4_onboarding: RuleStats;
    rule5_releases: RuleStats;
}
export interface RuleStats {
    enabled: boolean;
    execution_count: number;
    success_rate: number;
    impact_score: number;
    overhead_ms: number;
    value_delivered: number;
}
export interface StressTestResults {
    last_run: number;
    test_count: number;
    passed: number;
    failed: number;
    performance_regression: boolean;
    bottlenecks: string[];
    recommendations: string[];
}
export interface VersionCompatibility {
    current_version: string;
    migration_ready: boolean;
    breaking_changes: string[];
    compatibility_score: number;
    upgrade_blockers: string[];
}
export interface FrameworkIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    description: string;
    impact: string;
    auto_fix_available: boolean;
    recommendation: string;
}
export declare class FrameworkEfficiencyMonitor extends EventEmitter {
    private metaAgent?;
    private orchestrator?;
    private monitoringInterval?;
    private metrics;
    private issues;
    private isMonitoring;
    constructor();
    /**
     * Initialize monitoring with framework components
     */
    initialize(metaAgent: IntrospectiveMetaAgent, orchestrator: ProactiveAgentOrchestrator): Promise<void>;
    /**
     * Start continuous monitoring
     */
    startMonitoring(interval_ms?: number): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Perform comprehensive health check
     */
    performComprehensiveHealthCheck(): Promise<FrameworkMetrics>;
    /**
     * Check all agents performance
     */
    private checkAllAgentsPerformance;
    /**
     * Get individual agent statistics
     */
    private getAgentStats;
    /**
     * Calculate agent efficiency score (0-100)
     */
    private calculateAgentEfficiency;
    /**
     * Check proactive system performance
     */
    private checkProactiveSystem;
    /**
     * Check rules efficiency
     */
    private checkRulesEfficiency;
    /**
     * Calculate rule impact score based on documented benefits
     */
    private calculateRuleImpact;
    /**
     * Calculate value delivered by rule
     */
    private calculateRuleValue;
    /**
     * Run framework stress tests
     */
    private runFrameworkStressTests;
    /**
     * Test agent activation speed
     */
    private testAgentActivationSpeed;
    /**
     * Test parallel execution (Rule 1)
     */
    private testParallelExecution;
    /**
     * Test memory efficiency
     */
    private testMemoryEfficiency;
    /**
     * Test RAG query performance
     */
    private testRAGPerformance;
    /**
     * Test proactive system accuracy
     */
    private testProactiveSystemAccuracy;
    /**
     * Check version compatibility
     */
    private checkVersionCompatibility;
    /**
     * Calculate overall framework health (0-100)
     */
    private calculateOverallHealth;
    /**
     * Detect framework issues
     */
    private detectFrameworkIssues;
    /**
     * Monitoring cycle
     */
    private performMonitoringCycle;
    /**
     * Track agent activation
     */
    private trackAgentActivation;
    /**
     * Track agent completion
     */
    private trackAgentCompletion;
    /**
     * Track agent failure
     */
    private trackAgentFailure;
    /**
     * Get current metrics
     */
    getMetrics(): FrameworkMetrics;
    /**
     * Get current issues
     */
    getIssues(): FrameworkIssue[];
    /**
     * Generate health report
     */
    generateHealthReport(): string;
    /**
     * Get health emoji
     */
    private getHealthEmoji;
    /**
     * Initialize empty metrics
     */
    private initializeMetrics;
    /**
     * Create empty agent stats
     */
    private createEmptyAgentStats;
    /**
     * Create empty rule stats
     */
    private createEmptyRuleStats;
    /**
     * Cleanup
     */
    shutdown(): void;
}
export declare function getFrameworkMonitor(): FrameworkEfficiencyMonitor;
export declare function destroyFrameworkMonitor(): void;
