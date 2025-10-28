/**
 * @fileoverview VELOCITY Workflow State Machine - State management for 5-phase workflow
 *
 * Manages workflow state transitions through:
 * - Planning → Assessing → Delegating → Working → Codifying → Completed
 *
 * Includes:
 * - State definitions and transitions
 * - State persistence to filesystem
 * - Resume workflow from saved state
 * - Transition guards and validation
 *
 * @module workflows/velocity-workflow-state-machine
 * @version 6.5.0
 */
import { EventEmitter } from 'events';
/**
 * Workflow phases (matches VELOCITY methodology)
 */
export type WorkflowPhase = 'Plan' | 'Assess' | 'Delegate' | 'Work' | 'Codify' | 'Completed';
/**
 * Workflow state status
 */
export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'rolled_back';
/**
 * Complete workflow state
 */
export interface WorkflowState {
    /** Workflow identifier */
    id: string;
    /** Current phase */
    currentPhase: WorkflowPhase;
    /** Previous phase (for rollback) */
    previousPhase?: WorkflowPhase;
    /** Workflow status */
    status: WorkflowStatus;
    /** Phase history (for tracking progression) */
    phaseHistory: PhaseTransitionRecord[];
    /** Workflow configuration */
    config: WorkflowConfig;
    /** State metadata */
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        startedAt?: Date;
        completedAt?: Date;
        pausedAt?: Date;
    };
    /** Error information (if failed) */
    error?: {
        phase: WorkflowPhase;
        message: string;
        stack?: string;
        timestamp: Date;
    };
}
/**
 * Workflow configuration
 */
export interface WorkflowConfig {
    target: string;
    autoTransition: boolean;
    requireApprovalPerPhase: boolean;
    continuousMonitoring: boolean;
    qualityGateLevel: 'strict' | 'normal' | 'relaxed';
    maxExecutionHours: number;
    codifyToRAG: boolean;
}
/**
 * Phase transition record (audit trail)
 */
export interface PhaseTransitionRecord {
    from: WorkflowPhase | 'initial';
    to: WorkflowPhase;
    timestamp: Date;
    duration?: number;
    success: boolean;
    reason?: string;
}
/**
 * State transition event
 */
export interface StateTransitionEvent {
    workflowId: string;
    from: WorkflowPhase;
    to: WorkflowPhase;
    timestamp: Date;
}
export declare class VelocityWorkflowStateMachine extends EventEmitter {
    private logger;
    private states;
    private stateStoragePath;
    private readonly VALID_TRANSITIONS;
    constructor();
    /**
     * Create a new workflow
     */
    createWorkflow(id: string, config: WorkflowConfig): Promise<WorkflowState>;
    /**
     * Transition workflow to a new phase
     */
    transition(workflowId: string, toPhase: WorkflowPhase): Promise<void>;
    /**
     * Pause workflow
     */
    pause(workflowId: string): Promise<void>;
    /**
     * Resume workflow
     */
    resume(workflowId: string): Promise<void>;
    /**
     * Mark workflow as failed
     */
    fail(workflowId: string, error: {
        message: string;
        stack?: string;
    }): Promise<void>;
    /**
     * Rollback to previous phase
     */
    rollback(workflowId: string, reason: string): Promise<void>;
    /**
     * Get workflow state
     */
    getState(workflowId: string): Promise<WorkflowState | null>;
    /**
     * Get all workflow states
     */
    getAllStates(): WorkflowState[];
    /**
     * Get workflows by status
     */
    getWorkflowsByStatus(status: WorkflowStatus): WorkflowState[];
    /**
     * Get workflows by phase
     */
    getWorkflowsByPhase(phase: WorkflowPhase): WorkflowState[];
    /**
     * Check if transition is valid
     */
    private isValidTransition;
    /**
     * Get valid transitions from a phase
     */
    private getValidTransitions;
    /**
     * Ensure state storage directory exists
     */
    private ensureStateStorage;
    /**
     * Persist state to disk
     */
    private persistState;
    /**
     * Load state from disk
     */
    private loadState;
    /**
     * Delete state (cleanup completed workflows)
     */
    deleteState(workflowId: string): Promise<void>;
    /**
     * List all saved workflow IDs
     */
    listSavedWorkflows(): Promise<string[]>;
    /**
     * Clean up old completed workflows (older than N days)
     */
    cleanupOldWorkflows(olderThanDays?: number): Promise<number>;
}
export default VelocityWorkflowStateMachine;
