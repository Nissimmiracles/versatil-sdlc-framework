/**
 * @fileoverview VELOCITY Workflow Orchestrator - Compounding Engineering 5-Phase System
 *
 * Implements Compounding Engineering methodology:
 * Plan → Assess → Delegate → Work → Codify
 *
 * Each phase automatically transitions to the next upon successful completion,
 * creating a continuous learning loop where each feature makes the next 40% faster.
 *
 * @module workflows/velocity-workflow-orchestrator
 * @version 6.5.0
 */
import { EventEmitter } from 'events';
import { WorkflowState, WorkflowPhase } from './velocity-workflow-state-machine.js';
/**
 * Complete VELOCITY workflow configuration
 */
export interface VelocityWorkflowConfig {
    /** Workflow identifier */
    workflowId: string;
    /** Feature or work target description */
    target: string;
    /** Automatically transition between phases (default: true) */
    autoTransition: boolean;
    /** Require approval before each phase transition (default: false) */
    requireApprovalPerPhase: boolean;
    /** Enable continuous monitoring during Work phase (default: true) */
    continuousMonitoring: boolean;
    /** Quality gate enforcement level */
    qualityGateLevel: 'strict' | 'normal' | 'relaxed';
    /** Maximum workflow execution time in hours (safety, default: 24) */
    maxExecutionHours: number;
    /** Store learnings to RAG after completion (default: true) */
    codifyToRAG: boolean;
}
/**
 * Phase execution result
 */
export interface PhaseExecutionResult {
    phase: WorkflowPhase;
    success: boolean;
    duration: number;
    outputs: any;
    errors?: string[];
    warnings?: string[];
    nextPhase?: WorkflowPhase;
}
/**
 * Workflow execution context shared across phases
 */
export interface WorkflowContext {
    /** Feature description */
    target: string;
    /** Plan outputs (from Phase 1) */
    plan?: {
        todos: any[];
        estimates: {
            total: number;
            byPhase: Record<string, number>;
        };
        templates: string[];
        historicalContext: any[];
    };
    /** Assessment results (from Phase 2) */
    assessment?: {
        health: number;
        readiness: 'ready' | 'caution' | 'blocked';
        blockers: string[];
        warnings: string[];
    };
    /** Delegation results (from Phase 3) */
    delegation?: {
        assignments: Map<string, string[]>;
        parallelGroups: string[][];
        dependencies: Map<string, string[]>;
    };
    /** Work execution results (from Phase 4) */
    work?: {
        completedTodos: string[];
        actualDuration: number;
        testsAdded: number;
        filesModified: string[];
    };
    /** Codified learnings (from Phase 5) */
    learnings?: {
        patterns: any[];
        effortAccuracy: number;
        lessonsLearned: string[];
        ragStored: boolean;
    };
}
/**
 * Workflow metrics for performance tracking
 */
export interface WorkflowMetrics {
    totalDuration: number;
    phaseBreakdown: Record<WorkflowPhase, number>;
    estimatedVsActual: {
        estimated: number;
        actual: number;
        accuracy: number;
    };
    compoundingEffect: {
        baseline: number;
        improvement: number;
        percentageFaster: number;
    };
}
export declare class VelocityWorkflowOrchestrator extends EventEmitter {
    private logger;
    private stateMachine;
    private transitions;
    private activeWorkflows;
    private workflowMetrics;
    constructor();
    /**
     * Start a new VELOCITY workflow
     */
    startWorkflow(config: VelocityWorkflowConfig): Promise<string>;
    /**
     * Phase 1: Plan - Research and design with templates + historical context
     */
    executePlan(workflowId: string, context: WorkflowContext): Promise<PhaseExecutionResult>;
    /**
     * Phase 2: Assess - Validate readiness before work starts
     */
    executeAssess(workflowId: string, context: WorkflowContext): Promise<PhaseExecutionResult>;
    /**
     * Phase 3: Delegate - Smart work distribution to optimal agents
     */
    executeDelegate(workflowId: string, context: WorkflowContext): Promise<PhaseExecutionResult>;
    /**
     * Phase 4: Work - Execute implementation with tracking
     */
    executeWork(workflowId: string, context: WorkflowContext): Promise<PhaseExecutionResult>;
    /**
     * Phase 5: Codify - Learn from completed work and store to RAG
     */
    executeCodify(workflowId: string, context: WorkflowContext): Promise<PhaseExecutionResult>;
    private autoTransitionToAssess;
    private autoTransitionToDelegate;
    private autoTransitionToWork;
    private autoTransitionToCodify;
    private invokePlanCommand;
    private invokeAssessCommand;
    private invokeDelegateCommand;
    private invokeWorkCommand;
    private invokeLearnCommand;
    private updateMetrics;
    private calculateCompoundingEffect;
    /**
     * Get workflow context
     */
    getWorkflowContext(workflowId: string): WorkflowContext | undefined;
    /**
     * Get workflow metrics
     */
    getWorkflowMetrics(workflowId: string): WorkflowMetrics | undefined;
    /**
     * Get workflow state
     */
    getWorkflowState(workflowId: string): Promise<WorkflowState | null>;
    private setupEventHandlers;
}
export default VelocityWorkflowOrchestrator;
