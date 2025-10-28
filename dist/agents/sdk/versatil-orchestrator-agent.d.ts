/**
 * VERSATIL OPERA v6.0 - Main Orchestrator Agent (SDK-Native)
 *
 * The central intelligence that coordinates all VERSATIL operations using Claude Agent SDK.
 *
 * Architecture:
 * - Uses SDK Subagents for 6 OPERA agents (Maria, James, Marcus, Sarah, Alex, Dr.AI-ML)
 * - Uses SDK Background Tasks for monitoring (Flywheel Health, Context Sentinel, Evolution)
 * - Uses SDK Hooks for phase detection, knowledge storage, and status updates
 *
 * Responsibilities:
 * 1. Phase Detection - Identify current SDLC phase from context
 * 2. Agent Selection - Route tasks to appropriate OPERA agents
 * 3. Flywheel Coordination - Manage parallel flywheels per phase
 * 4. Context Management - Prevent context loss, optimize token usage
 * 5. User Communication - Real-time status updates and guidance
 *
 * @module VersatilOrchestratorAgent
 * @version 6.0.0
 */
import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../../rag/enhanced-vector-memory-store.js';
export type SDLCPhase = 'requirements' | 'design' | 'development' | 'testing' | 'deployment' | 'evolution';
export type AgentRole = 'maria-qa' | 'james-frontend' | 'marcus-backend' | 'sarah-pm' | 'alex-ba' | 'dr-ai-ml';
export interface OrchestratorConfig {
    vectorStore: EnhancedVectorMemoryStore;
    monitoring?: {
        flywheelHealth: boolean;
        contextSentinel: boolean;
        evolution: boolean;
    };
    orchestration?: {
        enableParallelFlywheels: boolean;
        maxConcurrentAgents: number;
        autoPhaseDetection: boolean;
    };
    userCommunication?: {
        statuslineEnabled: boolean;
        notificationsEnabled: boolean;
        dashboardEnabled: boolean;
    };
    ragIntegration?: {
        enabled: boolean;
        autoPatternStorage: boolean;
        retrievalThreshold: number;
    };
}
export interface PhaseContext {
    currentPhase: SDLCPhase;
    previousPhase: SDLCPhase | null;
    confidence: number;
    triggers: string[];
    timestamp: number;
}
export interface AgentTask {
    id: string;
    agent: AgentRole;
    description: string;
    context: any;
    priority: number;
    phase: SDLCPhase;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: any;
    startTime?: number;
    endTime?: number;
}
export interface FlywheelState {
    phase: SDLCPhase;
    active: boolean;
    momentum: number;
    activeAgents: AgentRole[];
    taskQueue: AgentTask[];
    metrics: {
        tasksCompleted: number;
        avgExecutionTime: number;
        successRate: number;
    };
}
export interface OrchestratorStatus {
    running: boolean;
    currentPhase: PhaseContext;
    flywheels: Map<SDLCPhase, FlywheelState>;
    activeAgents: Set<AgentRole>;
    taskQueue: AgentTask[];
    monitoring: {
        flywheelHealth: boolean;
        contextSentinel: boolean;
        evolution: boolean;
    };
    metrics: {
        totalTasksCompleted: number;
        avgTaskDuration: number;
        overallSuccessRate: number;
        contextUsagePercent: number;
        flywheelMomentumAvg: number;
    };
}
export declare class VersatilOrchestratorAgent extends EventEmitter {
    private config;
    private status;
    private flywheelMonitor;
    private contextMonitor;
    private evolutionTask;
    private flywheels;
    private taskQueue;
    private taskCounter;
    constructor(config: OrchestratorConfig);
    /**
     * Initialize all 6 SDLC phase flywheels
     */
    private initializeFlywheels;
    /**
     * Start the orchestrator and all background tasks
     */
    start(): Promise<void>;
    /**
     * Stop the orchestrator and all background tasks
     */
    stop(): Promise<void>;
    /**
     * Setup listeners for Flywheel Health Monitor
     */
    private setupFlywheelMonitorListeners;
    /**
     * Setup listeners for Context Sentinel
     */
    private setupContextMonitorListeners;
    /**
     * Setup listeners for Evolution Task
     */
    private setupEvolutionTaskListeners;
    /**
     * Detect current SDLC phase from context
     */
    detectPhase(context: {
        filePatterns?: string[];
        keywords?: string[];
        gitState?: any;
        userInput?: string;
    }): Promise<PhaseContext>;
    /**
     * Route a task to the appropriate agent(s)
     */
    routeTask(task: Omit<AgentTask, 'id' | 'status'>): Promise<AgentTask>;
    /**
     * Execute a task (simplified - would use SDK Subagent)
     */
    private executeTask;
    /**
     * Update task metrics
     */
    private updateTaskMetrics;
    /**
     * Update overall orchestrator metrics
     */
    private updateMetrics;
    /**
     * Notify user (if notifications enabled)
     */
    private notifyUser;
    /**
     * Get current orchestrator status
     */
    getStatus(): OrchestratorStatus;
    /**
     * Get flywheel state
     */
    getFlywheelState(phase: SDLCPhase): FlywheelState | undefined;
    /**
     * Activate a specific flywheel
     */
    activateFlywheel(phase: SDLCPhase): Promise<void>;
    /**
     * Deactivate a specific flywheel
     */
    deactivateFlywheel(phase: SDLCPhase): Promise<void>;
    /**
     * Get monitoring dashboards
     */
    getMonitoringDashboards(): {
        flywheelHealth: any | null;
        contextSentinel: any | null;
    };
    /**
     * Cleanup
     */
    destroy(): Promise<void>;
}
