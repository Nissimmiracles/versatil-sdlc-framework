/**
 * VERSATIL Framework - Sync Recovery System
 *
 * Automatic detection and recovery from synchronization issues.
 * Self-healing capabilities for orchestrator coordination problems.
 *
 * @module SyncRecoverySystem
 * @version 2.0.0
 */
import { EventEmitter } from 'events';
import { SynchronizationDashboard, SyncIssue } from './synchronization-dashboard.js';
import { FrameworkEfficiencyMonitor } from './framework-efficiency-monitor.js';
import { ProactiveAgentOrchestrator } from '../orchestration/proactive-agent-orchestrator.js';
import { AgenticRAGOrchestrator } from '../orchestration/agentic-rag-orchestrator.js';
export interface RecoveryAction {
    issue: SyncIssue;
    action: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    result?: string;
    error?: string;
}
export interface RecoveryResult {
    success: boolean;
    actionsAttempted: number;
    actionsSucceeded: number;
    actionsFailed: number;
    actions: RecoveryAction[];
    duration: number;
}
export declare class SyncRecoverySystem extends EventEmitter {
    private logger;
    private syncDashboard?;
    private frameworkMonitor?;
    private proactiveOrchestrator?;
    private ragOrchestrator?;
    private recoveryInProgress;
    private recoveryHistory;
    private autoRecoveryEnabled;
    private maxRecoveryAttempts;
    constructor();
    /**
     * Initialize recovery system
     */
    initialize(components: {
        syncDashboard: SynchronizationDashboard;
        frameworkMonitor: FrameworkEfficiencyMonitor;
        proactiveOrchestrator: ProactiveAgentOrchestrator;
        ragOrchestrator: AgenticRAGOrchestrator;
    }): Promise<void>;
    /**
     * Enable or disable auto-recovery
     */
    setAutoRecovery(enabled: boolean): void;
    /**
     * Initiate recovery process
     */
    initiateRecovery(issues: SyncIssue[]): Promise<RecoveryResult>;
    /**
     * Create recovery actions for a specific issue
     */
    private createRecoveryActionsForIssue;
    /**
     * Execute a single recovery action
     */
    private executeRecoveryAction;
    /**
     * Recovery Action: Rebuild event listeners
     */
    private rebuildEventListeners;
    /**
     * Recovery Action: Restart inactive orchestrators
     */
    private restartInactiveOrchestrators;
    /**
     * Recovery Action: Reset unhealthy orchestrators
     */
    private resetUnhealthyOrchestrators;
    /**
     * Recovery Action: Validate memory stores
     */
    private validateMemoryStores;
    /**
     * Recovery Action: Cleanup orphaned memories
     */
    private cleanupOrphanedMemories;
    /**
     * Recovery Action: Initialize health systems
     */
    private initializeHealthSystems;
    /**
     * Recovery Action: Generic recovery
     */
    private genericRecovery;
    /**
     * Create recovery result
     */
    private createRecoveryResult;
    /**
     * Get recovery history
     */
    getRecoveryHistory(): RecoveryResult[];
    /**
     * Get last recovery result
     */
    getLastRecovery(): RecoveryResult | null;
    /**
     * Is recovery in progress?
     */
    isRecoveryInProgress(): boolean;
    /**
     * Generate recovery report
     */
    generateRecoveryReport(): string;
    /**
     * Cleanup
     */
    shutdown(): void;
}
export declare function getSyncRecoverySystem(): SyncRecoverySystem;
export declare function destroySyncRecoverySystem(): void;
