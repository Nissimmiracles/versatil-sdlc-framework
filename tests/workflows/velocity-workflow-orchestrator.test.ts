/**
 * @fileoverview Tests for VELOCITY Workflow Orchestrator
 *
 * Validates:
 * - Complete workflow cycle (Plan → Assess → Delegate → Work → Codify)
 * - Auto-transitions between phases
 * - State machine persistence and resume
 * - Transition guards and validation
 * - Rollback functionality
 *
 * @module tests/workflows/velocity-workflow-orchestrator
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import VelocityWorkflowOrchestrator from '../../src/workflows/velocity-workflow-orchestrator.js';
import { EVERYWorkflowStateMachine } from '../../src/workflows/every-workflow-state-machine.js';
import { EVERYPhaseTransitions } from '../../src/workflows/every-phase-transitions.js';

describe('VELOCITY Workflow Orchestrator', () => {
  let orchestrator: VelocityWorkflowOrchestrator;

  beforeEach(() => {
    orchestrator = new VelocityWorkflowOrchestrator();
  });

  afterEach(async () => {
    // Cleanup
    orchestrator.removeAllListeners();
  });

  // ========================================================================
  // WORKFLOW LIFECYCLE TESTS
  // ========================================================================

  describe('Workflow Lifecycle', () => {
    it('should start a new workflow with Plan phase', async () => {
      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-workflow-1',
        target: 'Test feature implementation',
        autoTransition: false, // Manual control for testing
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      expect(workflowId).toBe('test-workflow-1');

      const state = await orchestrator.getWorkflowState(workflowId);
      expect(state).toBeDefined();
      expect(state?.currentPhase).toBe('Plan');
      expect(state?.status).toBe('idle');
    });

    it('should emit workflowStarted event', async () => {
      const workflowStartedPromise = new Promise(resolve => {
        orchestrator.once('workflowStarted', resolve);
      });

      await orchestrator.startWorkflow({
        workflowId: 'test-workflow-2',
        target: 'Test feature',
        autoTransition: false,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      const event: any = await workflowStartedPromise;
      expect(event.workflowId).toBe('test-workflow-2');
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  // ========================================================================
  // PHASE EXECUTION TESTS
  // ========================================================================

  describe('Phase Execution', () => {
    it('should execute Plan phase successfully', async () => {
      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-plan-phase',
        target: 'User authentication',
        autoTransition: false,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      expect(context).toBeDefined();

      if (context) {
        const result = await orchestrator.executePlan(workflowId, context);

        expect(result.phase).toBe('Plan');
        expect(result.success).toBe(true);
        expect(result.nextPhase).toBe('Assess');
        expect(context.plan).toBeDefined();
      }
    });

    it('should track phase completion metrics', async () => {
      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-metrics',
        target: 'Dashboard feature',
        autoTransition: false,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      const context = orchestrator.getWorkflowContext(workflowId);

      if (context) {
        await orchestrator.executePlan(workflowId, context);

        const metrics = orchestrator.getWorkflowMetrics(workflowId);
        expect(metrics).toBeDefined();
        expect(metrics?.phaseBreakdown.Plan).toBeGreaterThan(0);
      }
    });
  });

  // ========================================================================
  // AUTO-TRANSITION TESTS
  // ========================================================================

  describe('Auto-Transitions', () => {
    it('should auto-transition from Plan to Assess', async () => {
      const phaseCompletedPromises: Promise<any>[] = [];

      orchestrator.on('phaseCompleted', event => {
        phaseCompletedPromises.push(Promise.resolve(event));
      });

      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-auto-transition',
        target: 'Payment processing',
        autoTransition: true, // Enable auto-transitions
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      // Wait for phase completions
      await new Promise(resolve => setTimeout(resolve, 500));

      const state = await orchestrator.getWorkflowState(workflowId);

      // Should have progressed through multiple phases
      expect(state?.phaseHistory.length).toBeGreaterThan(0);
    });

    it('should emit phaseCompleted events for each transition', async () => {
      const events: any[] = [];

      orchestrator.on('phaseCompleted', event => {
        events.push(event);
      });

      await orchestrator.startWorkflow({
        workflowId: 'test-events',
        target: 'Search system',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].result.phase).toBeDefined();
    });
  });

  // ========================================================================
  // CONTEXT MANAGEMENT TESTS
  // ========================================================================

  describe('Context Management', () => {
    it('should maintain workflow context across phases', async () => {
      const workflowId = await orchestrator.startWorkflow({
        workflowId: 'test-context',
        target: 'File upload',
        autoTransition: false,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      const context = orchestrator.getWorkflowContext(workflowId);

      if (context) {
        // Execute Plan
        await orchestrator.executePlan(workflowId, context);
        expect(context.plan).toBeDefined();

        // Execute Assess
        await orchestrator.executeAssess(workflowId, context);
        expect(context.assessment).toBeDefined();

        // Context should maintain both plan and assessment
        expect(context.plan).toBeDefined();
        expect(context.assessment).toBeDefined();
      }
    });

    it('should retrieve workflow context by ID', () => {
      const workflowId = 'test-retrieve-context';

      orchestrator.startWorkflow({
        workflowId,
        target: 'Notification system',
        autoTransition: false,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      const context = orchestrator.getWorkflowContext(workflowId);
      expect(context).toBeDefined();
      expect(context?.target).toBe('Notification system');
    });
  });
});

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe('VELOCITY Workflow State Machine', () => {
  let stateMachine: EVERYWorkflowStateMachine;

  beforeEach(() => {
    stateMachine = new EVERYWorkflowStateMachine();
  });

  describe('State Creation', () => {
    it('should create workflow state', async () => {
      const state = await stateMachine.createWorkflow('test-sm-1', {
        target: 'Test feature',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: true,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      expect(state.id).toBe('test-sm-1');
      expect(state.currentPhase).toBe('Plan');
      expect(state.status).toBe('idle');
    });
  });

  describe('State Transitions', () => {
    it('should allow valid transitions', async () => {
      await stateMachine.createWorkflow('test-transition-1', {
        target: 'Test feature',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      await stateMachine.transition('test-transition-1', 'Assess');

      const state = await stateMachine.getState('test-transition-1');
      expect(state?.currentPhase).toBe('Assess');
      expect(state?.previousPhase).toBe('Plan');
    });

    it('should reject invalid transitions', async () => {
      await stateMachine.createWorkflow('test-invalid-transition', {
        target: 'Test feature',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      await expect(
        stateMachine.transition('test-invalid-transition', 'Work')
      ).rejects.toThrow(/Invalid transition/);
    });

    it('should track phase history', async () => {
      await stateMachine.createWorkflow('test-history', {
        target: 'Test feature',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      await stateMachine.transition('test-history', 'Assess');
      await stateMachine.transition('test-history', 'Delegate');

      const state = await stateMachine.getState('test-history');
      expect(state?.phaseHistory.length).toBe(2);
      expect(state?.phaseHistory[0].to).toBe('Assess');
      expect(state?.phaseHistory[1].to).toBe('Delegate');
    });
  });

  describe('State Persistence', () => {
    it('should persist state to disk', async () => {
      const state = await stateMachine.createWorkflow('test-persist', {
        target: 'Persistent feature',
        autoTransition: true,
        requireApprovalPerPhase: false,
        continuousMonitoring: false,
        qualityGateLevel: 'normal',
        maxExecutionHours: 24,
        codifyToRAG: true,
      });

      await stateMachine.transition('test-persist', 'Assess');

      // Create new state machine instance
      const newStateMachine = new EVERYWorkflowStateMachine();
      const loadedState = await newStateMachine.getState('test-persist');

      expect(loadedState).toBeDefined();
      expect(loadedState?.currentPhase).toBe('Assess');
    });
  });
});

// ============================================================================
// PHASE TRANSITIONS TESTS
// ============================================================================

describe('EVERY Phase Transitions', () => {
  let transitions: EVERYPhaseTransitions;

  beforeEach(() => {
    transitions = new EVERYPhaseTransitions();
  });

  describe('Plan → Assess Transition', () => {
    it('should allow transition when plan is complete', async () => {
      const context = {
        target: 'Test feature',
        plan: {
          todos: [{ id: '1', description: 'Test todo' }],
          estimates: { total: 100, byPhase: {} },
          templates: [],
          historicalContext: [],
        },
      };

      const result = await transitions.canTransitionFromPlanToAssess(context);

      expect(result.allowed).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should block transition when plan is missing', async () => {
      const context = {
        target: 'Test feature',
      };

      const result = await transitions.canTransitionFromPlanToAssess(context);

      expect(result.allowed).toBe(false);
      expect(result.blockers).toContain('Plan phase must complete before assessment');
    });
  });

  describe('Assess → Delegate Transition', () => {
    it('should allow transition when assessment passes', async () => {
      const context = {
        target: 'Test feature',
        assessment: {
          health: 95,
          readiness: 'ready' as const,
          blockers: [],
          warnings: [],
        },
      };

      const result = await transitions.canTransitionFromAssessToDelegate(context);

      expect(result.allowed).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should block transition when health is too low', async () => {
      const context = {
        target: 'Test feature',
        assessment: {
          health: 60,
          readiness: 'blocked' as const,
          blockers: ['Health below 70%'],
          warnings: [],
        },
      };

      const result = await transitions.canTransitionFromAssessToDelegate(context);

      expect(result.allowed).toBe(false);
      expect(result.blockers).toBeDefined();
    });

    it('should warn when health is 70-89%', async () => {
      const context = {
        target: 'Test feature',
        assessment: {
          health: 80,
          readiness: 'caution' as const,
          blockers: [],
          warnings: ['Some warnings'],
        },
      };

      const result = await transitions.canTransitionFromAssessToDelegate(context);

      // Should allow but with warnings
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('Work → Codify Transition', () => {
    it('should allow transition when work is complete', async () => {
      const context = {
        target: 'Test feature',
        work: {
          completedTodos: ['1', '2', '3'],
          actualDuration: 120,
          testsAdded: 5,
          filesModified: ['file1.ts', 'file2.ts'],
        },
      };

      const result = await transitions.canTransitionFromWorkToCodify(context);

      expect(result.allowed).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should block transition when no work completed', async () => {
      const context = {
        target: 'Test feature',
        work: {
          completedTodos: [],
          actualDuration: 0,
          testsAdded: 0,
          filesModified: [],
        },
      };

      const result = await transitions.canTransitionFromWorkToCodify(context);

      expect(result.allowed).toBe(false);
      expect(result.blockers).toContain('No todos completed - must complete work before learning');
    });
  });
});
