/**
 * VERSATIL OPERA v6.0 - Context Monitoring Background Task
 *
 * Real-time monitoring of context window usage and integrity.
 * Runs as an SDK Background Task with 5-second intervals (real-time).
 *
 * Prevents context loss through:
 * - Real-time token usage tracking
 * - Emergency compaction at 85% threshold
 * - Context integrity validation
 * - Cache efficiency monitoring
 *
 * Integrates with:
 * - ContextSentinel (the actual monitoring agent)
 * - VersatilOrchestratorAgent (main orchestrator)
 * - All OPERA agents (for context budget allocation)
 *
 * @module ContextMonitoringTask
 * @version 6.0.0
 */
import { EventEmitter } from 'events';
import { ContextDashboard, ContextRisk, CompactionResult } from '../agents/monitoring/context-sentinel.js';
export interface ContextMonitoringConfig {
    monitoringInterval: number;
    enableEmergencyCompaction: boolean;
    alertThresholds: {
        warningPercentage: number;
        criticalPercentage: number;
        lowCacheEfficiency: number;
        highWaste: number;
    };
    integrations: {
        userNotifications: boolean;
        statuslineUpdates: boolean;
        ragLogging: boolean;
    };
}
export interface ContextMonitoringStatus {
    running: boolean;
    lastCheck: number;
    totalChecks: number;
    emergencyCompactions: number;
    tokensReclaimed: number;
    currentDashboard: ContextDashboard | null;
    uptimeSeconds: number;
    contextTrend: 'increasing' | 'stable' | 'decreasing';
}
export interface ContextAlert {
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    contextUsage: number;
    risks?: ContextRisk[];
    compactionResult?: CompactionResult;
}
export declare class ContextMonitoringTask extends EventEmitter {
    private sentinel;
    private taskInterval;
    private config;
    private status;
    private startTime;
    private alertHistory;
    private contextHistory;
    constructor(config?: Partial<ContextMonitoringConfig>);
    /**
     * Setup event listeners for the sentinel
     */
    private setupSentinelListeners;
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
     * Calculate context trend (increasing/stable/decreasing)
     */
    private calculateContextTrend;
    /**
     * Handle context warning event
     */
    private handleContextWarning;
    /**
     * Handle context critical event
     */
    private handleContextCritical;
    /**
     * Handle emergency compaction event
     */
    private handleEmergencyCompaction;
    /**
     * Handle integrity violation event
     */
    private handleIntegrityViolation;
    /**
     * Send alert to user
     */
    private sendAlert;
    /**
     * Update statusline with current context usage
     */
    private updateStatusline;
    /**
     * Get emoji for context trend
     */
    private getTrendEmoji;
    /**
     * Log monitoring data to RAG for pattern learning
     */
    private logToRAG;
    /**
     * Get current task status
     */
    getStatus(): ContextMonitoringStatus;
    /**
     * Get recent alerts
     */
    getRecentAlerts(limit?: number): ContextAlert[];
    /**
     * Get current dashboard
     */
    getCurrentDashboard(): ContextDashboard | null;
    /**
     * Get context usage trend (last 5 minutes)
     */
    getUsageTrend(): {
        trend: 'increasing' | 'stable' | 'decreasing';
        rate: number;
    };
    /**
     * Manual trigger of context check (outside normal schedule)
     */
    triggerManualCheck(): Promise<ContextDashboard>;
    /**
     * Manual trigger of emergency compaction
     */
    triggerManualCompaction(): Promise<CompactionResult | null>;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<ContextMonitoringConfig>): void;
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
