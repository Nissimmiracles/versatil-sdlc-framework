/**
 * VERSATIL OPERA v6.1 - Flywheel Health Monitor Agent
 *
 * Monitors all 6 flywheels (agent coordination patterns) for:
 * - Momentum degradation
 * - Bottlenecks and slow execution
 * - Knowledge accumulation issues
 * - Performance anomalies
 * - Cross-flywheel inefficiencies
 * - Task-level execution metrics (NEW v6.1)
 *
 * Auto-optimizes and alerts on critical issues.
 *
 * @module FlywheelHealthMonitor
 * @version 6.1.0
 */
import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
export interface FlywheelMetrics {
    requirements: FlywheelHealth;
    design: FlywheelHealth;
    development: FlywheelHealth;
    testing: FlywheelHealth;
    deployment: FlywheelHealth;
    evolution: FlywheelHealth;
}
export interface FlywheelHealth {
    momentum: number;
    patternCount: number;
    avgExecutionTime: number;
    successRate: number;
    lastActivation: number;
    turns: number;
    taskMetrics?: {
        avgTasksPerPlan: number;
        avgSubtasksPerTask: number;
        taskCompletionRate: number;
        estimationAccuracy: number;
        parallelTasksAvg: number;
    };
}
export interface HealthIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    flywheel: string;
    type: 'low_momentum' | 'high_failure_rate' | 'slow_execution' | 'stagnant_learning';
    description: string;
    impact: string;
    recommendation: string;
    autoRecoverable: boolean;
}
export interface HealthDashboard {
    overall: number;
    flywheels: FlywheelMetrics;
    issues: HealthIssue[];
    recommendations: string[];
    timestamp: number;
}
export declare class FlywheelHealthMonitor extends EventEmitter {
    private vectorStore;
    private monitoringInterval;
    private metricsHistory;
    private readonly MONITORING_INTERVAL;
    private readonly HISTORY_RETENTION;
    private taskPlanManager?;
    private taskLevelMetrics;
    constructor(vectorStore: EnhancedVectorMemoryStore, taskPlanManager?: any);
    /**
     * Start continuous monitoring
     */
    startMonitoring(): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Run complete health check
     */
    runHealthCheck(): Promise<HealthDashboard>;
    /**
     * Collect metrics for all flywheels
     */
    private collectFlywheelMetrics;
    /**
     * Collect health metrics for a specific flywheel
     */
    private collectFlywheelHealth;
    /**
     * Calculate momentum
     * Formula: (patterns / turns) * successRate * 100
     */
    private calculateMomentum;
    /**
     * Get pattern count for flywheel
     */
    private getPatternCount;
    /**
     * Calculate average execution time from metrics
     */
    private calculateAvgExecutionTime;
    /**
     * Calculate success rate from metrics
     */
    private calculateSuccessRate;
    /**
     * Get last activation timestamp
     */
    private getLastActivation;
    /**
     * Store metrics in history for trend analysis
     */
    private storeMetricsHistory;
    /**
     * Detect health issues
     */
    private detectIssues;
    /**
     * Auto-optimize recoverable issues
     */
    private autoOptimize;
    /**
     * Enrich pattern library for flywheel
     */
    private enrichPatternLibrary;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Calculate overall framework health
     */
    private calculateOverallHealth;
    /**
     * Get current health dashboard
     */
    getCurrentHealth(): Promise<HealthDashboard>;
    /**
     * NEW v6.1: Setup task plan listeners to collect task-level metrics
     */
    private setupTaskPlanListeners;
    /**
     * NEW v6.1: Record task-level metrics from plan execution
     */
    private recordTaskLevelMetrics;
    /**
     * NEW v6.1: Count total subtasks in plan
     */
    private countSubtasks;
    /**
     * NEW v6.1: Count parallel tasks in plan
     */
    private countParallelTasks;
    /**
     * NEW v6.1: Map agent to flywheel (7 agents → 6 flywheels)
     */
    private mapAgentToFlywheel;
    /**
     * NEW v6.1: Calculate task-level metrics for flywheel
     */
    private calculateTaskMetrics;
    /**
     * Cleanup
     */
    destroy(): void;
}
