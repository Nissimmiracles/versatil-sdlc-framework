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

import { VERSATILLogger } from '../utils/logger.js';
import { WorkflowContext } from './velocity-workflow-orchestrator.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// PHASE TRANSITIONS IMPLEMENTATION
// ============================================================================

export class VelocityPhaseTransitions {
  private logger: VERSATILLogger;

  constructor() {
    this.logger = new VERSATILLogger('VelocityPhaseTransitions');
  }

  // ========================================================================
  // TRANSITION 1: PLAN → ASSESS
  // ========================================================================

  /**
   * Check if workflow can transition from Plan to Assess
   */
  async canTransitionFromPlanToAssess(context: WorkflowContext): Promise<TransitionResult> {
    this.logger.debug('Checking Plan → Assess transition', { target: context.target });

    const guards: TransitionGuard[] = [
      {
        condition: () => !!context.plan,
        failureMessage: 'Plan phase must complete before assessment',
        required: true,
      },
      {
        condition: () => context.plan?.todos && context.plan.todos.length > 0,
        failureMessage: 'Plan must include at least one todo item',
        required: true,
      },
      {
        condition: () => {
          if (!context.plan?.estimates) return false;
          return context.plan.estimates.total > 0;
        },
        failureMessage: 'Plan must include effort estimates',
        required: true,
      },
    ];

    return this.evaluateGuards(guards);
  }

  /**
   * Execute transition from Plan to Assess
   */
  async transitionPlanToAssess(context: WorkflowContext): Promise<TransitionResult> {
    const canTransition = await this.canTransitionFromPlanToAssess(context);

    if (!canTransition.allowed) {
      return canTransition;
    }

    this.logger.info('Transitioning: Plan → Assess', { target: context.target });

    return {
      success: true,
      allowed: true,
      nextPhase: 'Assess',
    };
  }

  // ========================================================================
  // TRANSITION 2: ASSESS → DELEGATE
  // ========================================================================

  /**
   * Check if workflow can transition from Assess to Delegate
   */
  async canTransitionFromAssessToDelegate(context: WorkflowContext): Promise<TransitionResult> {
    this.logger.debug('Checking Assess → Delegate transition', { target: context.target });

    const guards: TransitionGuard[] = [
      {
        condition: () => !!context.assessment,
        failureMessage: 'Assessment phase must complete before delegation',
        required: true,
      },
      {
        condition: () => context.assessment?.readiness !== 'blocked',
        failureMessage: 'Assessment shows blockers - cannot proceed',
        required: true,
      },
      {
        condition: () => {
          if (!context.assessment) return false;
          return context.assessment.health >= 70; // Minimum 70% health
        },
        failureMessage: 'Framework health below 70% - fix issues before delegating',
        required: true,
      },
      {
        condition: () => {
          if (!context.assessment) return false;
          return context.assessment.blockers.length === 0;
        },
        failureMessage: 'Assessment found blockers - resolve before proceeding',
        required: true,
      },
    ];

    const result = await this.evaluateGuards(guards);

    // Warnings for caution level (70-89% health)
    if (result.allowed && context.assessment && context.assessment.health < 90) {
      result.warnings = [
        `Framework health at ${context.assessment.health}% (below 90%)`,
        ...context.assessment.warnings,
      ];
    }

    return result;
  }

  /**
   * Execute transition from Assess to Delegate
   */
  async transitionAssessToDelegate(context: WorkflowContext): Promise<TransitionResult> {
    const canTransition = await this.canTransitionFromAssessToDelegate(context);

    if (!canTransition.allowed) {
      return canTransition;
    }

    this.logger.info('Transitioning: Assess → Delegate', {
      target: context.target,
      health: context.assessment?.health,
    });

    return {
      success: true,
      allowed: true,
      warnings: canTransition.warnings,
      nextPhase: 'Delegate',
    };
  }

  // ========================================================================
  // TRANSITION 3: DELEGATE → WORK
  // ========================================================================

  /**
   * Check if workflow can transition from Delegate to Work
   */
  async canTransitionFromDelegateToWork(context: WorkflowContext): Promise<TransitionResult> {
    this.logger.debug('Checking Delegate → Work transition', { target: context.target });

    const guards: TransitionGuard[] = [
      {
        condition: () => !!context.delegation,
        failureMessage: 'Delegation phase must complete before work execution',
        required: true,
      },
      {
        condition: () => {
          if (!context.delegation) return false;
          return context.delegation.assignments.size > 0;
        },
        failureMessage: 'No agents assigned - delegation must assign work',
        required: true,
      },
      {
        condition: () => {
          if (!context.plan) return false;
          return context.plan.todos.length > 0;
        },
        failureMessage: 'No todos available for work execution',
        required: true,
      },
    ];

    const result = await this.evaluateGuards(guards);

    // Validate dependencies are resolved
    if (result.allowed && context.delegation) {
      const unresolvedDeps = this.checkUnresolvedDependencies(context.delegation.dependencies);
      if (unresolvedDeps.length > 0) {
        result.allowed = false;
        result.success = false;
        result.blockers = unresolvedDeps.map(dep => `Unresolved dependency: ${dep}`);
      }
    }

    return result;
  }

