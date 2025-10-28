/**
 * VERSATIL Framework - Synchronization Dashboard
 *
 * Unified real-time monitoring of all synchronization states across the framework.
 * Integrates all health check systems to provide comprehensive sync validation.
 *
 * @module SynchronizationDashboard
 * @version 2.0.0
 */
import { EventEmitter } from 'events';
import { FrameworkEfficiencyMonitor } from './framework-efficiency-monitor.js';
import { IntrospectiveMetaAgent } from '../agents/meta/introspective-meta-agent.js';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
import { AgenticRAGOrchestrator } from '../orchestration/agentic-rag-orchestrator.js';
import { PlanFirstOpera } from '../orchestration/plan-first-opera.js';
import { StackAwareOrchestrator } from '../orchestration/stack-aware-orchestrator.js';
import { GitHubSyncOrchestrator } from '../orchestration/github-sync-orchestrator.js';
import { ParallelTaskManager } from '../orchestration/parallel-task-manager.js';
export interface SyncStatus {
    synchronized: boolean;
    score: number;
    lastCheck: number;
    issues: SyncIssue[];
    orchestrators: OrchestratorStatus[];
    eventSystem: EventSystemStatus;
    memoryConsistency: MemoryConsistencyStatus;
    healthSystems: HealthSystemsStatus;
}
export interface SyncIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    component: string;
    description: string;
    impact: string;
    autoRecoverable: boolean;
    recommendation: string;
}
export interface OrchestratorStatus {
    name: string;
    active: boolean;
    healthy: boolean;
    eventCount: number;
    lastActivity: number;
    responseTime: number;
    errorCount: number;
}
export interface EventSystemStatus {
    healthy: boolean;
    totalEvents: number;
    eventsPerSecond: number;
    droppedEvents: number;
    averageLatency: number;
    listeners: Map<string, number>;
}
export interface MemoryConsistencyStatus {
    consistent: boolean;
    totalMemories: number;
    orphanedMemories: number;
    duplicateMemories: number;
    corruptedMemories: number;
    lastValidation: number;
}
export interface HealthSystemsStatus {
    frameworkMonitor: {
        active: boolean;
        lastCheck: number;
        health: number;
    };
    introspectiveAgent: {
        active: boolean;
        lastCheck: number;
        health: number;
    };
    doctorSystem: {
        active: boolean;
        lastCheck: number;
        health: number;
    };
}
export declare class SynchronizationDashboard extends EventEmitter {
    private frameworkMonitor?;
    private introspectiveAgent?;
    private proactiveOrchestrator?;
    private ragOrchestrator?;
    private planOrchestrator?;
    private stackOrchestrator?;
    private githubOrchestrator?;
    private parallelManager?;
    private monitoringInterval?;
    private isMonitoring;
    private syncStatus;
    private eventMetrics;
    private lastEventTimes;
    constructor();
    /**
     * Initialize with all framework components
     */
    initialize(components: {
        frameworkMonitor: FrameworkEfficiencyMonitor;
        introspectiveAgent: IntrospectiveMetaAgent;
        proactiveOrchestrator: ProactiveAgentOrchestrator;
        ragOrchestrator: AgenticRAGOrchestrator;
        planOrchestrator: PlanFirstOpera;
        stackOrchestrator: StackAwareOrchestrator;
        githubOrchestrator?: GitHubSyncOrchestrator;
        parallelManager?: ParallelTaskManager;
    }): Promise<void>;
    /**
     * Subscribe to events from all orchestrators
     */
    private subscribeToSystemEvents;
    /**
     * Track event occurrence
     */
    private trackEvent;
    /**
     * Start continuous monitoring
     */
    startMonitoring(interval_ms?: number): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Perform comprehensive synchronization validation
     */
    performSyncValidation(): Promise<SyncStatus>;
    /**
     * Check status of all orchestrators
     */
    private checkAllOrchestrators;
    /**
     * Get event count for specific orchestrator
     */
    private getOrchestratorEventCount;
    /**
     * Validate event system health
     */
    private validateEventSystem;
    /**
     * Get recent event count
     */
    private getRecentEventCount;
    /**
     * Check memory consistency
     */
    private checkMemoryConsistency;
    /**
     * Validate all health systems
     */
    private validateHealthSystems;
    /**
     * Detect synchronization issues
     */
    private detectSyncIssues;
    /**
     * Calculate synchronization score (0-100)
     */
    private calculateSyncScore;
    /**
     * Update event system status
     */
    private updateEventSystemStatus;
    /**
     * Get current sync status
     */
    getSyncStatus(): SyncStatus;
    /**
     * Get sync score
     */
    getSyncScore(): number;
    /**
     * Is system synchronized?
     */
    isSynchronized(): boolean;
    /**
     * Get critical issues
     */
    getCriticalIssues(): SyncIssue[];
    /**
     * Generate sync report
     */
    generateSyncReport(): string;
    /**
     * Get sync emoji based on score
     */
    private getSyncEmoji;
    /**
     * Format timestamp for display
     */
    private formatTimestamp;
    /**
     * Initialize empty sync status
     */
    private initializeSyncStatus;
    /**
     * Cleanup
     */
    shutdown(): void;
}
export declare function getSyncDashboard(): SynchronizationDashboard;
export declare function destroySyncDashboard(): void;
