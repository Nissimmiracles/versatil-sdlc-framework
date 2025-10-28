/**
 * VERSATIL SDLC Framework - Real-time Progress Tracker
 * Provides comprehensive real-time visibility into SDLC and agent progress
 */
import { EventEmitter } from 'events';
import { SDLCOrchestrator, FlywheelState } from '../flywheel/sdlc-orchestrator.js';
import { EnhancedOPERACoordinator } from '../opera/enhanced-opera-coordinator.js';
import { AgentRegistry } from '../agents/core/agent-registry.js';
export interface TaskProgress {
    id: string;
    agentId: string;
    taskName: string;
    phase: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'blocked';
    progress: number;
    startTime?: number;
    estimatedCompletion?: number;
    actualCompletion?: number;
    blockers?: string[];
    output?: any;
}
export interface SDLCContextSnapshot {
    timestamp: number;
    flywheel: FlywheelState;
    phases: {
        [phaseId: string]: {
            status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
            progress: number;
            qualityScore: number;
            activeTasks: number;
            completedTasks: number;
        };
    };
    agents: {
        [agentId: string]: {
            status: 'idle' | 'busy' | 'error';
            currentTask?: TaskProgress;
            taskQueue: number;
            performance: {
                avgExecutionTime: number;
                successRate: number;
                tasksCompleted: number;
            };
        };
    };
    metrics: {
        overallProgress: number;
        velocity: number;
        estimatedCompletion: number;
        blockers: string[];
        risks: string[];
    };
}
export interface RealTimeConfig {
    updateInterval: number;
    enableWebSocket: boolean;
    wsPort?: number;
    persistProgress: boolean;
    alertThresholds: {
        taskTimeout: number;
        phaseDelay: number;
        qualityDrop: number;
    };
}
/**
 * Real-time SDLC Progress Tracker
 */
export declare class RealTimeSDLCTracker extends EventEmitter {
    private logger;
    private sdlcOrchestrator;
    private operaCoordinator;
    private agentRegistry;
    private config;
    private tasks;
    private contextHistory;
    private updateTimer?;
    private wsServer?;
    private wsClients;
    private taskStartTimes;
    private phaseStartTimes;
    private completionRates;
    constructor(sdlcOrchestrator: SDLCOrchestrator, operaCoordinator: EnhancedOPERACoordinator, agentRegistry: AgentRegistry, config?: Partial<RealTimeConfig>);
    /**
     * Initialize real-time tracking
     */
    private initialize;
    /**
     * Setup agent event listeners
     */
    private setupAgentListeners;
    /**
     * Setup SDLC orchestrator listeners
     */
    private setupSDLCListeners;
    /**
     * Setup OPERA coordinator listeners
     */
    private setupOPERAListeners;
    /**
     * Start update loop
     */
    private startUpdateLoop;
    /**
     * Update context snapshot
     */
    private updateContextSnapshot;
    /**
     * Create current context snapshot
     */
    private createContextSnapshot;
    /**
     * Calculate velocity (tasks per hour)
     */
    private calculateVelocity;
    /**
     * Estimate completion time
     */
    private estimateCompletion;
    /**
     * Identify risks
     */
    private identifyRisks;
    /**
     * WebSocket server for real-time updates
     */
    private startWebSocketServer;
    /**
     * Broadcast update to all WebSocket clients
     */
    private broadcastUpdate;
    /**
     * Handle WebSocket messages
     */
    private handleWebSocketMessage;
    /**
     * Public API
     */
    /**
     * Get current context snapshot
     */
    getCurrentContext(): SDLCContextSnapshot;
    /**
     * Get task progress by ID
     */
    getTaskProgress(taskId: string): TaskProgress | undefined;
    /**
     * Update task progress manually
     */
    updateTaskProgress(taskId: string, progress: number, estimatedCompletion?: number): void;
    /**
     * Get historical data
     */
    getHistory(from: number, to: number): SDLCContextSnapshot[];
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): any;
    /**
     * Stop tracking
     */
    stop(): void;
    private generateTaskId;
    private getActiveTasksForPhase;
    private getCompletedTasksForPhase;
    private updateAgentPerformance;
    private getAgentPerformance;
    private calculateVelocityTrend;
    private calculateAverageTaskDuration;
    private calculateSuccessRate;
    private updatePhaseMetrics;
    private checkTimeouts;
    private calculateMetrics;
    private checkQualityAlerts;
    private createBlocker;
    private loadPersistedProgress;
    private persistProgress;
    private handleQuery;
    private handleCommand;
    private getPhaseMetrics;
    private getAllAgentPerformance;
}
