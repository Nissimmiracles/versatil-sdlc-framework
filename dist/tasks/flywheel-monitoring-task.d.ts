/**
 * VERSATIL OPERA v6.0 - Flywheel Monitoring Background Task
 *
 * Continuously monitors all 6 SDLC flywheels for health, momentum, and performance.
 * Runs as an SDK Background Task with 30-second intervals.
 *
 * Integrates with:
 * - FlywheelHealthMonitor (the actual monitoring agent)
 * - SynchronizationDashboard (existing monitoring infrastructure)
 * - VersatilOrchestratorAgent (main orchestrator)
 *
 * @module FlywheelMonitoringTask
 * @version 6.0.0
 */
import { EventEmitter } from 'events';
import { HealthDashboard, HealthIssue } from '../agents/monitoring/flywheel-health-monitor.js';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';
import type { TaskPlanManager } from '../planning/task-plan-manager.js';
export interface MonitoringTaskConfig {
    vectorStore: EnhancedVectorMemoryStore;
    monitoringInterval?: number;
    enableAutoOptimization?: boolean;
    taskPlanManager?: TaskPlanManager;
    alertThresholds?: {
        criticalIssueCount: number;
        highIssueCount: number;
        lowMomentumThreshold: number;
    };
    integrations?: {
        syncDashboard: boolean;
        userNotifications: boolean;
        ragLogging: boolean;
        taskTracking: boolean;
    };
}
export interface MonitoringTaskStatus {
    running: boolean;
    lastCheck: number;
    totalChecks: number;
    issuesDetected: number;
    autoOptimizationsRun: number;
    currentDashboard: HealthDashboard | null;
    uptimeSeconds: number;
}
export interface MonitoringAlert {
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    issues?: HealthIssue[];
    actionTaken?: string;
}
export declare class FlywheelMonitoringTask extends EventEmitter {
    private monitor;
    private taskInterval;
    private config;
    private status;
    private startTime;
    private alertHistory;
    private taskPlanManager?;
    private trackedPlans;
    constructor(config: MonitoringTaskConfig);
    /**
     * Setup event listeners for the monitor
     */
    private setupMonitorListeners;
    /**
     * Start the background monitoring task
     */
    start(): Promise<void>;
    /**
     * Stop the background monitoring task
     */
    stop(): Promise<void>;
    /**
     * Run a single monitoring cycle
     */
    private runMonitoringCycle;
    /**
     * Analyze dashboard and trigger alerts/actions
     */
    private analyzeDashboard;
    /**
     * Send alert to user
     */
    private sendAlert;
    /**
     * Update SynchronizationDashboard (existing monitoring infrastructure)
     */
    private updateSyncDashboard;
    /**
     * Log monitoring data to RAG for pattern learning
     */
    private logToRAG;
    /**
     * Get current task status
     */
    getStatus(): MonitoringTaskStatus;
    /**
     * Get recent alerts
     */
    getRecentAlerts(limit?: number): MonitoringAlert[];
    /**
     * Get current dashboard
     */
    getCurrentDashboard(): HealthDashboard | null;
    /**
     * Manual trigger of health check (outside normal schedule)
     */
    triggerManualCheck(): Promise<HealthDashboard>;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<MonitoringTaskConfig>): void;
    /**
     * Setup event listeners for TaskPlanManager
     */
    private setupTaskPlanListeners;
    /**
     * Handle plan started event
     */
    private onPlanStarted;
    /**
     * Handle plan completed event - Record execution metrics for flywheel
     */
    private onPlanCompleted;
    /**
     * Handle plan failed event
     */
    private onPlanFailed;
    /**
     * Handle task completed event (optional granular tracking)
     */
    private onTaskCompleted;
    /**
     * Record flywheel execution metrics
     */
    private recordFlywheelExecution;
    /**
     * Log plan execution to RAG for pattern learning
     */
    private logPlanExecutionToRAG;
    /**
     * Map agent ID to flywheel name
     */
    private mapAgentToFlywheel;
    /**
     * Calculate estimation accuracy (0-1)
     */
    private calculateEstimationAccuracy;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