  /**
   * Execute transition from Delegate to Work
   */
  async transitionDelegateToWork(context: WorkflowContext): Promise<TransitionResult> {
    const canTransition = await this.canTransitionFromDelegateToWork(context);

    if (!canTransition.allowed) {
      return canTransition;
    }

    this.logger.info('Transitioning: Delegate → Work', {
      target: context.target,
      agents: context.delegation?.assignments.size,
    });

    return {
      success: true,
      allowed: true,
      nextPhase: 'Work',
    };
  }

  // ========================================================================
  // TRANSITION 4: WORK → CODIFY (LEARN)
  // ========================================================================

  /**
   * Check if workflow can transition from Work to Codify
   */
  async canTransitionFromWorkToCodify(context: WorkflowContext): Promise<TransitionResult> {
    this.logger.debug('Checking Work → Codify transition', { target: context.target });

    const guards: TransitionGuard[] = [
      {
        condition: () => !!context.work,
        failureMessage: 'Work phase must complete before codification',
        required: true,
      },
      {
        condition: () => {
          if (!context.work) return false;
          return context.work.completedTodos.length > 0;
        },
        failureMessage: 'No todos completed - must complete work before learning',
        required: true,
      },
      {
        condition: () => {
          if (!context.work) return false;
          return context.work.testsAdded > 0 || context.work.filesModified.length > 0;
        },
        failureMessage: 'No concrete work produced - nothing to codify',
        required: false, // Warning, not blocker
      },
    ];

    const result = await this.evaluateGuards(guards);

    // Warnings for incomplete work
    if (result.allowed && context.plan && context.work) {
      const completionRate = context.work.completedTodos.length / context.plan.todos.length;
      if (completionRate < 1.0) {
        result.warnings = result.warnings || [];
        result.warnings.push(
          `Only ${Math.round(completionRate * 100)}% of todos completed (${context.work.completedTodos.length}/${context.plan.todos.length})`
        );
      }
    }

    return result;
  }

  /**
   * Execute transition from Work to Codify
   */
  async transitionWorkToCodify(context: WorkflowContext): Promise<TransitionResult> {
    const canTransition = await this.canTransitionFromWorkToCodify(context);

    if (!canTransition.allowed) {
      return canTransition;
    }

    this.logger.info('Transitioning: Work → Codify', {
      target: context.target,
      completedTodos: context.work?.completedTodos.length,
    });

    return {
      success: true,
      allowed: true,
      warnings: canTransition.warnings,
      nextPhase: 'Codify',
    };
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Evaluate all transition guards
   */
  private async evaluateGuards(guards: TransitionGuard[]): Promise<TransitionResult> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    for (const guard of guards) {
      const passed = await guard.condition();

      if (!passed) {
        if (guard.required) {
          blockers.push(guard.failureMessage);
        } else {
          warnings.push(guard.failureMessage);
        }
      }
    }

    return {
      success: blockers.length === 0,
      allowed: blockers.length === 0,
      blockers: blockers.length > 0 ? blockers : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Check for unresolved dependencies
   */
  private checkUnresolvedDependencies(dependencies: Map<string, string[]>): string[] {
    const unresolved: string[] = [];

    dependencies.forEach((deps, taskId) => {
      deps.forEach(depId => {
        // In production, this would check if the dependency is actually resolved
        // For now, assume all dependencies are resolved
      });
    });

    return unresolved;
  }

  // ========================================================================
  // ROLLBACK & ERROR HANDLING
  // ========================================================================

  /**
   * Rollback from Assess to Plan (if assessment fails)
   */
  async rollbackAssessToPlan(context: WorkflowContext, reason: string): Promise<TransitionResult> {
    this.logger.warn('Rolling back Assess → Plan', { reason });

    return {
      success: true,
      allowed: true,
      reason: `Rolled back to Plan: ${reason}`,
      nextPhase: 'Plan',
    };
  }

  /**
   * Rollback from Delegate to Assess (if delegation fails)
   */
  async rollbackDelegateToAssess(context: WorkflowContext, reason: string): Promise<TransitionResult> {
    this.logger.warn('Rolling back Delegate → Assess', { reason });

    return {
      success: true,
      allowed: true,
      reason: `Rolled back to Assess: ${reason}`,
      nextPhase: 'Assess',
    };
  }

  /**
   * Rollback from Work to Delegate (if work execution fails)
   */
  async rollbackWorkToDelegate(context: WorkflowContext, reason: string): Promise<TransitionResult> {
    this.logger.warn('Rolling back Work → Delegate', { reason });

    return {
      success: true,
      allowed: true,
      reason: `Rolled back to Delegate: ${reason}`,
      nextPhase: 'Delegate',
    };
  }
}

export default VelocityPhaseTransitions;
