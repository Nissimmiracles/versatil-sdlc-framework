/**
 * @fileoverview VELOCITY Phase Transitions - Validation and orchestration between VELOCITY workflow phases
 *
 * Defines transition rules for the 5-phase Compounding Engineering workflow:
 * - Plan approval → auto-trigger Assess
 * - Assess passing → auto-trigger Delegate
 * - Delegate completion → auto-trigger Work
 * - Work completion → auto-trigger Codify (Learn)
 *
 * @module workflows/velocity-phase-transitions
 * @version 6.5.0
 */
import { WorkflowContext } from './velocity-workflow-orchestrator.js';
/**
 * Transition result with detailed reasoning
 */
export interface TransitionResult {
    success: boolean;
    allowed: boolean;
    reason?: string;
    blockers?: string[];
    warnings?: string[];
    nextPhase?: string;
}
/**
 * Transition guard conditions
 */
export interface TransitionGuard {
    condition: () => Promise<boolean> | boolean;
    failureMessage: string;
    required: boolean;
}
export declare class VelocityPhaseTransitions {
    private logger;
    constructor();
    /**
     * Check if workflow can transition from Plan to Assess
     */
    canTransitionFromPlanToAssess(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Execute transition from Plan to Assess
     */
    transitionPlanToAssess(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Check if workflow can transition from Assess to Delegate
     */
    canTransitionFromAssessToDelegate(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Execute transition from Assess to Delegate
     */
    transitionAssessToDelegate(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Check if workflow can transition from Delegate to Work
     */
    canTransitionFromDelegateToWork(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Execute transition from Delegate to Work
     */
    transitionDelegateToWork(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Check if workflow can transition from Work to Codify
     */
    canTransitionFromWorkToCodify(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Execute transition from Work to Codify
     */
    transitionWorkToCodify(context: WorkflowContext): Promise<TransitionResult>;
    /**
     * Evaluate all transition guards
     */
    private evaluateGuards;
    /**
     * Check for unresolved dependencies
     */
    private checkUnresolvedDependencies;
    /**
     * Rollback from Assess to Plan (if assessment fails)
     */
    rollbackAssessToPlan(context: WorkflowContext, reason: string): Promise<TransitionResult>;
    /**
     * Rollback from Delegate to Assess (if delegation fails)
     */
    rollbackDelegateToAssess(context: WorkflowContext, reason: string): Promise<TransitionResult>;
    /**
     * Rollback from Work to Delegate (if work execution fails)
     */
    rollbackWorkToDelegate(context: WorkflowContext, reason: string): Promise<TransitionResult>;
}
export default VelocityPhaseTransitions;
